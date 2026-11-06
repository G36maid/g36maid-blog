---
title: "uv 內部實現導讀：從 65 個 crates 看它為什麼快"
description: "以 2026-01-25 當時的 uv 0.9.26 為基準，從原始碼結構讀 uv 的全域快取、hardlink 安裝、tokio 非同步管線與 PubGrub 平行解析——一篇讀 repo 的筆記式 case study，不是 profiler 實測。"
pubDate: 2026-01-25 22:54:30 +0800
category: programming
tags: ["rust", "python", "uv", "package-manager", "source-code", "case-study", "pubgrub", "astral"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1769352870
---

> 本文擴寫自 2026-01-25 的 Facebook 貼文（原稿兩句：「好久沒研究 rust 了 想要做一些 case study 可以來研究一下 uv 內部怎麼實現的」）。證據等級聲明：本文是讀 [astral-sh/uv](https://github.com/astral-sh/uv) repo、官方文件與 Astral 部落格的筆記，不是 profiler 實測；版本號以 2026-01-25 當時最新的 **uv 0.9.26**（2026-01-15 發布）為基準，標「補註」處是擴寫時（2026-11）回頭查的新進展。沒逐行讀完原始碼，寫錯請留言糾正。

## pip install 為什麼慢？

先問一個問題：`pip install` 的時間到底花在哪裡？我把依賴砍掉重裝，明明檔案都下載過了，為什麼還要等那麼久？答案是 pip 的安裝模型幾乎是「每次都從頭來」：重新查 index、重新下載（頂多靠 HTTP 快取省一點）、解壓、複製進 site-packages——每一層都沒有跨專案的全域記憶。uv 之所以快，不是某一處寫得特別神，而是把這條流水線的每一層都換了做法。這篇就以 2026-01-25 當時的 uv 0.9.26 為準，從原始碼結構讀起。

## 先立術語：uv 是什麼

uv 是 Astral（做 Ruff 的那家）在 2024 年 2 月發布的 Python 套件管理器，Rust 寫的單一靜態 binary。Charlie Marsh 在[發布文](https://astral.sh/blog/uv)裡的目標原話是「Cargo for Python」，並接手了 Armin Ronacher 的 Rye 作為統一的後繼者。歷史脈絡大致是：pip（PyPA，純 Python 的安裝器）→ pip-tools / poetry / pdm 各補上鎖定或專案管理的一塊 → Rye 嘗試整合 → uv 把這些收斂成一個工具。發布文宣稱 `uv pip` 介面在 Trio 依賴的 benchmark 上比 pip/pip-tools 快 8–10 倍（冷快取）、80–115 倍（暖快取）——數字是官方的，我沒重跑。

原始碼層面：repo 主語言是 Rust（GitHub languages API 實測約 21.3MB Rust 原始碼，佔絕對多數），MIT OR Apache-2.0 雙授權。Cargo workspace 底下在 0.9.26 有 **65 個 crates**，uv-cache、uv-client、uv-resolver、uv-extract、uv-installer、uv-python……切得極細。這是 case study 的第一課：套件管理被拆成四個正交層——**client（網路）、resolver（求解）、cache（磁碟）、installer（寫入環境）**，讀懂一層不需要先讀懂其他層。

## 快取架構：安裝其實是 link，不是 copy

uv 的[快取文件](https://docs.astral.sh/uv/concepts/cache/)開宗明義 "aggressive caching"：

- 全域快取目錄（Unix 上 `$XDG_CACHE_HOME/uv`），且 uv **永遠**需要一個 cache——連 `--no-cache` 都只是換成當次呼叫的暫存目錄。
- 快取按依賴性質分 **bucket**（wheels、sdist、git、核心 metadata 等），每個 bucket 有獨立版本號：0.4.13 對核心 metadata 做了不相容變更，bucket 版就從 v12 升到 v13。不同版本的 uv 因此可以安全共用同一個快取目錄，舊 entry 只是等著被 `uv cache prune` 清掉。
- registry 依賴尊重 HTTP 快取 headers；Git 依賴以解析出的 commit hash 為 key。
- 安裝策略是這套設計的精華：檔案**從快取 hardlink（或 CoW clone）進 site-packages**，跨檔案系統才 fallback 成 copy。所以文件建議把 cache 放在跟虛擬環境同一個檔案系統上，否則 link 不動、退化成慢的複製。發布文原話："leverages Copy-on-Write and hardlinks on supported filesystems to minimize disk space usage."（補註：0.9.28 之後 `clone` link mode 加了 `reflink` 別名，[#17724](https://github.com/astral-sh/uv/pull/17724)。）
- 併發安全：快取支援多讀多寫，對目標 venv 施加 file lock 防止並發安裝互踩。

補註（2026 年中後）：快取又疊了一層 `content-addressed-cache` preview——解壓後的檔案改用 BLAKE3 內容雜湊存放、以 hardlink 組回 wheel 目錄，同一個檔案整個快取只存一份（[#21327](https://github.com/astral-sh/uv/pull/21327)）。0.9.26 當時還沒有這層，這是之後的演進。

## 網路與解壓層：整套走 async

從 0.9.26 的 Cargo.toml 可以直接查到技術選型：`uv-client` 用 **reqwest** 搭配 reqwest-middleware/reqwest-retry，TLS 走 **rustls**（tokio-rustls）而非系統 OpenSSL；`uv-resolver` 的依賴裡有 tokio 和 dashmap（並發用的分片 HashMap）；`uv-extract` 解 tar 用的是 Astral 自家維護的 `astral-tokio-tar` fork，解壓縮走 async-compression（gzip/zstd/xz/bzip2 都支援）。也就是說下載、解壓、寫盤全部跑在 tokio 的非同步 runtime 上，可以互相交錯而不是階段式等待。

## 平行解析：metadata 才是瓶頸

[Resolver internals](https://docs.astral.sh/uv/reference/internals/resolver/) 文件第一段就很有 farseerfc 味道地誠實：版本求解按教科書定義等價於 SAT 問題、是 NP-complete——但實務上「最慢的部分是載入套件與版本的 metadata，即使有快取」。所以 uv 的重點根本不是把求解演算法榨乾，而是：

- 用 [pubgrub-rs](https://github.com/pubgrub-rs/pubgrub)（PubGrub 演算法的 Rust 實作，發布文致謝了維護者 Jacob Finkelman 與 Matthieu Pizenberg）做增量求解，靠**優先序**讓幾乎不用 backtrack：URL 依賴最高、精確 `==` 次之，同類內按第一次出現的順序，保證結果確定性。
- 選定一個套件版本後，它的依賴 metadata 會**在背景 prefetch**——文件原話 "uv prefetches their metadata in the background to improve performance"。網路層和求解層因此是重疊執行的。
- 衝突管理有個樸素但有效的啟發式：兩個套件互撞五次，就把它們標成 highly-conflicting、調換決策順序再手動回溯（[#8157](https://github.com/astral-sh/uv/issues/8157)、[#9843](https://github.com/astral-sh/uv/pull/9843)）。
- 另有 forking resolver 處理 marker 衝突（同一套件在不同 `python_version`/`sys_platform` 下要求不同版本時，把求解空間切開分別解），這個設計靈感來自 Poetry。

## 誠實列限制

一、我沒跑任何 profiler 或 benchmark，效能數字全部轉述官方來源。二、65 個 crates 我只抽查了 uv-client、uv-resolver、uv-extract 的 Cargo.toml，沒有逐行讀求解器的實作（pubgrub-rs 自己的[導覽文件](https://pubgrub-rs-guide.pages.dev/internals/intro)是下一步）。三、快取文件讀的是擴寫時的版本，部分行為可能與 0.9.26 當時有差異，已用「補註」標出。四、resolve 的 worst-case 仍是 NP-complete，uv 快是工程取勝，不是理論突破——這句話是文件自己說的。

## 結語

好久沒認真讀 Rust 原始碼了，這次以 uv 為 case study 回來補課，第一個感想是：它的快不是魔法，是紀律——全域快取 + link-based 安裝把「重複工作」從常數裡消掉，async I/O 把等待重疊起來，resolver 則老實承認瓶頸在 metadata 而把力氣花在 prefetch 和優先序上。crates 的切分方式也很值得抄：每個概念一個 crate，邊界就是文件。等哪天真有空，再來讀 pubgrub 的 backtrack 實作吧。

## References

- [astral-sh/uv](https://github.com/astral-sh/uv)（GitHub repo；語言組成與授權經 GitHub API 實測，200）
- [uv 0.9.26 release](https://github.com/astral-sh/uv/releases/tag/0.9.26)（2026-01-15，寫作當下版本，200）
- [Caching | uv](https://docs.astral.sh/uv/concepts/cache/)（快取 bucket、link 策略、併發安全，200）
- [Resolver internals | uv](https://docs.astral.sh/uv/reference/internals/resolver/)（PubGrub、forking、prefetch 原話，200）
- [uv: Python packaging in Rust](https://astral.sh/blog/uv)（Charlie Marsh 發布文、benchmark 數字、Rye 接手、PubGrub 致謝，200）
- Cargo.toml @0.9.26 與 crates/ 目錄清單（GitHub raw/API，reqwest+rustls、tokio、dashmap、astral-tokio-tar 依賴實測，200）
- [uv #21327](https://github.com/astral-sh/uv/pull/21327)（content-addressed cache，補註用，200）
