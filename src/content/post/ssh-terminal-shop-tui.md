---
title: "各位知道 terminal.shop 嗎？在終端機裡用 SSH 買咖啡"
description: "ssh terminal.shop 進純文字介面買咖啡：SSH key 就是帳號、Stripe 結帳、Wish + Bubble Tea 架構拆解，附 2026-11 實測連線驗證與 trade-off 踩雷筆記。"
pubDate: 2025-11-06 11:12:23 +0800
category: linux
tags: ["ssh", "terminal", "cli", "tui", "coffee"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1762398743
---

> 本文擴寫自 2025-11-06 的 Facebook 貼文，擴寫於 2026-11-04，當天重新實際連線驗證過服務現況。

各位知道 terminal.shop 嗎？

一家專門賣咖啡的網站，但你不打開瀏覽器——你在終端機裡輸入：

```
ssh terminal.shop
```

然後一個純文字介面就載入進來，你可以瀏覽商品、丟進購物車、結帳。沒有 HTML、沒有 JavaScript bundle，就是一個 SSH session。對終端機人來說，這種「逛網路商店的浪漫」大概比咖啡因本身還上癮。以下是我實際連上去玩過一輪之後的整理，順便拆解一下「SSH 怎麼可能拿來開店」。

## terminal.shop 是什麼

terminal.shop 是 2024 年年中由一群開發者圈名人（ThePrimeagen、TJ DeVries、Adam Elmore、Dax Raad 等人）推出的咖啡品牌，主打「只透過 SSH 販售」。他們在 X 上的自我介紹就很直白： Delicious Brazilian coffee, ethically sourced, and roasted to perfection • Order via your terminal。技術棧用的是 Charm 那套 Go 工具鏈：Wish 做 SSH server、Bubble Tea 做 TUI、Lip Gloss 做排版（見 Charm 官方部落格的介紹文）。

順帶一提，2026 年 11 月的現在它還活著——我剛剛才連過去確認。

## 怎麼用：三步買到咖啡

1. **連線就是登入**。SSH key 就是你的帳號：terminal.shop 會從你的 public key 產生 fingerprint 當作用戶識別，沒有密碼、沒有註冊表單。沒帶 key 的連線會被當成匿名訪客逛逛（FAQ 原文：we treat users without a public key as anonymous）。
2. **在 TUI 裡逛**。介面是熱鍵式：`S` 進商店、`C` 看購物車、`F` FAQ、`A` 關於。選豆、選研磨度、選數量，都跟操作 htop 一樣。
3. **結帳走 Stripe**。輸入收件人資料後，付款資訊由 Stripe 處理——官方 FAQ 講得很妙：「all payment information is stored exclusively by Stripe」，他們連自己的資料庫都幾乎不存東西，只留姓名、地址、email 和 key fingerprint。API 文件也開誠布公：卡片是以 Stripe token 形態附加的。

另外有個月費制訂閱叫 `cron`（每月一包新豆），訂閱指令是 `ssh terminal.shop -t cron`——用 `-t` 強制配置 TTY 直達某個子應用，這個 CLI 設計本身就很有味道。

## 為什麼 SSH 能開店？原理拆解

很多人第一反應是「SSH 不是拿來登入主機的嗎」。重點在於：**使用者看到的不是網頁，而是 SSH server 上跑的一個 TUI 程式**。SSH 協定只負責加密通道和身分驗證，通道另一端接什麼程式，server 說了算。

自架 SSH 服務常見兩種做法：

- **單純 shell 帳號**：開一個 Unix 帳號，用戶 `ssh user@host` 後直接掉進 bash。要限制只能跑特定程式，得靠 `ForceCommand` 或 restricted shell，但互動體驗（清屏、熱鍵、動態排版）要自己刻。
- **自訂 SSH server**：用函式庫直接實作 SSH 協定，例如 Go 的 [Wish](https://charm.sh/blog/terminaldotshop/)（charm.land 那篇講得很清楚），連線進來直接啟動一個 Bubble Tea 程式，根本不給 shell。terminal.shop 走這條路，而且把 host key 驗證、key fingerprint 當帳號系統、Stripe 當金流全部串起來。

延伸一下還有 sshx、ttyd 這類「把終端機搬到瀏覽器」的工具，但方向相反：它們是把 terminal 塞進 web，terminal.shop 是把 shop 塞進 terminal——一個是遠端協作/分享，一個是完整的電商應用，別搞混。

## 我的實測

寫這篇時（2026-11-04）我用非互動方式驗證伺服器還在線上：

```
$ ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -T terminal.shop
Warning: Permanently added 'terminal.shop' (ED25519) to the list of known hosts.
Requires an active PTY
```

主機金鑰是 ED25519，server 沒有死，只是拒絕沒有 TTY 的 session——這行「Requires an active PTY」本身就是它們 server 寫的應用邏輯，證明 SSH 通道後面真的掛著一個需要偽終端的 TUI 程式，不是 shell。

## Trade-off 與踩雷

誠實列幾個缺點：

- **只寄美國**。FAQ 明講目前不寄美國以外地區，所以像我在臺灣，實際下單是不可能的，只能過過乾癮。
- **金鑰遺失＝帳號消失**。帳號就是 key fingerprint，private key 沒了就沒有任何找回機制。要養成備份金鑰的習慣，或者先用 API 把 email 綁定到帳號上。
- **無障礙是硬傷**。TUI 對螢幕閱讀器不友善，行動裝置上的 SSH client 體驗也參差不齊——網頁電商在這點上完勝。有趣的是他們後來還是補了正式的 REST API 和六種語言的官方 SDK（JS/Go/Python/Ruby/Java/Kotlin，皆開源在 GitHub 的 terminaldotshop 組織下），等於承認純 SSH 介面覆蓋不了所有場景。
- **別開 agent forwarding**。SSH 進去時記得關掉 SSH-Agent forwarding，避免金鑰被遠端不當使用；官方也建議把 host key 釘進 `known_hosts`，防中間人冒充。
- **主體原始碼沒有公開**。開源的是 SDK、API 文件和周邊小專案，TUI 和後端本身是閉源的，想抄架構只能自己看著辦。

## 個人評價

作為電商，terminal.shop 是玩具；作為技術展示，它是傑作。它證明了一件事：SSH 通道後面可以掛任何東西，帳號系統可以就是你的金鑰圈，金流可以外包給 Stripe 到「自己沒有資料庫」的程度。就算你不喝咖啡（或不巧不住美國），`ssh terminal.shop` 也值得連一次——看看人家怎麼用 htop 的操作方式把一包豆子賣出去。

至於我？我連上去逛了一圈，看了看結帳頁，然後想起來我不住在美國。浪漫還是要付運費的。

---

*本文由 2025-11-06 的 Facebook 貼文草稿擴寫而成，並於 2026-11-04 實際連線驗證服務現況。*

## References

- terminal.shop FAQ（SSH 安全性、key fingerprint、Stripe 資料儲存）： https://www.terminal.shop/faq
- terminal.shop API 文件（Stripe card token、personal access token）： https://api.terminal.shop/doc
- terminal.shop /api（token 與 OAuth 說明）： https://www.terminal.shop/api
- Charm 官方部落格〈A coffee shop for your terminal〉（Wish / Bubble Tea / Lip Gloss 技術棧）： https://charm.land/blog/terminaldotshop
- XDA Developers〈You can now order coffee over SSH〉（原始碼未公開、agent forwarding 注意事項）： https://www.xda-developers.com/you-can-now-order-coffee-over-ssh
- GitHub terminaldotshop 組織（官方 SDK 與專案清單）： https://github.com/terminaldotshop
