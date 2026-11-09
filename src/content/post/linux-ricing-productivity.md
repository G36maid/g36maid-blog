---
title: "Linux Ricing 不是浪費時間：看得開心，用得順手"
description: "買新手機會調設定、換桌布、排 App；裝 Linux 折騰桌布、終端機、編輯器本質上是同一件事。從 r/unixporn 與 NvChad 談起：為什麼「看得開心」是最直接的生產力投資。"
pubDate: 2025-11-30T01:20:32+08:00
category: linux
tags: ["linux", "ricing", "neovim", "生產力", "dotfiles"]
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1764436832
draft: false
---

> 本文擴寫自 2025-11-30 的 Facebook 相片短文。原稿是貼圖隨筆，附圖為 NvChad v2.0 的截圖拼貼，原始語氣照舊保留。

常聽到有人說 Linux Ricing 是浪費時間。

但一般人買了新手機，不也會花一個晚上調設定、換桌布、把常用的 App 排到順手的位置？這本質上不就是 Ricing 嗎？只是手機可能一年才玩一次，一次用一年罷了——而終端機和編輯器是你每天要盯八小時的東西，折騰一次的回報率其實高得多。

![NvChad v2.0：截圖拼貼展示了以 Lua 打造的 Neovim 發行版，各種配色下的 bufferline、statusline 與內建終端機](/media/2025-11/122135047244958395.jpg)

## Ricing 到底是什麼

「Ricing」一詞來自改裝車文化——rice burner 原指東亞進口車的外觀改裝，後來被 Linux 社群以自嘲的方式挪用：把桌面、終端機、狀態列、配色全部改到自己順眼，就叫 ricing your setup。精神上的家是 2011 年 9 月創版的 [r/unixporn](https://www.reddit.com/r/unixporn/)，如今有六十多萬訂閱者；發文標題得按規矩以 `[dwm]`、`[Hyprland]` 這類視窗管理器標籤開頭，而且慣例要附上 dotfiles。重點從來不是炫耀，而是「我的環境是我自己一塊塊拼出來的」。

## 附圖：NvChad

附圖是 [NvChad](https://github.com/nvchad/nvchad) v2.0 的宣傳拼貼。NvChad 是 2021 年 3 月出現在 GitHub 上的 Neovim 發行版，一個以 Lua 寫成的「基礎設定」，主打漂亮的 UI 與約 0.02–0.07 秒的啟動時間；目前 28,000+ stars、GPL-3.0 授權，仍在活躍維護。

Neovim 之所以需要「發行版」，是因為它本體只是一個可深度客製化的編輯器核心：LSP、補全、檔案樹、statusline，全都要自己裝。生態系因此長出一整排現成品——NvChad、LazyVim、AstroNvim、kickstart.nvim——性質就像 Linux 發行版：核心同一個，預設體驗天差地遠。裝一個發行版，等於直接繼承別人調好的配色、鍵位與 UI，把「調到順手」的起點往前挪一大步。

## 我的 ricing 落在 dotfiles 裡

說「我的環境是我自己拼的」當然要拿出證據。我的 Arch Linux + Hyprland 配置整包收在 [G36maid/dotfiles](https://github.com/G36maid/dotfiles)，用 [GNU Stow](https://www.gnu.org/software/stow/) 管理：Hyprland 0.55+、zsh（zim framework）、kitty、vim + zed、fcitx5，一條 `pacman` 清單加上 stow symlink 就能在新機器上還原整個環境。截圖就在 repo 的 README 裡——waybar、wofi、tmux、zellij、yazi 這些每天都在盯的東西，配色和鍵位都是一次一次調出來的。

ricing 這件事會傳染。朋友看了之後也掉進坑裡：[Koios1143/dotfiles](https://github.com/Koios1143/dotfiles) 做了一整套 **NieR 風格**的主題——同樣是 Arch + Hyprland，但走 GNU Stow + quickshell 路線，狀態列、app launcher、剪貼簿歷史、電源選單全部用 quickshell 自己畫，連 SDDM 登入畫面和鎖屏都是改自 qylock 的 nier theme，輸入法掛的是他自己 fork 的 0c-ime（靈犀注音）。README 裡附了電源選單、鎖屏、剪貼簿的示範影片，看完真的很難不想重灌。他 repo 的自我介紹寫著「A Nier-style Arch Linux with Hyprland configured by GNU Stow」——這就是 r/unixporn 精神的具體呈現：同一套軟體，每個人的長相都不一樣。

## 看得開心是合法的生產力投資

反正「看得開心」加上「用得順手」，心情好了，阻力小了，就是最直接的生產力提升。

這句話可以認真拆。工程師的一天其實是一連串的啟動摩擦：打開終端機、進專案、開編輯器、跑測試。每一層如果讓人皺眉，就多一分拖延的理由；反過來，一個看得舒服、反應飛快、鍵位長在自己手上的環境，會讓你「更想打開它」。打開的次數多了，肌肉記憶與熟練度自然累積——阻力變小不是玄學，是行為學。手機桌布換了只能自己爽，編輯器的每一分順眼都直接攤在你每天的工作裡。

dotfiles 還有一層額外的回報：**它是可遷移的**。換機器、重灌、SSH 到伺服器，環境跟著 repo 走。折騰的時間沒有消失，它被資本化成了可以無限次複用的資產。

## 誠實的反面

當然要誠實：ricing 也是拖延的完美掩護，調一下午 config 卻沒寫半行 code 的週末確實存在。判準很簡單——這次折騰是讓之後每天都順一點（值得），還是只是在迴避真正該做的事（不值得）。手機一年玩一次沒關係，編輯器記得別天天重灌就好。

工具是拿來用的，也是拿來看的。看得開心，用得順手，就夠了。

## 延伸閱讀

- [G36maid/dotfiles](https://github.com/G36maid/dotfiles)——我的 Arch + Hyprland 配置（GNU Stow）
- [Koios1143/dotfiles](https://github.com/Koios1143/dotfiles)——被我推坑的朋友做的 NieR 主題，quickshell + SDDM nier theme，非常棒
- [用 AUR 思維替 Zed Editor 做非官方 FreeBSD port](/blog/zed-freebsd-port/)——另一場為了「順手」而起的折騰。
