---
title: "我真的會恨 Gemini：平台內很聰明，呼叫外部工具就笨到不行"
description: "社群回報與後訓練特化解釋 Gemini 平台內外 tool calling 落差，附 Gemini 3 後記。"
pubDate: 2025-11-17T12:56:18+08:00
category: ai
tags: ["gemini", "mcp", "function-calling", "agent", "ai", "llm"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1763355378
---
> 本文擴寫自 2025-11-17 的 Facebook 貼文（原稿四行怨言加一張迷因貼圖）；證據與原理是擴寫時補的，文末另附 2026-11 的後見更新。

原稿全文：

> 我真的會恨Gemini
> 只能在自己的平台上運作良好
> 呼叫外部工具或是 mcp 到時候真的笨到不行
> 😅

![原稿附圖：貼文用的「已老實」反應迷因貼圖](/media/2025-11/122132857898958395.jpg)

## 平台內外，是兩個 Gemini

這段怨言在 2025 年底的公開討論裡幾乎是一邊倒的共識。Gemini 在自家介面——gemini.google.com、AI Studio——連著內建搜尋與 code execution，表現是第一梯隊；同一顆模型接到我自己的工具鏈（opencode 加自選 MCP）就開始出包：說要呼叫工具卻沒有呼、參數不合 schema，嚴重時乾脆自己編造工具回傳值。我的 agent 日常主力因此一直是 Claude 和開源 GLM，Gemini 只在 chat 場景上場。

證據隨手就是一把。r/Bard 有一串標題就叫「Gemini API function calling never works」：不把 `tool_config` 設成 `ANY` 就幾乎不呼 tool，1.5 到 2.5 全中，還有人回報模型說「I'm executing the function xyz...」然後就停了。r/mcp 的「Is it just me, or Gemini refuses to call MCP tools?」統計出約三到四成的機率模型說要呼卻沒呼，而且「Gemini is the only model that has its 'own way' of doing it」——從 MCP server 抓下來的 schema 別家都照收，只有 Gemini 挑：「field xy can only be of type DATE, not STRING」。Google AI Developers Forum 上更有長串「Very frustrating experience with Gemini 2.5 function calling performance」：作者原本能動的整合「recently stopped working almost entirely」，模型照著 schema 生成純文字回應就是不發 function call，回應開頭多包一層 json code block 的 bug「going on for a couple of months」沒人修。連替 Gemini 說話的人都只能承認：「function calling using MCP is not as smooth as Sonnet, GPT 4.1 and even latest Qwen models. Especially when there are many tools.」

## 為什麼自家平台特別聰明

這個落差有結構性原因，核心是後訓練特化。工具呼叫能力是 post-training 教出來的：供應商用合成資料大量演練「何時呼 tool、怎麼填參數、怎麼從錯誤恢復」。平台內建工具（搜尋、code execution）的呼叫模式就在這批資料裡被強化過無數次，屬於 in-distribution——token 層級的肌肉記憶直接寫進權重。外部 function tool 走的是另一條路：模型在推論時現場讀你的 schema，用 in-context learning 猜這個工具的語意，本質上是 out-of-distribution。Salman Quazi 在〈Why Built-in Tools Outperform Function Tools in LLMs〉把這件事講得很白：內建工具的 schema 等於寫在權重裡，自訂工具的 schema 只是一份一次性塞進 context 的說明書。

在這之上還有三層。**Schema 遵從**：供應商可以替自家工具量身設計格式與驗證，第三方 schema 只能被動配合 Gemini 的怪癖——前面 DATE/STRING 那則就是現場示範。**Context 管理**：接幾十個 MCP server，所有 tool schema 預載進 context，注意力被稀釋；我在讀 [Anthropic 的 Code execution with MCP](/blog/mcp-code-execution-mode/) 時分析過同一個問題，而 Gemini 對這種塞爆的 context 似乎格外敏感。**行為漂移**：forum 那串「上週還好好的」顯示供應端的調整只需保證自家平台場景，外部場景 regress 了也沒有回滾機制。三層疊起來，「自家平台聰明、外部工具笨」就有了機制上的解釋：訓練管線與產品策略共同決定的結果。

## 我的對照組

我的判準很實際：同一套 harness、同一組 MCP，換模型直接比 tool call 命中率。結果是探索與批量處理交給便宜的開源模型，貴的留給規劃——這套分工寫在 [oh-my-opencode 一個月](/blog/oh-my-opencode-one-month/)那篇。Gemini 在這張表上不上榜：便宜、context 長、chat 體感好（我甚至拿它做過[自我提純](/blog/gemini-preference-distillation/)），但 MCP 這關過不了，省下的錢都賠在重試與驗證的時間上。

## 2026-11 update：Gemini 3 之後有變好嗎

一年後回看，官方數字確實追上來了。Gemini 3 Pro（2025-11-18 發布）的模型評估報告裡，τ²-bench（agentic tool use）拿到 85.4%，同一份表格中 Gemini 2.5 Pro 只有 54.9%，並與 Claude Sonnet 4.5（84.7%）同列第一梯隊。

但兩件事沒變。其一是整合稅：Gemini 3 開始強制 function call 帶 thought signature，第三方不原樣帶回就吃 400 錯誤——[OpenAI 相容端點直接被打爆](https://discuss.ai.google.dev/t/openai-api-compatibility-broken-due-to-thought-signature-on-gemini-3-pro-preview/109823)、[mlflow 的 Gemini adapter 因 signature 從 `functionCall` 內部搬到 `Part` 層級而整批失效](https://github.com/mlflow/mlflow/issues/25745)，連 Google 自己的 gemini-cli 都中鏢，每一筆都是開放生態要自行吸收的介面變動。其二是 MCP 場景的實測仍落後：MCP Atlas pass rate 54.1%、MCP-Universe 44.6%，與平台內 benchmark 的亮麗距離很遠；r/cursor 也有「Gemini 3 ended up being a disappointment for Agentic Coding」這種第一手回報，Gemini CLI 與 Antigravity 的心得則好壞參半。

所以原稿那句話到今天我依然同意，只是表述可以更精確：Gemini 的聰明是真實的，但它沿著自家平台與自家工具的形狀生長。挑模型的時候，平台內分數與開放 harness 分數要分開看——兩者的落差，就是供應商綁定的報價單。

## References

- [Function calling with the Gemini API](https://ai.google.dev/gemini-api/docs/function-calling) — 官方文件：function calling modes（含 `ANY`）與 best practices（2026-11-13 curl 200）
- [Gemini API function calling never works（r/Bard，2024-11）](https://www.reddit.com/r/Bard/comments/1fp4xu3/gemini_api_function_calling_never_works/)
- [Is it just me, or Gemini refuses to call MCP tools?（r/mcp，2025-04）](https://www.reddit.com/r/mcp/comments/1jxkso4/is_it_just_me_or_gemini_refuses_to_call_mcp_tools/)
- [Very frustrating experience with Gemini 2.5 function calling performance（Google AI Developers Forum，2025-07）](https://discuss.ai.google.dev/t/very-frustrating-experience-with-gemini-2-5-function-calling-performance/92814)
- [Making Gemini the best model for building Agents（r/Bard，2025-07）](https://www.reddit.com/r/Bard/comments/1lpxzzu/making_gemini_the_best_model_for_building_agents/)
- [Am I crazy, or is the Gemini CLI completely broken?（r/Bard，2025-10）](https://www.reddit.com/r/Bard/comments/1oktc48/am_i_crazy_or_is_the_gemini_cli_completely_broken/)
- [Why Built-in Tools Outperform Function Tools in LLMs（Salman Quazi）](https://www.salmanq.com/blog/llm-built-in-tools/) — 後訓練特化與 in-distribution 論證
- [New Gemini API updates for Gemini 3（Google Developers Blog，2025-11）](https://developers.googleblog.com/new-gemini-api-updates-for-gemini-3) — thought signature 強制驗證公告
- [Thought signatures（Gemini API 文件）](https://ai.google.dev/gemini-api/docs/thought-signatures)
- [OpenAI API compatibility broken due to thought_signature on gemini-3-pro-preview（Google AI Developers Forum，2025-11）](https://discuss.ai.google.dev/t/openai-api-compatibility-broken-due-to-thought-signature-on-gemini-3-pro-preview/109823)
- [mlflow#25745：Gemini 3 broke multi-turn function calling on the OpenAI-compatible path](https://github.com/mlflow/mlflow/issues/25745)
- [Gemini 3 Pro — Model Evaluation report（Google DeepMind，2025-11）](https://storage.googleapis.com/deepmind-media/gemini/gemini_3_pro_model_evaluation.pdf) — τ²-bench 85.4% vs 2.5 Pro 54.9%
- [Gemini 3 Pro benchmark scores（evals.report：MCP Atlas 54.1%、MCP-Universe 44.59%）](https://evals.report/models/google-gemini-3-pro)
- [Gemini 3 ended up being a disappointment for Agentic Coding（r/cursor，2025-11）](https://www.reddit.com/r/cursor/comments/1p0pmxq/gemini_3_ended_up_being_a_disappointment_for/)
- [Gemini 3.0 Pro Preview in Gemini CLI — Review（r/Bard，2025-11）](https://www.reddit.com/r/Bard/comments/1p4mac1/gemini_30_pro_preview_in_gemini_cli_review/)
