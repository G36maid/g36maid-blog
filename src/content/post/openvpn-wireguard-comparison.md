---
title: "OpenVPN vs WireGuard：防火牆上跑 VPN 的選型筆記"
description: "從教育訓練筆記整理出來的 VPN 選型文：OpenVPN 的 userspace TLS 架構與 WireGuard 的 Noise 協議、kernel 內建路線差在哪，OPNsense 上兩者的設定經驗，以及什麼場景該選哪個；文末附 2026 年改用 Tailscale 後的更新觀點。"
pubDate: 2024-11-10 15:21:10 +0800
category: self-hosting
tags: [vpn, wireguard, openvpn, opnsense, tailscale, homelab, network, encryption]
draft: false
source: hackmd
sourceType: "note"
sourceTimestamp: 1731223270
---

> 本文擴寫自 2024-11-10 的 HackMD 教育訓練筆記（原稿是一份 VPN 工具介紹教材，有威脅模型、工具比較與安裝步驟的骨架）；擴寫於 2026-11，版本與連結以 2024 年 11 月當時狀態為準。

## 為什麼要選？

2024 年 11 月我要準一份 VPN 教育訓練教材，第一個遇到的問題就是 OpenVPN 跟 WireGuard 該講哪個。筆記裡我先照教科書列了威脅模型：MITM 竊聽、被廣告商或 ISP 追蹤、敏感資料外洩、身份冒充。但認真想，對自架伺服器的人來說威脅模型其實很單純：家裡的服務不想直接暴露在公網，而自己在外面用的網路（咖啡廳、宿舍）不可信任。這代表我要的只是「點對點的加密私網」，不是匿名上網——後者需要的是 Tor 之類的工具，VPN 擋不了網站端的追蹤。想清楚這點，選型條件就剩下三個：效能、設定成本、還有防火牆上的整合度。

## 協議層級的差別

兩者的架構差異比表面上的「新舊」更深。OpenVPN 是 userspace 程式，控制通道走 TLS，資料通道再由 TLS 協商出的金鑰保護；[官方協議文件](https://openvpn.net/community-resources/openvpn-protocol/)裡可以看到 P_CONTROL/P_DATA 的設計——它疊在 OpenSSL 上，所以 OpenSSL 支援的加密演算法它幾乎都能用，TCP fallback、憑證撤銷、動態推送路由這些企業需要的功能也是這樣長出來的。代價是程式碼量：[The Register 引用的數字](https://www.theregister.com/software/2021/12/08/how-wireguard-made-it-into-linux/1514180/)，OpenVPN 本體約 7 萬行，連同 OpenSSL 算進來接近 60 萬行，完整稽核是大工程。

WireGuard 走完全相反的路：整套協議建立在 [Noise 協議框架](https://www.wireguard.com/)上，Curve25519 做金鑰交換、ChaCha20-Poly1305 做對稱加密，全部寫死、沒有演算法協商。官方的設計主張就是「少到一個人能完整讀完的程式碼」，初版不到 4,000 行（[WIRED 的報導](https://www.wired.com/story/wireguard-gives-linux-faster-secure-vpn/)）；2020 年 1 月 Linus Torvalds 把它 [merge 進 Linux 5.6 的 source tree](https://www.bleepingcomputer.com/news/security/linux-kernel-56-source-tree-includes-wireguard-vpn/)，2020 年 3 月隨 5.6 正式發佈，之後的 kernel 都內建。在 kernel 裡跑而不是 userspace，是它效能優勢的主要來源——省掉封包在 user/kernel 之間來回複製的開銷。「沒有選項」在這裡反而是賣點：攻擊面小、金鑰輪替自動處理，不用擔心設定出來的 cipher suite 是弱組合。

## 在 OPNsense 上設定的實際經驗

我是在 [OPNsense 防火牆](/blog/bsd-nas-opnsense-nested-virt/)上實際跑這兩個東西的，這也是筆記裡步驟最多、最值得留下來的部分。

OpenVPN 在 OPNsense 是核心功能，不用裝 plugin：Web UI 有精靈建 server、憑證階層，client 設定檔直接從介面匯出。但它對 OpenVPN 版本升級敏感——[21.7.1 的 changelog](https://docs.opnsense.org/releases/CE_21.7.html) 就有「openvpn: fix genkey format on 2.5」「openvpn: improve the cipher parsing」兩條，cipher 語法在 2.4 到 2.5 之間改過一次，升級防火牆時這類修正會直接影響既有隧道。

WireGuard 則是 21.7 才正式支援（[21.7 "Noble Nightingale" 的 release notes](https://forum.opnsense.org/?topic=24112.0)），裝 `os-wireguard` plugin 之後在介面上建 Instance 和 Peer，照[官方 how-to](https://docs.opnsense.org/manual/how-tos/wireguard-client.html) 設定即可；MTU 預設 1420，PPPoE 環境要降到 1412。command line 的部分反而比 OpenVPN 簡單得多，筆記裡留了這段：

```bash
sudo apt install wireguard
wg genkey | tee privatekey | wg pubkey > publickey
# /etc/wireguard/wg0.conf 填入兩端的公鑰與 AllowedIPs
sudo wg-quick up wg0
```

概念上就是把 SSH 公鑰交換那套搬過來：兩邊交換公鑰，AllowedIPs 決定哪些流量進隧道，就這樣。OpenVPN 的 server.conf 還要 easy-rsa 生憑證、寫 cipher 設定、處理 push route，設定檔長度完全是另一個量級。

## 什麼場景選哪個

我的歸納：企業遠端存取，尤其需要和既有帳號系統整合、雙因子驗證、或網路環境封鎖 UDP（OpenVPN 可以跑 TCP）時，OpenVPN 仍然合理。自架 homelab 的點對點隧道，WireGuard 幾乎是正解——效能好、設定短、kernel 內建不用額外 daemon。多台設備要互連成 mesh 的話，別自己管 peer 拓撲，直接上 Tailscale 這類基於 WireGuard 的方案。

2024 年寫筆記時我還把兩者並列成「企業選 OpenVPN、效能選 WireGuard」的二分；現在回頭看，那只是因為當時我還在學 OpenVPN，對它的熟悉度高了一些。

## 2026-11 update

後來我的 homelab 實際跑的是 Tailscale——OPNsense VM 那台的遠端入口也是 Tailscale 而不是 OpenVPN（見[那篇 NAS 文章](/blog/bsd-nas-opnsense-nested-virt/)），之後又折騰了自架的 [Headscale 控制伺服器](/blog/headscale-v023-upgrade/)。兩年下來立場變得很明確：除非有憑證管理、合規要求、或必須穿越封鎖 UDP 的網路這種硬需求，我的第一選擇是 WireGuard 系（直接 wg 或 mesh 方案），OpenVPN 變成「先問為什麼不用 WireGuard」之後的答案。2024 年那份二分的寫法就留給當時的脈絡吧。
