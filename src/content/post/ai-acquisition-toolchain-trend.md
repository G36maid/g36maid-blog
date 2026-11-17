---
title: "我們都有光明的未來：從 Anthropic 買 Bun 到 OpenAI 買 Astral"
description: "Anthropic 收購 Bun、OpenAI 收購 Astral——查證這兩筆 AI 巨頭吞併開源工具鏈的交易，拆解動機差異，以及「我們都有光明的未來」這句玩笑背後的生態焦慮。"
pubDate: 2026-03-20 04:15:21 +0800
category: ai
tags: [anthropic, openai, bun, astral, uv, open-source, ai-coding]
draft: false
source: facebook
sourceType: "貼文"
sourceTimestamp: 1773951321
---

> 本文擴寫自 2026-03-20 的 Facebook 貼文。原文只有三行：「anthropic 收購 bun / OpenAI 收購Astral / 我們都有光明的未來」。當時是在 OpenAI 宣布收購 Astral 的隔天凌晨寫下的，現在回頭補上查證與後續發展。

2026 年 3 月 19 日，OpenAI 宣布要收購 Astral——就是做出 uv、Ruff、ty 那家 Python 工具公司。隔天凌晨我發了那則三行的 Facebook 貼文。兩個月前，2025 年 12 月 2 日，Anthropic 才剛買下 Bun，那是他們創立以來的第一次收購。兩家 AI 巨頭，前後三個多月，各吞下了一個開源開發工具團隊，而這兩個工具恰好都是我天天在用的東西。Bun 是 Claude Code 的執行環境，uv 是我 Python 環境的事實標準。看到這種新聞的第一反應不是「恭喜」，是「我們的工具鏈正在被 AI 公司整包搬走」。

先把查證結果講清楚，因為兩件事的真偽在社群上都被懷疑過。Anthropic 收購 Bun 是真的：官方公告、Bun 創辦人 Jarred Sumner 的部落格、Reuters 報導都在 2025 年 12 月初對上，金額未公開（Bun 之前只拿過 2022 年一輪 700 萬美元種子輪）。OpenAI 收購 Astral 也是真的：OpenAI 官方公告和 Astral 執行長 Charlie Marsh 的聲明都發於 2026 年 3 月 19 日，同樣未公開金額，交割需主管機關核准。原稿發文時，網路上確實有人以為這是梗圖或假消息——一個賣模型的公司買 JavaScript runtime、另一個買 Python 套件管理器，聽起來就像 AI 圈的黑色笑話。但它不是笑話。

拆開看動機，兩筆收購的邏輯其實不太一樣。Anthropic 買 Bun 是純粹的依賴管理：Claude Code 以 Bun 單一執行檔的形式出貨給幾百萬人，用 Sumner 自己的話說，「如果 Bun 壞了，Claude Code 就壞了」。一個年營收剛衝上 10 億美元 run-rate 的產品，核心運行環境握在一家只有七人規模、幾乎沒有收入的新創手上，這在財務上是無法接受的風險。所以他們不是買產品，是買保險——把整條關鍵路徑的維護責任收回自己家。OpenAI 那邊則更接近「買生態位」：Codex 要做的是橫跨整個開發生命週期的 agent，而 uv、Ruff、ty 正好卡在 Python 工作流的每個入口——裝依賴、linter、型別檢查。把 Astral 收進 Codex 團隊，等於讓自己的 agent 直接長在開發者的工具鏈裡，而不是隔著一層 API 叫工具。

值得注意的是兩邊都承諾工具維持開源：Bun 繼續 MIT 授權、同一批人在 GitHub 上公開開發；Astral 也保證 uv、Ruff、ty 收購後持續開源。我對這種承諾的態度是「先相信，但記在帳上」——歷史上開源專案被收購後變調的例子不缺，而 AI 公司買基礎工具的動機從來不是為了開源理想。不過至少到 2026 年 11 月為止，帳面上還沒有變調的跡象：Bun 持續發版，Astral 團隊已併入 Codex 團隊約一個月，Charlie Marsh 在 Talk Python 受訪時說他們在 OpenAI 裡出的開源可能比在 Astral 時還多。這當然是收購後的標準話術，但也不全是話術——養一個廣被依賴的開源工具對買方有直接商業利益，信任本身就是產品。

比較讓我在意的是另一件事：這兩筆收購把「AI 巨頭吃基礎工具鏈」從焦慮變成了既成事實。開發者工具公司一輩子的天花板就是被大公司併購或慢慢凋零，Astral 2022 年創立、2024 年拿 400 萬美元種子輪，三年內把工具做到每月上億次下載，最後的出路還是被收購——差別只在於買家從雲端大廠換成了 AI 公司。對寫工具的人來說，這是個不太舒服的訊號：你的工具越好用、越接近開發工作流的中心，就越早被 AI 公司盯上。而對用工具的人（包括我），問題變成：當我的 linter、我的套件管理器、我的 runtime 都屬於 AI 模型公司時，這些工具的最佳化方向還會以開發者為中心嗎？Anthropic 把 Bun 的 roadmap 對齊 Claude Code 的需求、Sumner 說 Bun repo 裡合併 PR 最多的帳號已經是 Claude Code bot——工具為 AI 而非為人最佳化，這件事已經在發生，只是目前兩者利益恰好重疊。

所以回到原稿那句「我們都有光明的未來」。這句話當時就是反著說的：AI 公司真的把開發工作流的關鍵位置一個個買下來了，開發者能做的只剩下相信他們的開源承諾。八個月過去，承諾還沒跳票，工具也還沒變難用，但版圖已經確定換人坐——我的 shell 歷史裡 uv 和 bun 的呼叫次數沒有變少，只是每次按下 enter 的時候，這些指令背後的公司名稱都變了。

延伸閱讀：我之前寫過 [uv 的原始碼導讀](/blog/uv-internals-case-study/)，看過 uv 內部實作的人應該更能體會這種工具被收購時的複雜心情；另外關於 LLM 這個詞怎麼被 GPT 綁架的語感問題，也寫在[這篇](/blog/gpt-is-not-a-generic-term-for-llms/)。

References:
- Anthropic 官方公告（Anthropic acquires Bun as Claude Code reaches $1B milestone, 2025-12）: https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone
- Bun 官方聲明（Bun is joining Anthropic, Jarred Sumner, 2025-12-02）: https://bun.com/blog/bun-joins-anthropic
- Reuters 報導 Anthropic 收購 Bun（2025-12-02）: https://www.reuters.com/business/media-telecom/anthropic-acquires-developer-tool-startup-bun-scale-ai-coding-2025-12-02
- SiliconANGLE：Bun 融資歷史與收購背景（2025-12-02）: https://siliconangle.com/2025/12/02/anthropic-makes-first-acquisition-purchase-bun-accelerate-claude-code
- OpenAI 官方公告（OpenAI to acquire Astral, 2026-03-19）: https://openai.com/index/openai-to-acquire-astral/
- Astral 官方聲明（Astral to join OpenAI, Charlie Marsh, 2026-03）: https://astral.sh/blog/openai
- Ars Technica 報導 OpenAI 收購 Astral（2026-03）: https://arstechnica.com/ai/2026/03/openai-is-acquiring-open-source-python-tool-maker-astral/
- Simon Willison 對 OpenAI 收購 Astral 的評論（2026-03-19）: https://simonwillison.net/2026/Mar/19/openai-acquiring-astral/
- Talk Python To Me #552（Astral joins OpenAI，收購後團隊訪談）: https://talkpython.fm/episodes/show/552/astral-joins-openai
- heise online：Bun 收購案與開源承諾（2025-12-04）: https://www.heise.de/en/news/Open-source-toolkit-AI-company-Anthropic-acquires-Bun-11102416.html
