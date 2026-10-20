---
title: "在 2× DGX Spark 上部署 GLM-5.3-Flash-EXL3：decode 很香，prefill 很痛"
description: "GLM-5.3-Flash 上機實錄：用社群 wheel 讓 vLLM 吃下 2-bit EXL3 專家權重，decode 快得理想，prefill 慢得讓人認真考慮回歸 NVFP4 的懷抱。"
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

EXL3 是 [exllamav3](https://github.com/turboderp-org/exllamav3) 的量化格式，基於 QTIP 的 trellis 編碼，支援 2–8 bpw。對 Spark 來說它的吸引力很直接：decode 是記憶體頻寬綁定的，18B 活躍參數壓到 2 bit 上下，每 token 要讀的權重少到一個誇張的程度，273 GB/s 的頻寬也能餵出令人滿意的速度。代價是：**stock vLLM 根本不支援 EXL3**（[官方 feature request 還開著](https://github.com/vllm-project/vllm/issues/19896)），得靠社群 wheel 才能上 vLLM。

## 1. 先把兩台 Spark 接起來

單機 128GB 對 300GB 級的模型當然不夠，先用 QSFP 線把兩台接上 ConnectX-7（200GbE RoCE），照 [NVIDIA 的 playbook](https://build.nvidia.com/spark/connect-two-sparks/stacked-sparks) 配好介面：

```bash
ibdev2netdev   # 確認 enP2p1s0f1np1 之類的介面是 Up
```

這一步沒什麼雷，真正的雷都在下一步。

## 2. 裝會講 EXL3 的 vLLM

`pip install vllm` 是個陷阱：它會「看起來裝好了」，然後在你下載完 91 GiB 權重後才因為不認得 `Glm5Next` 架構、沒有 `exl3` 量化方法而炸掉。要裝的是 [GLM-5.3-Flash-EXL3-K2-spark-vllm](https://huggingface.co/vcruz305/GLM-5.3-Flash-EXL3-K2-spark-vllm) 這種打包好的 wheel——vLLM 當引擎、exllamav3 只當 CUDA kernel 函式庫、外掛把 `exl3` 註冊成量化方法：

```bash
bash scripts/install_prebuilt.sh
```

注意這組 wheel 綁得很死：aarch64、GB10（SM121）、Python 3.12、PyTorch 2.13.0+cu130、CUDA 13，換任何一樣就得自己從源碼編。

## 3. 起服務

FlashInfer 要在機器上 JIT 編 kernel，所以 `nvcc` 必須在 PATH 上，否則 vLLM 會挑掉 GB10 上唯一的 sparse-MLA backend，直接死在 `No valid attention backend found for cuda`：

```bash
export PATH=/usr/local/cuda-13.0/bin:$PATH
python preflight.py   # 先體檢
bash serve_one_spark.sh
```

正式起服務大致是這個形狀（雙機 TP=2）：

```bash
vllm serve vcruz305/GLM-5.3-Flash-EXL3-K2-spark-vllm \
  --quantization exl3 \
  --tensor-parallel-size 2 \
  --max-num-seqs 8 \
  --enable-chunked-prefill \
  --speculative-config '{"method": "mtp", "num_speculative_tokens": 5}'
```

裝的時候 pip 報 `flashinfer-python` 版本衝突是預期的（0.6.18rc10 就是實測版本），手癢降級反而會靜默離開實測過的 runtime，不要碰。

## 4. Prefill 為什麼慢成這樣

這就是整篇的核心 trade-off。decode 每一步只讀 18B 活躍參數的 2-bit 權重，頻寬省到笑，體感單流能到令人滿意的兩位數 tok/s；但 prefill 是計算綁定的，EXL3 的 trellis 權重沒辦法走 Blackwell tensor core 的 FP4 路徑，大 batch 時甚至得把權重解回來跑 hgemm。反觀 [NVFP4](https://developer.nvidia.com/blog/3-ways-nvfp4-accelerates-ai-training-and-inference) 是 Blackwell 原生格式，W4A4 直接上 tensor core——prefill 快非常多，只是 4 bit 對上 2 bit，decode 的頻寬紅利就沒了，而且 321B 模型的 NVFP4 版本更可能逼你兩台 Spark 都塞滿。NVIDIA 官方 vLLM release 也是[從 26.07 才把 NVFP4 帶上 Spark](https://docs.nvidia.com/deeplearning/frameworks/pdf/vLLM-Release-Notes.pdf)，兩條路線都還很年輕。

## 踩雷清單

- **K-pool tail bug**：8/30 之前的 wheel 在長生成時會對 sparse-MLA K-pool tail cache 越界寫入，引擎直接死掉或靜默弄壞鄰層的索引。當天釋出的 build 修掉了，並在 65,536 context 驗證過——我踩的時間點堪稱完美。
- **`pkill -f VLLM::EngineCore` 會自殺**：pattern 會 match 到下指令的 shell 自己。要用 `tools/reap`，不然下次啟動會以為是程式壞掉。
- **Cooperative GEMM 死鎖**：EXL3 的 trellis GEMM 在 33–144 行的 prefill 上會把引擎卡死（GPU 忙著空轉、EngineCore 100% CPU）。社群已改走 reconstruct 路徑繞過——這也再度印證 prefill 才是 EXL3 的痛點。
- **別自作聰明降級 flashinfer**：上面說過了，忍著。

## 個人評價

以「自架、低併發、長對話」的用途來說，這套組合我願意繼續用：decode 快、context 吃得起、兩台 Spark 剛好夠用。但 prefill 的痛是結構性的，不是調參能救的。如果之後跑的工作負載 prefill 佔比變高（長文件、RAG 大段灌入），NVFP4 大概是擋不住的引力——到時候大概就是「EXL3 留給聊天、NVFP4 留給灌文件」的雙軌制了。暫時還不想認輸。

![GLM-5.3-Flash-EXL3 本地部署截圖](/media/2026-08/122174129726958395.jpg)

延伸閱讀：[exllamav3 的 EXL3 格式說明](https://github.com/turboderp-org/exllamav3/blob/master/doc/exl3.md)、[vLLM 官方 GLM-5.3-Flash recipe](https://recipes.vllm.ai/zai-org/GLM-5.3-Flash)、[DGX Spark 多節點 vLLM playbook](https://build.nvidia.com/spark/vllm/multi-node)。
