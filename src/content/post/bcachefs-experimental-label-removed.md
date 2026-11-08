---
title: "bcachefs 拿掉「實驗性」標籤：一場遲到的官方宣告，以及它背後的兩年"
description: "bcachefs 於 2026 年 6 月由 Kent Overstreet 宣布不再 experimental：從 6.7 閃電合併、on-disk format 凍結、與 Linus 的衝突到移出 kernel 改走 DKMS，除標的實質意義與仍在的限制。"
pubDate: 2026-06-25T04:42:17+08:00
category: linux
tags: ["bcachefs", "檔案系統", "linux-kernel", "filesystem"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1782333737
---
> 本文擴寫自 2026-06-25 的 Facebook 貼文（原文僅兩行：「聽說皮卡丘檔案系統(bcachefs) 已經拿掉實驗性標籤了／準備來深入研究一下」，附一條 Phoronix 連結）。擴寫於 2026-11-08，所有事實主張附原始出處，查證不到的細節會明說。

# bcachefs 拿掉「實驗性」標籤：一場遲到的官方宣告，以及它背後的兩年

2026 年 6 月中下旬，bcachefs 的消息圈有兩件事同時發生：Kent Overstreet 發布了 bcachefs-tools 1.38.6（6 月 17 日），並在 Patreon 貼文中寫下這句話：

> "We're no longer experimental. I took the label off the website – a few months ago, I think, based on my usual 'the incoming bug reports are slowing down and looking a lot less serious and easy to get through than they were'. Consider this the belated official announcement :)"

（出處：[Kent Overstreet 的 Patreon 貼文](https://www.patreon.com/bcachefs/posts/1-38-6-release-161366372)）

三天後，Michael Larabel 在 Phoronix 發表了基準測試 review——也就是原稿連結指向的那篇——標題就叫「Benchmarking Bcachefs 1.38.6: The First Release No Longer "Experimental"」（2026-06-22，[bcachefs-1386](https://www.phoronix.com/review/bcachefs-1386)）。所以那條 review 連結的意義是：**這是 Kent 拿掉 experimental 標籤之後的第一個版本**，Larabel 在同一台機器上比較 1.38.5 與 1.38.6 的效能變化（Threadripper 9980X、Ubuntu 25.10、Samsung 9100 PRO NVMe）。

## 「標籤」到底指哪一個？其實有三層

查證時最容易混淆的一點：「拿掉實驗性標籤」不是一個 kernel commit。它至少有三個層次，時間點各不相同：

1. **kernel 內的 Kconfig 標籤**：bcachefs 進入 mainline 時，`fs/bcachefs/Kconfig` 的選項名就叫 "bcachefs filesystem support (EXPERIMENTAL)"，這個字串從 Linux 6.7 一路留到 6.17（見 [LKDDb 資料庫](https://cateee.net/lkddb/web-lkddb/BCACHEFS_FS.html)）。但它**永遠沒有機會在 mainline 被拿掉**——因為 6.18 起 bcachefs 整個被移出 kernel 了。
2. **bcachefs.org 網站上的標籤**：這才是 Kent 說「I took the label off the website」的那個。他說是「幾個月前」拿掉的；ArchWiki 記載官方 FAQ 於 2026-04-15 起宣稱 bcachefs 為 stable（[ArchWiki: Bcachefs](https://wiki.archlinux.org/title/Bcachefs)）。這個時間點是二手轉述，我沒有找到原始網頁改版的精確日期。
3. **「官方宣告」本身**：遲至 1.38.6 的 Patreon 貼文才補上，Kent 自己也承認是 "belated"。判斷依據是他一貫的標準：進來的 bug report 變少、而且嚴重度變低。

換句話說，2026 年 6 月這波報導（Phoronix、The Register、Linuxiac）報的其實是一個**補發的官方宣告**，搭著 1.38.6「效能釋出版」一起講。

## experimental 從何而來：6.7 的閃電合併

回頭看標籤的起點。2023-10-30，Kent 發出 [bcachefs 的第一個 [GIT PULL] 請求](https://lore.kernel.org/lkml/20231030145540.pjkggoiddobyjicq@moria.home.lan)，Linus 在 24 小時內就合併了——merge commit [9e8770528966](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=9e87705289667a6c5185c619ea32f3d39314eb1b)，2781 個 commit、223 個檔案、約 95,000 行新增，MAINTAINERS 裡的狀態直接標 `Supported`。Linux 6.7 於 2024 年 1 月釋出，bcachefs 正式進入 mainline，但 Kconfig 帶著 EXPERIMENTAL 字樣；同檔案裡 erasure coding 選項還加了一句現在回看很有歷史感的警告："WARNING: this feature is still undergoing on disk format changes, and should only be enabled for testing purposes."

## 這兩年標籤為什麼摘不下來

### on-disk format 一直在動

檔案系統的 experimental 標籤有個很實際的意義：**磁碟格式還會變**。bcachefs 前兩年正是如此——Hacker News 上一則被廣泛引用的整理（出處 Kent 本人的說明脈絡，[Migrating Away from Bcachefs 討論串](https://news.ycombinator.com/item?id=42773296)）指出兩個大改：6.11 的 accounting rewrite（把空間統計從 percpu counter 改成寫進 btree key、以 delta 方式進 journal），以及 6.14 的 backpointers 改動（為了 fsck 的可擴展性）。升級 kernel 可能就得跑相容性升級甚至 fsck，這對「穩定」的定義是硬傷。

轉折出現在 2025 年初：Kent 先宣告 master 分支上 on-disk format 凍結（[Phoronix: Bcachefs Freezes Its On-Disk Format](https://www.phoronix.com/news/Bcachefs-On-Disk-Format-Freeze)）；3 月的 6.15 pull request 再確認為 "soft frozen"——"no more required/automatic are anticipated before taking off the experimental label"（merge commit [4a4b30ea](https://github.com/torvalds/linux/commit/4a4b30ea80d8cb5e8c4c62bb86201f4ea0d9b030)）。

### Linus 的態度從未軟化

標籤掛著的另一個原因，是 kernel 頂層對它的信任程度。這兩句原話值得留檔：

- 2024-04-07，Linux 6.9-rc3 公告：*"if you thought bcachefs was stable already, I have a bridge to sell you"*（[LKML 原信](https://lore.kernel.org/lkml/CAHk-=whDuqyVC6xMkOnNt2EeTd-s4uqa3sYghj5UzkELFW2bpw@mail.gmail.com/)）
- 2024-08-24，拒收 6.11-rc5 的 fixes pull 時：*"Nobody sane uses bcachefs and expects it to be stable, so every single user is an experimental site."*（[LKML 原信](https://lore.kernel.org/lkml/CAHk-=wj1Oo9-g-yuwWuHQZU8v=VAsBceWCRLhWxy7_-QnSa1Ng@mail.gmail.com/)）

Kent 自己在 2024-04 的 rc4 pull request 回信裡也說得很直白："bcachefs is still marked as experimental for a reason... you shouldn't be running bcachefs just yet if you'll be sad if things are offline for a bit (where a bit has been for a few people a week or two)"（[原信](https://lore.kernel.org/lkml/woux55cy6ms6exoa43hg745ftfo6msc3bsnjge3te2c4pvdzmf@57wrbdc5pp7s)）。也就是說：最壞情況資料不會丟，但檔案系統可能離線一兩週等你 debug。

### 然後它連 kernel 都待不下去了

2025-06-26，Kent 在 6.16-rc4 又把 journal_rewind 這類帶新功能的修復塞進 pull request，Linus 收下了程式碼但附上那句著名的 *"I think we'll be parting ways in the 6.17 merge window"*（[LWN 整理](https://lwn.net/Articles/1027289/)、[Phoronix 報導](https://www.phoronix.com/news/Bcachefs-One-Week-Later-Merge)）。後續：2025-08 Linus 把 bcachefs 在 MAINTAINERS 改標 "externally maintained"（commit [ebf2bfec](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ebf2bfec412ad293a0b118fb1a20a551088ebc9b)），2025-09 起整個從 kernel 移除，6.18 開始改以 DKMS 模組形式發行（[bcachefs.org](https://bcachefs.org/) 自述）。German storage-insider 的報導提到移除的量級約 117,000 行。

所以有一個苦澀的註腳：**Phoronix 在 2025-07-28 的報導「[Bcachefs To Remove Its Experimental Label In Linux 6.18 – If It's Still In The Kernel](https://www.phoronix.com/news/Bcachefs-Linux-6.17)」中的那個如果，最終以最壞的方式成真**——Kent 在 6.17 的 pull request 裡原計畫「the experimental label is coming off in 6.18」，但標籤沒能在 kernel 裡被拿掉，因為整個檔案系統先離開了 kernel。

## 2026 年：除標前的修補清單

到 1.38.6 為止，"experimental" 的實質構成要件大致被清掉了：

- **磁碟格式**：1.38.x 系列每個版本的 changelog 都明寫 "No on-disk format changes"（[bcachefs-tools Changelog](https://github.com/koverstreet/bcachefs-tools/blob/master/Changelog.mdwn)）。不過 Patreon 貼文也提到 1.39 會有「小的磁碟格式變更」——格式凍結是 soft，不是 stone。
- **Erasure coding**：2026-03 的 1.37.0 拿掉 EC 的 experimental 標記（metadata version `erasure_coding`），核心功能宣告齊備；1.38.6 再加強。Kent 說 EC 採用非同步建 stripe 的方式避開 RAID5/6 的 write hole。
- **Reconcile**（前身 rebalance）：設備與資料管理的狀態機，背景搬移、rereplicate、套用 EC 選項，1.38.6 大幅加速與並行化。
- **效能**：Kent 自述這輪 benchmark + profiling 產出約 200 個核心補丁；自報 dbench 48 clients 16.5 GB/s（對照 XFS 16 GB/s）、fio 4k 隨機寫 700k IOPS（對照 XFS 1M）。注意這是**開發者自報數字**，Phoronix 的獨立測試只比較了 1.38.5 vs 1.38.6，對其他檔案系統的橫向比較要等 Linux 7.2 之後的文章。The Register 也酸了一句：某些情境其實比 XFS 慢。
- **規模上限**：單一檔案系統支援到 255 個設備。
- **Rust 重寫**：userspace 已轉成 Rust，下一版把 Rust bindings 進 DKMS 模組。

## 除標的實質意義——與還沒變的事

除標是**維護者單方面的品質宣告**：DKMS 模組沒有 kernel 的 Kconfig 標籤機制，experimental 的摘除完全由作者裁量（Reddit 討論串上不少人點出這點）。它的意義在於訊號——bug report 的量與質到了 Kent 自己的除標門檻——而不是任何機構背書。Linuxiac 的標題下得好：「No Longer Experimental, But Caution Still Applies」。

仍然該記在心上的限制：

1. **不在 kernel 裡**。6.18 起要靠 DKMS 每次編譯，發行版支援是套件庫層級的事（Debian/Ubuntu 走 apt.bcachefs.org；官方站列出 Gentoo、Void、NixOS、Arch、Fedora、openSUSE 等打包說明）。
2. **單一主力開發者**。兩年來的爭議本質之一就是 bus factor：CoC 停權（2024 年 11 月被禁足一個開發週期）、與其他維護者的衝突、Debian 維護者 2024-08 孤兒化 bcachefs-tools 套件。除標不會改變這個結構。
3. **fsck 仍然是痛點**。issue tracker 上不缺這類報告：大檔案系統 fsck 吃掉數 GB 記憶體甚至 OOM（[#850](https://github.com/koverstreet/bcachefs/issues/850)）、多快照時掛在 fsck 好幾小時（[#747](https://github.com/koverstreet/bcachefs/issues/747)）。online fsck 在 roadmap 上，1.37 也讓 journal rewind「完全安全」，但離 XFS 級別的修復體驗還有距離。
4. **過去兩年的磁碟格式變動史**意味著你手上的舊檔案系統可能需要跑過相容性升級；除非備份在手，別把唯一副本放上去。

## 證據等級聲明

這篇文章的證據分三級：**一級**（我直接讀過原文的）——Patreon 貼文全文、LKML 三封信、merge commits、Phoronix review 原文、bcachefs-tools changelog、LWN、Linuxiac、The Register、Wikipedia；**二級**（可信但未見原始文件）——ArchWiki 對 FAQ stable 日期（2026-04-15）的記載、storage-insider 對 117k 行移除量的數字；**未查證**——「幾個月前拿掉網站標籤」的精確日期（Kent 自己也只說 "a few months ago, I think"）。dbench/fio 效能數字均為開發者自報，未經獨立重現。

bcachefs.org 現在的首頁寫著一句自嘲式的話：6.18 起不再隨 kernel 發行，「原因太複雜，這裡說不清。（但可能跟 QA 有關。）」除掉實驗性標籤是真的，路怎麼走回去，還沒有答案。
