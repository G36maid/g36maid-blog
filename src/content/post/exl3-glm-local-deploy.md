---
title: "在 2× DGX Spark 上部署 GLM-5.3-Flash-EXL3：decode 很香，prefill 很痛"
description: "GLM-5.3-Flash 上機實錄：用 MiaAI Lab 的 recipe 讓 vLLM 吃下 4-bpw EXL3 專家權重，decode 快得理想，prefill 慢得讓人認真考慮回歸 NVFP4 的懷抱。"
pubDate: 2026-08-30T03:03:00+08:00
category: self-hosting
tags: ["vllm", "exl3", "glm", "dgx-spark", "quantization"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1788030180
---

> 本文擴寫自 2026-08-30 的隨筆。

今天成功本地部署了 GLM-5.3-Flash-EXL3。雖然 decode 表現很理想，但 prefill 速度真的太慢了。開始認真思考 EXL3 是不是一個正確的量化方式——或許還是要回歸 NVFP4 的懷抱。

先把結論說在前面：在 DGX Spark 這種「記憶體很大、頻寬很小」的機器上，EXL3 的取捨其實是合理的，只是它把成本全部推到 prefill 那一側去了。

## 為什麼是 GLM-5.3-Flash + EXL3

[GLM-5.3-Flash](https://dell.huggingface.co/models/zai-org/GLM-5.3-Flash) 是 2026 年 8 月 17 日發布的 GLM-5.3 系列 Flash 版：約 320B 總參數、每 token 只啟用 18B 的 MoE，45 層混用 KDA 線性注意力與 NoPE sparse MLA，路由 288 個專家中的 8 個，號稱 1M context、附一層 MTP 草稿層。原生 FP8 權重約 306 GiB——我的兩台 [DGX Spark](https://docs.nvidia.com/dgx/dgx-spark/hardware.html)（GB10、128GB LPDDR5x、273 GB/s）加起來都吃不太下，所以勢必得往低位元量化走。

EXL3 是 [exllamav3](https://github.com/turboderp-org/exllamav3) 的量化格式，基於 QTIP 的 trellis 編碼，支援 2–8 bpw。對 Spark 來說它的吸引力很直接：decode 是記憶體頻寬綁定的，18B 活躍參數壓到 4 bit 上下，每 token 要讀的權重少到一個誇張的程度，273 GB/s 的頻寬也能餵出令人滿意的速度。代價是：**stock vLLM 根本不支援 EXL3**（[官方 feature request 還開著](https://github.com/vllm-project/vllm/issues/19896)），所以我是用 [MiaAI Lab 的 recipe](https://github.com/MiaAI-Lab/GLM-5.3-Flash-EXL3-2x-DGX-Sparks)——它把 vLLM fork、exllamav3 kernel、`exl3` 量化方法與 DFlash2 草稿層整包成一份給 GB10（SM121）的 Docker overlay，兩台 Spark 一個指令拉起來。

品質上這個 checkpoint 也站得住：依 recipe 附的 KLD 量測，[TR3 4bpw](https://huggingface.co/Mia-AiLab/GLM-5.3-Flash-EXL3-TR3-4bpw) 對 FP8 幾乎是 1.00× 的保真度，只用了 54% 的位元組。4 bit 換 2 倍容量省一半，這筆帳很划算。

## 1. 先把兩台 Spark 接起來

單機 128GB 對 164 GiB 的權重當然不夠，先用 QSFP 線把兩台接上 ConnectX-7（200GbE RoCE），照 [NVIDIA 的 playbook](https://build.nvidia.com/spark/connect-two-sparks/stacked-sparks) 配好介面：

```bash
ibdev2netdev   # 確認 enP2p1s0f1np1 之類的介面是 Up
```

這一步沒什麼雷，真正的雷都在下一步。

## 2. 一個指令把服務拉起來

recipe 把整條鏈（映像檔、權重、worker rsync、TP=2 起服務）包進 `start.sh`：

```bash
git clone https://github.com/MiaAI-Lab/GLM-5.3-Flash-EXL3-2x-DGX-Sparks.git
cd GLM-5.3-Flash-EXL3-2x-DGX-Sparks
cp .env.example .env    # 填 HEAD_IP / WORKER_IP / WORKER_USER 與 CX7 介面名
./start.sh
```

`./start.sh` 會依序：preflight docker/ssh/disk → `docker pull ghcr.io/miaai-lab/glm-5.3-flash-2x-dgx-sparks:exl3`（worker 拉不動就 `docker save | ssh docker load`）→ 下載 [TR3 4bpw 權重](https://huggingface.co/Mia-AiLab/GLM-5.3-Flash-EXL3-TR3-4bpw)（~164 GiB、120 shards，鏡像不全會 fallback 到 [brandonmusic/GLM-5.3-Flash-tr3-4bpw](https://huggingface.co/brandonmusic/GLM-5.3-Flash-tr3-4bpw)）→ rsync 給 worker → 以 TP=2 起服務，OpenAI API 開在 head 的 8888。等 worker 就緒前想先 stage 權重，`./download.sh` 只在 head 抓，不碰 docker 與 SSH。

草稿層預設是 [DFlash2](https://huggingface.co/incoai/GLM-5.3-Flash-DFlash2)（~2.3 GiB BF16、k=7），要回 MTP 的話：

```bash
SPEC_METHOD=mtp ./start.sh restart      # MTP k=2
```

記憶體預算方面，`GPU_MEM_UTIL=0.87` 要求 vLLM 自身約 9 GiB 之外還有 ≥105.9 GiB 可用（GB10 是 CPU/GPU 共享記憶體，得留 OS 頭寸），記憶體檢查不過就降到 `0.86`。KV pool 是 fp8 打包的 `fp8_ds_mla`，1M context 下 live pool 1,754,237 tokens（1.75×）。

## 3. Decode 實測

recipe 附的 kit 數字（sparkDash decode bench、DFlash2 k=7、structured prompt 類型）：單流 **62.9 tok/s**、TTFT 719 ms；×4 併發 aggregate 146.5 tok/s。同一協定下 MTP k=2 基線只有 ~24.6 tok/s——DFlash2 的接受率（structured 0.959、每步 6.71 tokens）就是 decode 體感的主要來源。我自己跑下來的體感和這組數字一致：單流穩定兩位數尾到六字頭，長對話完全可用。

## 4. Prefill 為什麼慢成這樣

這就是整篇的核心 trade-off。decode 每一步只讀 18B 活躍參數的 4-bit 權重，頻寬省到笑；但 prefill 是計算綁定的，EXL3 的 trellis 權重沒辦法走 Blackwell tensor core 的 FP4 路徑，大 batch 時甚至得把權重解回來跑 GEMM。反觀 [NVFP4](https://developer.nvidia.com/blog/3-ways-nvfp4-accelerates-ai-training-and-inference) 是 Blackwell 原生格式，W4A4 直接上 tensor core——prefill 快非常多，只是對上同樣 4 bit 的 EXL3，容量優勢沒了、NVIDIA 官方 vLLM release 也是[從 26.07 才把 NVFP4 帶上 Spark](https://docs.nvidia.com/deeplearning/frameworks/pdf/vLLM-Release-Notes.pdf)，兩條路線都還很年輕。

社群也印證了這個痛點：我部署隔天（8/31），recipe 就併了 [fat-expert prefill 加速](https://github.com/MiaAI-Lab/GLM-5.3-Flash-EXL3-2x-DGX-Sparks/commit/4b8d3c76)——大家都在補 prefill 這一側，沒有人在補 decode。

## 踩雷清單

- **K-pool tail slotmap bug**：長生成時對 sparse-MLA K-pool tail cache 越界寫入，引擎直接死掉或靜默弄壞鄰層的索引。修復（[PR #50](https://github.com/MiaAI-Lab/GLM-5.3-Flash-EXL3-2x-DGX-Sparks/commit/e2274d88)、pin 死 one-block circular scratch）就在 8/30 當天合併——我踩的時間點堪稱完美。裝的時候直接拉 main 就好。
- **別想用 stock vLLM 映像**：stock 的 `vllm/vllm-openai:glm53-flash-arm64-cu130` 載入這個 checkpoint 會死在 `pe_dim must be 64 for fp8_ds_mla`——GLM-5.3-Flash 是 NoPE MLA，SM12x 上唯一的 sparse-MLA backend 幾何不匹配，overlay 是靠 zero-pad 512-d latent 才接上的。
- **`attention_backend: TRITON_ATTN` 是毒藥**：掛了之後 structured 接受率直接崩（~29 tok/s、0.31 accept），pos0 之後全倒。
- **GB10 UVM livelock**：recipe 的 docs 裡有 runbook（8/31 進 repo），遇到卡死先翻它，不要自己硬猜。
- **`--moe-backend marlin`、NVFP4 KV dtype、改 TP/CX7 pins**：recipe 的「Do not」清單寫得很白，別手癢。

## 個人評價

以「自架、低併發、長對話」的用途來說，這套組合我願意繼續用：decode 快（DFlash2 加持）、context 吃得起（1.75× 的 KV pool）、164 GiB 的權重兩台 Spark 剛好夠用。但 prefill 的痛是結構性的，不是調參能救的。如果之後跑的工作負載 prefill 佔比變高（長文件、RAG 大段灌入），NVFP4 大概是擋不住的引力——到時候大概就是「EXL3 留給聊天、NVFP4 留給灌文件」的雙軌制了。暫時還不想認輸。

![GLM-5.3-Flash-EXL3 本地部署截圖](/media/2026-08/122174129726958395.jpg)

延伸閱讀：[exllamav3 的 EXL3 格式說明](https://github.com/turboderp-org/exllamav3/blob/master/doc/exl3.md)、[vLLM 官方 GLM-5.3-Flash recipe](https://recipes.vllm.ai/zai-org/GLM-5.3-Flash)、[DGX Spark 多節點 vLLM playbook](https://build.nvidia.com/spark/vllm/multi-node)。
