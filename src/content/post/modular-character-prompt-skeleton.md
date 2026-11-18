---
title: "把角色生成 prompt 當程式碼維護：模組化骨架實戰"
description: "整段 prompt 改一個詞整張圖跑版，於是把角色生成圖拆成固定骨架加可替換模組庫：鎖死畫風與角色核心保一致性，其餘照編號抽換，再以 recipes 打包組合，附骨架節錄。"
pubDate: 2026-01-13 05:12:30 +0800
category: essay
tags: ["ai-art", "prompt-engineering", "image-generation", "workflow", "module-design"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1768252350
---

這篇是 2026 年 11 月擴寫的筆記。原始素材是今年一月我在 HackMD 整理的一份 prompt 骨架筆記（當時的標題叫 Project Nene），內容是一套動漫角色生成圖的模組化 prompt：一個固定的 Master Skeleton，配上每個區塊可以替換的英文片段庫。角色本身已經去識別化成一隻 cyberpunk mermaid；比起清單裡列了什麼，我更想聊「把 prompt 當程式碼維護」這件事的操作心得。

## 痛點：改一個詞，整張圖跑版

最早的 prompt 是一整段：畫風、角色、服裝、場景、構圖全擠在同一大段英文裡，幾百字一口氣餵給模型。這種寫法在微調時特別痛苦——只想換個外套顏色，結果髮型、尾巴材質、光線方向全部跟著變，運氣差的時候連角色都要重抽。圖像模型的注意力是全段的，你動任何一個 token，其他部分的生成條件就跟著漂。一段 prompt 改到第五版，你已經不記得「上一版能看的那張圖」到底是由哪些字支撐的，也回不去。

## 骨架：把不變項鎖死

解法是把 prompt 拆成編號區塊，區塊之間有依賴順序，固定的部分原封不動。Master Skeleton 長這樣（節錄前兩節）：

```markdown
[0. Header: Art Style & Meta]
High-quality, cinematic anime illustration.
Strictly refer to the provided input image for the character's design details.

[1. Character Core (Fixed Identity)]
She is depicted as a cyberpunk mermaid.
Her long ash-green hair floats weightlessly.
On her head, she wears the distinct neon green mechanical
attachments and headset gear.
Her purple eyes have a cool, focused glow.

[2. Upper Body Construction]
[2a. Base Layer] [2b. Cut & Silhouette]
[2c. Outer Layer] [2d. Material Texture]

[3. Details & Gear]  [4. Tail Construction]
[5. Scene Composition]  [6. Narrative Context]
```

[0] 和 [1] 是「永遠不改」的區塊：畫風宣告加上角色核心識別（髮色、瞳色、頭部機械件），這幾行就是角色一致性的錨。生成時這兩段一字不動，只動 [2] 以下。實際操作時我會另外放一張定稿的角色立繪當輸入參考圖，骨架裡那句 "Strictly refer to the provided input image" 就是在指揮模型去看它——這其實是手動補強：Midjourney 的 [Character Reference](https://docs.midjourney.com/docs/character-reference)（Niji 6 上就是 `--cref`，可用 `--cw` 調強度，官方文件也明說精細度有限，臉上的痣或衣服 logo 不保證複製到位）和 Stable Diffusion 陣營的 [IP-Adapter FaceID](https://ipadapterfaceid.com/) 都是同一個問題的官方化解法。但這些功能對「原創角色的細節裝備」照樣抓不太準——cref 官方建議搭配的恰恰是 detailed text prompt。所以骨架 [1] 的文字描述仍然是必要的保險，文字與參考圖要並用。

## 模組庫：分類、命名、可替換

骨架之下是 Module Library：每個編號區塊下面列一排可直接抽換的英文片段。以 [2a. Base Layer] 為例：

```markdown
[2a. Base Layer]
* `She wears a minimalist black bandeau.` (極簡抹胸)
* `She wears a form-fitting black bodysuit.` (標準連身衣)
* `She wears a ribbed tactical tank top.` (戰術背心)
* `She wears a professional diving suit.` (潛水服)
```

每個片段都是完整英文句子，後面括號掛中文註解方便自己掃。分類照骨架編號走，區塊內再用語意 tag 分組（例如 [3b. 武器] 分常規槍械、高科技重型、駭客特殊三組），要找「陰暗緊張感」的燈光時直接翻 [5d] 的對應 tag，不用全文搜尋。片段庫會長大到幾十條，這時版控比想像中重要：某條片段被證實「一用就讓構圖崩」就該刪或註記，而不是靠記憶過濾。至於 NSFW 級的片段，我把它跟一般片段放在同一套編號系統裡、只靠 tag 區分強度——去識別化後的骨架是通用的，換掉 [2a] 以下的內容，同一套結構就能服務任何尺度。

## 組合：fill-in-brackets 工作流

生成一張圖的流程變成：抄 Master Skeleton → 在 [1] 貼定稿角色核心 → 每個編號從模組庫挑一條填進去 → 預覽、只重抽不滿意的那個區塊。後來我又整理了一份續作筆記，把常用組合預先打包成 recipes（例如尾巴區塊的幾種現成配對），要用時整套複製，省掉每次現拼。因為不變項鎖在 [0][1]，改 [5c] 的環境時，角色不會跟著走樣——這是單段 prompt 時代做不到的。

## 這套骨架不只在服務一種圖

雖然原型是尺度開放的角色圖，骨架本身完全通用：把 [1] 換成任何角色的固定描述、[4] 的尾巴換成翅膀或義體，它就是一般的角色立繪與情境圖工作流。之前用 Gemini 玩視覺模擬的經驗、還有把[系統 prompt 當演化對象來養](/blog/system-prompt-evolution/)的經驗其實是同一個直覺——生成式工具的輸出失控時，工程手段（結構化、鎖定、版本化）比反覆手氣不好式重抽有效得多。

回頭看，這套做法最值得保留的是「固定區塊永不動」的紀律；最想改的是模組庫缺半自動驗證——理想上應該跑批次測試記錄每條片段對構圖的影響，而不是靠人腦抽卡歸納。另外 [6. Narrative Context] 在我的筆記裡一直是空的，敘事層怎麼模組化，是下次改版要補的洞。

