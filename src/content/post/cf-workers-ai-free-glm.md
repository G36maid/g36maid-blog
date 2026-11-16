---
title: "在 Cloudflare Workers AI 上白嫖 GLM-5.2 接 opencode：實測筆記"
description: "Workers AI 模型目錄上直接掛著 Z.ai 的 agentic coding model GLM-5.2，建個 CF 帳號、開一支 API token 就能接進 opencode 當 coding agent。實測心得、免費 Neurons 額度的算法，以及 2026-11 的後續：免費好日子不到半年就結束了。"
pubDate: 2026-06-27T22:38:28+08:00
category: ai
tags: [ai, glm, api, opencode, cloudflare]
draft: false
source: facebook
sourceType: "相片"
sourceTimestamp: 1782571108
---
（這篇擴寫自 2026-06-27 的 Facebook 快訊，當時原文只有幾行：CF Workers AI 上面有免費的 GLM-5.2 可以用，建立 CF 帳號、建立 id 與 API token 後即可在 opencode 內使用，備註是每天有免費額度但不是無限量。以下把當時的操作過程展開，文末補上 2026-11 的現況更新——結局有點幽默，這個「免費」沒活多久。）

## 為什麼盯上這個組合

Coding agent 的訂閱費一個月一兩千起跳，而我手上已經有兩條 GLM 路線：一台在 DGX Spark 上用 EXL3 自架的本地 GLM（[之前的部署筆記](/blog/exl3-glm-local-deploy/)），加上一份 GLM coding plan（token 帳單的痛點在[用 oh-my-opencode 一個月的心得](/blog/oh-my-opencode-one-month/)裡抱怨過）。自架的問題是機器被綁住，出門在外或筆電沒電時整套 agent 就斷線。

那陣子翻 Cloudflare Workers AI 的模型目錄，發現上面直接掛了 `@cf/zai-org/glm-5.2`——Z.ai 的旗艦 agentic coding model，262,144 tokens 的 context window、支援 function calling 和 reasoning，而且頁面上寫著 Workers Free 方案每天送的額度就能跑。對「隨手開個 opencode 幫忙改 code」的場景來說，不用管 GPU、不用開機器、帳號辦一辦就能用，這個組合值得一試。

## 開通：三個步驟

1. **建 Cloudflare 帳號，抄下 Account ID。** 登入 dash.cloudflare.com 後，右側欄位就有 Account ID，等一下接 API 時會用到。
2. **建一支 API token。** 路徑是 My Profile → API Tokens → Create Token，用 custom token 只給 Account → Workers AI 的 Edit 權限就好。別把 Global API Key 拿出來用——一支能被 scope 限縮的 token 出事時損害範圍小得多。
3. **接進 opencode。** 在 opencode 裡跑 `/connect`，選 Cloudflare Workers AI，貼上 token；接著 `/models` 搜「cloudflare workers AI」，清單裡就會出現 Glm 5.2，選下去即可。當時用的版本是 OpenCode 1.17.9：

![OpenCode 1.17.9 的 Select model 對話框，搜尋 cloudflare workers AI 後選 Glm 5.2，側欄顯示 MCP 伺服器連線清單](/media/2026-06/122166836354958395.jpg)

如果 `/models` 清單裡找不到（版本差異或 provider catalog 沒同步），可以手動在 `opencode.json` 加一個 OpenAI 相容的 provider：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "cloudflare": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Cloudflare Workers AI",
      "options": {
        "baseURL": "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1",
        "apiKey": "{env:CLOUDFLARE_API_TOKEN}"
      },
      "models": {
        "@cf/zai-org/glm-5.2": {
          "name": "GLM 5.2"
        }
      }
    }
  }
}
```

Workers AI 本身就提供 OpenAI 相容端點（`/ai/v1/chat/completions`），所以任何吃 OpenAI 格式的工具都能這樣接，opencode 只是其中一個。模型 ID 要照抄完整的 `@cf/zai-org/glm-5.2`，少一段就 404。注意 opencode 改版時 config schema 的欄位名動過幾次（`provider`/`providers`、`npm`/`package`），以你手上版本的[providers 文件](https://opencode.ai/docs/providers/)為準。

## 實測：當 coding agent 到底行不行

先講結論：可以跑，agent loop 是完整的。function calling 有支援，opencode 的讀檔、改檔、跑指令這些工具呼叫都正常，不會有那種「模型不會用工具、一直在那邊輸出純文字」的窘境。262K context 搭配 opencode 自動壓縮，在實際的 repo 裡工作不太會撞到上限。

幾個使用上的觀察：

- **reasoning 預設是開的**，每次回應前會先想一段，TTFT 明顯拉長。急著要短答的場合可以關掉，但在 opencode 裡讓它慢慢想反而比較穩，編輯計畫比較不會亂來。
- **速度比訂閱的旗艦模型慢一些**，但作為背景 agent 跑重構、寫測試這種「丟著等」的任務完全可接受。
- **免費額度真的就是「每天」的量。** Workers Free 每天送 10,000 Neurons，以 GLM-5.2 這種量級的模型換算，粗估一天大概只有幾萬 tokens 的用量（input 比 output 便宜，但都吃不小）。認真讓它跑一個下午的重構，額度就見底了；超過之後請求直接報錯，要等到 UTC 00:00 才重置。
- **隱私方面倒是給得不錯**：官方頁面標了 zero data retention，請求不會被留著訓練。

超額時的錯誤訊息不會告訴你還剩多少，要去 dashboard 的 Workers AI 頁面看 Neuron 用量曲線。我的習慣是把它當「每天一小時的免費算力」：早上開 opencode 丟一件中等大小的任務，跑完就收工，不會把額度浪費在無聊的問答上。

順帶一提，後來把本地 GLM 接上 Ghidra 做逆向工程那篇（[glm-ghidra-llm-reverse](/blog/glm-ghidra-llm-reverse/)）用的也是 opencode 當 agent 殼，這個工具換 provider 就能換腦，接 CF 或本地 vLLM 都是一份 config 的事。

## 2026-11 update：免費的好日子結束了

寫這篇擴寫時回頭查官方文件，狀況變了不少：

- 模型頁面現在標著 **Paid access required**——`glm-5.2` 和 `glm-5.3`、`glm-5.3-flash` 這批 Z.ai 模型（加上 kimi-k2 系列、deepseek v4 系列同列此待遇）已不能單靠 Workers Free 的每日 Neurons 跑，要升級 Workers Paid 或是用預儲的 AI Gateway credits。
- 更妙的是它同時掛了 **Planned deprecation：2026-11-20**。也就是說從「免費可用」到「要付錢而且快下架」，前後不到半年。CF 目錄上接棒的會是 glm-5.3 系列。
- 定價也改成了單位計價：$1.40/M input tokens、$4.40/M output tokens、cached input $0.26/M；後端計費單位仍是 Neurons（$0.011 / 1,000 Neurons）。
- 想繼續在 Workers AI 白嫖的話，目錄裡 llama、Qwen、GPT-OSS 這批開源模型仍在每天 10,000 Neurons 的免費額度內，當輕量備援還是可以。

歷史教訓：免費額度上的 frontier 級模型，使用期限要以週或月為單位來看待，架構上把 provider 做成可替換的（像 opencode 這種一份 config 換腦的設計）才是應對之道。

## 延伸閱讀

- [Cloudflare Workers AI — glm-5.2 模型頁](https://developers.cloudflare.com/workers-ai/models/glm-5.2/)
- [Cloudflare Workers AI — 定價與免費額度](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [OpenCode — Providers 文件](https://opencode.ai/docs/providers/)
- 站內：[在 2× DGX Spark 上部署 GLM-5.3-Flash-EXL3](/blog/exl3-glm-local-deploy/)、[把本地 GLM 接上 Ghidra 做逆向工程](/blog/glm-ghidra-llm-reverse/)、[oh-my-opencode 一個月心得](/blog/oh-my-opencode-one-month/)
