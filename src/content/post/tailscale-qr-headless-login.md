---
title: "在伺服器 console 用 tailscale up --qr 掃碼登入"
description: "在沒有瀏覽器的純文字環境加入 Tailscale 網路，最麻煩的是把一長串登入網址抄到手機上。加個 --qr flag 讓終端機直接印 QR code，掃一下就完成節點驗證；本文記錄用法、原始碼裡的實作方式，以及與 auth key 等其他登入方式的取捨。"
pubDate: 2025-10-27T09:14:04+08:00
category: self-hosting
tags: [tailscale, linux, 伺服器, 終端機, cli]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1761527644
---
## 本文來源

這篇擴寫自 2025-10-27 的 Facebook 貼文草稿（原稿只有幾行：`sudo tailscale up --qr` 會在終端機印 QR code，方便在伺服器 console 掃碼登入）。擴寫版補上了實際操作脈絡、其他登入方式的比較，以及這個 flag 在原始碼裡的樣子，原貼文的推薦語氣照舊保留。

---

在伺服器上第一次把機器加進 Tailscale 網路時，多數人會直接跑：

```bash
sudo tailscale up
```

接著終端機會印出一串像 `https://login.tailscale.com/a/xxxxxxxx` 的登入網址，要你在有瀏覽器的裝置上打開、用 Google 或 Microsoft 帳號驗證這個節點。在桌面上這很順——點連結就好。問題是伺服器往往沒有瀏覽器：有時你人在機房對著 console，有時是透過 KVM、有時是透過 SSH 連進一台剛裝好系統、連個圖形介面都沒有的機器。把那串 URL 從 console 螢幕抄到手機上輸入，等號後面十六個字元，打錯一次就得重來，這是純文字環境下最惱人的小摩擦。

解法是在 `up` 後面多加一個參數：

```bash
sudo tailscale up --qr
```

輸出的地方會多印一個黑白 QR code（半角塊字元拼出來的那種），登入網址照樣印在旁邊。拿手機相機對著 console 螢幕掃一下，瀏覽器直接開到同一個驗證頁，登入完成，那台伺服器就上線了。整個流程從「抄 URL、手動輸入、祈禱沒打錯」變成「舉手機、掃、按登入」，這是我覺得 Tailscale CLI 裡最值得記住的小 flag。

## 它是怎麼做到的

終端機印 QR code 這件事沒有任何魔法：QR code 本質是黑白方塊的矩陣，而終端機用半格高的 Unicode 方塊字元（U+2580 起的那一族）就能以大約兩倍於字元點陣的解析度畫出黑白圖案。Tailscale 的 Go 原始碼裡用的是 [skip2/go-qrcode](https://github.com/skip2/go-qrcode) 這個套件，流程大致是：拿到登入 URL → 產生 QR code 點陣 → 以半方塊字元輸出到 stderr，跟登入 URL 印在一起。相關程式碼在 [`cmd/tailscale/cli/up.go`](https://github.com/tailscale/tailscale/blob/main/cmd/tailscale/cli/up.go)。

這個 flag 從 [Tailscale v1.24.1（2022 年初）](https://github.com/tailscale/tailscale/blob/v1.24.1/cmd/tailscale/cli/up.go) 就已經存在了。本文寫作時（2025 年底）的版本不但還在，官方後來還加了 `--qr-format` 選項，可以在 `small` 與 `large` 兩種輸出尺寸之間切換——large 模式每個「點」佔更多字元，console 截圖或雜訊大的環境下比較好掃。

一個值得知道的細節：`tailscale up` 的其他 flag 是「狀態」——重跑時如果省略，CLI 會警告並要求你補齊（或加 `--reset`）。但 `--qr`、`--auth-key`、`--force-reauth` 這三個被明確排除在外，它們只是單次操作的參數，不會被記住，也不會因為下次沒帶就被要求補寫。所以加 `--qr` 不會改變節點的任何組態，單純是輸出格式的開關，用完即丟，這也是它適合随手加上的原因。

## 登入方式的選擇空間

`--qr` 不是唯一讓伺服器免抄 URL 的方法，實務上常見的就這幾條路：

1. **`sudo tailscale up --qr`**：本文主角。最適合「人在機器前、手上有智慧型手機」的場景——實體 console、KVM over IP、或是直接坐在伺服器鍵盤前。零前置設定，隨掃隨登。
2. **Auth key**：`sudo tailscale up --auth-key=tskey-auth-xxxx`。適合自動化與大量部署——cloud-init、Ansible、開機腳本都靠這招，因為它完全不互動。官方文件[「Auth keys」](https://tailscale.com/kb/1085/auth-keys)建議伺服器類節點用 key 加標籤（tags）的方式加入，讓節點歸屬於機器而非個人帳號，人員離職也不會把節點帶走。代價是 key 的產生與保管本身要管理。
3. **`tailscale login`／`tailscale up` 印 URL 後複製**：SSH 連進去的機器上，直接複製終端機裡的 URL 到本機瀏覽器貼上也很常見。缺點是 URL 很長、複製路徑跨越 SSH session，而 console 上根本沒得複製——這正是 QR code 存在的理由。

所以簡單的取捨是：手上有手機、在機器前，就 `--qr`；腳本與佈署管線，就 auth key。兩者不互斥，我自己的習慣是互動式裝機用 QR、批次部署用 key。

## 踩雷筆記

- **認證的是「節點」不是「機器加入」就結束**：掃完 QR、瀏覽器登入後，節點還要等 Tailscale 把它標成 `Running`。機器所有權審核（machine authorization）如果被 admin console 關閉，還要多一道人工核准，別掃完碼發現連不上就以為是網路問題。
- **SSH session 的大小**：小字元的 QR 在某些寬度不足或字型不對的終端機上會糊掉，掃不動時先確認視窗夠寬、字型是等寬，必要時放大字級再試。
- **console 錄影/截圖**：QR code 內容就是登入 URL，等於一組有效憑證。如果 console 輸出會被 log 或截圖存檔（KVM 的 session recording、 screencast），登入完成後那段畫面最好別外流——URL 本身單次有效、綁定該次登入流程，但仍不宜隨意散佈。
- **此招對 `tailscale login` 也通用**：flag 定義在 `up` 與 `login` 共用的 flag set 上，兩個指令都吃 `--qr`。

## 小結

Tailscale 把「在無頭環境完成互動式登入」這個小痛點，用一個 flag 和幾行程式碼就解掉了，成本趨近於零。`--qr` 沒什麼好猶豫的——伺服器上跑 `tailscale up` 時順手加上，console 前省下的就是實實在在的幾分鐘。

## 相關文章

- [Tailscale 網狀 VPN：從零配置到 Homelab 實戰](/blog/tailscale-mesh-vpn-intro/)：整體架構與使用心得的完整版，本篇算是其中「安裝與登入」一步的放大鏡。
- [chunghwa-modem-qrcode-bypass](/blog/chunghwa-modem-qrcode-bypass/)：同樣是「終端機印 QR code 解決現場問題」的故事，剛好是另一個應用場景。

## References

- [Tailscale KB: `tailscale up` 與 CLI flags（含 `--qr`、`--qr-format`）](https://tailscale.com/kb/1215/tailscale-up) — 官方 flag 說明
- [tailscale/tailscale `cmd/tailscale/cli/up.go`](https://github.com/tailscale/tailscale/blob/main/cmd/tailscale/cli/up.go) — `--qr` 的實作位置（qrcode 產生與半方塊字元輸出）
- [tailscale/tailscale v1.24.1 `up.go`](https://github.com/tailscale/tailscale/blob/v1.24.1/cmd/tailscale/cli/up.go) — flag 早在 2022 年初就存在
- [Tailscale KB: Auth keys](https://tailscale.com/kb/1085/auth-keys) — 非互動式登入與伺服器節點建議做法
- [skip2/go-qrcode](https://github.com/skip2/go-qrcode) — Tailscale 用來在終端機輸出 QR code 的 Go 套件
