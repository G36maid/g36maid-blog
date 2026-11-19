---
title: "DeepSeek-V4-Flash-0731 GGUF 部署筆記：llama.cpp + unsloth 動態量化，下載前的哇酷哇酷"
description: "在 DGX Spark 上用 llama.cpp 跑 DeepSeek-V4-Flash-0731 的 GGUF：選 UD-IQ2_M 的權衡、llama-server 旗標的取捨、26 萬 context 的 KV cache 代價，與 dspark speculative decoding 的觀望。"
pubDate: 2026-08-01T12:55:21+08:00
updated: 2026-11-19T00:00:00+08:00
category: self-hosting
tags: ["llama.cpp", "gguf", "deepseek", "unsloth", "quantization", "dgx-spark", "local-llm"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1785560121
---

> 本文擴寫自 2026-08-01 的短貼文。原稿只有一句「準備部署了，哇酷哇酷」加一條 [unsloth/DeepSeek-V4-Flash-0731-GGUF](https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF) 的連結——那天早上模型才剛出來幾個小時，我一行指令都還沒跑，純粹是看到 284B 的 MoE 被壓進 80 多 GB 的檔案就興奮到先發文。以下把後來真正下載、啟動、調參的過程補齊。

## 0. 痛點與為什麼是 GGUF 這條路

自己開 284B 級距的模型，卡的一直是記憶體，不是算力。DGX Spark（[GB10](https://www.nvidia.com/en-us/products/dgx-spark/)，128GB unified memory）這種機器「記憶體很大、頻寬很小」，[之前跑 GLM-5.3-Flash EXL3](/blog/exl3-glm-local-deploy/) 時就領教過：decode 順、prefill 痛。DeepSeek-V4-Flash-0731 是 284B 總參數、每 token 只有 13B 活躍的 MoE，這個形狀對頻寬可憐的機器反而是利好——每步只需要搬 13B 對應的權重。GGUF 配 llama.cpp 對這種情境最寬容：量化檔案選擇多、社群調參經驗累積最快、單機不用碰分散式推理的複雜度。分散式那套是[另一篇文章](/blog/exl3-glm-local-deploy/)的故事，這篇專注單機。

## 1. 選量化等級：從 Q8 一路往下算

先看官方權重的形狀。原版 [checkpoint](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731) 把 96% 的 routed experts 原生存成 MXFP4，其他部分是 FP8/BF16。unsloth 的做法是把 MXFP4 專家逐 bit 重打包（GGUF 的 MXFP4 就是同一個格式，零誤差）、非專家的 4% 另外處理：[模型卡](https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF)上寫 UD-Q8_K_XL（162GB）是逐 tensor 驗證過 bit-identical 的無損版，UD-Q4_K_XL 只多壓非專家權重所以體積緊鄰 Q8。無損很好，但 162GB 塞不進 128GB 還要留 KV cache 的機器。於是往下算：UD-IQ3_XXS 約 97.1 GiB，UD-IQ2_M 約 84.7 GiB。我的情境還要開 26 萬 token 的 context，KV cache 至少要擠出幾十 GB，84.7 是唯一留得下呼吸空間的等級。

UD-IQ2_M 是 unsloth Dynamic 2.0 的 2-bit 動態量化。[unsloth 的說明](https://www.unsloth.ai/blog/dynamic-v2)：不做整顆模型同一個 bit 寬度，而是按層敏感度分配——attention 與前後的 dense 層多給一點、routed experts 壓狠一點、每層組合依模型量身計算，校準資料特別混入 chat 與 tool call 的分佈。獨立測試（[krakowiak.eu 的量化筆記](https://krakowiak.eu/quantization/unsloth-dynamic)）也支持 2-3 bit 這個區間 UD 通常是同體積最強的檔案。MoE 在低 bit 有個結構性優勢：每 token 只啟動 13B，2-bit 專家權重的影響比帳面 284B 看起來小。

社群有個實測可以借鑑：NVIDIA 論壇有人單機同時測 UD-IQ3_XXS 與 UD-IQ2_M，單流速度接近，但 IQ3_XXS 在 4 路併發時有可重現的吞吐崩塌（47.6 掉到 26.3 tok/s）、IQ2_M 穩定（[討論串](https://forums.developer.nvidia.com/t/1x-dgx-spark-deepseek-v4-flash-0731-on-llama-cpp-131k-ctx-slot-19-7-tok-s-single-stream-52-tok-s-4-concurrent/379129)）。我寧可小一點、穩一點、多留記憶體給 context，所以直接選 2-bit。

## 2. 下載

用 `hf` CLI，`--include` 只抓要的量化版，整個 collection 有 123 個項目，不需要全抱回家：

```bash
hf download unsloth/DeepSeek-V4-Flash-0731-GGUF \
  --local-dir ~/models/DeepSeek-V4-Flash-0731-GGUF \
  --include "*UD-IQ2_M*"
```

約 84.7 GiB、三個 shards（`DeepSeek-V4-Flash-0731-UD-IQ2_M-00001-of-00003.gguf` 起）。llama.cpp 會自動接 shards，llama-server 只要指第一個。repo 裡另有一顆 `dspark-DeepSeek-V4-Flash-0731-Q8_0.gguf` 是 speculative decoding 的 draft model，想加速解碼再另外抓。

## 3. llama-server 啟動

起手式直接沿用社群在 NVIDIA 論壇跑通的[參數組合](https://forums.developer.nvidia.com/t/deepseek-v4-flash-0731-gguf-new-model/378829)，我照抄再微調：

```bash
~/tools/llama.cpp/build/bin/llama-server \
  -hf unsloth/DeepSeek-V4-Flash-0731-GGUF:UD-IQ2_M \
  --alias deepseek-v4-flash-0731 \
  --host 0.0.0.0 --port 8000 \
  --n-gpu-layers 999 \
  --flash-attn on \
  --ctx-size 262144 \
  --parallel 2 \
  --batch-size 2048 --ubatch-size 512 \
  --jinja \
  --reasoning off \
  --cache-type-k f16 --cache-type-v f16 \
  --temp 0.6 --top-p 0.95 --min-p 0.0 \
  --metrics
```

旗標背後的 trade-off：

- `--ctx-size 262144`：這模型原生支援 1M context，GGUF 能開到多少其實是記憶體問題。權重 84.7 GiB 之後，128GB unified memory 扣掉系統只剩不到 40GB 給 KV cache，而 f16 的 KV cache 隨 context 線性長——262144 tokens 已經很緊，`--parallel 2` 再把它對半分。長 context 的代價不只是啟動時佔住記憶體，prefill 也會變慢，塞一份長文件進去的等待感很實在。
- `--cache-type-k/v f16`：不動品質、代價就是記憶體。想省一半可以改 `q8_0`（[HF discussion #26](https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF/discussions/26) 有人回報品質幾乎不動），但量化 V cache 需要 FlashAttention，`--flash-attn on` 跟這兩行是綁定的。
- `--n-gpu-layers 999`：把整顆模型塞 GPU。GB10 是 unified memory，「GPU 層」其實是同一塊記憶體，只是走 CUDA kernel 的路徑。
- `--jinja`：套 model card 裡的 chat template。不加的話 tool call 格式會壞，agent 工作流直接掛。
- `--reasoning off`：關掉內建 thinking 模式。我偏好思考預算由外面的 agent 自己控制，不要讓 server 端自作主張想三分鐘。

## 4. Speculative decoding：dspark draft model

DeepSeek-V4-Flash-0731 的結構與 [DeepSeek-V4-Flash-DSpark](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-DSpark) 相同，官方 checkpoint 就附了一個 speculative decoding 模組。概念是小模型（這裡是 Q8 的 dspark 模組）先連猜幾個 token、主模型一次並行驗證，猜中率夠高的話等於一次 decode 多個 token。對我們這種頻寬受限的機器特別划算：驗證比生成便宜。llama.cpp 用 `--model-draft` 載入。社群實測：[HF discussion #26](https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF/discussions/26) 回報 Strix Halo 128GB 從 15 提到 25 tok/s，老 P40/P100 環境也從 6-7 到 10+ tok/s。unsloth 官方文件說 GGUF 的 DSpark 支援可到 [1.5-1.9x 加速](https://unsloth.ai/docs/models/deepseek-v4)。不過當時這條路徑還實驗中，有人碰到 `failed to measure draft model memory` 的載入錯誤（[同串](https://huggingface.co/unsloth/DeepSeek-V4-Flash-0731-GGUF/discussions/26)回報，官方說 investigatin）。我決定先不加，等它成熟。

## 5. 踩雷注意事項

- **shards 要完整**：三個 shard 少一個 llama.cpp 直接拒載。下載完 `ls -lh` 對大小，別只確認第一個存在。
- **`--no-mmap` vs mlock**：unified memory 機器上 mmap 有時會讓權重被系統回收，社群回報 `--no-mmap` 或 `--load-mode mlock` 才穩（[NVIDIA 論壇](https://forums.developer.nvidia.com/t/1x-dgx-spark-deepseek-v4-flash-0731-on-llama-cpp-131k-ctx-slot-19-7-tok-s-single-stream-52-tok-s-4-concurrent/379129)）。
- **`q8_0` KV cache 併發時品質掉比較多**：省記憶體有感，但 `--parallel > 1` 時衰減比單 slot 明顯，我自己踩過。
- **採樣旗標**：`--top-k 0` 是關閉 top-k 過濾（不是沒設），只留 `--top-p`。`--min-p 0.0` 要顯式寫，不然預設值會偷偷卡掉低機率 token。
- **thinking token 吃吞吐**：開 thinking 時長推理讓實際輸出速度難看——它想太多的時間都算在你的等待裡。

## 6. 個人使用評價

先講優點：284B 塞進 84.7 GiB、在 128GB 機器真的跑得起來，這件事本身值得哇酷哇酷。單機 Spark 實測大致 19-20 tok/s 的量級（[社群數據](https://forums.developer.nvidia.com/t/1x-dgx-spark-deepseek-v4-flash-0731-on-llama-cpp-131k-ctx-slot-19-7-tok-s-single-stream-52-tok-s-4-concurrent/379129)：19.7 tok/s 單流、併發 4 路合計 52 tok/s），跟人對話、跑 agent 都在可用範圍。0731 版的 agentic 能力比 preview 進步非常多——[官方 benchmark](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731) Terminal Bench 2.1 61.8→82.7、Cybergym 38.7→76.7、DeepSWE 7.3→54.4——實際用起來 tool call 真的有感變可靠。MIT 授權，要幹嘛都乾脆。

缺點也不客氣：UD-IQ2_M 是 2-bit，模型知識的精細度明顯折損，coding 任務偶爾給出「形狀對、細節錯」的答案，這是 2-bit 的物理極限。KV cache 記憶體壓力是常態，長文件加上併發很容易 OOM。speculative decoding 當時不成熟，沒吃到那個加速是遺憾。同級距有 API 可用時，本地這套的意義主要在資料不出門與離線，純論效率是輸的——這在[單機測評](https://forums.developer.nvidia.com/t/1x-dgx-spark-deepseek-v4-flash-0731-on-llama-cpp-131k-ctx-slot-19-7-tok-s-single-stream-52-tok-s-4-concurrent/379129)裡也是共識。

## 2026-11 update

幾個月下來主力已經切去 GLM-5.3-Flash EXL3 on vLLM（兩台 Spark 分散式跑，心得在[前一篇](/blog/exl3-glm-local-deploy/)），DeepSeek-V4-Flash-0731 留在 GGUF/llama.cpp 這條路，需要它原生 1M context 的任務才會再開回來。unsloth 後來把 DSpark 支援做穩了（[文件](https://unsloth.ai/docs/models/deepseek-v4)說 1.5-1.9x 解碼加速），`--model-draft` 那個 bug 也修了；想在 Spark 上看它自己打 AoC 的紀錄，可以看[這篇](/blog/dgx-spark-deepseek-pi-agent-aoc/)。
