---
title: "抓戰犯範圍直接變成兩倍：self-host model 加 harness 的歸因難題"
description: "同時 self-host model 又跑自己寫的 harness，出錯時永遠分不清是 model 智商有問題還是 harness 設計有缺陷，疊上分散式推論後嫌疑犯名單其實有三份。記錄我用固定變數分層測試、雲端同款模型對照組、trace log、logprobs 逐 token 檢視與最小重現案例把戰犯抓出來的經驗。"
pubDate: 2026-08-15T04:10:19+08:00
category: ai
tags: ["local-llm", "vllm", "opencode", "harness", "debugging", "agent"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1786738219
---

> 本文擴寫自 2026-08-15 的 Facebook 貼文。原稿只留了一句：出錯時永遠不知道是 model 的智商有問題，還是 harness 的設計有缺陷，「抓戰犯範圍直接變成兩倍 🫠」。三個多月過去，這句話依然成立，把後來學到的抓戰犯方法補完。

## 嫌疑犯名單為什麼變長

用別人養好的 API，出錯頂多懷疑 prompt 寫壞了或 model 不行。自從我在 2× DGX Spark 上 self-host model、又在 [opencode](https://github.com/sst/opencode) 上疊了一層自己寫的 harness，「兩倍」還太樂觀——嫌疑犯名單其實有三份：

1. **model 本身**：智商、採樣參數、量化誤差。我跑的是 EXL3（[ExLlamaV3](https://github.com/turboderp-org/exllamav3) 的格式），低位元量化本來就會讓行為和全精度有微妙差異。
2. **推論基礎設施**：[vLLM](https://github.com/vllm-project/vllm) 分散式推論跨兩台機器跑，tensor parallel 設定、context 上限、KV cache，任何一環出包，症狀都是「agent 突然變笨」。
3. **我自己的 harness**：prompt 組裝、工具回傳怎麼塞回去、parser 怎麼解析輸出。自己寫的程式碼，出 bug 的機率不會因此降低。

最討厭的是三層的錯誤訊號長得一樣：都是 model 做出莫名其妙的決定。盯著輸出半天，分不出它是想錯、沒看到，還是被我的格式搞糊塗。

## 分層抓戰犯的土法煉鋼

**固定 harness，只換 model。** 同一份 prompt 與工具，丟給雲端同款 model 當對照組。雲端也錯，問題大概率在 harness；雲端對、本地錯，就往 self-host 那側挖：量化位元數、採樣參數、context 有沒有被截斷。缺點是要付 API 錢，但比盲目改設定便宜。

**固定 model，只改 harness。** 把中間產物全部攤開：送出的完整 prompt、每個工具呼叫的原始回應。我的 harness 曾把工具回傳的 JSON 轉義弄壞，model 收到一堆反斜杠就開始幻覺工具不存在——不攤開中間層，永遠會以為是 model 的鍋。

**最小重現案例。** 三十輪對話抓不出戰犯，就縮成單輪、單工具呼叫。縮到第幾步壞掉，壞因通常就躲在那一步的訊息裡。

## 工具面

- **trace log 落地**：每次工具呼叫的請求與回應完整寫進檔案。跑半小時才炸的 case，靠記憶還原不了現場。
- **逐 token 檢視**：vLLM 可以吐 logprobs。用 0.9 的信心選錯工具，和用 0.35 在兩個工具間鬼打牆，是兩種病：前者改 prompt 或換 model，後者有時調 temperature 就好。
- **工具呼叫 diff**：同一 prompt 跑兩次，diff 兩邊的行為。差異大的地方，就是隨機性吃掉確定性的地方。

## 兩邊都有問題的時候

最難抓的是兩層互相餵毒：harness 的錯誤訊息太含糊，model 亂猜參數，parser 又把亂猜的格式炸掉，訊息更含糊。單獨測哪一層都「沒問題」，疊起來就爛。這種時候只能認了，把介面契約重寫清楚——model 收到什麼、該回什麼、出錯時怎麼回報。介面講清楚，歸因難度至少砍半。

所以「抓戰犯範圍變兩倍」的解法，說穿了就是讓每一層都能被單獨懷疑。做得到固定其他變數只動一個，戰犯就跑不掉；做不到，就繼續 🫠。

延伸閱讀：EXL3 部署的 decode/prefill 取捨在[另一篇](/blog/exl3-glm-local-deploy/)；用極簡 harness 打完 AoC 2025 在[這篇](/blog/dgx-spark-deepseek-pi-agent-aoc/)；工具呼叫的設計取捨則在[讓 agent 用寫程式的方式呼叫 MCP](/blog/mcp-code-execution-mode/)。
