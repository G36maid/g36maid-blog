---
title: "Btrfs 的 block size > page size direct I/O 與 remap-tree：Linux 7.0 裡我最期待的兩個變更"
description: "Linux 7.0 讓 Btrfs 在 block size 大於 page size 時終於支援 direct I/O，並加入實驗性的 remap-tree：從 iomap、large folio 與 relocation 實作層，談這兩個變更為什麼難、解決了什麼。"
pubDate: 2026-04-16T16:28:02+08:00
category: linux
tags: ["linux", "btrfs", "kernel", "filesystem"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1776328082
---

> 本文擴寫自 2026-04-16 的 Facebook 貼文（原稿只有一句 kernel 摘要引文加「太開心了」三個字），擴寫於 2026-11-04，過程查證了 patch series 與 release 時序。

2026 年 4 月 16 日，我在 Facebook 上轉了一則 kernel 摘要，全文只有一句話加三個字：

> The Btrfs file system received support for direct I/O when a block size is bigger than the page size and initial support for the remap-tree feature

太開心了。

那個時間點不是巧合：[Linux 7.0 於 2026 年 4 月 12 日釋出](https://kernelnewbies.org/Linux_7.0)，我轉貼的那句話正是這次 release 裡 Btrfs 的兩大變更。而這兩件事背後的故事——一個糾纏了 kernel 社群快十年的假設，和一個重寫 Btrfs relocation 根基的實驗——比摘要那句乾巴巴的英文有趣得多。

## 先立術語：block size、page size、folio

討論之前先把名詞釘死，不然後面全是概念漂移：

- **page size（PS）**：kernel 記憶體管理的最小單位，x86_64 上是 4KiB。
- **block size（Btrfs 裡叫 sectorsize）**：檔案系統配置資料的最小單位。
- **folio**：6.1 前後引進的資料結構，把一段連續實體頁包成一個物件，讓 page cache 可以表示「大於一頁」的單位。Btrfs 的 bs > ps 支援幾乎整個建立在 large folio 之上。

關鍵假設是這樣：早年 kernel 程式碼裡到處寫著「一個 page 就是一個 fs block」。只要 block size ≤ page size，兩者可以混著用不會出事。Btrfs 反過來先破例——[3.4 版（2012）就支援 metadata nodesize 大於 page size](https://btrfs.readthedocs.io/en/latest/Feature-by-version.html)（預設 16KiB，btrfs-progs 3.12 起即是如此），因為 metadata 走自己的路徑。但**資料**的 bs > ps，一直拖到 [6.18 才有實驗性支援](https://www.phoronix.com/news/Linux-6.18-Btrfs)，而且第一版明確不支援 direct I/O 和 RAID56。

## 為什麼 bs > ps 的 direct I/O 這麼難

難點不在 page cache——large folio 把它解決了——而在 **direct I/O 的記憶體是你給的，不是 kernel 給的**。

Btrfs 的 bs > ps 實作依賴一個不變式：任何 fs block 都不能跨 folio 邊界。buffered I/O 沒問題，因為 page cache 的 folio 是 kernel 自己配的，它可以保證 folio 夠大、對齊正確。但 DIO 的目標緩衝區來自 user space：程式只能保證**虛擬位址**連續，實體頁要等多久、是否對齊，完全不受控制。Qu Wenruo 在[啟用 bs > ps 的原始 patch 說明](https://www.spinics.net/lists/linux-btrfs/msg158010.html)裡寫得很直白：「user space programs can only ensure the virtual addresses are contiguous, but no control on their physical addresses. Our bs > ps support heavily relies on large folios, and direct IO memory can easily break it.」

第二個坑在 checksum。Btrfs 每個 block 都有 checksum，DIO 讀寫要邊走邊算，所以 bio 的 biovec 必須按 fs block 對齊。但 iomap 的 `bio_iov_iter_get_pages()` 只對齊到 `bdev_logical_block_size()`——也就是 512 或 4K——[Qu Wenruo 提出的修法](https://lore-kernel.gnuweeb.org/linux-fsdevel/20251023135559.124072-2-hch@lst.de/)是加一個 `IOMAP_DIO_FSBLOCK_ALIGNED` 旗標，讓檔案系統宣告「請把我的 bio 切在 fs block 邊界上」。這個旗標由 Christoph Hellwig 代投進 iomap 層，是 Btrfs 之外所有人共享的基礎建設。

時間軸整理一下（依 [btrfs 官方 feature 對照表](https://btrfs.readthedocs.io/en/latest/Feature-by-version.html)與 [Phoronix 報導](https://www.phoronix.com/news/Linux-6.18-Btrfs)）：

- **6.17**：實驗性 large folio 支援
- **6.18**：實驗性 bs > ps，**無** DIO、無 RAID56
- **6.19**：補上 encoded read/write、RAID56，free-space-tree 變必要 feature
- **7.0**：[David Sterba 於 2026-02-06 發的 pull](https://www.phoronix.com/news/Linux-7.0-Btrfs-Changes) 中，Qu Wenruo 以 27 個 patch 把 DIO 打開——其中 [`btrfs: enable direct IO for bs > ps cases`](https://git.kernel.org/linus/ddea91780fecd349eb4b2c4036bfbf1ab5f75321) 就是那句「太開心」的來源

還有個誠實的但書：7.0 的 DIO **不是無條件全開**。資料 profile 帶 duplication（single 以外有冗餘的 block group）時會 fallback 回 buffered I/O，避開 checksum 與冗餘 profile 的對不上的問題；真正的 DIO 目前限 single 或 RAID0。這在 [btrfs 文件的 7.0 條目](https://btrfs.readthedocs.io/en/latest/Feature-by-version.html)寫得明白。

## remap-tree：把 relocation 的成本從「改寫所有 tree」變成「查一層表」

第二個 feature 更激進，因為它動了 on-disk format。

Btrfs 做 balance/relocation 時，現行作法是沿著 backref 把每一棵引用到舊位址的 tree 都改寫一遍。Mark Harmstone 在 [2025 年 5 月的 RFC](https://lwn.net/Articles/1021452/) 裡描述現狀：「Our present system involves following backrefs to rewrite addresses in the metadata trees, which can be slow and has knock-on effects such as breaking nocow files.」——又慢，還會弄壞 nodatacow 檔案。

remap-tree 的想法（原始設計出自 [Josef Bacik 的 extent tree v2 todo](https://github.com/btrfs/btrfs-todo/issues/54)）是加一層**邏輯位址的間接層**：block group 被 REMAPPED 之後，所有落在它名下的 I/O 都先查 remap tree 得到真正的底層位址。relocation 時不再改寫每棵 tree，只記一筆新舊位址對應。它有自己的 REMAP chunk type（不能塞進 SYSTEM chunk，因為 chunk item 得擠進 superblock），incompat flag 是 `1ULL << 17`，目前 gated 在 `CONFIG_BTRFS_EXPERIMENTAL` 後面。Harmstone 是誰？就是寫 WinBtrfs（Windows 上的 Btrfs 驅動）那位，從 RFC 到 v5（[2025-11-10](https://lwn.net/Articles/1046074/)）改了半年，v5 才補上 remap backrefs 和 REMAP chunk 自身的 relocation。

長遠來看它解鎖的東西在 [kernelnewbies 的 7.0 條目](https://kernelnewbies.org/Linux_7.0)講得很清楚：更大的 data extent、以及「移除 COW-only metadata items 來降低寫入放大」。對 SSD 壽命和 balance 卡頓都是實質改善。btrfs-progs 7.0 起 `mkfs.btrfs -O remap-tree` 就能玩，btrfstune 還支援離線轉換。

一個有趣的細節：目前這兩個 feature **互斥**——[v5 的 changelog 明寫](https://lwn.net/Articles/1046074/)「Now errors out on mount if we try to use remap tree when bs > ps」。兩條戰線各自推進，會合之後的事，那就是 extent tree v2 的下一步了。

## 證據等級聲明

老實說：這篇是二手資料整理—— mailing list、LWN、Phoronix、官方文件——我沒有逐行讀完原始碼，也還沒真的開一顆 bs > ps 或 remap-tree 的檔案系統來測。細節若有出入，以 patch 原文和 [btrfs 文件](https://btrfs.readthedocs.io/en/latest/Feature-by-version.html)為準。

但「太開心了」是真的。一個我天天在用的檔案系統，在 2026 年的春天同時把兩塊十年的架構債還掉了一角，沒有什麼比看著它慢慢變好更開心的了。
