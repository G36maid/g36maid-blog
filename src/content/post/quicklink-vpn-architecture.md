---
title: "自架一套「產品級」VPN 控制面：以 headscale 為核心的 Compose 架構拆解"
description: "以開源的 headscale + derper + Traefik + nginx 為基準，拆解一套自架 Tailscale 風格 VPN 系統的分層設計：edge、負載均衡、控制面、DERP relay、訊息流與可觀測性，每個決定都講代價。"
pubDate: 2025-11-20T09:44:02+08:00
category: self-hosting
tags: ["traefik", "headscale", "derp", "vpn", "docker-compose", "tailscale", "mqtt", "self-hosting", "observability"]
draft: false
---

> 本文由 2025-11-20 的架構圖解筆記於 2026-11 重寫：改以開源元件（headscale、derper、Traefik、nginx、EMQX、Loki/Grafana）為基準的通用架構文，並對照 headscale upstream 的官方立場重新驗證了技術細節。文中架構是通用參考設計，非任何特定公司的系統。

自架 VPN 這件事，教學都寫得很輕鬆——一個 headscale 容器、一條 docker run，就結束了。但只要你真的想把它變成一套「產品」：要有控制面板、要有裝置管理 API、要有訊息推播、要有日誌可以查，你就會發現控制面伺服器只是冰山一角。這篇把一套以開源元件組成的 VPN 系統攤開來畫圖：**兩層 Docker 網路、三組 nginx 負載均衡、控制面與 relay 各司其職**，全部塞在一組 Docker Compose 裡。

先把醜話說在前頭：這不是「教你五分鐘自架 VPN」的文章。這是給已經被自己的 compose 檔淹沒、想看看別人怎麼分層的人看的。圖會多，但每一張圖我都會講「為什麼要這樣」和「代價是什麼」。

## 全貌：兩層網路，一切從 edge 開始

整個系統只有兩條 Docker 網路：

- `traefik-public`：只有 edge 層站在上面——[Traefik](https://traefik.io/traefik/)、DERP relay、Grafana。任何要對外服務的容器都必須明確加入這層。
- `app-net`：其餘所有服務的內部通訊層，資料庫和訊息佇列不會接觸到 edge。

```mermaid
graph TB
    Client["Client / VPN Client"] -->|HTTP HTTPS| Traefik["Traefik :80 :443"]

    subgraph LB["負載均衡層 app-net"]
        NW["nginx-web"] --> BE["backend API :3000"]
        NW --> FE["frontend 靜態 :80"]
        NM["nginx-mqtt"] --> MS["MQTT broker (EMQX)"]
        NV["nginx-vpn"] --> HS1["headscale-1 :8080"]
        NV --> HS2["headscale-2 :8080"]
    end

    subgraph VPN["VPN 服務"]
        DM["derper relay :443 / STUN :3478/udp"]
    end

    subgraph DATA["資料層"]
        PG[(postgres :5432)]
        MQ["MQTT 處理器"]
    end

    Traefik --> NW
    Traefik --> NM
    Traefik --> NV
    Traefik --> DM
    Traefik --> GR["grafana :3000"]

    BE --> PG
    DM --> HS1
    DM --> HS2
    DM --> PG
    MQ --> PG

    PT["promtail"] --> LK["loki :3100"]
    GR --> LK
```

服務構成大致是：控制面（headscale 實例）、relay（derper）、一個 API 後端與靜態前端、基礎設施（Traefik、三組 nginx、Postgres、EMQX、Loki、Promtail、Grafana）、以及幾個一次性工具容器（憑證產生、CA 產生、設定注入）。這種「一個職責一個容器」的切法在 compose 裡很自然，代價是 `docker compose ps` 要捲動很久——後面會講我對這個重量的態度。

## Edge 層：魔法域名與憑證的坑

所有 HTTP/HTTPS 流量從 Traefik 進來，路由靠 host 規則。開發環境最常用的技巧是 [traefik.me](https://traefik.me/) 或 sslip.io 這類魔法域名：公共 DNS 伺服器把域名裡嵌的 IP 抽出來回傳，所以 `server.127.0.0.1.traefik.me` 解析回 127.0.0.1、`server.192.168.1.100.traefik.me` 解析回 192.168.1.100。好處是同一套 Host 規則，localhost 和 LAN 存取都通——這也是為什麼 Traefik 的路由規則用的是 `HostRegexp`（例如 `^vpn\.[a-zA-Z0-9.-]+\.traefik\.me$`）而不是精確 `Host()`，因為 IP 段會隨部署環境變動。

憑證則要靠自己：mkcert 自簽 + 私有 CA。這裡有個歷史脈絡值得記一筆：traefik.me 早年還額外發放一份 Let's Encrypt 簽的共享萬用憑證（`https://traefik.me/cert.pem` 直接下載），但在 **2025 年 3 月被 Let's Encrypt 撤銷了**——把同一把私鑰發給所有訪客違反 CA/Browser Forum Baseline Requirements 的 sole control 規定（[經過詳述](https://guillaumedelre.github.io/2025/04/17/local-https-with-traefik-traefik.me-is-dead-long-live-sslip.io/)）。所以自簽 CA 不是懶惰，是唯一正解：要嘛自己 mkcert、要嘛上真的域名走 Let's Encrypt。

## VPN 控制面：先講清楚 headscale 官方不支援 HA

架構圖上最引人注意的，大概是兩個 headscale 控制面實例並排、前面站著 `nginx-vpn` 負載均衡。看起來很像 HA，但我必須把 upstream 的立場先講明白：**這不是 headscale 支援的部署方式。**

[Headscale 的 FAQ](https://headscale.net/stable/about/faq/) 明載推薦單一程序配 SQLite，PostgreSQL 雖然仍支援但「considered to be in maintenance mode」；社群裡甚至流傳過源碼註記「using Postgres is highly discouraged, it is only supported for legacy reasons」。至於多實例 HA，[issue #2695](https://github.com/juanfont/headscale/issues/2695) 裡維護者的回答是「**The short answer is no**」——理由是控制面是低流量協調服務，值得的是「快速從備份重建」而不是多寫者同步。

所以這種雙實例部署，實際運作比較像「兩個實例共用同一個 Postgres、用 LB 分流註冊請求」，而不是 upstream 語義上的 failover 叢集。它能跑，內部系統用沒問題；但如果讀者要抄這個架構，請先知道自己站在 upstream 的保證範圍之外——fork 裡的每一行，都是自己簽的保固。對絕大多數自架場景，我的建議反而簡單：**單實例 + 定期備份 SQLite，然後把「重建」演練熟**，這才是 upstream 認可的路。

## DERP relay：UDP 打不通時的最後防線

[derper](https://github.com/tailscale/tailscale/tree/main/cmd/derper) 是 Tailscale 開源的 relay 實作，身兼三職：

| 埠 | 用途 |
| --- | --- |
| `:443` (HTTPS) | [DERP](https://tailscale.com/blog/how-tailscale-works/) relay——Tailscale 語義的「Designated Encrypted Relay for Packets」，純 HTTP 之上的加密封包轉送，NAT 打洞失敗時的 fallback |
| `:3478/udp` | [STUN](https://tailscale.com/kb/1053/what-is-stun)——讓客戶端知道自己被 NAT 看成什麼 `ip:port`，判斷 easy NAT 還 hard NAT |
| 其他 | 客戶端啟動時從自訂 DERP map 拉 relay 清單的 API（通常自己用一個小服務提供） |

Tailscale 的 [NAT traversal 長文](https://tailscale.com/blog/how-nat-traversal-works/)把這套機制講得很清楚：連線永遠先走 DERP 立刻可用，同時並行跑 STUN/ICE 探測，探出直連路徑就升級。自己架一個 DERP 的意義就在這——官方 relay 清單裡沒有你的內網，內部系統要有一台自己控制延遲的 relay。

部署上有兩個細節容易踩：憑證（`-certmode manual` 配自簽，或掛真域名走 ACME）和 `--hostname` 要與客戶端 DERP map 裡寫的一致，否則 TLS SNI 對不上，客戶端會直接拒連。

## 訊息流：API 與投遞解耦

裝置管理類系統的共同需求是「下發訊息給 N 台裝置」。合理的切法是把 API 和投遞完全解耦：

```mermaid
sequenceDiagram
    participant C as Client
    participant B as backend
    participant Q as 佇列 (SQS/RabbitMQ)
    participant H as 投遞 worker
    participant P as postgres
    participant M as EMQX
    participant D as Device

    C->>B: API 建立訊息
    B->>P: 寫入訊息 metadata
    B->>Q: enqueue
    B-->>C: 200 OK

    loop 投遞
        H->>Q: poll
        Q-->>H: 訊息批次
        H->>P: 更新狀態
        H->>M: publish 到裝置 topic
        M-->>D: 送到裝置
        H->>Q: delete
    end
```

MQTT broker 用 [EMQX](https://docs.emqx.com/en/emqx/latest/deploy/install.html)，埠就是它的預設組合：`1883`（TCP）、`8883`（TLS）、`8083`（WebSocket，瀏覽器端裝置模擬用）、`18083`（Dashboard）。前面站 `nginx-mqtt` 轉發，旁邊配幾個小 worker 負責狀態回寫。

佇列的選擇：本地開發可以像這套系統一樣用 [LocalStack](https://docs.localstack.cloud/aws/customization/networking/accessing-endpoint-url/) 假裝自己是 SQS/S3（4566 單一 edge 埠收所有 AWS API），`ENV_TYPE` 一切換，同一份程式碼在雲上就打真的 SQS。這招的好處是本地開發零成本、離線可跑；壞處是 LocalStack 和真 AWS 的行為差異（SQS 的 visibility timeout 邊界、S3 的 host-style bucket URL）遲早會咬你一口，所以關鍵路徑還是建議上真環境驗證過。不想綁 AWS 的話，RabbitMQ 或 NATS 是更中性的選擇。

## 可觀測性：Promtail → Loki → Grafana

日誌這層沒有花活：所有服務容器打上 `logging=promtail` 標籤，`promtail` 掛 `/var/run/docker.sock` 自動發現有標籤的容器、抓 Docker log driver 的輸出推進 `loki:3100`，`grafana:3000` 預先配好 Loki datasource。

這套組合的運維重量極低——不用改任何應用程式碼，加新服務只要貼標籤。代價是那個掛進去的 Docker socket：promtail 理論上只需要讀日誌，但 socket 給它的權限是整個 Docker API（含啟停容器）。信任邊界要自己想清楚，至少要限 `:ro`；更講究的做法是用 [Vector](https://vector.dev/) 或 Promtail 的 Docker service discovery 替代方案，避免直接掛 socket。

## 啟動順序與健康檢查

十幾二十個容器的啟動順序不是開玩笑的。compose 層面靠三種條件保住正確順序：`postgres` 和佇列服務用 healthcheck + `condition: service_healthy`；憑證/設定產生這類一次性容器用 `service_completed_successfully`；其餘用 `service_started`。CA 生出的憑證還要寫進資料庫再簽發裝置憑證。這套東西一旦少了 healthcheck，`nginx-vpn` 會在 headscale 起來之前開始轉發 502——第一次踩到時會花你一個晚上。

## 誠實評價：這套架構的代價

優點先說：職責切得乾淨（edge/LB/app/data 四層）、環境變數讓同一份 compose 從筆電長到雲上、日誌零侵入、訊息投遞和 API 完全解耦。這些都不是紙上談兵，是 compose 檔裡實際寫得出的東西。

但代價也得攤開：

- **headscale 多實例不在 upstream 保證範圍內**（見上文 issue #2695），這是整個架構最需要自覺的一點；大多數場景單實例 + 備份就夠。
- **PostgreSQL 版本要盯緊 EOL 時鐘**（[版本政策](https://www.postgresql.org/support/versioning/)是五年），而 headscale 官方對 Postgres 的態度本身就是 maintenance mode——非必要就別選它。
- **容器的重量**：全家桶每次 `docker compose up` 都要醒一遍，工具型容器雖然跑完就退出，但拉鏡像、啟動順序的複雜度是實打實的。內部系統可以接受，公開服務我會先砍一半。
- **魔法域名依賴公共 DNS 服務**：域名是別人的，憑證得自己簽，斷網或 DNS 服務變動時 LAN 存取會直接失效。認真用就掛自己的域名。
- **LocalStack 的模擬保真度**：SQS/S3 的快樂路徑沒問題，但錯誤路徑和配額行為和真 AWS 有差，測試金字塔別只靠它。

總的來說，這是一份「把自架 VPN 當產品做」的架構範本：它的價值不在單一元件，而在**分層的紀律**——誰能碰 edge、誰只在內網、一次性容器怎麼注入憑證與設定、雲地差異怎麼收進環境變數。這些紀律搬到任何一套自架服務上都不吃虧。

## 延伸閱讀

- [Headscale v0.23 升級與重構筆記](/blog/headscale-v023-upgrade/)——跟上游大重構的實錄
- [Tailscale: How NAT traversal works](https://tailscale.com/blog/how-nat-traversal-works/)——DERP/STUN/ICE 的原理，本文 VPN 部分的理論基礎
- [headscale issue #2695](https://github.com/juanfont/headscale/issues/2695)——維護者親自回答「為什麼不做 HA」
- [traefik.me](https://traefik.me/)——魔法域名本尊；[憑證被撤銷的始末](https://guillaumedelre.github.io/2025/04/17/local-https-with-traefik-traefik.me-is-dead-long-live-sslip.io/)
- [PostgreSQL 版本政策](https://www.postgresql.org/support/versioning/)——五年 EOL 時鐘
