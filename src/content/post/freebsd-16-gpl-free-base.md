---
title: "FreeBSD 16 基礎系統正式告別最後的 GPL 程式碼 dialog，真正實現 GPL Free"
description: "FreeBSD 16 基礎系統正式告別最後的 GPL 程式碼 dialog，真正實現 GPL Free。從 bsddialog 替換史到 GPLv3 凍結 GCC 的二十年去 GPL 搬遷，考證 commit、review 與 release note，並附 2026-11 的 16.0 release 現況。"
pubDate: 2026-07-16 21:55:18 +0800
draft: false
category: linux
tags: ["freebsd", "程式", "GPL", "授權"]
source: "facebook"
sourceType: "facebook"
sourceTimestamp: 1784210118
---

本文擴寫於 2026-11-25；原稿是 2026-07-16 貼在 Facebook 的連結短評，全文只有一行——「FreeBSD 16 基礎系統正式告別最後的 GPL 程式碼 dialog，真正實現 GPL Free」——加一條 Phoronix 連結。半年過後把當時的脈絡挖出來補齊，順便看看這半年又發生了什麼。

看到這則新聞時我的第一反應有點好笑：FreeBSD 追逐「base system 零 GPL」這個目標追了二十多年，最後倒下的居然是一個畫藍色終端框框的小工具。`dialog(1)` 是 LGPL 授權的 cdialog，靠 ncurses 畫選單、表單、進度條，FreeBSD 安裝程式 bsdinstall 的 shell script 就是一層層呼叫它在 tty 上長出那個藍底白字的安裝畫面。它自己不是什麼重量級的元件，麻煩純粹在授權：base system 是整包再散佈的作業系統，裡面只要有一份 copyleft 程式碼，商用產品廠商就得跟著處理義務。對主張 permissive license 的 FreeBSD 來說，這根刺一拔二十年。

替換它的人是 Alfonso Siciliano（asiciliano）。2021 年 Q2 的 FreeBSD status report 就有他「BSDDialog — TUI Widgets」的專案報告，目標很明確：寫一個 BSD-2-Clause 授權、API 相容 dialog(1) 的替代品。第一刀切在 2022 年 4 月 2 日，commit `6833ac673d98`，訊息寫著「Replace (LGPL) dialog(1) with (BSD-2-Clause) bsddialog(1)」，先把 bsdinstall 的 netconfig 換掉；同年 9 月 bsddialog 0.4 以 vendor import 進了 `contrib/bsddialog`；2023 年 10 月 bsdconfig(8) 也跟進；2024 年 5 月 import 1.0.3。到這裡，安裝程式和設定工具實質上都已經改用 bsddialog 了，dialog(1) 在 base 裡已經沒有活著的 caller——剩下的最後一個使用者是 dpv(1)，Devin Teske 寫的進度顯示工具，早已停用兩年多，只是程式碼還躺在樹上。

真正動手清場的是 Dag-Erling Smørgrav（des）。2026 年 2 月 21 日他在 Phabricator 一口氣開了 D55423「Retire GNU diff」和 D55424「Retire dialog」。GNU diff 會留到這麼晚，原因是 BSD 版的 diff3(1) 一直補不齊功能——emaste 的「Retire GNU diff3」（D46878，FreeBSD Foundation sponsored，一次刪掉 82 個檔案、32,560 行）直到 2026 年 2 月才落地，diff3 補齊了，GNU diff 才退場，3 月 10 日以 `df5b2cf2b31b` 完全移除。接著 7 月上旬 D55424 併入，dialog、dpv、libdpv、libfigpar 一起退役；des 再開 D55425 把已經空掉的 `gnu/` 子樹整個刪掉，commit `134a4c7` 的訊息只有一句：「With GNU diff and cdialog gone, this is now an empty shell.」Devin Teske 在 7 月 9 日的貼文寫「we at-long-last banished the last of the copyleft licensed code out of the FreeBSD tree. Goodbye cdialog, bsddialog is here to stay.」

這件事的遠因，FreeBSD Foundation 那份《FreeBSD 13.0 Tool Chain》白皮書講得最直白：FreeBSD 從一開始就依賴 GNU toolchain（GCC、binutils、GDB），這些工具一直有人在維護更新，「This continued until 2007 when the GNU project changed the license on these tools to version 3 of the GNU Public License (GPLv3), and they were not updated again.」也就是說 GPLv3 一出，in-tree 的 GCC 就凍結在 4.2.1，FreeBSD 於是花了十年做 LLVM/Clang 遷移，直到 sparc64 退役後的 2020 年初才有辦法把 GCC 連同 binutils 2.17 從樹裡拿掉；13.0（2021 年 4 月）的 release notes 正式宣布「Removed the obsolete binutils 2.17 and gcc(1) 4.2.1 from the tree」，同時 BSD 版 grep(1) 轉正、GNU grep 移除。之後 diff、diff3、dialog 逐一清掉，base 的 GNU 足跡就這樣一寸一寸縮到零。

所以「GPL Free」講的是 base system，不是整台 FreeBSD——ports/packages 裡幾千個 GPL 程式照樣能裝。對一般桌上使用者，安裝畫面長得幾乎一樣（bsddialog 本來就是照著相容性做的）；真正受益的是嵌入式和商用再散佈場景，base 從此可以整包放進產品而不必碰 copyleft。這在主流 32/64-bit BSD 裡是頭一遭：OpenBSD 早就禁止新的 GPL 軟體進 base，但舊的歷史殘留還在。

不過別急著開香檳。Phoronix 在 7 月 29 日就出後續了：FreeBSD wiki 的 GPLinBase 頁面從「Mission accomplished!」悄悄改口，承認 kernel 裡還有 GPL 程式碼——從 Linux kernel 抄來的 device tree 檔案，例如 Qualcomm 的 `qcom,tcsr.h` header 和若干 GPLv2-only 的 `.dts`。userland 乾淨了，kernel 還差一截，除非說服上游改雙授權。可見「去 GPL」不是一次新聞發布會，是一場持續二十幾年的搬遷，現在只是先搬完了人（userland），房子（kernel）裡還留著前房客的家具。

相關文章：之前把 Zed 移植到 FreeBSD 的記錄在 /blog/zed-freebsd-port/，用 OPNsense（FreeBSD 底）玩 NAS 與巢狀虛擬化的則在 /blog/bsd-nas-opnsense-nested-virt/。

2026-11 update：16.0-RELEASE 截至今天（2026-11-25）還沒有發布。官方 release 資訊頁上最新的 production release 是 15.1（2026-06-16），15.2 正在 beta，14.5（2026-09-08）為 legacy；dialog(1) 和 dpv 在 15.x 的 base 裡都還在。Phoronix 的報導預期 16.0 要到 2027 年 12 月才會成形，換句話說這個「正式告別」還要再等一年多才真正抵達一般使用者的安裝畫面。目前手上能做的，是去 16-CURRENT snapshot 上看看那個沒有 cdialog 的世界——只是安裝程式的藍框框看起來，大概還是老樣子。
