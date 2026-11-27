---
title: "59.8 MB 的 cli.js.map：Claude Code 原始碼是怎麼從 npm 洩出去的"
description: "Anthropic 把 59.8 MB 的 source map 一起發上 npm，Claude Code 約 51 萬行未混淆 TypeScript 因此曝光。一次 packaging 失誤的時間線、source map 格式解釋，以及從供應鏈安全角度的三層後續。"
pubDate: 2026-03-31T20:24:43+08:00
category: security
tags: [claude, npm, sourcemap, supply-chain, reverse-engineering, anthropic]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1774959883
media:
  - 122155224284958395.jpg
---

![Chaofan Shou（@Fried_rice）發現 Claude Code 的 source map 洩漏，截圖自其 X 貼文，附解包 cli.js.map 後的原始碼目錄列表](/media/2026-03/122155224284958395.jpg)

> 本文擴寫自 2026-03-31 的 Facebook 貼文（原稿是一句「Claude-code的原始碼透過 npm洩漏了」加一個 repo 連結，配上面這張推文截圖）。擴寫於 2026-11-27，事實部分依當時的報導與 registry metadata 查核，多為二手資料，寫錯歡迎指正。

Claude Code 的原始碼，是靠一個不該存在的檔案、躺在一個本來就公開的地方洩出去的。2026-03-31 凌晨，資安研究員 Chaofan Shou（[@Fried_rice](https://x.com/Fried_rice/status/2038894956459290963)）發現 `@anthropic-ai/claude-code` 的 v2.1.88 帶了一個 59.8 MB 的 `cli.js.map`，然後在 X 上寫了那句後來被轉到 21M+ views（CNBC 統計；The Hacker News 後續追到 28.8M）的話：**"Claude code source code has been leaked via a map file in their npm registry!"** 幾小時內，整個 codebase 被搬上 GitHub，原 repo 當天就破 41,500 forks，部分鏡像累積到 84k stars。Anthropic 在數小時內把套件下架，並對外說明：這是 human error 造成的 packaging 問題，沒有客戶資料或憑證外洩。

## 為什麼一個 .map 等於整包原始碼

Source map 是給 devtool 對照壓縮後的 production 碼用的 JSON，關鍵欄位有三個：`sources`（原始檔路徑）、`mappings`（壓縮碼位置到原始碼位置的映射）、還有最致命的 `sourcesContent`——bundler 預設把每個原始檔的完整內容**當字串直接塞進這個陣列**。也就是說，`sourcesContent` 存在的 `.map` 跟整包原始碼在資訊量上是等價的，反解只要跑個 script。

Claude Code 用 Bun 當 runtime，而 Bun 的 bundler 預設產生 source map。加上套件的 `package.json` 沒有 `files` 白名單、也沒有在 `.npmignore` 排除 `*.map`，這個 59.8 MB 的檔案就這樣跟著 `npm publish` 上去了。報導還指出另一條路徑：map 檔裡的參照指向 Anthropic 自己 Cloudflare R2 bucket 上一個未加驗證就能下載的 ZIP——同一棵原始碼樹放在兩個公開的地方。

防這件事的成本低得誇張：`package.json` 寫 `files` 白名單、production build 關掉 source map、發佈前跑一次 `npm pack --dry-run` 檢查 tarball 內容，任何一項都能擋下。它失守的原因就是 CI 裡少了「看一眼要發佈什麼」這一步。

## 從 reverse 的角度看這批原始碼

我做 reverse 的工作，看這件事的視角不太一樣。平常逆向一個閉源工具，要先脫殼、還原 symbol、猜資料結構，五百行程式猜半天；這次是約 1,900 個 TypeScript 檔、51 萬行**未混淆**的原始碼直接躺在 registry 裡，難度驟降到「打開來讀」。

讀起來的收穫也實在：完整的 agent harness 首次攤在陽光下——約 40 個內建工具各自有 permission gate、約 46,000 行的 query engine 處理 API 呼叫、串流、快取與編排、React + Ink 做的 terminal UI、用 JWT 認證的 IDE bridge、多 agent 協作與常駐記憶體系統。社群本來就在逆 Claude Code（[ccleaks.com](https://www.ccleaks.com/) 整個網站都在收這些），所以嚴格說這不是「從零解密」，更像一次版本齊全的考古材料補完。這種規模的閱讀，用 LLM 輔助歸納架構正是好場景——我之前把[本地部署的 GLM 接上 Ghidra 做半自動逆向](/blog/glm-ghidra-llm-reverse/)，那套是對 binary；對這種拿得到乾淨原始碼的 case，連反編譯那步都省了，模型直接讀 `entrypoints/`、`QueryEngine.ts`、`tool_hooks/` 這些目錄就能給你架構圖。

順帶一提，這類新聞底下永遠有人喊「所以是 GPT 流出了嗎」，語言模型的通稱問題我之前[吐槽過一次](/blog/gpt-is-not-a-generic-term-for-llms/)，這裡就不重複了。

## 供應鏈角度：一次洩漏的三層後續

npm 供應鏈攻擊本來就是我在資安工作裡熟悉的題材，這次事件的三層後續值得分開記：

1. **同日的 Axios 事件**：就在洩漏發現的同一天，廣泛使用的 npm 套件 Axios 被注入遠端存取木馬（影響 1.14.1 與 0.30.4 兩個版本）。VentureBeat 報導，3 月 31 日 00:21–03:29 UTC 之間透過 npm 安裝或更新 Claude Code 的人，可能拉到被污染的相依套件。Anthropic 之後把 native installer 列為建議安裝方式，整個繞開 npm 依賴鏈。
2. **「洩漏」變成釣餌**：Zscaler ThreatLabz 觀察到假冒「Claude Code leaked source」的 repo，releases 區掛一個 7z，解開是 Rust dropper，落地 Vidar（資訊竊取）加 GhostSocks（流量代理）。想圍觀洩漏碼的人反而中鏢——熱度起來之後，事件關鍵字本身就是攻擊面。
3. **收不回來**：Anthropic 對部分鏡像發了 DMCA，但數百個 repo 已經散開。原稿引的那個 [instructkr/claude-code](https://github.com/instructkr/claude-code) 連結，上傳者後來因為怕吃法律責任，把 repo 換成 Claude Code 的 Python 功能移植版——但 forks 與鏡像都還在。洩漏一旦發生，撤下原始碼在實務上就是不可能的任務。

## 檢討：發佈即公開

這件事沒有攻擊者，只有一個漏掉的 packaging 規則，所以它特別適合當教材。npm tarball 的內容就是公開資產，`npm publish` 那一刻等於把裡面所有東西交給全世界。Anthropic 的開發負責人 Boris Cherny 曾說過他對 Claude Code 的貢獻「100% 由 Claude Code 自己寫成」（此轉述出自一篇討論 AI 生成碼安全閘門的 [arXiv 預印本](https://arxiv.org/pdf/2604.01052v1)，我沒有回查原始訪談）——這次漏掉的是 bundler 預設值跟發佈白名單的組合，AI 生成的設定檔能編過、能發佈，除非有人明確要求排除 `.map`，它不會自己想到要排。不過我不想把鍋扣給 AI：`files` 白名單本來就該是人手寫、人 review 的那一行，哪來的生成方式都一樣。

> 2026-11 update：事件後半年的發展大致照劇本走——鏡像散佈、DMCA 只收掉少數、Zscaler 觀察到的釣餌 campaign 變成常態性的關鍵字搶註。Anthropic 的 native installer 建議沿用至今；npm 版套件仍在，但已非官方推薦路徑。

## References

- [Chaofan Shou（@Fried_rice）的原始推文，2026-03-31](https://x.com/Fried_rice/status/2038894956459290963)
- [Anthropic accidentally exposes Claude Code source code — The Register, 2026-03-31](https://www.theregister.com/2026/03/31/anthropic_claude_code_source_code/)（含 Anthropic 官方聲明、41.5k forks 數字、instructkr repo 改 Python port 的後續）
- [Claude Code's Entire Source Code Was Just Leaked — Gabriel Anhaia, DEV Community](https://dev.to/gabrielanhaia/claude-codes-entire-source-code-was-just-leaked-via-npm-source-maps-heres-whats-inside-cjo)（1,900 檔 / 51 萬行的原始碼分析）
- [Anthropic Claude Code Leak — Zscaler ThreatLabz](https://www.zscaler.com/blogs/security-research/anthropic-claude-code-leak)（假冒洩漏 repo 投遞 Vidar + GhostSocks 的 campaign、DMCA 與鏡像數字）
- [Inside Claude Code's leaked source — The New Stack](https://thenewstack.io/claude-code-source-leak/)（44 個未公開 feature flags、同日 Axios 供應鏈攻擊）
- [Anthropic Accidentally Exposes Claude Code Source via npm Source Map File — InfoQ, 2026-04](https://www.infoq.com/news/2026/04/claude-code-source-leak/)（Bun 預設產 sourcemap、防治建議）
- [Kuberwastaken/claude-code — 洩漏原始碼的架構 breakdown repo](https://github.com/Kuberwastaken/claude-code)
- [VibeGuard: A Security Gate Framework for AI-Generated Code — arXiv 預印本](https://arxiv.org/pdf/2604.01052v1)（vibe-coded packaging 論述與 Boris Cherny 引述）
