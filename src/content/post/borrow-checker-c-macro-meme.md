---
title: "我剛剛把 borrow checker 搬到 C 了"
description: "兩行 #define 讓 C cosplay Rust 的自嘲文，順便半認真考據 Checked C、Fil-C、Safe C++ 與 clang -Wlifetime 這條把記憶體安全搬進 C 的研究路線。"
pubDate: 2026-09-24 05:31:44 +0800
category: shitpost
tags: ["rust", "c", "meme", "memory-safety"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1790199104
---

> 擴寫於 2026-11-21。原稿是 2026-09-24 的 FB 相片貼文：一句「我剛剛把 borrow checker 搬到 C 了」加一張編輯器截圖。先繼續得意，再認真考據。

![我剛剛把 borrow checker 搬到 C 了](/media/2026-09/122177294648958395.jpg)

截圖裡的偉業只有兩行：

```c
#define mut
#define let

let mut int x = 1;
let int y = x;
```

編譯，零警告。Rust 的味道有了，而且 `y = x` 之後 `x` 還活得好好的——我沒有 move，也沒有 borrow，但語法已經 cosplay 到位。發文當下的成就感是真的，只是背後的技術含量是零。

## 這個巨集到底做了什麼

答案是：什麼都沒做。`#define mut` 和 `#define let` 是沒有替換內容的 object-like macro，前置處理器遇到這兩個 token 就直接吞掉，`let mut int x = 1;` 前處理之後就是 `int x = 1;`，跟我手寫一行 C 沒有差別。型別系統、所有權、生命週期全部沒變，編譯器甚至不知道我寫過 `mut`。整個專案裡唯一在運作的 borrow checker 是我的眼睛。

## 認真版：真的有人把所有權搬進 C 系語言

笑完之後查資料，發現這個笑話其實是一條很嚴肅的研究路線，只是大家都做得比我認真：

**Checked C**。Microsoft Research 2015 年起的專案，給 C 加上 `_Checked` 區塊和 bounds annotation，讓既有程式碼逐步改成有界線檢查的版本。repo（[checkedc/checkedc](https://github.com/checkedc/checkedc)）是 MIT 授權，2024 年移到獨立的 [checkedc 組織](https://www.checkedc.org/)，附 clang fork 和自動加 annotation 的 3C。不過它只管界線安全，所有權跟借用不在範圍裡，最近一年動靜也小了。

**Fil-C**。Filip Pizlo 的作品（[pizlonator/fil-c](https://github.com/pizlonator/fil-c)），路線反過來：不改語法，靠「隱形 capability（InvisiCaps）」加垃圾回收，在 runtime 檢查每個可能不安全的操作，宣稱完全記憶體安全。CPython、OpenSSH、Emacs 都能直接編進去，2026 年 10 月剛出 v0.687，還做了跨平台的執行檔。代價是效能，還有「你的 C 跑在 GC 上」這個心理門檻。

**Safe C++**。Sean Baxter 在他的 Circle 編譯器裡真的實作了 Rust 式的 borrow checking，2024 年 9 月提出 C++ 標準提案（[P3390/D3390](https://safecpp.org/draft.html)），在編譯器中間層做初始化分析和借用檢查。2025 年中委員會投票選了 Stroustrup 的 Profiles，Baxter 宣布停止，理由很直白：委員會不喜歡 Rust 的 safety model，而 safe function coloring 正是它反對的東西。這是把借用檢查搬進 C 系語言最接近成功的一次。

**clang 的 -Wlifetime**。Gábor Horváth 2019 年在 LLVM 提的 [RFC](https://discourse.llvm.org/t/rfc-lifetime-annotations-for-c/61377)，想給 clang 加生命週期分析，最後只有零碎的 statement-local 警告進主線，完整版一直沒 upstream。

## 為什麼 #define 做不到

這些專案的共同教訓：所有權是一種型別系統。Rust 的 borrow checker 能運作，是因為每個值都有型別，型別帶著所有權與生命週期的語意，編譯器在語意分析階段追蹤每條控制流。前置處理器在這一切之前，只做 token 換字：它不知道 `int` 是什麼，不知道 `x` 活多久，更不知道 `y = x` 之後誰 free。`#define` 能給的只有換皮——把 `let` 換成空白，程式行為跟原本一樣，安全保證也一樣：零。

所以我的 borrow checker 仍然是最強的：零誤報、零誤判、零編譯成本，缺點是只在我看的時候運作。哪天它抓到第一個 dangling pointer，我再回來更新。

延伸閱讀：[用 Rust 重寫 CUDA bindings 的心得](/blog/cuda-oxide-rust-cuda/)、[Brainfuck interpreter 的 Rust 效能實測](/blog/brainfuck-rs-benchmark/)。
