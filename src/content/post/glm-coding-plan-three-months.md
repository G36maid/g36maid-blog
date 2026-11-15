---
title: "九美元用了三個月的 GLM coding plan：從等不及買 pro 到每天都很爽"
description: "27 美三個月漲到 80 美一個月的心痛、Copilot Student 互斥只能用 GLM-5 代替 OPUS、lite 下放後每天重度使用、GLM-5.1 的 vector-db bench 截圖，與長上下文六七成後劣化的實測因應。"
pubDate: 2026-03-13 04:57:43 +0800
category: ai
tags: ["glm", "ai", "coding-plan", "opencode", "llm", "tool-review"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1773349063
---

看到 z.ai 終於把 GLM-5 下放給 lite 用戶的那一刻，我心裡只有一句話：這三個月每天開機都在用的 coding plan，才花我九美元，真的太爽了。不過這個爽，是用心痛換來的。把二月到三月的時間線攤開來記一下，順便當作一份使用心得。

## 價格：27 美變 80 美的那個瞬間

2026 年 2 月 12 日 GLM-5 發布當天，我已經等不及了，當下決定買 z.ai coding plan 的 pro。那時 pro 三個月 27 美元，覺得還行。沒過多久再看，同樣的方案變成一個月 80 美元。有點後悔當時買的三個月不是 lite 而是 pro 了，現在買真的頗貴。我個人的用量，lite 等級其實就夠。現在的官方定價頁上，Lite 是每月 18 美元（年繳折合每月 12.6 美元），Pro 是每月 80 美元，配額改以 credits 計算、每五小時一個窗口。早買早享受，晚買哭著漲價，這次真的發生在我身上。

## Copilot Student 互斥，只能用 GLM-5 代替 OPUS

我是學生身分，GitHub 那邊用的是 Copilot Student。問題來了：Copilot Student 跟 Copilot Pro 互斥，就算有錢也不能升級，帳單頁永遠只顯示你符合免費的學生方案，想付錢都不讓你付。難受。GitHub Docs 的授權說明也寫著學生是免費取得付費等級功能、無法另外升級，Reddit 上同樣卡住的討論串一查一大串。想用最強模型的時候手上沒有選項，這也是我跳去買 GLM coding plan 的原因之一——Claude Opus 的帳單我不敢開，Copilot 的升級之路被學生資格堵死，GLM-5 就變成我替代 OPUS 的日常主力。

## GLM-5 下放 lite：九美元的每一天

三月中，我之前買的 plan 終於把 GLM-5 下放給 lite 用戶。不過我才九美元（三個月），這三個月每天都用，真的太爽了。實際工作流是 opencode 接上 z.ai 的 API：寫扣、改扣、開 subagent 掃整個 repo，lite 的配額幾乎沒摸到天花板。opencode 本身的配置心得我另外寫過一篇[一個月的 oh-my-opencode 使用記錄](/blog/oh-my-opencode-one-month/)，這邊不重複。

## GLM-5.1 上線：好爽（ ・∀・）

三月底 GLM-5.1 開放，我也是用上了，好爽（ ・∀・）。手上剛好留著一張當時的截圖，是 kcores 的 vector database benchmark 榜單：GLM-5.1 在 recall ≥ 95% 的條件下跑出 3,989 QPS 排第一，後面是 Claude Opus 4.6 的 3,548 和 GPT-5.4 Pro 的 3,091：

![kcores vector-db-bench 排行榜：GLM-5.1 以 3,989 QPS 排在第一，領先 Claude Opus 4.6 與 GPT-5.4 Pro](/media/2026-03/122155018028958395.jpg)

用上 GLM-5.1 那天的心情，大概就是下面這樣：

![用上 GLM-5.1 那天的心情（ ・∀・）](/media/2026-03/122154744572958395.jpg)

完蛋，如果看我的個版真的會覺得我是 GLM 吹。但我真的蠻喜歡 GLM-5.1，近期會多用看看。順帶一提，那段時間 GLM-OCR 也剛發布，看 benchmark 強度看起來很不錯：只有 0.9B 參數量，在 OmniDocBench V1.5 拿到 94.62 分、當時排第一，有時間找機會試試看。

原稿附的 bench 連結是 [vector-db-bench.kcores.com](https://vector-db-bench.kcores.com/zh/)，這篇發稿前查過，頁面還在、GLM-5.1 那筆 3,989 的紀錄也還看得到，只是該站的 TLS 憑證有問題，curl 要忽略憑證驗證才連得上，瀏覽器可能會直接擋；哪天整個頁面消失也不意外，先截圖存證。

## 長上下文的坑：六七成之後開始漂

一直使用後發現，5.1 在長上下文的情況效果變差很多。我的實測感受是 session 的 context 用到六、七成之後，模型開始忘記前面講好的約定、重提已經否決過的方案，輸出整個往下掉。因應方式很樸素：建議多用 subagent 把調查類的工作外包出去，主 session 保持乾淨；或是壓縮之後開新 session，讓模型帶著摘要重來。這個體驗也推著我後來去玩本地部署——把 GLM-5.3-Flash 用 EXL3 量化跑在兩台 DGX Spark 上（[部署記錄](/blog/exl3-glm-local-deploy/)、[兩個月後的進步調查](/blog/miaai-exl3-progress/)），甚至接上 Ghidra 玩逆向工程（[GLM-5.3-Flash 接 Ghidra](/blog/glm-ghidra-llm-reverse/)），那就是另外幾篇的故事了。

## 堪用模型清單

二月初我就把 GLM、Kimi、MiniMax 都列入堪用模型。中國系模型這波給的壓力是真的：價格只有閉源巨頭的零頭，coding 場景的能力堪用到可以當主力。z.ai 這邊想花錢隨時可以加購，不會遇到 Copilot 那種有錢不能升級的互斥問題，光是這點就舒服很多。

## 評價

便宜、配額大、coding 能力對得起價格，九美元的 lite 能天天重度使用本身就是最好的證明；模型迭代快，GLM-5 到 5.1 的間隔用週計算。要挑毛病也有：長上下文後段劣化明顯，session 衛生得自己顧，subagent 和壓縮不是選配而是必需品；方案價格說漲就漲，27 美三個月到 80 美一個月，老用戶沒有任何緩衝。但這三個月的體感只有一句話能形容：太爽了。

## 2026-11 update

寫這篇時是三月，之後的事快速補一下。GLM-5.2 在 2026-06-16 發布，主打 1M token 的長上下文與 long-horizon 任務，coding plan 用戶直接可用；2026-08-14 GLM-5.3 上線（release notes 標 08-18），官方宣稱 coding 能力比 5.2 提升 50%，開源權重在安全評估後釋出，三天後 GLM-5.3-Flash（320B 總參數、18B 激活、原生視覺）也跟著放出來，coding plan 的配額全面換成 points 制。我現在已經活在 GLM-5.3 的時代，日常改用純 opencode 加上 z.ai 的 glm-5.3-flash；本地那台雙 DGX Spark 跑的也是同一顆模型的 EXL3 量化版。從二月等不及買 pro 到現在，這套東西從「堪用模型」一路變成我的主力。九美元的爽，之後每一代都還在延續。
