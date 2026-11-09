---
title: "ssh 進去顏色全跑掉？先看 $TERM，別急著罵終端機"
description: "ssh 會把本機 $TERM 原樣傳到遠端，遠端沒有對應 terminfo 就爆。kitty 用 kitten ssh、ghostty 用 +ssh 或手動 infocmp 送 terminfo；export TERM=xterm-256color 只是閹割能力的偏方。"
pubDate: 2026-03-24T17:53:49+08:00
category: linux
tags: [ssh, terminfo, kitty, ghostty, terminal, linux]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1774346029
---
> 本文改寫自 2026-03-24 的 Facebook 貼文隨筆，於 2026-11-07 擴寫；當時只是抱怨，現在補齊原理與解法。

社群上一直看到有人換了 kitty 或 ghostty 之後，ssh 進伺服器發現顏色跑掉、按鍵亂跳、跳出 `Error opening terminal: xterm-ghostty`，就罵終端機有 bug，然後默默換回 iTerm2。拜託，`export TERM=xterm-256color` 是常識了🙄 現在都沒人看 StackOverflow 了嗎？——但罵完之後我承認，這件事的原理確實沒有人第一時間告訴新手，所以這篇一次講完。

## 1. 問題出在哪：$TERM 會原樣傳到遠端

ssh 建立連線時，會把本機的 `TERM` 環境變數原封不動送到遠端（這是 SSH 協定內建行為，`TERM` 不受遠端 `AcceptEnv` 限制，一定會傳）。`TERM` 的用途，是讓遠端的程式去查 terminfo 資料庫：「這種終端機支援哪些控制碼？怎麼畫底線？怎麼清屏？」

kitty 會設 `TERM=xterm-kitty`，ghostty 會設 `TERM=xterm-ghostty`。這兩個 entry 都是它們自訂的，記錄了自己的新能力（truecolor、styled underline 之類）。如果遠端機器的 terminfo 資料庫裡沒有這個 entry，`infocmp` 查不到，程式就會報錯、fallback 或畫面亂掉。所以壞的不是終端機，是遠端根本不認得你的 `TERM`。

## 2. 先診斷：三個指令

ssh 進去之後：

```bash
echo $TERM           # 看遠端收到什麼
infocmp "$TERM"      # 查得到＝遠端有這個 terminfo entry
toe | head           # 列出遠端已安裝的 entry
```

`infocmp` 回 `terminal 'xterm-ghostty' not found`，病因就確認了。

## 3. kitty：`kitten ssh` 一行解決

kitty 官方建議的做法就是用內建的 ssh kitten，它在登入時自動把 terminfo 和 shell integration 一起送過去（自動 shell integration 自 0.25.0 加入）：

```bash
kitten ssh myserver
alias s="kitten ssh"
```

不想用 kitten，官方文件也有手動一行流：

```bash
infocmp -a xterm-kitty | ssh myserver tic -x -o ~/.terminfo /dev/stdin
```

更好的做法：現代發行版多半有 `kitty-terminfo` 套件（Debian、Fedora 都有），裝在伺服器上就一勞永逸。還要小心 `sudo` 會濾掉 `TERMINFO` 變數，官方 FAQ 建議在 sudoers 加 `Defaults env_keep += "TERM TERMINFO"`。如果伺服器是 FreeBSD 這種走 termcap 的系統，得先在本機 `infocmp -CrT0 xterm-kitty` 轉成 termcap，append 到 `/usr/share/misc/termcap` 再跑 `cap_mkdb`。

## 4. ghostty：`ghostty +ssh` 或 SetEnv fallback

ghostty 官方文件有整章 terminfo。手動安裝一行流：

```bash
infocmp -x xterm-ghostty | ssh YOUR-SERVER -- tic -x -
```

懶人版是 `ghostty +ssh`（tip/1.4 起）：首次連線自動在遠端編譯安裝 terminfo 並快取結果，裝不上去（例如遠端沒有 `tic`）就自動退回 `TERM=xterm-256color`。真的無法裝，就在 `~/.ssh/config` 設 fallback（需 OpenSSH 8.7+，官方文件明講這會失去 styled underline 等進階能力）：

```ssh-config
Host example.com
SetEnv TERM=xterm-256color
```

另外，ncurses 6.5-20241228 之後已收錄 ghostty 的 entry——但維護者是以 `ghostty` 這個名字（不是 `xterm-ghostty`）、內容也不同收的，所以 ghostty 團隊在 2026 年宣布不再等系統預裝，一律從客戶端手動或自動安裝。

## 5. 「export TERM=xterm-256color」這招的代價

老偏方不是不能用，而是你在對遠端說謊：騙它說你是一台 256 色 xterm。遠端程式就只會送出它以為 xterm 不支援的控制碼——truecolor 探測、styled underline、kitty keyboard protocol 全被自己封印。它是 emergency fallback，不是解法；正解永遠是把正確的 terminfo 裝到遠端，或用終端機內建的 ssh wrapper。

## 6. 個人評價

罵終端機有 bug 之前先看 `echo $TERM`，這個立場我維持。但我也承認 terminfo 機制對 2026 年的新手真的很不友善：終端機的體驗取決於你 ssh 過去的每一台機器知不知道它的名字，這個雞生蛋問題一直沒有協定層的解法——kitty 作者自己也在文件裡抱怨，說正解是叫 OpenSSH 自動做這件事；ghostty 的 `+ssh` 則是目前最接近自動化的嘗試。缺點老實列：`kitten ssh` 對 BSD、嵌入式的殘缺 sh 很挑剔；tmux 底下行為看運氣；`+ssh` 還沒進 ghostty 穩定版。下次換終端機，先花兩分鐘把 terminfo 送過去，別換回 iTerm2 了🙄

## 延伸閱讀

- kitty ssh kitten 官方文件（含手動複製 terminfo、FreeBSD termcap 轉換）：<https://sw.kovidgoyal.net/kitty/kittens/ssh/>
- kitty FAQ（sudo 與 TERMINFO）：<https://sw.kovidgoyal.net/kitty/faq/>
- ghostty terminfo 文件：<https://ghostty.org/docs/help/terminfo>
- ghostty `+ssh` 文件：<https://ghostty.org/docs/features/ssh>
- ncurses 6.5-20241228 公告（新增 ghostty entry）：<https://invisible-island.net/ncurses/NEWS.html>
- ghostty 團隊不再等系統預裝 terminfo 的立場：<https://github.com/ghostty-org/ghostty/discussions/8268>
