---
title: "Tailscale 網狀 VPN：從零配置到 Homelab 實戰"
description: "從「不想碰埠轉發」的痛點出發，整理 Tailscale 這種以 WireGuard 為底的網狀 VPN 與傳統中央閘道 VPN 的差異、能緩解的威脅、優缺點與快速入門步驟。內容以親身使用經驗為主：Moonlight＋Sunshine 遊戲串流、Docker/Kubernetes 部署、無筆電遠端開發、實習期間跨防火牆連線，以及 FreeBSD、OPNsense、TrueNAS 等平台的整合心得。"
pubDate: 2024-11-24 15:51:38 +0800
category: self-hosting
tags: ["tailscale", "vpn", "wireguard", "networking", "homelab", "freebsd", "opnsense", "docker", "remote-work"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1732434698
---
Tailscale 標榜「幾分鐘建好 VPN」，我第一次設定的原因很實際：要在外面的網路連回家裡的機器，又懶得碰埠轉發。本來以為會像 OpenVPN 那樣先花一個晚上生憑證和設定檔，結果裝完登入，兩台機器之間就直接通了，那一瞬間的感想只有「就這樣？」。

和傳統 VPN 最大的差別在流量走向。OpenVPN 這種典型架構是把所有流量送進中央閘道再轉發出去；Tailscale 則是幫每台裝置建立點對點的加密通道，組成網狀網路（官方叫 tailnet），設備之間直接互連，底下走 WireGuard 協定。註冊是強制 SSO，登入後每台裝置會自動拿到一個 100.x.y.z 的虛擬 IP，跨防火牆和 NAT 都能通，不用開任何埠。想把它當傳統 VPN 用，就設定 exit node 當出口。

這個工具能緩解的威脅類型：

- 竊聽與攔截（MITM）：流量走 WireGuard 端到端加密，抓封包也看不到內容
- 未授權存取：服務只掛在 tailnet 內，不會暴露到公網，也沒有「埠開著被掃」這件事
- 跨網路通訊：不同網段的機器照樣直連，防火牆規則可以維持原樣

相較 OpenVPN 這種中央閘道方案，我自己的優缺點清單是：

優點：

- 設定極簡，裝好登入就能用，管理在網頁控制台完成
- 虛擬 IP 和 MagicDNS 名稱在所有裝置上通用，不用維護內部 DNS
- 跨平台支援完整，手機到伺服器都有官方 client，連防火牆和 NAS 也能裝
- 免費 Personal plan 到 2024 年為止可用裝置數 100 台，自用非常夠

缺點：

- 控制層在 Tailscale 手上，協調伺服器掛了會影響新連線建立（已有連線不受影響）
- 想玩進階功能（ACL、subnet router、exit node）得花時間讀文件
- 過 NAT 打洞失敗時會 fallback 到中繼，延遲和頻寬都比直連差

## 快速入門

1. 前往 tailscale.com/download 下載 client，或直接裝套件，登入註冊

   ```console
   # Arch Linux
   $ pacman -S tailscale
   $ systemctl enable --now tailscaled
   $ tailscale up
   ```

2. 第二台機器也執行 `tailscale up`，用同一個帳號登入，兩台就會在控制台的 Machines 頁面看到彼此
3. 啟用 MagicDNS（控制台預設已開），之後用機器名稱就能連，不用記 100.x IP
4. 想把服務限縮在內網，就讓 server 只聽 tailnet 介面的位址

添加設備到 tailnet 的方式：在第二台機器登入同一個帳號；或用 pre-auth key（auth keys，官方建議 server 類裝置用這招，不用互動登入）：

```console
# 在控制台產生 auth key，再到新機器執行
$ tailscale up --authkey=tskey-auth-xxxxx
```

每台裝置會依主機名自動分配 100.x.y.z 的唯一 IP，在 admin console 的 Machines 頁面可以改名，名稱同時就是 MagicDNS 的 hostname。

需要低延遲的連線場景是 Tailscale 的強項。WireGuard 協定精簡，效能通常比 OpenVPN 好，適合遊戲、遠端桌面這種應用。我自己就用 Moonlight 當前端、Sunshine 當後端跑遊戲串流，中間透過 Tailscale 連線——在外面玩家裡的遊戲機，延遲表現完全可接受。

## 有大量機器需要管理

因為 Tailscale 是網狀連接的 VPN，我在 Docker / Kubernetes 時也常常使用此工具進行部署開發，所有的網路架構都像是平坦的攤開在桌面上一樣，非常的方便。多台機器之間不用想誰要當跳板，反正彼此都看得到。

## 我的其他使用例子

1. 遠端工作：我沒有筆電，軟體開發靠 Tailscale 讓我可以無痛在個人終端連回工作站進行遠端開發（搭配 tmux 維持 session）
2. 實習期間：曾在資訊公司實習，無法獲取防火牆配置與設定，但透過 Tailscale 能輕易在家中電腦、公司電腦、學校工作站及其他雲端伺服器中開發和部署
3. 研究與開發：最近正在研究 FreeBSD 工作站及防火牆，透過嵌套虛擬化方便配置 Homelab，Tailscale 在各種使用案例的整合度都很高，配置工作相比其他服務非常簡單輕鬆

包含使用 OPNsense（官方有 [plugin](https://tailscale.com/kb/1097/install-opnsense)）以及設置出口節點；Synology NAS 也有官方套件。

我實際裝過的平台：Archlinux、Ubuntu、macOS 10.15、Windows 10、Android、iOS / iPadOS、Docker、Kubernetes、FreeBSD、OPNsense、TrueNAS scale / core、FreeBSD jails。細節參考[官方的安裝文件](https://tailscale.com/kb/1347/installation)。

## 踩雷注意

- MagicDNS 用機器名稱連線的時候，如果主機名跟本機網段內其他服務撞名，解析結果會讓人混亂，建議在控制台把裝置改名成不易重複的名字
- 實習場景要留意資安規範，公司未授權的話不該擅自把公司機器加進自己的 tailnet；當時是先問過主管才使用
- 在 FreeBSD 或 OPNsense 這類非主流平台上，client 版本更新會慢於官方主流平台，功能出現時間有落差
- Docker 內跑 Tailscale 要注意 `/dev/net/tun` 的掛載，沒開的話會直接起不來

## 個人使用評價

用到現在，Tailscale 是我長期保留在所有機器上的基礎服務，等級和 ssh 一樣。對不想碰網路細節的人，它把「架 VPN」從一個週末的專案變成一條指令；對想玩網路的人，ACL、subnet router、exit node 又有足夠的深度可以挖。硬要挑毛病：協調伺服器是單一依賴，官方出事的時候你只能等；免費方案的裝置數量雖然寬鬆，企業等級的功能（SSO 整合、審計 log）都要付費。作為個人或小團隊的自架方案，目前沒有讓我想換掉的理由。

## 2026-11 update

寫這篇時我只用官方協調伺服器。兩年後回頭看，「控制層在別人手上」這件事的權重變高了：後來我把部分環境改跑 self-host 的 [headscale](https://github.com/juanfont/headscale)（目前版本已到 v0.29），協調伺服器自己顧，DERP 中繼也可以自架，整套過程寫在[《headscale v0.23 升級記》](/blog/headscale-v023-upgrade/)與[《DERP 驗證實作》](/blog/derp-client-verification-implementation/)。官方服務的省事和 self-host 的掌控力是取捨，兩邊我都留著用——家裡的 tailnet 連官方就好，要長期營運的環境才自架。2026 年 Tailscale 商業方案也改成依席次計費（Standard 每人每月 $8 起，見 [pricing](https://tailscale.com/pricing)），免費 Personal plan 涵蓋 6 個 user，比 2024 年更寬鬆，個人使用依舊不需要付錢。

## 延伸閱讀

- [How Tailscale works](https://tailscale.com/blog/how-tailscale-works)：官方對架構的完整說明，講協調伺服器和資料平面分離的設計
- [Tailscale use cases](https://tailscale.com/kb/1377/use-cases)：各種應用情境
- [MagicDNS](https://tailscale.com/kb/1085/magicdns)：自動 DNS 的細節
- [Exit nodes](https://tailscale.com/kb/1103/exit-nodes)：想當傳統 VPN 用的入口
- [Secure server agents](https://tailscale.com/kb/1077/secure-server-agents)：server 類裝置的 auth key 與標籤做法
- 相關文章：[OPNsense 上跑巢狀虛擬化的 NAS](/blog/bsd-nas-opnsense-nested-virt/)、[SSH 遠端開發的 TERM 環境問題](/blog/ssh-term-environment/)、[資訊公司實習報告](/blog/moxa-internship-report/)
