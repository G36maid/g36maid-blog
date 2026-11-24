---
title: "用了三天的 GLM 5.2：1M 上下文是真的，共情有點煩"
description: "GLM 5.2 三天實用心得：1M 上下文真的能用，莫名奇妙的共情能力有點煩，智譜算力不足的老毛病依舊。附 GLM 5.1 規格對照與 2026-08 的 GLM 5.3 後續。"
pubDate: 2026-06-16T21:15:49+08:00
category: ai
tags: ["glm", "llm", "tool-review"]
source: facebook
sourceType: "貼文"
sourceTimestamp: 1781615749
draft: false
---

本文擴寫自 2026-06-16 的臉書貼文（當時剛用三天的觀察），2026-11 擴寫成完整版，補上版本資料查證與後續更新。

## 先交代時間線

訂 GLM coding plan 到寫原稿時大約三個月，主力模型是 GLM-5.1。先修正我貼文裡的手滑：5.1 的上下文是 200K，我打成 200M 了——[官方文件](https://docs.z.ai/guides/llm/glm-5.1)寫 200K context、最大輸出 128K，checkpoint 裡的 `max_position_embeddings` 是 202,752，5.1 於 2026-04-07 發布。而 [GLM-5.2 的官方 release notes](https://docs.z.ai/release-notes/new-released)標的日期是 2026-06-16，技術部落格和權重是隔天才補齊。我貼文寫在 6/16 晚上卻自稱用了三天，合理解釋是 API 先悄悄上線、隔天才正式官宣——5.1 當年也是 HuggingFace repo 先建好、幾天後才發布，智譜很愛這種節奏。

## 1M 上下文是真的

最有感的就是上下文。5.1 在 200K 用到六、七成左右能力就明顯降低，開始忘東忘西，agent 跑長任務時特別痛。5.2 官方宣稱「Solid 1M lossless context」，我原本當行銷話術看，實際把一個中型 codebase 連同一堆 log 整包餵進去，幾乎讀得完也不太會出問題。架構上靠 [IndexShare](https://z.ai/blog/glm-5.2) 這類稀疏注意力技巧把 1M 的計算成本壓下來，細節我沒有深究，結論對使用者很簡單：以前要自己整理摘要再餵的東西，現在可以直接塞。我的 agent 工作流是 [oh-my-opencode 那套 subagent 分工](/blog/oh-my-opencode-one-month/)，便宜模型探索、主模型動手，5.2 之後主模型直接吃全 repo 的場合多了一整個數量級。benchmark 隨手附一個：SWE-Bench Pro 62.1%，[開源模型最高](https://huggingface.co/zai-org/GLM-5.2)，長程任務的幾個 benchmark 上貼近 Claude Opus 4.8、價格只要幾分之一。數字真假我無法獨立驗證，但跟三天的體感一致。

## 莫名奇妙的共情能力

第二個有感的地方比較好笑：莫名奇妙的共情能力。5.1 用起來像機器人，5.2 莫名喜歡關心人，code 寫到一半會來問你還好嗎。我猜是 RLHF 把情商調高了，但這純屬個人猜測——我把 [5.2 的技術部落格](https://z.ai/blog/glm-5.2)和模型卡翻過一輪，官方從頭到尾只講 coding 跟 long-horizon，對話風格一個字都沒提，連 release notes 都只列長上下文和工程體驗。不管原因是什麼，我是不習慣，甚至有點煩。我要的是安靜把事做完的隊友，配套聊天機器人是什麼意思。風格偏好沒有對錯，喜歡陪伴感的人搞不好剛好相反。

## 老問題：算力

老生常談之智譜算力不足，速度真的太慢，回答一下卡一下。5.2 把 context 拉到 1M 之後這件事更明顯：長上下文的 prefill 本來就重，[官方部落格](https://z.ai/blog/glm-5.2)自己承認瓶頸已經轉移到 KV-cache 容量和 kernel 開銷；再加上官方把尖峰時段的配額消耗訂成三倍、離峰兩倍，算力壓力大不大，看訂價就知道。實務影響是 agent 迴圈每輪都要重新吃一大包 context，卡一下就是幾十秒，長任務的等待會累積到讓人失去耐性。模型能力再強，尖峰的服務品質會把體驗整個拖回去。

## 2026-08 update

兩個月後智譜在 2026-08-14 發布 [GLM-5.3](https://z.ai/blog/glm-5.3)。重點很明確：基座跟 5.2 完全同一顆（744B MoE、40B active），所有提升來自後訓練擴張——程式能力在自家的 Z.ai Code Bench 上比 5.2 提升 50%，公開 benchmark 拿開源 SOTA；比較意外的是後訓練過程湧現超出預期的資安能力，CyberGym 漏洞挖掘 84.5%（5.2 是 77.2%），官方說與多個資安團隊合作的實測共找出 2,436 個真實漏洞、其中 1,097 個中高危。大概因為能力太敏感，權重沒照慣例當天開源，[延後約兩週做完安全評估](https://lamjinlab.com/zh-hk/blog/zai-releases-glm-5-3-weights-after-cybersecurity-safety-review)才釋出。API 我沒有回去認真測，短期印象是尖峰塞車的老毛病還在。倒是本地這條線有進展：後來我把 GLM-5.3-Flash 用 EXL3 量化塞進兩台 DGX Spark，decode 快得理想、prefill 慢得痛苦（[在 2× DGX Spark 上部署 GLM-5.3-Flash-EXL3](/blog/exl3-glm-local-deploy/)），接著接上 Ghidra 玩逆向（[本地 LLM 逆向工程實戰](/blog/glm-ghidra-llm-reverse/)），MiaAI 那份 recipe 八週後的變化也追了一篇（[GLM-5.3-Flash-EXL3 的進步調查](/blog/miaai-exl3-progress/)）。被雲端速度逼到自己架模型，大概就是對智譜最誠實的評價。
