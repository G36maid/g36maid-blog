---
title: "微軟把 coreutils 帶上 Windows：不用 WSL 的 UNIX 工具終於來了"
description: "微軟在 Build 2026 發布 Coreutils for Windows，把 Rust 寫的 uutils coreutils、findutils 加上新寫的 grep 包成原生 multi-call binary，MIT 授權、winget 一行安裝。從 PowerShell 半吊子別名與 Git Bash 的痛點談起，比較現有方案、猜微軟的生態動機，也誠實講 kill 與 timeout 缺席這些缺點。"
pubDate: 2026-06-03 09:11:46 +0800
category: programming
tags: ["windows", "linux", "cli", "open-source"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1780449106
---

本文擴寫於 2026-11-21。原稿是 2026-06-03 的 Facebook 連結分享，全文只有兩句：「微軟發布了給 Windows 使用的 UNIX-style 工具程式。Windows 現在用起來越來越像 Linux 了...」，附的連結是 [microsoft/coreutils](https://github.com/microsoft/coreutils)。以下把當時沒講完的背景補齊。

在 Windows 上想用 `ls`、`cp`、`grep` 這些工具，二十年來一直是個半吊子局面。cmd 的 `dir` 是 DOS 基因，PowerShell 幫 `ls` 做了別名，但那個 `ls` 其實是 `Get-ChildItem` 的化身，參數完全對不上，`ls -la` 直接報錯。認真一點的人裝 Git Bash 或 MSYS2，結果 path 轉換、行尾符、權限各自有各自的雷；更早還有 GnuWin32，一堆專案零散維護、多年沒更新。同一份 script 在 Git Bash 跑得動、貼進 PowerShell 就死，這種事我遇過太多次。

2026 年 6 月 2 日，Build 2026 開幕當天，微軟發布了 [Coreutils for Windows](https://github.com/microsoft/coreutils)：把 Rust 寫的 [uutils/coreutils](https://github.com/uutils/coreutils)、[uutils/findutils](https://github.com/uutils/findutils)，加上微軟新寫的 [uutils/grep](https://github.com/uutils/grep)，包成一個 multi-call binary，原生跑在 Windows 上，不用 WSL、不用模擬層。repo 採 MIT 授權，2026-05-15 建立，第一版 v2026.5.29 在 6 月 2 日放上 releases，安裝只要一行：

```powershell
winget install Microsoft.Coreutils
```

幾個我覺得值得注意的細節：

- **同一套指令走天下**。官方目標寫得很明白：在 Linux、macOS、WSL、container、Windows 之間移動時，flags 與 pipeline 行為一致。對天天在遠端 Linux 機器與本機 Windows 之間切換的人來說，這正是痛點本身。
- **相容性處理得務實**。DOS 既有的 `sort` 和 `find` 用 shim 保住原行為，PowerShell 另附 wrapper 讓 glob pattern 照 POSIX 慣例展開。
- **該砍的砍**。`chmod`、`chown`、`chroot`、`stty`、`tty` 這些綁 POSIX 權限模型與 terminal 概念的工具直接不提供；`uname`、`shred`、`dircolors` 在 Windows 沒意義也不做。`kill` 因為 Windows 沒有 signal 機制而缺席，連帶 `timeout` 也不能用——對寫 script 的人來說，這是最實際的缺口。

跟現有方案比：Git Bash 是完整 bash 環境，但行為被 MSYS2 的 path 轉換規則綁架；MSYS2 功能最全，套件管理卻是另一個世界；GnuWin32 大致半棄療。uutils 本身則是近幾年最有活力的 coreutils 重寫專案（MIT、24,400+ stars，經 GitHub API 實查），在 Linux 上也裝得起來——我這台 Arch 上的 GNU coreutils 是 9.11，uutils 尚未逐項對齊 GNU 行為，但微軟這次等於替它做了一次企業級背書，還附上 winget 發行管道，這對 uutils 生態的意義搞不好比 Windows 端本身還大。

回頭看微軟對 POSIX 工具的態度，其實繞了好幾圈：Windows NT 時代有過 SFU/Interix，後來收掉；WSL1、WSL2 把整個 Linux kernel 搬進來，解決了相容性卻犧牲了輕量——開個 WSL session 的記憶體成本不是每種場景都付得起。這次走第三條路：不搬 kernel，只把工具本身編譯成原生 binary。對只想在 cmd 底下敲個 `grep` 的人來說，這個取捨反而剛好。

微軟為什麼現在做這個？我認為動機很直白。Build 2026 整場都在賣「developer-optimized Windows」，Windows 負責人 Pavan Davuluri 的說法是讓你累積多年的指令與工作流在 Windows 上直接可用；去年 WSL 在 Build 開源，今年 WSL containers 進 public preview，而 AI 開發工作流幾乎全跑在類 Unix 環境。Windows 再不把命令列體驗補起來，開發者會繼續往 macOS 和 Linux 流失。這既是防禦，也是把開發負載留在 Windows 生態的算盤。

所以「Windows 越來越像 Linux」這句吐槽，如今是字面意義。我的評價：方向正確，執行還在 preview。`kill` 與 `timeout` 缺席、部分指令和 DOS 內建衝突得靠 shim 繞路，複雜 script 仍然不能無腦搬過去。但比起再裝一個 Git Bash，原生 binary、winget 一行安裝、MIT 授權、上游是活躍的 Rust 專案，這個組合我願意在下一台 Windows 機器上直接試。至於 systemd 什麼時候也被包進 winget——那就真的只能等笑話成真了。

延伸閱讀：我平時把開發環境整台搬到 Linux 的過程寫在 [Framework 13 上裝 Arch Linux 的筆記](/blog/framework-13-arch-linux-install/)；另一篇 [ssh 進去顏色全跑掉](/blog/ssh-term-environment/) 也是同一系列跨平台終端機環境的疑難雜症。
