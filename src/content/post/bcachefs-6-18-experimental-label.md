---
title: "Bcachefs 計畫在 Linux 6.18 移除實驗性標籤"
description: "從 Kconfig 的 EXPERIMENTAL 標記到底是什麼講起，還原 bcachefs 從 6.7 合併、6.16 衝突到 6.18 被 git rm 的完整時間線，以及 2026 樹外現況。"
pubDate: 2025-07-29T10:39:46+08:00
category: linux
tags: ["linux", "bcachefs", "filesystem", "kernel"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1753756786
---

你猜一個檔案系統要怎麼樣才算「不再實驗」？是改掉幾萬行程式碼，還是——改掉 Kconfig 裡的一行字串？

2025 年 7 月底我在 FB 上只寫了句短評：「Bcachefs 計畫在 Linux 6.18 移除實驗性標籤 👀 不是移出 Linux？這是誰給的勇氣」。這篇把它展開：先解釋 EXPERIMENTAL 標籤在 kernel 裡到底擋了什麼，再按年代把事件排開，最後補一段 2026 年回看的「後來怎麼了」。本文擴寫於 2026-11，原稿寫於 2025-07-29；我沒逐行讀過 bcachefs 原始碼，內容以 LWN、Phoronix、LKML 等二手資料為主，寫錯請留言糾正。

## EXPERIMENTAL 到底擋了什麼

老 Linux 人記憶中的 `CONFIG_EXPERIMENTAL`，是 init/Kconfig 裡那個「Prompt for development and/or incomplete code/drivers」開關：沒開它，`depends on EXPERIMENTAL` 的選項根本不會出現在選單裡。但它早在 2013 年的 v3.9 就被整批移除了——2012 年 kernel summit 決議、Kees Cook 跑了一整套約兩百個 patch 把樹裡所有 `depends on EXPERIMENTAL` 清掉（[patch 系列](https://lists.openwall.net/linux-kernel/2012/10/02/734)）。從那之後，Kconfig prompt 裡的 `(EXPERIMENTAL)` 就只是純裝飾字串：**不擋編譯、不擋掛載、不擋任何人**。

bcachefs 的標籤就長在這種地方。v6.16 的 [fs/bcachefs/Kconfig](https://raw.githubusercontent.com/torvalds/linux/v6.16/fs/bcachefs/Kconfig) 裡是 `tristate "bcachefs filesystem support (EXPERIMENTAL)"`，erasure coding 另有一個獨立的 `(EXPERIMENTAL)` 選項。所以 Kent Overstreet 說「6.18 拿掉實驗性標籤」，技術上只需刪掉 prompt 裡那個括號；真正要動的是社會契約——讓發行版敢預設啟用、讓我這種人敢把 homelab 的資料放上去。Linus 2024 年 8 月的話可以當註腳："nobody sane uses bcachefs and expects it to be stable, so every single user is an experimental site"（[Linux Magazine 引 LKML](https://linux-magazine.com/Online/News/Linux-Kernel-6.17-Drops-bcachefs)）。

## 按年代走一遍

- **2015–2023**：Kent 宣布 bcachefs，2019 年自稱 "it's done cooking" 求合併；2023 年 10 月進 6.7 merge window（2024-01 釋出），自帶 EXPERIMENTAL 標籤。
- **2024-11**：因郵件論戰罵人，CoC 委員會禁 Kent 投稿整整一個 cycle（6.13），這是他第一次被「時間到」（[The Register](https://www.theregister.com/2024/11/22/bcachefs_linux/)）。
- **2025-06**（6.16-rc 期間）：Kent 在 rc 階段送了 journal_rewind 這種新功能，Linus 拒絕時說 "This is getting beyond ridiculous"，最後雖然還是拉了，但撂話 "I think we'll be parting ways in the 6.17 merge window"（[2025-06-26 LKML](https://lore.kernel.org/all/CAHk-=wi+k8E4kWR8c-nREP0+EA4D+=rz5j0Hdk3N6cWgfE03-Q@mail.gmail.com/)，[LWN](https://lwn.net/Articles/1027289/)）。Ted Ts'o 也跳出來提醒 merge window 規則不是擺設。
- **原稿那天（2025-07-29）**：6.17 merge window 剛開，Kent 送出 6.17 PR——自稱 hard freeze、只修 bug——同時宣布 "the experimental label is coming off in 6.18"，理由是他翻完 bug tracker、訪談過使用者後覺得剩下的問題「it's not much」（[Phoronix 引 LKML](https://www.phoronix.com/news/Bcachefs-Linux-6.17)）。當時 Linus 尚未回應。這就是原稿「誰給的勇氣」的語境：一個月前維護者才說要分道揚鑣，Kent 的回答是「下下版我要畢業」。
- **2025-08**：Linus 在信裡寫道 "we're now talking about git rm -rf in 6.18"，Kent 引述在 LKML 上（[2025-08-09](https://lkml.org/lkml/2025/8/9/337)）。答案揭曉：勇氣沒被沒收，但選項已經變成「拿掉標籤」或「拿掉整個檔案系統」。

## 後來怎麼了（2026-11 補記）

- **2025-08-29**：Linus 把 MAINTAINERS 裡的 bcachefs 改成 "Externally maintained"；整個 6.17 cycle 一行 bcachefs code 都沒收，樹內 code 凍結在 6.16 狀態（[Phoronix](https://www.phoronix.com/news/Bcachefs-Externally-Maintained)）。
- **2025-09**：Kent 宣布轉為 DKMS 樹外模組（[Phoronix](https://www.phoronix.com/news/Bcachefs-DKMS-Plans)）；9 月 29 日 Linus 動手，[commit f2c61db](https://github.com/torvalds/linux/commit/f2c61db29f277b9c80de92102fc532cc247495cd) 一次刪掉 117,483 行、284 個檔案，理由是 "It's now a DKMS module, making the in-kernel code stale, so remove it to avoid any version confusion."（[Phoronix](https://www.phoronix.com/news/Bcachefs-Removed-Linux-6.18)、[LWN](https://lwn.net/Articles/1040120/)）。
- **2025-11 底釋出的 6.18**（如 Phoronix 當時預期成為 LTS）不再含 bcachefs。bcachefs.org 的說法很乾脆："As of 6.18, bcachefs is no longer being distributed with the kernel... So we're shipping as a DKMS module now. (Like ZFS!)"。
- **2026**：樹外開發持續且相當活躍。1.37（2026-03）宣告 erasure coding 穩定；1.38.6（2026-06）Kent 補了個「遲來的官方公告」——實驗性標籤正式拿掉了（[The Register](https://www.theregister.com/software/2026/06/19/bcachefs-exits-experimental-status-in-new-performance-release/5258801)）。只是這次是他自己在樹外拿的，跟當年計畫的「在 mainline 裡畢業」是兩回事。

## 評論：標籤是社會訊號，不是技術開關

結局剛好對上原稿的問句：標籤確實「在 6.18 前後」沒了——只是連 code 一起出樹了。EXPERIMENTAL 這種標記從 2013 年起就沒有任何機制上的意義，它的全部功能是訊號：告訴發行版維護者「出事別來煩我」，告訴使用者「資料自己負責」。openSUSE 在 2025 年 9 月一度宣布要跟著 6.18 移除 bcachefs、後來又放軟（[The Register](https://www.theregister.com/software/2025/09/25/bcachefs-goes-dkms-after-torvalds-kernel-banishment/729876)），正是這種訊號在發行版層級的傳導。

 Kent 的勇氣來源其實很正當：bug tracker 上的數字。但 merge window 的紀律是 Linus 維護的另一種「bug tracker」——一個不收 rc 期間新功能的社會規範。兩個計數器對不上，結果就是現在這樣。我自己是 btrfs 派、homelab 的資料照舊放 TrueNAS，bcachefs 留在觀察名單上；不過樹外化後反而少了一層「mainline 會幫它收斂」的期待，要試的人得自認是實驗站——這點 Linus 早就說對了。
