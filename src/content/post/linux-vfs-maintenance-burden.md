---
title: "Linux 核心檔案系統過度增加的負擔"
description: "fs/ 目錄下的七十來個檔案系統如何拖累 VFS 的 folio/iomap/fs_context 遷移，以及 VFS 團隊為新檔案系統立下納入與退場規範的來龍去脈。"
pubDate: 2026-05-06 14:40:01 +0800
category: linux
tags: ["linux", "filesystems", "kernel", "btrfs"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1778049601
---

（本文由 2026-05-06 的 Facebook 連結分享短文於 2026-11-21 擴寫而成，原稿出自 Phoronix 對 Linux 檔案系統數量與 VFS 維護負擔的報導。引文都在 lore.kernel.org 鏡像讀過原文，數字用 torvalds/linux master 分支現算，沒查證到底的地方文內會註明。）

Linux 核心到底背著多少個檔案系統？用 GitHub API 數 master 分支 fs/ 底下的子目錄，答案是 75 個；扣掉 iomap、netfs、quota、unicode 這類支援層，真正的檔案系統大約落在 Phoronix 2026 年 5 月報導所稱的 69 個上下。ext4、XFS、Btrfs、F2FS、NFS，加上完全不裝資料的 proc、sysfs，全都擠在同一個目錄裡，隔壁還住著從 BeOS 繼承來的 BeFS、IBM 移植的 JFS，以及 1991 年教會 Linus 第一課的 Minix。

這個數量本身的傷害在哪？fs/ 樹上方是 VFS——虛擬檔案系統共用層，而 VFS 一直在大改：page cache 從 struct page 遷往 folio、塊映射從 buffer_head 遷往 iomap、掛載參數遷往 fs_context 新 API。每一次遷移都得掃過 fs/ 底下六十幾個目錄。有維護者、有 fstests 覆蓋的檔案系統會跟著改，改不動時至少找得到人商量；麻煩的是被放棄的那些——介面轉換得由 VFS 開發者自己動手，又沒有測試能驗證轉完沒壞，結果只能無限延長新舊 API 並存期，或者冒著讓無測試程式碼迴歸的風險硬轉。這就是「廢棄檔案系統拖累 VFS 開發」的機理：幾千行沒人碰的 on-disk 格式程式碼，維護成本卻記在想改核心基礎建設的人頭上，而這些人往往連該檔案系統的磁片都沒見過。

導火線是同一週冒出的兩個新提案。Aurelien DESBRIERES 的 FTRFS 給太空級輻射環境設計，on-disk layout 加 CRC32 與 Reed-Solomon 糾錯，宣稱以五千行內的程式碼通過 DO-178C 之類認證稽核；Adrian McMenamin 的 VMUFAT 則是 Sega Dreamcast 記憶卡的檔案系統，2012 年提過一次，十四年後又回來了。2026 年 4 月 19 日，Amir Goldstein 把「新檔案系統提交指引」patch 的 v2 寄上 linux-fsdevel（Message-ID: 20260419111833.1520854-1-amir73il@gmail.com），commit message 寫得直白：「This document is motivated by the ongoing maintenance burden that abandoned and untestable filesystems impose on VFS developers, blocking infrastructure changes such as folio conversions and iomap migration.」——同一週就有兩個新檔案系統來叩門。這份文件本身只有 199 行，要求進 mainline 的檔案系統用 folio、iomap、fs_context 等現代介面，附 mkfs 與 fsck 工具、fstests 覆蓋、MAINTAINERS 條目，並直接寫明：維護者失聯、跟不上基礎建設變更、無法測試者，會被 deprecated 進而移除。patch 排進 vfs 樹的 vfs-7.2.misc 分支（commit b34d597f），預計趕上 Linux 7.2 的 merge window。

退場標準的辯論早一步展開。Jan Kara 在 2026 年 2 月 4 日一封 LSF/MM 討論信（Message-ID: yndtg2jbj55fzd2kkhsmel4pp5ll5xfvfiaqh24tdct3jiqosd@jzbfzf3rrxrd）點名 bfs、adfs、minix、efs、freevxfs：客群極小、測試接近不可能，對 folio/iomap 遷移的拖累「not very favorable」，最難的是找願意做轉換的人。Ted Ts'o 在 1 月的 NILFS2 討論（Message-ID: 20260124091742.GA43313@macsyma.local）更直接：沒有 fsck、沒進 fstests，「no one will take the file system seriously」，拿去生產環境近乎專業失職；檔案系統要的是公司派人投入的商業理由，曝光量幫不上忙。五月的 LSF/MM+BPF 峰會上，Christian Brauner 替這份指引定調：收新檔案系統的門檻「should be quite high」，他也提醒，最終決定權在把 patch 送去給 Linus Torvalds 的人手上，檔案系統社群手上並沒有否決權。

移除其實有前例：ReiserFS 在 6.6 被標記 deprecated，6.13 整個目錄拔除。指引就位後，下一批候補恐怕是那些名義上有人掛名、實際上沒人動的目錄——BeFS 在 MAINTAINERS 裡還標著 Maintained，JFS 的 Dave Kleikamp 則只給到 Odd Fixes 等級。（本段維護狀態僅限我對 master 的 MAINTAINERS 跑 grep 所見，沒逐個翻 git tree，「沒人動」的部分請打折扣看。）

兩個導火線的下場最有說服力：Phoronix 後續報導指出 VMUFAT 因為門檻收紧而無緣 mainline；FTRFS 經過幾輪 review——Matthew Wilcox 要求 IO 路徑從 buffer_head 遷去 iomap，Eric Biggers 指出 Reed-Solomon 該用核心內建的 lib/reed_solomon，作者 v2 自製的編碼器甚至會產出不相容的碼字——最後作者另外開了 beamfs 重寫。修完就沒事，檔案系統帳面上也漂亮，但從 commit 到 review 到測試全都是借來的工時，沒有任何企業會替這種目錄長期出錢。門檻文件還沒進 mainline，就已經在發揮過濾功能。

相關閱讀：bcachefs 與 Btrfs 的維護者風波（/blog/bcachefs-btrfs-maintainers/）是同一套治理問題的另一個樣本；Btrfs 在 Linux 7 拿到 large block DIO（/blog/btrfs-linux7-large-block-dio/）正是 folio/iomap 這些新介面在主要檔案系統落地的實例；APFS 設計的取捨（/blog/apfs-design-vs-btrfs/）則提供了跨平台檢視「什麼值得存在於核心」的角度。
