---
title: "把 Brainfuck 編譯成 Rust 再量給你看：brainfuck-rs 的 hyperfine benchmark 實戰"
description: "自製 Brainfuck 工具鏈 brainfuck-rs：BF 轉 Rust 編譯成 native code 比直譯快約 6.7 倍。用 hyperfine 做嚴謹 benchmark 的完整流程，含可重現的 bench.sh 指令與環境說明。"
pubDate: 2025-11-30T04:37:35+08:00
category: programming
tags: ["rust", "brainfuck", "benchmark", "hyperfine", "編譯器", "最佳化"]
draft: false
source: "facebook"
sourceType: "影片"
sourceTimestamp: 1764448655
---

> 擴寫自 2025-11-30 的隨筆（原為 FB 影片貼文，附操作錄影）。

寫直譯器最怕的就是被問一句：「所以到底快多少？」我最近在寫一個 Brainfuck 工具鏈 [brainfuck-rs](https://github.com/G36maid/brainfuck-rs)，有兩個執行模式：`bfi` 直接直譯優化過的指令，`bfc` 則是把 BF 轉成 Rust 原始碼、交給 rustc 編成 native code。「轉編譯真的比較快嗎？快幾倍？」這種問題不能憑感覺回答，我需要一個嚴謹、可重現的 benchmark。順便把高等編譯器課堂上學的最佳化技巧實際練一遍。

## brainfuck-rs 做了哪些最佳化

`bfi` 和 `bfc` 共用同一條優化管線：

- **指令摺疊（RLE）**：`>>>` 合併成單一 `PtrAdd(3)`
- **Offset / Lazy Pointer**：把指標移動延後，與後續的 `+`/`-` 合併成帶位址偏移的單一運算
- **Parallel Assignment**：連續的 `ValAdd`、`Clear` 批次成 `BulkAdd`/`BulkClear`
- **Clear loop**：`[-]` 直接換成一次 `Clear`
- **Move loop**：`[->+<]` 這種乘法迴圈變成一組 `MulAdd`
- **Scan loop**：`[>]` 換成一次 `ScanRight`
- **DCE**：刪掉永遠不會進入的迴圈等死碼

這套手法在 BF 圈其實是標準套路，[matslina 的 optimizing brainfuck](http://calmerthanyouare.org/2015/01/07/optimizing-brainfuck.html) 早就系統性地整理過 copy loop、multiplication loop 的轉換。而 `bfc` 的賽局更簡單：把優化過的 IR 轉成 Rust 後，rustc/LLVM 會接手做自動向量化、迴圈展開這種手寫直譯器很難做到的深度優化。相比之下，[JIT 直接噴機器碼](https://rodrigodd.github.io/2022/11/07/bf_compiler-part2.html)省掉的是直譯迴圈本身的 dispatch 開銷；轉編譯則是把「生成好代碼」這件事外包給 LLVM，實作成本低非常多，效果又好。

## 1. 先寫一個可重現的 bench 腳本

整個流程包在 [`script/bench.sh`](https://github.com/G36maid/brainfuck-rs/blob/main/script/bench.sh)：

```bash
# 1. 下載 mandelbrot.bf（重活題，來自 erikdubbelboer/brainfuck-jit）
curl -s https://raw.githubusercontent.com/erikdubbelboer/brainfuck-jit/master/mandelbrot.bf \
  -o examples/mandelbrot.bf

# 2. Release build
cargo build --release

# 3. 轉編譯 + rustc 編成 native
./target/release/bfc < examples/mandelbrot.bf > target/mandelbrot_transpiled.rs
rustc -O -C opt-level=3 target/mandelbrot_transpiled.rs -o target/mandelbrot_native

# 4. 驗證正確性：兩邊輸出必須一致
./target/release/bfi examples/mandelbrot.bf > target/out_bfi.txt
./target/mandelbrot_native > target/out_native.txt
diff -q target/out_bfi.txt target/out_native.txt

# 5. Benchmark
hyperfine --warmup 3 --export-markdown bench_results.md \
    -n "Interpreter (bfi)" "./target/release/bfi examples/mandelbrot.bf" \
    -n "Compiler (bfc -> native)" "./target/mandelbrot_native"
```

關鍵是第 4 步的 `diff`：優化管線再複雜，輸出和直譯器不一致就是寫錯了，直接 `set -e` 退出。benchmark 之前先驗正確性，不然你只是在量一個 bug 的速度。

## 2. hyperfine：為什麼不用 `time`

我強烈推薦 [hyperfine](https://github.com/sharkdp/hyperfine)（寫這篇時剛出 [v1.20.0](https://github.com/sharkdp/hyperfine/releases/tag/v1.20.0)）：

1. **Warmup**：`--warmup 3` 先跑三次，避免 disk I/O 和 cache 冷啟動污染數據（這點超重要）
2. **統計分析**：預設至少 10 次取平均，自動偵測 outlier 並警告
3. **比較模式**：多個指令丟進去，直接告訴你 A 比 B 快幾倍，附相對倍率的信賴區間
4. **多種輸出**：`--export-markdown` 掛 README、`--export-json` 餵給其他程式或 GitHub Action（我放在 [CI workflow](https://github.com/G36maid/brainfuck-rs/actions/workflows/benchmark.yml) 每次跑）

## 3. 結果與環境

環境：Linux x86_64，Rust stable（rustc -O -C opt-level=3），GitHub Actions `ubuntu-latest` runner；hyperfine `--warmup 3`、其餘預設。程式集是 mandelbrot.bf，計算量夠重、無 I/O 瓶頸，適合量 CPU 效能。README 記錄的典型結果：

| 實作 | 平均時間 | 加速比 |
|---|---|---|
| 直譯器 `bfi` | ~3.50 s | 1x |
| `bfc` → native | ~0.52 s | **~6.7x** |

數字會隨機器與版本浮動，重現方式就是上面那個腳本，歡迎自己跑一次驗證——這也是把 bench.sh 進版本庫的原因。順帶一提，[danangell 的 Rust JIT 版](https://danangell.com/blog/posts/brainfuck-optimizing-jit/)在 mandelbrot 上從 naive 直譯 56.8s 壓到 JIT 5.5s，[Lambdaland 那篇](https://lambdaland.org/posts/2024-10-22_bf_writeup/)則示範了 scan loop、basic loop 優化在 AST 層怎麼做，都是很好的對照組。

## 個人心得

`bfc` 路線最大的賣點是便宜：不用處理 label 重定位、不用 `mprotect`、不用管 x86-64 與 ARM64 的指令差異，一個 transpiler 加上 `rustc -O` 就拿到 ~6.7x。代價是多一個編譯步驟（數秒）、無法在執行期重新優化。如果哪天想再壓下去，下一步會是試 [threadcode](https://en.wikipedia.org/wiki/Threaded_code)（direct threading 消 dispatch 開銷）或 DynASM 式 JIT——[bf-dynasm](https://github.com/igorwwwwwwwwwwwwwwwwwwww/bf-dynasm) 就是現成的例子。

缺點老實說：mandelbrot 是純計算題，對 I/O 重的 BF 程式倍率會沒這麼漂亮；hyperfine 量的是整個 process 的 wall time，含啟動成本，極短程式會被 noise 蓋住。但對「證明編譯比直譯快」這個目的來說，夠了。

**延伸閱讀**

- [brainfuck optimization strategies — matslina](http://calmerthanyouare.org/2015/01/07/optimizing-brainfuck.html)
- [A Singlepass JIT Compiler — rodrigodd](https://rodrigodd.github.io/2022/11/07/bf_compiler-part2.html)
- [Towards the Fastest Brainf\*\*\* Implementation Ever — Lambdaland](https://lambdaland.org/posts/2024-10-22_bf_writeup/)
- [hyperfine README](https://github.com/sharkdp/hyperfine/blob/master/README.md)

