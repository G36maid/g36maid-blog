---
title: "在 Ubuntu 幫朋友裝軟體，比我的 Arch 還難裝——AUR vs Ubuntu 套件安裝體驗"
description: "從「看到 Available on AUR 反而鬆一口氣」談起：比較 Ubuntu 的 apt/PPA/snap/手動 deb 多重安裝路徑與 AUR 的單一入口，解釋 PKGBUILD 與投票機制為何能把安裝收斂成一種，再用 2026 年 AUR 供應鏈攻擊事件檢視這份便利的代價。"
pubDate: 2025-10-15 03:54:12 +0800
category: linux
tags: ["ubuntu", "aur", "arch", "pacman", "snap", "supply-chain"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1760471652
---

幫朋友在 Ubuntu 上裝軟體，有時候遇到的複雜度竟然比我在 Arch 上還要高。這句話聽起來違反直覺——Ubuntu 不是素來以「對新手友善」著稱嗎？但實際跑過一輪之後，我發現友善的是預裝好的桌面，不是「安裝官方倉庫沒有的軟體」這件事。老實說，如果一個新軟體的 installation guide 裡寫著「Available on AUR」，我反而會鬆一口氣：那代表我不用操心，一條指令就能裝起來測試，看看能不能整合進自己的工作流程。

先講 Ubuntu 上實際會走過的安裝路徑。官方 apt 倉庫裡有的東西，`sudo apt install` 當然最舒服。麻煩從倉庫沒有開始：通常是上官網找安裝說明，接著撞上好幾種岔路——加入 PPA 再 `apt update`、從下載頁抓 `.deb` 用 dpkg 裝、被引導去裝 snap 或 Flatpak 版本，甚至遇到只提供 AppImage 或要自己加第三方 apt 源的。這些路徑各自成立，問題是它們的更新機制、信任來源、解除安裝方式都不一樣：PPA 要記得事後移除，snap 有自己的版本與掛載行為，手動抓的 `.deb` 從此不受套件管理照顧，第三方源則是把別人的 repository 加進系統信任鏈。Ubuntu 官方文件[把套件管理拆成 apt、snap 等好幾套系統說明](https://ubuntu.com/server/docs/package-management)，這個「拆」字本身就說明了體驗——沒有一個地方能讓我先統一搜一次，再決定怎麼裝。Debian wiki 也[特別警告非官方倉庫的風險](https://wiki.debian.org/UnofficialRepositories)，因為第三方源等於把 root 權限的程式碼來源交給不認識的人，這是常識，卻也是每次裝新軟體都要重新判斷一次的成本。

Arch 這邊的體驗正好相反。官方倉庫之外的東西幾乎都在 [AUR](https://aur.archlinux.org/)（Arch User Repository），一個社群維護的套件描述檔集合。搜到、`paru -S` 或 `yay -S`、看完 PKGBUILD 確認、Enter，結束。不是說要把 AUR 當 App Store 來用，但至少那是一個統一可以先搜看看的地方——安裝路徑被收斂成一種，更新也收斂成一種，AUR helper 會把官方倉庫和 AUR 一起升級。我自己的 [dotfiles](https://github.com/G36maid/dotfiles) 裡就有一份 `pacman`/`paru` 的明細清單，換機器時照著跑一輪，整個環境就回來了。

為什麼 AUR 能做到這種統一？關鍵在它存的不是二進位套件，而是 [PKGBUILD](https://wiki.archlinux.org/title/PKGBUILD)——一份描述「原始碼從哪來、怎麼編譯、裝到哪裡」的 shell script，下載、編譯、安裝都在自己機器上發生，官方只提供網站與 git 托管。副作用是覆蓋率極高：上游只要釋出東西，通常幾天內就有人寫好 PKGBUILD，因為寫一份的成本比維護整個發行版包低很多。另一個機制是[投票](https://wiki.archlinux.org/title/AUR_voting)——夠多票數的套件可能被 TU（Trusted User）收進官方 [extra] 倉庫，等於社群用票聲決定哪些東西值得升級成一級公民。名聲與維護者列表就長在套件頁上，查一個 PKGBUILD 可不可信時這些是線索。

但統一的背面就是集中風險，這半年 AUR 的安全事故多到不能裝作沒看見。2026 年 6 月的「Atomic Arch」事件中，攻擊者大量認養孤兒套件，在 PKGBUILD 裡塞 `npm install atomic-lockfile` 之類的指令，第一波[超過 400 個套件](https://labs.cloudsecurityalliance.org/research/csa-research-note-aur-supply-chain-ebpf-rootkit-20260614-csa)被注入憑證竊取器與 eBPF rootkit，24 小時內換了投放載體、總數衝到 1,500 以上，Arch 官方後來[發新聞呼籲大家檢查所有 PKGBUILD 變更](https://archlinux.org/news/active-aur-malicious-packages-incident)。7 月又爆發一波惡意認養潮，Arch 直接[暫停套件認養](https://lists.archlinux.org/archives/list/aur-general@lists.archlinux.org/message/DRDEU3JUSC72CB265XHXPFA3DFSLXPBP/)。這些案例的共同點很刺眼：套件名、歷史、投票數都沒變，只有 build script 被換掉——也就是說，「在 AUR 上搜得到、票數不錯」這個訊號本身，並不能證明今天這份 PKGBUILD 是乾淨的。

所以對我來說，AUR 的 trade-off 是拿「集中、方便」換「信任必須自己驗」。它不是官方倉庫，AUR 頁面自己就寫著 user produced content、風險自負，官方 [Arch Wiki](https://wiki.archlinux.org/title/Arch_User_Repository) 也一直強調更新前要讀 PKGBUILD。滾動更新雖然讓套件永遠跟上游，但基礎系統跟著動，沒有 Ubuntu LTS 那種「五年不動」的保證，出事時也不像 Ubuntu 有那麼多現成的論壇答案。反過來說，Ubuntu 的 LTS 加上嚴格一點只用官方倉庫與 snap，其實是更保守也更容易交接給別人的選擇——只是代價就是上面那串岔路。

我的結論是：如果機器是我的主力工作機，AUR 的統一入口省下來的時間遠大於偶爾讀 PKGBUILD 的成本，而且讀 script 這件事本來就是 Arch 生態的入場費，我買單。如果是幫朋友裝機、或者機器的主人不想理解套件從哪來，Ubuntu 反而是對的選擇——穩定、預設行為可預期，只是我要多花點時間幫他挑安裝路徑。順帶一提，[上次把 Arch 裝起來](/blog/arch-install-notes-2025/)之後，我把桌面環境與 [ricing 相關的套件選擇](/blog/linux-ricing-productivity/)也整理進了 dotfiles，換機器時 AUR 這套清單直接就能重放，這大概是「統一先搜一次」最大的紅利。

