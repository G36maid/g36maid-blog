---
title: "Google Antigravity 根本就是 Windsurf：一條價值 24 億美元的 fork chain"
description: "Cascade 殘骸與同一顆 language server binary，回頭看 Windsurf 被拆三份的那一週。"
pubDate: 2025-11-20T14:55:30+08:00
category: essay
tags: ["antigravity", "windsurf", "gemini", "vscode", "ai-ide"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1763621730
---
2025 年 11 月 18 日，Google 趁著 Gemini 3 發表的氣勢，端出了新的 agentic 開發平台 Antigravity：一個 VS Code 風格的 IDE、加上一個叫 Manager 的 agent 儀表板，還有讓 agent 直接操作瀏覽器的 Chrome extension。免費 public preview，Gemini 3 Pro 額度大方，當天社群一片歡呼。我在 FB 上隨手發了一句「Google antigravity 根本就是 windsurf」，當時半開玩笑。幾天後我發現這句玩笑話比想像中更精確——不只是神似，是字面意義上的同一套程式碼。

## Antigravity 看起來確實是 Windsurf

Simon Willison 當天的評語很保守：乍看之下「yet another VS Code fork Cursor clone」，但仔細看比想像中有趣——三個 surface 的設計（Manager 儀表板、傳統編輯器、透過 Chrome extension 深度整合瀏覽器）、自動產生 task list 和 implementation plan 的 artifacts、agent 做完事會交出 walkthrough 報告，這些是 Cursor 沒有的新意。他也順手點出一個細節：官方 14 分鐘的介紹影片主講者 Kevin Hou，先前就在 Windsurf 工作。

真正的證據是社群挖出來的。發表隔天，Kilo 的分析文章直接把 Antigravity 稱為「史上最貴的 PORK（proprietary fork）」：有人在 Antigravity 的程式碼裡找到「Cascade」——Windsurf 自家 agent 引擎的名字——直接留在 Antigravity 裡，連 Windsurf 的功能截圖幾乎原封不動出現在 Antigravity 介面中。Reverse engineering 的結果更硬：Antigravity 和 Windsurf 用的是同一顆 Codeium language server binary，同一套 Connect-RPC protocol（`exa.language_server_pb.LanguageServerService`），port 探測和 CSRF auth 流程幾乎一模一樣，甚至 `GetUserStatus` 回應裡還留著 Windsurf 按月計費的 credit 欄位——Antigravity 的額度其實改用 per-model fraction，這些舊欄位根本沒在用，只是忘記清掉。連 Codium 官方 marketplace 的 Windsurf Pyright 也曾在 Antigravity 的 Python 生態系裡出現過。

所以血統是三層的：VS Code（微軟開源）→ Codeium fork 出 Windsurf → Google 再 fork 出 Antigravity。每一層都拿前層的成果往上疊。

## 這個 fork 從哪來：Windsurf 的三分事件

要看懂這條線，得回頭看 2025 年 7 月那場混亂。

Windsurf（前身 Codeium）在 4 月與 OpenAI 進入 exclusivity，談一筆約 30 億美元的收購。7 月 11 日 Bloomberg 證實交易破局——報導指向微軟因素：OpenAI 與微軟的協議會讓微軟取得 Windsurf IP，這是 OpenAI 不想見到的。同一天，Google 宣布以約 24 億美元聘用 Windsurf 執行長 Varun Mohan、共同創辦人 Douglas Chen 及部分 R&D 團隊進 DeepMind，並取得 Windsurf 技術的非專屬授權——不持股、不收購，避免反壟斷審查。三天後的 7 月 14 日，Devin 母公司 Cognition 買下 Windsurf 剩餘的 IP、產品、商標和員工，條件未公開。Khosla Ventures 的 Vinod Khosla 當時公開批評這種創辦人帶人走的模式是「founders leaving their teams behind」。Venkatesh Rao 後來把這個結構稱作「foie gras capitalism」——矽谷不收購了，改抽鵝肝。

24 億美元裡有多少是買授權、多少是補償金，Google 從未拆分。但從半年後的證據回頭看，這筆授權費顯然買到了實打實的東西：Antigravity 的底層就是 Windsurf 的程式碼。

## 從 Windsurf 之亂到 Antigravity：Google 的另一次經典操作

這條時間線很有意思，值得攤開來看：

- **2025 年 2–4 月**：OpenAI 對 Windsurf 展開約 30 億美元的收購談判，4 月進入 exclusivity
- **2025 年 7 月 11 日**：OpenAI 交易破局（微軟 IP 權衝突）；Google 同日宣布 24 億美元 license + 人才方案，Varun Mohan 進 DeepMind 做 agentic coding
- **2025 年 7 月 14 日**：Cognition 買下 Windsurf 剩餘部分
- **2025 年 11 月 18 日**：Antigravity 隨 Gemini 3 發表，公開 preview
- **2026 年 5 月 19 日**：Google I/O 發表 Antigravity 2.0，Varun Mohan 親自站台，身份已是 DeepMind 軟體工程總監

半年時間，Google 拿著授權來的程式碼做出產品，還讓原執行長親自發表它。Windsurf 員工的處境對比更刺眼：跟著 Mohan 走的人進了 DeepMind，留下來的人歸 Cognition，公司的價值被拆成兩半賣掉。這種結構——不收購、只買授權與人才、避開審查——跟 Character.AI、Adept、Inflection 如出一轍，Khosla 的批評正說明了這在當時已經引起反彈。我把這條時間線的結構記下來，是因為它的下一步還沒走完。

## 從我的角度：Zed 陣營的旁觀者清

我是 Zed 用戶，主力 coding agent 是 opencode，對 VS Code fork 大戰本來就保持距離旁觀。Antigravity 1.0 時期我在意的是兩件事：一，VS Code fork 的宿命是連 extension marketplace 都要自己養（Windsurf 用 Open VSX 生態系，Antigravity 連 Windsurf Pyright 都搬來用，可見 fork chain 帶來的整包包袱）；二，Hacker News 首日就有人吐槽字體、圖示、面板尺寸參差不齊，Google 沒有 Cursor 那種打磨 VS Code fork 的耐心。這些問題是 fork chain 的共同成本：每往下一層 fork，上游改版就多一層 rebase 債。

這半年 Antigravity 更新很快：2.0 改成獨立桌面應用，CLI 和 SDK 也補上了，11 月還在推 Orchestrator、遠端 agents 和內建瀏覽器的 agent 操作。我的主力工具鏈（Zed + opencode）不走 fork 路線，Antigravity 對我不是日常工具，但我持續觀察它的成長。它最大的隱患在 Google 的產品治理文化：額度政策一年改了好幾次，Pro 訂閱額度曾被砍 70–90%，有 paying user 被鎖帳號六天，Third-party OAuth 存取也被條款禁止。Google Reader 與 Inbox 的前車之鑑就在眼前——當年那種「免費大方、突然關閉」的劇本，如今換了一套技術棧重新上演的可能，值得記在心裡。

## 2026-11 update

一年過去，玩笑話成了定論。Antigravity 2.0 已在 2026 年 5 月 Google I/O 發表，從 IDE 轉型為獨立 agent 桌面應用，補上 CLI 與 SDK；Varun Mohan 以 DeepMind 軟體工程總監身份持續領導，11 月還在發表 Orchestrator、遠端 agents 和內建瀏覽器 agent 操作。平台本身持續營運、功能快速迭代，這點無庸置疑。

但評價就分歧多了。額度是最大的雷：額度以文字描述而不給數字，2026 年內多次調整，3 月的調整讓 Pro 額度實質縮水 70–90%，付費訂戶碰上動輒數天甚至六天的鎖帳號，Google 自己的論壇抱怨不斷；條款還明文禁止透過第三方工具存取，2 月曾無預警停權包含 Ultra 訂戶在內的帳號——Varun Mohan 稱之為「malicious usage」。5 月 2.0 改版把 IDE 換成單一對話框，Ultra 訂戶抱怨得先完整清除重裝才拿得回 IDE，Hacker News 上「bait and switch」的抱怨拿到 771 分。社群評價大致是：跑 Gemini 便宜又快，但額度預測性輸給 Cursor 和 Claude Code。

回頭看，「根本就是 Windsurf」在發表當天是個俏皮話，一年後變成一個事實陳述：Antigravity 的 engine、protocol、甚至額度欄位的殘骸都來自 Windsurf。這條 VS Code → Windsurf → Antigravity 的 fork chain，每一層都在別人的基礎上蓋樓，也各自背著上層的債。對開源治理有興趣的我，看完這條鏈只想說：開源基座（VS Code）讓 fork 任意疊層，proprietary 基座（Windsurf）的 fork 則要用 24 億美元去買授權。底層授權條款決定了上層的遊戲規則，這大概是我從整件事學到最扎實的一課。
