---
title: "ScaleTail：148 個現成 Docker Compose stack，讓自架服務用 Tailscale sidecar 直接進 tailnet"
description: "自架服務最麻煩的是開 port、掛 reverse proxy、簽憑證這些重複工。ScaleTail 把每個服務打包成帶 Tailscale sidecar 的現成 compose stack，只要 auth key 就能部署成 tailnet-only 的 HTTPS 服務。這篇實際走一次 Vaultwarden 與 Miniflux 部署，並記下 auth key 明文、裝置累積與 headscale 相容性的取捨。"
pubDate: 2026-04-08T04:48:16+08:00
category: self-hosting
tags: ["tailscale", "github", "docker", "compose", "auth"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1775594896
---

> 本文由 2026-04-08 的 Facebook 連結分享草稿（一句話推坑 [ScaleTail](https://github.com/tailscale-dev/ScaleTail)）於 2026-11 擴寫而成，原稿只留了 repo 連結和「docker-compose 加 Auth-key 就能部署」一句話。文中的架構說明、部署步驟與服務清單，皆於 2026-11-23 對照 repo README 與 Tailscale 官方文件查證。

自架服務最麻煩的往往不是裝服務本身，而是把它接到網路上：開 port、掛 reverse proxy、申請憑證，每個服務重來一次。我自己長年用 [headscale](/blog/headscale-v023-upgrade/) 自架 Tailscale 控制伺服器，裝置之間打通很省事，但每次要發布一個新的 Web 服務，還是得手動把容器接進 tailnet、再設定一輪。看到 [ScaleTail](https://github.com/tailscale-dev/ScaleTail) 這個 repo 時，我的第一反應是「這不就是把我每次重複的那段流程打包好了嗎」。

## ScaleTail 是什麼

[ScaleTail](https://github.com/tailscale-dev/ScaleTail) 是 Tailscale 官方 GitHub org（tailscale-dev）底下的社群專案，MIT 授權，收錄 148 個現成的 Docker Compose stack（截至 2026-11-23，[README](https://github.com/tailscale-dev/ScaleTail) 自述「120+」），從 [Vaultwarden](https://github.com/tailscale-dev/ScaleTail/blob/main/services/vaultwarden)、Immich、Jellyfin 到 DNS、監控、Minecraft 伺服器都有，而且維護相當活躍——我查證時最新 commit 就在前一天。

每個 stack 的核心概念是 [Tailscale 官方 Docker 文件](https://tailscale.com/kb/1282/docker)講的 sidecar 模式：跑一個 `tailscale` 容器，應用程式容器用 `network_mode: service:tailscale` 跟它共用網路命名空間，於是應用程式本身以一台獨立裝置的身分加入 tailnet，外界看到的位址是 `https://<service>.<tailnet>.ts.net`，憑證由 [Tailscale Serve](https://tailscale.com/kb/1312/serve) 自動處理。主機上不開任何 port，服務預設只有 tailnet 內的裝置碰得到。

## 1. 事前準備

依 [README 的 Quick Start](https://github.com/tailscale-dev/ScaleTail)，需要 Linux 主機、Docker Compose 2.23.1 以上，以及 tailnet 端打開 [MagicDNS](https://tailscale.com/kb/1081/magicdns) 和 [HTTPS certificates](https://tailscale.com/kb/1153/enabling-https)（都在管理後台的 DNS 頁），不然 `https://` 位址不會通。

然後在管理後台的 Keys 頁產生一把 auth key。這裡有幾個 README 特別提醒的坑：

- **不要勾 Ephemeral**：ephemeral 裝置離線半小時到一小時後會被移除，等你 `docker compose down` 再 up，裝置就沒了。
- 勾 **Reusable** 讓一把 key 部署多個 stack；tailnet 有開裝置審核的話要勾 **Pre-approved**。

接著把 repo 抓下來：

```bash
git clone https://github.com/tailscale-dev/ScaleTail.git
cd ScaleTail/services/vaultwarden
```

## 2. Sidecar 架構在跑什麼

每個 stack 都是同一套[標準模板](https://github.com/tailscale-dev/ScaleTail/blob/main/documentation/standard-setup.md)：`tailscale` 容器先起來，`application` 容器透過 `depends_on: condition: service_healthy` 等它健康檢查通過才啟動。compose 裡幾個關鍵設定值得看懂：

```yaml
tailscale:
  image: tailscale/tailscale:latest
  environment:
    - TS_AUTHKEY=${TS_AUTHKEY}
    - TS_STATE_DIR=/var/lib/tailscale
    - TS_SERVE_CONFIG=/config/serve.json
    - TS_USERSPACE=false
  devices:
    - /dev/net/tun:/dev/net/tun
  cap_add:
    - net_admin

application:
  network_mode: service:tailscale
```

[TS_AUTHKEY](https://tailscale.com/docs/features/containers/docker/docker-params) 是登入 tailnet 用的，`TS_STATE_DIR` 掛 volume 保存節點狀態，少了它每次重啟都會變成一台新裝置。[官方文件](https://tailscale.com/docs/features/containers/docker/docker-params)說 `TS_USERSPACE` 預設開啟、到處都能跑但效能較差；ScaleTail 選了 `false` 走 kernel 網路，代價是要給容器 `/dev/net/tun` 和 `net_admin` 權限。這是效能與權限的取捨，homelab 場景我認為值得。`TS_SERVE_CONFIG` 則是一份 JSON 的 [Serve 設定](https://tailscale.com/kb/1312/serve)，把 443 的 HTTPS 流量代理到應用程式的內部 port。

## 3. 實際部署：Vaultwarden

我選 [Vaultwarden](https://github.com/dani-garcia/vaultwarden) 當第一個例子：密碼庫資料敏感，本來就不該暴露到公網，和 tailnet-only 的預設行為剛好契合。

編輯該目錄下的 `.env`，把 auth key 貼進 `TS_AUTHKEY=`（服務相關的變數像 `SERVICE`、`IMAGE_URL` 已有預設值），然後：

```bash
docker compose up -d
docker compose ps
```

啟動後從 tailnet 內任何裝置打開 `https://vaultwarden.<tailnet>.ts.net`。第一個請求可能要等上一分鐘，因為 Tailscale 是在當下才去簽憑證。註冊完自己的帳號後，把 compose 裡的 `SIGNUPS_ALLOWED` 改成 `"false"` 再重啟，免得別的 tailnet 成員也來註冊。

另一個細節是 README 提醒節點金鑰預設 180 天過期，記得到管理後台的 Machines 頁把這台裝置的 key expiry 關掉，不然三個月後服務會無聲斷線。

## 4. 需要額外變數的服務：Miniflux

不是每個 stack 都這麼無腦。像 [Miniflux](https://github.com/tailscale-dev/ScaleTail/blob/main/services/miniflux)（RSS 閱讀器，附帶 PostgreSQL 容器）的 README 就要求先在 `.env` 設 `TAILNET_NAME`、`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`POSTGRES_PASSWORD`，沒設的話 `docker compose up` 會直接報 `required variable X is missing a value`。各服務 README 的「Before you start」都列了需要什麼，動手前先看一眼可以省掉不少試誤。

順帶一提，每個 stack 的資料都留在服務目錄底下（`./ts/state`、`./<service>-data/`），之後要搬遷或備份都很單純。我之前幫 homelab 的照片庫[做去重](/blog/fclones-photo-dedup-homelab/)時最痛的就是資料散落各處，這種「一個服務一個目錄」的設計整理起來舒服很多。

## 想公開給外人？

預設的 Serve 設定把 `AllowFunnel` 關著，所以公網進不來。真的要分享給 tailnet 以外的人，可以按 README 的說明打開 [Tailscale Funnel](https://tailscale.com/kb/1223/funnel)：在 policy 檔給該裝置 `funnel` 屬性、把 compose 裡的 `AllowFunnel` 改 `true` 後 `docker compose up -d --force-recreate`。Funnel 目前還在 beta，只開 443、8443、10000 三個 port，而且一旦打開就是整個網際網路都進得來，記得先把應用程式自己的登入機制開好。

## 個人評價

對已經在用 Tailscale 的人，ScaleTail 把「部署一個自架服務」壓縮成「clone、填 key、up」三步，而且每個服務的設定都有人幫你踩過坑，這個價值很實在。我有意在意的幾個點：auth key 以明文放在 `.env`，repo 只能放在自己機器上、不能推上遠端；每個 stack 一台裝置，部署多了之後 tailnet 的裝置清單會長得很快，`./ts/state` 也都得留著；裝置名稱開了 HTTPS 憑證之後會出現在公開的憑證透明日誌裡，雖然只是服務名稱，介意的人要有心理準備。另外整套是綁官方 Tailscale 的——像我想接[自己維護的 headscale](/blog/headscale-v023-upgrade/)，還得透過 `TS_EXTRA_ARGS` 加 `--login-server` 指向自己的控制伺服器，Serve 憑證那段的相容性也得自己驗證，不像用官方控制伺服器那樣開箱即用。我的服務多跑在 [FreeBSD NAS 上的 Linux 虛擬機](/blog/bsd-nas-opnsense-nested-virt/)裡，這種 sidecar 模式對環境的要求（TUN 裝置、net_admin）在 VM 裡反而好滿足，之後新服務大概就照這套流程走了。
