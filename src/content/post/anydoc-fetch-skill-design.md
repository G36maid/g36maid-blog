---
title: "寫了一個 skill 處理隨時都要 fetch 文件這件事"
description: "把「抓文件餵 agent」做成一個 skill：痛點、skill 與 MCP server 的取捨、SKILL.md 的觸發描述與快取設計、human-in-the-loop 確認點，以及十個月後換上 anydoc 的回顧。"
pubDate: 2026-01-27 08:55:28 +0800
category: ai
tags: ["agent-skills", "ai-coding", "documentation", "human-in-the-loop", "anydoc", "mcp"]
draft: false
source: "facebook"
sourceType: "分享的貼文"
sourceTimestamp: 1769475328
---

> 本文擴寫自 2026-01-27 的 FB 分享貼文，原文只有一句話：「寫了一個 skills 處理隨時都要 fetch 文件這件事 / 以及 human-in-the-loop」。擴寫時間 2026-11，以下以當時的設計脈絡展開，文末補一段現況。

## 文件是 agent coding 的隱形成本

每天寫 code 都會撞到同一件事：agent 要處理某個函式庫的 API，但模型訓練資料裡的版本早就舊了。直接叫它寫，寫出來是上個大版本的呼叫方式；叫它自己上網查，它會挑第一個搜尋結果，然後把 SEO 農場的內容當真理——hallucination 常常就是這樣混進來的。最土的解法是我自己開瀏覽器、把文件複製貼進對話，但每次都貼，token 成本累積起來很可觀，而且貼的當下根本不知道這份文件對不對版本。

這些問題疊起來，結論很自然：把「fetch 文件」這件事本身，變成 agent 的一個 skill。

## 為什麼用 skill，不用 MCP server

我考慮過三條路。手動貼文件最直覺，問題是重複勞動，而且靠人肉記版本遲早出錯。MCP server 是比較正規的做法——我也寫過 [MCP 的 code execution 模式](/blog/mcp-code-execution-mode/)——但文件抓取的需求太發散：今天要 React 的文件、明天要 PostgreSQL 的語法、後天要一份 PDF 規格。為了這種多變的需求寫一個固定 API 的常駐 server，每次對話都付出 tool schema 的 context 成本，換來的彈性卻有限。

Skill 走的是 Anthropic 講的 progressive disclosure：平時只有 name 和 description 佔 context，agent 判斷需要時才把整份 SKILL.md 讀進來。文件取得是偶發需求，按需載入的模型剛好對上。skill 又是純文字檔，改流程就是改 markdown，部署成本趨近於零。

## SKILL.md 的實際設計

設計上我抓三個重點。

第一是觸發描述。description 決定 agent 什麼時候想起這個 skill，寫太窄該觸發時不觸發，寫太寬每次都跳出來。我的寫法是把觸發場景直接列舉：「需要查函式庫/API/規格文件時」「不確定某函式的正確簽名時」。

第二是 fetch 步驟固定化。先查快取，快取沒有才抓官方源，抓完寫回快取。快取目錄用「來源 + 版本號」當檔名，旁邊記抓取日期，超過一定天數就標成 stale 要求重抓。版本號寫進檔名最重要——文件最大的坑就是版本錯置，這樣設計讓快取本身就是版本安全的。

第三是 human-in-the-loop。三種情況停下來問人：來源不可信（搜尋結果、非官方 domain、內容跟已知行為矛盾）；要把抓到的文件寫入 repo（vendored docs 牽涉授權和 repo 衛生）；內容超過 token 預算（大文件先摘錄章節，確認要哪部分再載入）。

下面是這個 skill 的示意重構版（非當時原文，憑設計思路重寫）：

```markdown
---
name: fetch-docs
description: Fetch library/API/spec documentation on demand. Use when a task
  needs current docs for a library, when unsure about a function signature,
  or when generated code must match a specific library version.
---

# Fetch docs

1. Cache first: check `.agent-docs-cache/<source>-<version>.md`.
   If present and younger than 30 days, use it.
2. Cache miss: fetch from the official docs domain only. Record the
   version number and fetch date in the cache file header.
3. Before relying on fetched content, verify the version matches the
   project's lockfile / package manifest.

## Stop and ask the human when
- the source is not the official domain (search results, mirrors, blogs)
- the fetched document would be written into the repository
- the document exceeds the token budget (extract only the needed section)
```

## 一個月後回頭看

用了約一個月，幾個觀察。description 是成敗關鍵——我改過兩次觸發條件，第一次寫得太窄，agent 明明該查文件卻自己硬編；放寬之後觸發率正常，但也偶爾在不需要的時候觸發，權衡點大概就在這裡。快取的投資報酬率最高，同一份文件一週內被讀了七八次，每次都省下抓取和重新確認版本的功夫。human-in-the-loop 三條規則剛好夠用，一個月內真正停下來問我的次數不多，但每一次都該問：兩次是來源可疑，一次是我叫它把規格書 commit 進 repo。這種確認點的價值在頻率低、後果重的場合，跟我之前整理 agent 安全工作流的經驗一致。

把成功流程沉澱成 skill 檔這件事本身也一直在做——跟[演化 system prompt](/blog/system-prompt-evolution/)、[蒸餾模型偏好](/blog/gemini-preference-distillation/)是同一條路線：觀察 agent 的實際行為，把對的部分固化成文字檔，錯的部分寫成規則擋掉。

## 2026-11 update

十個月過去，生態變化不小。文件轉 markdown 已經有專門工具：Firecrawl 在 2026-08 開源了 [anydoc](https://github.com/firecrawl/anydoc)（Rust、MIT），把 Word、PowerPoint、Excel、OpenDocument、RTF、EPUB、CSV、PDF 轉成 GitHub-Flavored Markdown，官方直接附一份 agent skill（`npx skills add firecrawl/anydoc`），CLI 用 `npx @firecrawl/anydoc <file>` 就能跑。我現在把 fetch-docs skill 的轉換層換成 anydoc——轉換品質和速度都比土法好——skill 裡保留的只有流程：快取策略、版本確認，還有那三個問人的時機。工具會被取代，確認點的設計不會。

