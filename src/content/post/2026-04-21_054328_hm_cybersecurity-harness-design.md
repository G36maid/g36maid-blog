---
title: "Cybersecurity Harness Design Based on OpenCode"
description: "隨著人工智慧在軟體工程與網路安全領域的應用產生典範轉移，代理架構（Agentic Architecture）的設計逐漸取代了傳統的單一模型對話模式。"
pubDate: 2026-04-21 05:43:28 +0800
tags: ["模型", "opencode", "程式", "agent", "claude", "github", "ai", "漏洞", "ctf", "llm"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1776721408
category: ai
---

[TOC]

隨著人工智慧在軟體工程與網路安全領域的應用產生典範轉移，代理架構（Agentic Architecture）的設計逐漸取代了傳統的單一模型對話模式。
本報告旨在探討如何基於 OpenCode 及其擴充生態系 Oh-My-OpenCode，打造一套具備高度擴充性、無供應商綁定（No Vendor Lock-in）且適合網路安全攻防與自動化漏洞挖掘的 Harness 與 Agents 系統。

## OpenCode

https://opencode.ai/

OpenCode 是一款以 TypeScript 為主要語言編寫的終端原生開源 AI 編程代理。其核心設計哲學在於讓開發者員無需離開其熟悉的命令列環境，即可透過文字介面調用強大的語言模型進行程式碼重構、錯誤修復與系統分析。

相較於高度封閉且緊密綁定特定生態系的工具（如 Claude Code），OpenCode 最引以為傲的核心精神在於「拒絕供應商綁定」，使用者能自由對接超過 75 種以上的 LLM，甚至包含本地部署的模型。

## Oh-My-OpenCode

https://github.com/code-yeongyu/oh-my-openagent

Oh-My-OpenCode（現亦稱 Oh-My-OpenAgent，簡稱 omo）是一個將 OpenCode 從單一助理轉化為多代理協作工程系統的強大框架。它引入了非同步背景代理執行、嚴格的生命週期掛鉤（Hooks）與先進的編輯工具。

### Sisyphus's Teammates (Curated Agents)

系統圍繞著主編排者 Sisyphus 建立了一支虛擬開發團隊，每位成員都有特定專長與適配的模型：

- Oracle: 專責系統架構設計與深層除錯（預設配置為 GPT-5.2 Medium 或同級高階推理模型）。
- Frontend UI/UX Engineer: 負責前端視覺與使用者體驗開發（預設配置為 Gemini 3 Pro 或視覺優化模型）。
- Librarian: 專注於官方文件檢索、開源實作尋找與龐大程式碼庫的脈絡探索（建議配置為 Claude Sonnet 4.5/4.6 等級模型）。
- Explore: 具備極速的程式碼庫全域搜尋能力，運用 Contextual Grep 等技術快速定位標的。

### 核心功能與工具支援 (Features)

Oh-My-OpenCode 內建了多項提升代理工程品質的殺手級功能：

- Full LSP / AstGrep Support: 整合語言伺服器協定與語法樹感知，讓代理能果斷且精準地執行大規模重構與語法分析。
- Todo Continuation Enforcer: 這是一套混合中斷偵測機制，強制代理在任務中途退出或遭遇錯誤時必須接續執行。正是這個機制讓 Sisyphus 能像神話中推石頭般，不屈不撓地推進任務直到完成。
- Comment Checker: 嚴格防止 AI 在程式碼中添加過度囉嗦或不必要的註解，確保由 Sisyphus 生成的程式碼在風格上與人類頂尖工程師的產出無異。
- Claude Code Compatibility: 具備與 Claude Code 完整的相容層，支援 Command、Agent、Skill、MCP 以及 Hook 系統（包含 PreToolUse、PostToolUse、UserPromptSubmit、Stop 等生命週期事件）。
- Curated MCPs: 內建精選的模型上下文協定伺服器，包含 Exa（網頁搜尋）、Context7（官方技術文件）以及 Grep.app（GitHub 全域程式碼搜尋）。
- Interactive Terminal Supported: 深度整合 Tmux，代理能直接與互動式終端介面（如 Vim、Htop 或 Metasploit）互動，保持背景工作階段不中斷。
- Async Agents: 允許像真實工程團隊一樣，平行啟動多個子代理在背景執行耗時的探索或編譯任務。

Quick Overview:

- Agents: Sisyphus (the main agent), Prometheus (planner), Oracle (architecture/debugging), Librarian (docs/code search), Explore (fast codebase grep), Multimodal Looker
- Background Agents: Run multiple agents in parallel like a real dev team
- LSP & AST Tools: Refactoring, rename, diagnostics, AST-aware code search
- Context Injection: Auto-inject AGENTS.md, README.md, conditional rules
- Claude Code Compatibility: Full hook system, commands, skills, agents, MCPs
- Built-in MCPs: websearch (Exa), context7 (docs), grep_app (GitHub search)
- Session Tools: List, read, search, and analyze session history
- Productivity Features: Ralph Loop, Todo Enforcer, Comment Checker, Think Mode, and more

## Agent

在 AI 架構中，Agent（代理）並非單指大型語言模型本身，而是「模型」加上「工具」與「長期/短期記憶」的綜合實體。OpenCode 預設提供單一的對話式 Agent 來處理日常編程任務，但面對複雜的資安專案時，單一代理往往會面臨上下文溢出或推理能力不足的問題。

### Multi-Agent & Subagent 架構

為何要基於 Oh-My-OpenCode 開發 Cybersecurity Harness？
原因在於其成熟的非同步子代理（Async Subagents）委派架構與角色分工。

Oh-My-OpenCode 的主代理 (Main Agents):

- Sisyphus (Ultraworker): 團隊的核心編排者，負責理解意圖、分發工作並驗證最終結果。
- Hephaestus (Deep Agent): 負責深度的自主研究與程式碼執行。
- Prometheus (Plan Agent): 專責任務規劃，會在動手修改程式碼前以「面試模式」向使用者釐清邊界與模糊地帶。
- Atlas (Plan Executor): 嚴格執行 Prometheus 所擬定的 Todo 待辦事項。

專門化子代理 (Subagents):

- Librarian / Explore / Oracle / Multimodal-looker / Metis / Momus：各自負責文件檢索、快速搜尋、除錯顧問、視覺工程與決策輔助等專業領域。
- Sisyphus-Junior: 用於處理被委派的子任務，框架會根據任務的複雜度與性質將其進一步劃分為多個類別（Categories）。

Sisyphus-Junior 任務類別 (Categories):

系統會將子任務自動路由至最適合的模型，類別包含：
- visual-engineering / ultrabrain / deep / artistry / quick / unspecified-low / unspecified-high / writing

例如，單一檔案的拼字修正會被分發至 `quick` 類別交由輕量級模型處理，而深層的漏洞利用腳本撰寫則會被路由至 `deep`。

### Models

[Artificial-analysis-intelligence-index](https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index)

2026 年的模型生態已發生劇烈變化。雖然 Anthropic 的 Claude Opus 系列（如 Opus 4.6/4.7）與 Google 的 Gemini 系列仍具備頂尖實力，但其嚴重的供應商綁定（Vendor-lockin）與過度的安全護欄（Safety Refusals）常導致模型在資安攻防中「降智」且服務不穩定。

與此同時，開源與開放權重模型強勢崛起。2026 年的基準測試（Benchmark）顯示，GLM-5、Kimi K2.5/K2.6 與 MiniMax M2.5/M2.7 已展現出極高的實用性。

GLM-5.1: 作為一款千億參數的混合專家模型（MoE），其在 BenchLM 基準測試中獲得了 84 分，其實力已極度逼近獲得 86 分的 Claude Sonnet 4.6，特別是在複雯推理（Reasoning）與超長上下文（203K）處理上表現卓越。

每個模型的專長配置: Oh-My-OpenCode 允許根據使用者持有的 Model Provider 提供完整的配置。例如，利用 Claude 進行高階架構規劃，利用 GLM-5 執行複雜的逆向工程與漏洞利用，並利用 MiniMax M2.7 處理 `quick` 類別的常規腳本修改，將成本與效益最佳化。

參考我的[ oh-my-openagent.json 配置](https://gist.github.com/G36maid/070db9005971a5e0a3a56c201c91458a)。

現在的模型供應商來源
* Claude Pro/Max subscription
* OpenAI/ChatGPT Plus subscription
* Google Gemini
* GitHub Copilot subscription
* OpenCode Zen
* Z.ai Coding Plan
* Kimi For Coding subscription
* OpenCode Go subscription
* Vercel AI Gateway API key
* Openrouter API key

系統會在 oh-my-opencode install 時自動配置合適的模型以及 fallback model
當然自行去 `~./config/opebcode/oh-my-openagent.json` 修改及配置模型

## Harness

Harness 是代理與作業系統/目標環境互動的集合。在 OpenCode 中，Harness 包含了精密的工具鏈與提示工程設計。

### Prompt 提示工程

AGENTS.md：將 AGENTS.md 視為代理的 README：一個專門且可預期的位置，用以提供上下文與操作指示，幫助 AI 程式碼代理在您的專案中正確運作。

意圖檢測 (IntentGate): 代理在採取任何動作前，強制注入提示詞，分為探索、規劃、決策、執行與驗證五種分類。

Compact 與 Context 管理: 何時使用 `/compact` 壓縮上下文是代理穩定運作的關鍵。當對話輪次過多導致記憶衰退時，應觸發 compact 清理無效歷史。

分支技巧: 觀察 LLM 的 "think"（推理思維）過程，若發現思路偏移，應果斷 fork 該分支後重新給予精確的 prompt。

Git 當作聖旨: 由於 LLM 內建的 revert 或字串替換工具在處理大檔案時並不穩定，最佳實踐是將 Git 作為狀態管理的聖旨，透過 `git reset` 或建立分支來進行穩定的狀態回退。

### Tools

代理的操作基礎依賴以下工具：

- Read — 精確讀取檔案內容與行號（支援範圍讀取與行號標註）。
- Write — 建立或覆寫檔案（支援原子寫入與檔案權限保留）。
- Edit — 採用 Hashline Edit 修改，避免「過期行錯誤」（stale-line errors），並支援區塊替換與 diff。
- Bash — 提供受控的 Shell 執行環境（支援命令沙箱、超時與輸出限制）。
- grep — 基於 ripgrep 的正規表示式檔案內容搜尋，支援語言特定高亮、上下文行數與遞迴搜尋 。
- glob — 使用 glob 模式（如 `//*.js` 或 `src//*.ts`）搜尋檔案，回傳按修改時間排序的匹配路徑 。

### MCP

MCP（Model Context Protocol）是標準化 LLM 與外部資料源／工具通訊的輕量協定。它定義了檢索、摘要、分段上下文注入與工具呼叫的行為，讓 Harness 與 Agents 能在不同資料源間一致、安全且可追蹤地取得上下文。

實用 MCP：
- Context-7：官方技術文件檢索器，支援版本感知與全文索引，適合注入 API/SDK 文件或技術手冊的上下文段落。
- Grep-app：程式碼庫搜尋服務（整合 GitHub/Grep.app），回傳參考用程式片段 。
- Exa-websearch：網頁搜尋，支援摘錄、來源鏈結與時間範圍過濾，適合作為外部情資補強。
- Markitdown：文件格式轉換與清洗器，將 HTML、PDF 等格式轉換為標準 Markdown 並保留元資料（標題、程式碼區塊、來源）。

資訊安全相關 MCP：
- ghidra-mcp：整合 Ghidra 反編譯器，回傳函式反匯編、資料流與呼叫圖（call graph）、符號表與分析註記，便於逆向工程與靜態分析。
- ida-pro-mcp：整合 IDA Pro / Hex-Rays（需授權），提供高精度的型別還原與反編譯結果，比較適合複雜二進位分析場景。
- revula-mcp：整合動態分析工具（GDB、LLDB、Frida），支援執行時快照、記憶體與寄存器讀寫、hook 腳本上傳與回傳執行痕跡。


### Skills 技能模組化

技能（Skills）是將領域知識、系統指令與工具權限綁定在一起的模組化設定檔（如 SKILL.md）。
在資安領域，可以撰寫特定的 Skill 
例如專門解特定題目如 reverse / pwn / web ，或是提示使用特定的 MCP。

日前建立了 [ctf-arsenal](https://github.com/G36maid/ctf-arsenal) 的專案，將在此專題進一步完善。

## Cybersecurity

基於上述強大的 Harness 與 Agent 架構，得以建構高度自動化的網路安全測試系統。

### Harness Design 實戰：金盾獎 CSC2025

在 2025 年的金盾獎（CSC2025）競賽中，實作了名為 [ctf-arsenal](https://github.com/G36maid/ctf-arsenal) 的專案，將此架構推向實戰。透過設計專屬的 Cybersecurity Skill 與 MCP 伺服器，單人使用者成功編排了四個平行的 Agent 同時進行解題，最終成功解開四題，並在 "llm-this" (PastedLM this) 題目中奪得大會首殺（First Blood）。

OPUS Plan + GLM Execute 策略: 為了突破雲端模型高昂的成本與嚴苛的安全護欄，採用了混合模型策略。由推理能力頂尖的 Claude OPUS 擔任 Prometheus 角色進行戰術規劃（Plan），隨後將具體且具備攻擊性的執行腳本撰寫（Execute）交由開源的 GLM4.7 模型負責。此一架構大幅降低了實際使用的 API 費用。

未來發展: 本專案將持續基於 Oh-My-OpenAgent，開發一系列針對漏洞挖掘、權限提升的 Agent 協作模組。

### Benchmark 測試基準

目前針對資安代理的測試標準正快速演進：

- Cybench: 專注於專業級 CTF 挑戰。在 2026 年的最新數據中，如 Claude Mythos Preview 等頂尖模型在多次嘗試下已能達成 100% 的解題成功率（Pass@1），展示了模型在解謎與漏洞利用上的極限。
- CVE-Bench v2.1.0: 將評估焦點轉向真實世界高嚴重性 CVE（如遠端程式碼執行 RCE）。該基準摒棄了簡單的檔案上傳測試，要求代理在 13,000 行的真實應用程式碼中，自主執行 nmap 掃描、nuclei 驗證與 metasploit 利用。最新的多代理架構在此基準中已能達成高達 92.5% 的攻擊成功率。

透過整合 Oh-My-OpenAgent 的多代理編排、LSP 工具鏈，已經證明了開源驅動的 Cybersecurity Harness 在自動化漏洞挖掘與 CTF 競賽中具備實戰價值。

### The Mythos Situation | TheStandup

{%youtube 6szQxMGX5JI %} 
https://youtu.be/6szQxMGX5JI?si=WevXjdloF-lad97X

## 相關連結
[簡報連結](https://drive.google.com/drive/folders/1DAqLNk_oo2NyfggDiHNCQN7ZwLjvkoqu?usp=drive_link)
generated by notebookLM
