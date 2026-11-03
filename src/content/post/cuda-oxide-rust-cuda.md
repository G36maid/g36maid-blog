---
title: "NVIDIA 發布 CUDA-Oxide：用 Rust 直接寫 CUDA kernel 的實驗性編譯器"
description: "NVIDIA Labs 於 2026-05-07 釋出 CUDA-Oxide 0.1：自訂 rustc codegen backend，將純 Rust 直接編譯為 NVIDIA PTX，不需 DSL 或外部綁定即可寫 SIMT GPU kernel；本文對照 Rust-GPU、rust-cuda、CubeCL、std::offload、cudarc、wgpu 的生態系定位，並誠實列出 alpha 階段的限制。"
pubDate: 2026-05-12 22:26:49 +0800
tags: ["rust", "cuda", "nvidia", "compiler", "gpu", "ptx", "simt", "phoronix"]
category: programming
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1778596009
draft: false
---

> 本文擴寫自 2026-05-12 的社群貼文（新聞轉述），擴寫於 2026-11-03。原文寫於 CUDA-Oxide 0.1 剛發布、資訊零碎的當下，本文以 2026 年 5 月當時的脈絡為主；文末另附寫作時點的查證註記。

2026 年 5 月 7 日，NVIDIA Labs 釋出 **CUDA-Oxide 0.1**——一個實驗性 Rust→CUDA 編譯器的首個版本。它的賣點一句話講完：讓你用（「相對安全的」，官方用詞是 *safe(ish)*）Rust 寫 SIMT GPU 核心，而且標準的 Rust 程式碼會被直接轉譯為 NVIDIA PTX，過程中不經過 DSL、也不經過外部語言綁定。Phoronix 的 Michael Larabel 在 5 月 8 日以〈[NVIDIA Releases CUDA-Oxide 0.1 For Experimental Rust-To-CUDA Compiler](https://www.phoronix.com/news/NVIDIA-CUDA-Oxide-0.1)〉做了報導。

我日常寫 Rust，又一直對編譯器底層（backend、IR 這一層）有興趣，看到 NVIDIA 官方下場寫一個 `rustc` codegen backend，對我來說這則新聞的趣味在兩個層面：一是 Rust 生態多了條上 GPU 的正規路線，二是終於有大公司把 GPU 程式設計的入口放在「語言本體」而不是框架上。

## 這東西到底是什麼

CUDA-Oxide 不是「Rust 呼叫 CUDA」的 binding，而是一個**自訂的 `rustc` 編譯器後端**。據 [Phoronix 報導](https://www.phoronix.com/news/NVIDIA-CUDA-Oxide-0.1)，它由 NVIDIA 工程師設計，目標是三件事：**單一來源編譯**（single-source：host 與 device 程式碼放在同一份 Rust 裡）、**裝置端抽象化**，以及透過自訂編譯器後端建構的 **Rust 原生編譯管線**。[The cuda-oxide Book](https://nvlabs.github.io/cuda-oxide/) 的開頭講得更直接：「not a DSL, a custom rustc codegen backend that compiles pure Rust to PTX」。

PTX 是 NVIDIA 的中間表示：虛擬機器層級的組語，最終再由驅動程式 JIT 編成實際的 SASS 機器碼。直接產 PTX 意味著產物可以在各代 GPU 上重編，不必綁死特定晶片架構。SIMT（Single Instruction, Multiple Threads）則是 CUDA 的執行模型：成千上萬個 thread 鎖步執行同一段程式，各自處理不同資料。傳統上你得用 CUDA C++ 寫 `__global__` kernel；CUDA-Oxide 的做法是用 `#[kernel]` 等 attribute macro 在純 Rust 裡標記 kernel，由後端產生 PTX，host 端再由產生的 launch 方法（參數會做型別檢查）呼叫。Book 的 quick start 就是一個 vecadd：`#[kernel]` 標宣告式、`#[launch_contract]` 定義 launch 幾何，其餘都是普通的 Rust。

## 在 Rust + GPU 生態系的位置

2026 年 5 月當時，Rust + GPU 生態系已經相當熱鬧：Rust-GPU、rust-cuda、CubeCL、`std::offload`、cudarc、wgpu 各有各的目標。[官方 book 的 appendix](https://nvlabs.github.io/cuda-oxide/appendix/ecosystem.html) 有一張很好的對照表：

| 專案 | 做法 | 目標 | 定位 |
|---|---|---|---|
| cuda-oxide | `rustc` codegen backend | NVIDIA PTX/SASS | 以 safe Rust 寫 CUDA 程式模型 |
| Rust-GPU | `rustc` → SPIR-V | Vulkan/Metal/DX | 圖形 shader 為主 |
| rust-cuda | `rustc` → NVVM IR | NVIDIA PTX | 把 Rust 語言模型帶上 NVIDIA GPU |
| CubeCL | 內嵌 DSL + JIT | CUDA/ROCm/WGPU | 跨供應商的 compute kernel |
| std::offload | rustc + LLVM offload | NVIDIA/AMD/Intel | 隱式 offload CPU 程式碼 |
| cudarc | 安全的 driver 綁定 | NVIDIA | host 端綁定 |
| wgpu | WebGPU API + WGSL/Naga | 跨平台 | shader 語言層的可攜計算 |

最容易混淆的是 rust-cuda。官方的說法是兩者「從遠處看可互換，靠近看設計中心不同」：**rust-cuda 是把 Rust 帶上 GPU**（`async`/`.await`、部分 std 在裝置端執行）；**cuda-oxide 是把 CUDA 帶進 Rust**（kernel 撰寫、device intrinsics、SIMT 模型，精神上接近寫 C++ 的 `__global__`）。官方也明說兩個方向都成立、專案彼此互補。

## 怎麼試

- **Book**：[nvlabs.github.io/cuda-oxide](https://nvlabs.github.io/cuda-oxide/)（含[生態系 appendix](https://nvlabs.github.io/cuda-oxide/appendix/ecosystem.html)）
- **GitHub**：[NVlabs/cuda-oxide](https://github.com/NVlabs/cuda-oxide)，Apache-2.0 授權
- **版本**：首個 release 是 2026-05-07 的 [v0.1.0](https://github.com/NVlabs/cuda-oxide/releases)，裝完 prerequisites 後照 book 的 quick start 就能跑 vecadd

## 誠實列限制

官方在 book 裡的自我定性很清楚：v0.1.0 是 **early-stage alpha**，「expect bugs, incomplete features, and API breakage」。安全性也只是 *safe(ish)*——GPU 有太多 subtleties，book 另有專章討論 safety model。加上需要自訂的 rustc 工具鏈與 NVIDIA 硬體，這不是能直接搬進 production 的東西；把它當成「官方對 Rust+CUDA 方向的正式表態」來追蹤，比較接近實情。

## 寫作時點

本文脈絡停在 2026-05 的 v0.1.0。2026-11-03 我用 GitHub API 查證：[NVlabs/cuda-oxide](https://github.com/NVlabs/cuda-oxide) 授權 Apache-2.0、3,953 stars、最後 push 為 2026-11-02——專案至今仍活躍迭代、後續已有新版本釋出，但 0.1 時期「實驗性、API 會破壞」的定性，仍是理解這類專案的正確框架。

![FB 貼文截圖：NVIDIA 發布 CUDA-Oxide 0.1，實驗性 Rust→CUDA 編譯器，可將標準 Rust 程式碼直接轉譯為 NVIDIA PTX](/media/2026-05/122161456010958395.jpg)
