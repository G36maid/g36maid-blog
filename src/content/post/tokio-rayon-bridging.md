---
title: "Tokio 與 Rayon 的橋接難題：不阻塞執行器的完整解法"
description: "Tokio 用於非同步 I/O，Rayon 用於 CPU 運算，如何在不阻塞執行器的情況下連接它們？從 spawn_blocking 的 512 執行緒上限、block_in_place 的讓渡機制，到三種橋接模式與社群方案的完整整理。"
pubDate: 2026-07-05T01:07:54+08:00
category: programming
tags: ["rust", "tokio", "rayon", "async", "concurrency"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1783184874
---
Tokio 處理非同步 I/O，Rayon 處理 CPU 平行運算，兩套 runtime 各自完美——直到你必須在同一個程式裡讓它們說話。2026 年 7 月初我在思考這個問題時把它當成一張圖貼出來問答案，事後把各種橋接方案整理成這篇完整版筆記。原文只是提問，以下是答案本身。

![一個常見的 Rust 難題 Tokio 用於非同步 I/O，Rayon 用於 CPU 運算，但如何在不阻塞執行器的情況下連接它們？🦀 告訴我你的答案：](/media/2026-07/122167570796958395.jpg)

*原稿配圖：2026-07-05 貼出的難題原文。*

## 先搞清楚你在阻塞什麼

你覺得你的程式裡大多數工作大概有多久？先猜再往下讀。

async runtime 的全部本質，是「在 `.await` 點把執行緒讓出去換別的任務跑」。所以「阻塞」的定義不是系統呼叫，而是：**這段程式碼在兩個 await 點之間待了多久**。一個 10 毫秒的 `par_iter()` 不是 I/O，但它和一個 10 毫秒的同步磁碟讀取在 Tokio 眼裡是一樣的東西——都是把 worker thread 抓著不放 10 毫秒。

Rayon 則是完全相反的設計：固定大小的 worker pool（預設等於邏輯核心數）、work-stealing 排程、任務要求是純計算、絕不等待。它的世界裡沒有「讓出」這個概念——`rayon::join()` 的語意是「兩個閉包**都**會跑完才返回」，這是阻塞式 fork-join，不是 future。

所以橋接問題的真正形狀是：**把「會跑很久的純計算」從「靠讓出生存的排程器」手上，搬到「天生就該吃滿 CPU 的 pool」上，再讓結果以 future 的形式流回來。**

## Tokio 的兩種執行緒：core 與 blocking

Tokio runtime 有兩類執行緒，這是所有後續討論的基礎：

- **Core threads（worker）**：跑所有 async 任務，預設數量 = CPU 核心數（可用 `TOKIO_WORKER_THREADS` 或 Builder 覆寫）。這些執行緒是稀缺資源，被卡住一個就少一個。
- **Blocking threads**：由 `spawn_blocking` 按需 spawn，專門給「會阻塞但終會結束」的工作。上限預設 **512**，閒置 10 秒回收，超過上限後任務進 FIFO 排隊而不是再開新執行緒。

spawn_blocking 的文件特別警告一件事：上限之所以開到 512 那麼大，是因為它設計上預期被拿去跑**各種不能 async 的 I/O**；但如果你把 CPU-bound 工作大量丟進去，512 個執行緒搶 8 個核心的 context-switch 開銷會讓吞吐量崩掉。官方建議：跑大量 CPU 工作時，用 semaphore 或其他同步原語**自己限制並行度**——或者，直接用 Rayon，因為 Rayon 本來就是一個「大小正確的 pool 加上排程器」。

另一個常被忽略的限制：`spawn_blocking` 的任務**不可 abort**。它不是 future，你的 `JoinHandle` 被 drop 或 cancel 之後，閉包照樣跑完，只是結果沒人收。如果你的任務可能跑幾分鐘，這代表取消語意是假的。文件給的經驗法則：短暫的阻塞操作用 `spawn_blocking`，長期跑的背景工作直接 `std::thread::spawn` 開專屬執行緒，別佔 blocking pool 的名額。

## block_in_place：借位而不是搬家

`tokio::task::block_in_place` 是另一條路，機制完全不同。它不把你搬到別的執行緒，而是對排程器喊聲：「我這個任務接下來要佔著這條 thread 了，你先把**其他任務**搬到新開的 worker 去。」

原理上它不改變「這條 thread 會被卡住」的事實，改變的是**其他任務的下場**——本來會被餓死，現在因為被提前遷走而活得好好的。current_thread runtime 只有唯一一條 worker，沒有東西可以遷，所以直接 panic（錯誤訊息原文：*can call blocking only when running on the multi-threaded runtime*——這行我在本機跑例子親自觸發驗證過）。multi-thread runtime 之外呼叫它是合法的，只是退化成普通的函式呼叫。

它還有一個 subtle 的坑：**同一個 task 裡的其他並行分支會被 suspend**。如果你在 `join!(a, b)` 的 a 裡叫 block_in_place，b 也會被凍結。文件明說這種情況該改用 `spawn_blocking`。所以 block_in_place 的適用場景其實比看起來窄：適合「這個 task 的剩餘部分就是一段純計算，跑完就結束」的形狀；一旦 task 內部還有別的 future 要並行推進，就該搬家而不是借位。

和 Rayon 配合的好處：block_in_place 之後這條 thread 已經「被讓渡」了，你可以在裡面直接跑 `par_iter()` 或 `rayon::scope()`，甚至用 `Handle::current().block_on()` 重新進 async 世界。缺點是它仍然吃 worker thread 的 stack，而且整個機制**只在 multi-thread runtime 存在**——`#[tokio::main]` 預設是 multi-thread，但測試或 embedded 場景切成 current_thread 就會炸。

## 模式一：spawn_blocking 包整段 Rayon

最直接、最常見、大多數情況下就該這樣寫：

```rust
use rayon::prelude::*;

async fn mode_a_spawn_blocking(data: Vec<u64>) -> u64 {
    tokio::task::spawn_blocking(move || {
        data.par_iter().copied().map(|x| x.wrapping_mul(x)).sum()
    })
    .await
    .expect("spawn_blocking task panicked")
}
```

形狀是「async 世界 → blocking thread → Rayon fork-join → 回傳單一結果」。Rayon 的 `join` 語意保證 `par_iter` 結束時所有分支都跑完了，所以 blocking thread 只被佔用到整個計算收斂，然後結果以 `JoinHandle` 的形式回來。這個例子是本機 `cargo check` + `cargo run --release` 實際編譯執行過的版本（結果 `mode_a=333833500`），語法層面驗證無誤。

這個模式的好處是**佔用 blocking pool 的名額是可控的**：一次 `spawn_blocking` = 一條 blocking thread，你的 Rayon 部分再怎麼 fan-out 都發生在那條 thread 觸發的 fork-join 裡，不會爆炸出 512 條執行緒。缺點是如果你有 100 個 async task 各自要算東西，會需要 semaphore 把並行度壓在 blocking pool 舒服的範圍內，否則 blocking pool 先滿、後面排隊，Rayon 反而閒著。

## 模式二：spawn_blocking 包 rayon::scope，動態分支

如果你的計算形狀不是平的 `par_iter`，而是執行期才知道要分幾支的樹狀結構，`rayon::scope` 是對的工具：

```rust
async fn mode_b_rayon_scope(data: Vec<u64>) -> (u64, u64) {
    tokio::task::spawn_blocking(move || {
        let (left, right) = data.split_at(data.len() / 2);
        rayon::scope(|s| {
            let (tx_l, rx_l) = std::sync::mpsc::channel();
            let (tx_r, rx_r) = std::sync::mpsc::channel();
            s.spawn(move |_| {
                let _ = tx_l.send(left.iter().sum::<u64>());
            });
            s.spawn(move |_| {
                let _ = tx_r.send(right.iter().sum::<u64>());
            });
            (rx_l.recv().unwrap_or(0), rx_r.recv().unwrap_or(0))
        })
    })
    .await
    .expect("spawn_blocking task panicked")
}
```

`rayon::scope` 內部可以用 `s.spawn()` 動態開分支，離開 scope 時 block 直到全部收斂——這是 fork-join 的正統用法。scope 內部要跨分支傳值，最順手的是 `std::sync::mpsc`（在 blocking thread 裡用標準庫 channel 沒有任何問題，不用勉強自己用 async channel）。

這裡的 rustc 細節值得注意：`s.spawn` 的閉包需要 `move`，否則編譯器會告訴你「closure may outlive the current function」——scope 的分支可能活得比外層 stack frame 久，所以借用是不允許的。上面的例子是我實際迭代了三輪編譯錯誤才過的版本，`E0373`（closure may outlive）和 `E0382`（use of moved value，`data` 被 split 之後不能再 move 進第二個分支）都是真的撞過的牆。

## 模式三：單一任務直接丟 Rayon，用 oneshot 回傳

前面兩個模式都「包整段」，這個模式反過來：**不經過 blocking pool，把單一 Rayon 任務直接變成 future**：

```rust
use tokio::sync::oneshot;

async fn execute_on_rayon<R: Send + 'static>(
    f: impl FnOnce() -> R + Send + 'static,
) -> R {
    let (tx, rx) = oneshot::channel();
    rayon::spawn(move || {
        // 送信端 drop 即代表 Rayon 端 panic；await 端會收到 Err
        let _ = tx.send(f());
    });
    rx.await.expect("rayon task panicked before sending")
}
```

這就是 Rust 論壇上 steffahn 給出的經典配方（2022 年，「How can I send data from tokio to rayon?」討論串）。關鍵直覺：**oneshot 的 sender 在 Rayon thread 裡被 drop，receiver 那邊的 `.await` 就會醒**。Sender 被 drop 而沒有 send，`rx.await` 會拿到 `Err`——所以 Rayon 端 panic 時，async 端不會 hang，而是收到錯誤。上面的版本是簡化形；嚴謹版會用 `catch_unwind(AssertUnwindSafe(f))` 把 panic payload 抓住再 `resume_unwind` 回 async 端，tokio-rayon crate 就是這樣做的。

它的取捨很清楚：**沒有佔用任何 blocking thread**，async 端零成本等待；但一次只送一個任務進 Rayon，沒有 fork-join 的 fan-out，也繞過了 blocking pool 的排隊/上限機制——等於是兩個 pool 直接對接。適合「偶爾一筆 CPU 工作要送出去算」的場景；如果你每次都要算一大批，模式一更合適。

## 反模式：async 跑進 Rayon 裡面等

最誘人也最錯的做法，是想讓 Rayon 的閉包裡 `.await` 東西：

```rust
// 這個方向走不通：rayon 的閉包不能是 async
rayon::spawn(move || {
    let data = some_async_fetch().await; // ← 編譯不過
    compute(data);
});
```

閉包要能進 Rayon 就必須是普通 `FnOnce`，不是 future；就算你硬用 `block_on` 把 future 跑成同步，也是在 Rayon 的 worker 上**阻塞等待**——這直接違反 Rayon 的設計前提，work-stealing pool 的 thread 被你抓去等 I/O，整個 pool 的計算容量就縮水了。

正確的形狀是反過來：**Rayon 裡只放純計算，計算完了把結果用 channel 丟回來**，等待一律發生在 async 端。論壇上另一個案例（「Tokio and Rayon. Asynchrony and parallelism」）就是在問 `rayon::scope()` 和 `oneshot::channel()` 哪個快，回答一針見血：`rayon::scope()` 是阻塞呼叫，會把 Tokio worker thread 抓住不放，`oneshot::channel()` 是非阻塞的 async channel——兩者根本不是同一層的東西，不該拿來比速度。那位原 Po 進一步想「在 Rayon thread 裡 loop 等資料進來再算」，也被點醒這完全違反 Rayon 的模型：**Rayon 裡不該有等待，只有計算；要等的話，等的事情屬於 async 端或專屬 thread**。

## 社群現成方案：tokio-rayon

如果不想自己接線，`tokio-rayon` crate 把模式三包好了：

```rust
let result = tokio_rayon::spawn(|| do_some_crypto_stuff()).await;
```

它做的事就是我們上面手寫的：`rayon::spawn` + `tokio::sync::oneshot` + `catch_unwind`/`resume_unwind` 處理 panic 傳播，回傳一個實作 `Future` 的 `AsyncRayonHandle<T>`。API 刻意鏡像 Rayon 本身的命名（`spawn`/`spawn_fifo` 自由函式，加上 `AsyncThreadPool` extension trait 給自訂 `ThreadPool` 用 `spawn_async`/`spawn_fifo_async`），re-export 了 `rayon` module 讓你不用另外加依賴。相依極小：只要 tokio 的 `sync` feature 和 rayon 本身。

值得注意的是這不是唯一一個嘗試：dynamo-runtime（NVIDIA 的推理框架）的 compute module 裡就有一整節「Rayon-Tokio Integration Strategy」，用 dedicated Rayon pool 加 async bridge 給 CPU-bound 的 tokenize/serialize 工作，文件裡還給了 bridge 開銷的數量級參考（小任務數十微秒級、大於幾毫秒的任務可忽略）。我沒有重跑他們的 benchmark，這個數字只是轉述他們文件，不是自己的測量。

## Rayon 官方的 async 支援：一個開了七年的 PR

Rayon 本身對 async 的態度值得知道。歷史脈絡：

- 早期有實驗性的 `rayon-futures` crate（`Scope::spawn_future`、`rayon::spawn_future_async`），需要 `rayon_unstable` feature gate。
- 2019 年 8 月，cuviper（Rayon maintainer）開了 [PR #679](https://github.com/rayon-rs/rayon/pull/679)「Add the ability to spawn futures」，基於 std `Future`（Rust 1.36+），把任務丟進 pool 執行、回傳 `RayonFuture`。
- 這個 PR 至今（2026 年）仍是 draft 狀態，label 掛著 `help wanted`。2020 年時 cuviper 在 issue #234 裡說 `rayon-futures` 已被放棄，#679 是考慮中的替代方案，「但還不清楚它應該長什麼樣」。

七年沒合，原因大概就是模式三的反面教材講的：Rayon 的核心模型是**純計算的 fork-join**，future 意味著「可能等待」，這跟 work-stealing pool 的前提有根本張力。社群的共識方案一直是：在 Rayon 外面包一層，而不是把 async 塞進去。

## 決策表

| 場景 | 建議 |
|---|---|
| 一批資料要平行算，結果合併 | `spawn_blocking` + `par_iter`（模式一） |
| 執行期才知道分支形狀的計算 | `spawn_blocking` + `rayon::scope`（模式二） |
| 偶爾一筆 CPU 工作，不想佔 blocking pool | `rayon::spawn` + oneshot（模式三）或 `tokio-rayon` |
| task 內沒有其他並行 future、算完就結束 | `block_in_place` 也可以 |
| task 內還有 `join!`/`select!` 要推進 | 用 `spawn_blocking`，不要 `block_in_place` |
| 長期跑的背景工作 | `std::thread::spawn`，不要佔 blocking pool |
| 在 Rayon 閉包裡 await / 等待輸入 | 不要，改成計算完成後丟 channel 回來 |

## 這張圖的答案

回到原稿那張圖的提問——「如何在不阻塞執行器的情況下連接它們」——完整答案是一句話：**讓 Tokio 只做等待、Rayon 只做計算，兩者之間用一個「會結束的阻塞呼叫 + channel」當橋**。具體選模式一/二/三取決於你的計算形狀，但原則只有一條：任何一邊都不要去等另一邊會「等」的東西。

寫這篇的當下（2026 年 11 月擴寫），這個題目的生態比我原稿提問時清晰了一些——tokio-rayon 這類小 adapter 已經可用，Rayon 官方的 async PR 仍然沉睡，但社群對「橋的正確形狀」已經有穩定共識。如果你的工作負載真的又重 I/O 又重 CPU，值得把 pool 的大小當成一等參數來調，而不是事後補救。

## References

- [tokio::task::spawn_blocking 官方文件](https://docs.rs/tokio/latest/tokio/task/fn.spawn_blocking.html) — blocking pool 上限 512、不可 abort、與專屬 thread 的取捨
- [tokio::task::block_in_place 官方文件](https://docs.rs/tokio/latest/tokio/task/fn.block_in_place.html) — multi-thread runtime 限定、suspend 同 task 其他分支、`Handle::block_on` re-entry
- [tokio::runtime::Builder](https://docs.rs/tokio/latest/tokio/runtime/struct.Builder.html) — `max_blocking_threads` 預設 512、keep-alive 10 秒
- [Tokio crate 文件：CPU-bound tasks and blocking code](https://docs.rs/tokio/latest/tokio/) — core/blocking thread 二分、建議 CPU-bound 用 Rayon
- [Tokio Discussion #3858: How does Tokio decide how many threads to spawn/use and when?](https://github.com/tokio-rs/tokio/discussions/3858) — 兩種 thread 的行為總結
- [rayon::scope 官方文件](https://docs.rs/rayon/latest/rayon/fn.scope.html)、[rayon::spawn](https://docs.rs/rayon/latest/rayon/fn.spawn.html)
- [tokio-rayon crate](https://docs.rs/tokio-rayon/latest/tokio_rayon/) 及 [AsyncThreadPool trait](https://docs.rs/tokio-rayon/latest/tokio_rayon/trait.AsyncThreadPool.html)
- [Rust 論壇：How can I send data from tokio to rayon?](https://users.rust-lang.org/t/how-can-i-send-data-from-tokio-to-rayon/105168) — steffahn 的 oneshot 配方
- [Rust 論壇：Tokio and Rayon. Asynchrony and parallelism](https://users.rust-lang.org/t/tokio-and-rayon-asynchrony-and-parallelism/121885) — scope 是阻塞呼叫、oneshot 是 async channel 的辨析
- [Rayon PR #679: Add the ability to spawn futures](https://github.com/rayon-rs/rayon/pull/679) — 2019 年開、至今 draft
- [Rayon issue #234: spawn_future needs documentation](https://github.com/rayon-rs/rayon/issues/234) — cuviper 說 rayon-futures 已棄置
- [Alice Ryhl: Async: What is blocking?](https://ryhl.io/blog/async-what-is-blocking/) — 「阻塞」在 async 語境的定義
- [dynamo-runtime compute module](https://docs.rs/dynamo-runtime/latest/dynamo_runtime/compute/index.html) — NVIDIA 端的 Rayon-Tokio 整合策略與開銷量級轉述
