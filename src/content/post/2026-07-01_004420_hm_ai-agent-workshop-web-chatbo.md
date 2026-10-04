---
title: "AI Agent Workshop — 從 web chatbot 到 agentic workflow"
description: "這整張講稿是我當天開著念、也給台下看的同一份。"
pubDate: 2026-07-01 00:44:20 +0800
tags: ["agent", "模型", "ai", "opencode", "llm", "claude", "github", "gemini", "prompt", "glm"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1782837860
category: ai
---

---

## 議程（at a glance）

> 這整張講稿是我當天開著念、也給台下看的同一份。

### 上半場（早上）：pure opencode

| 段落 | 時間估計 | 對應 insight |
|---|---|---|
| Block 1：自我介紹 | 10-15 min | INSIGHT-9|
| Block 2：AI / Agent 到底是什麼 + Mini Agent 現場實作 + 實驗 | 60-90 min | INSIGHT-1, 2, 3 |
| Block 3：環境配置 + First run | 30-40 min | INSIGHT-3, 8 |
| Block A：MCP 是什麼、直接配起來、兩種不同的設計思路 | 40-60 min | INSIGHT-5 |
| Block B：SKILL 是什麼 + 手搓一個 | 20-30 min | — |
| **Block C：多模型編排 + live config show-and-tell** | **40-50 min** | **INSIGHT-4** |
| **Block D：自建 context 語料庫 + AGENTS.md 深講** | **30-40 min** | **INSIGHT-7, 8** |

### 下半場（下午）：subagent + omo（條件性）

> 若上午 opencode 講不完 → 下午順延。上午優先級 > 下午。

| 段落 | 時間估計 | 對應 insight |
|---|---|---|
| 下午 Block 1：subagent 概念 + 配置 + context 節省 demo | 30-40 min | INSIGHT-3, 4 |
| 下午 Block 2：omo（若時間允許） | 20-30 min | INSIGHT-3 延伸 |

### 研究工具段（教授要求：不只開發還有研究）

| 段落 | 時間估計 | 對應 insight |
|---|---|---|
| 研究工具 1：web chatbot deep-research | 15-20 min | INSIGHT-6 |
| 研究工具 2：alphaXiv + autoresearch | 20-25 min | INSIGHT-3, 6 |

### 收尾

| 段落 | 時間估計 | 對應 insight |
|---|---|---|
| INSIGHT-9 + INSIGHT-10 | 20 min | 9, 10 |

> 講者備註：上述時間僅供參考

---

## 這個 Workshop 不是什麼 / 是什麼

**不是**：單純的工具教學（那是搬運工才做的事）、不是教你怎麼操作 Cursor，更不是教你「養龍蝦」。

**是**：一次**心智模型遷移**。很多人只把 ChatGPT 當作解答機——複製答案後貼上到 IDE。但我想帶大家看到的是：LLM 本質上是一個 I/O 黑盒子，而 Agent 就是圍繞著它運作的一個 loop。你完全可以控制餵進去的 input，我們要思考的是如何真正善用這些工具，來完成人類需要的任務，進而大幅加速我們的開發與研究。

**定位**：今天我會分享自己的心路歷程，把英文圈的精華 insight 消化後直接講給你聽，幫你省下去爬原文的時間。此外，我也會隨性聊聊一些我自己想分享的觀察。

---

# 上半場（早上）：pure opencode

整個早上，我們都會在 **OpenCode**（一款開源的 Coding Agent）裡面跑。這也是我平常開發的 Daily Driver（主力工具）。
你可以把它想像成是開源版的 Claude Code。

🔗 [OpenCode 首頁](https://opencode.ai/)

### 什麼是 OpenCode？

OpenCode 是一個開源的 AI Agent，能協助你在終端機 (Terminal)、IDE 或是桌面應用程式中編寫程式碼。

**核心特色：**
*   **支援 LSP**：能為 LLM 自動載入合適的 LSP (Language Server Protocol)。
*   **多工作階段 (Multi-session)**：允許在同一個專案中，平行啟動多個 Agent 處理不同任務。
*   **分享連結**：能將任意工作階段生成連結，分享給其他人參考或協助 Debug。
*   **整合 GitHub Copilot**：可透過 GitHub 登入，直接連接並使用你的 Copilot 帳號。
*   **整合 ChatGPT Plus/Pro**：可透過 OpenAI 登入，直接使用你的 ChatGPT Plus/Pro 帳號。
*   **支援任意模型**：透過 Models.dev 介接超過 75 家 LLM 供應商，也支援串接 Local（本地端）模型。
*   **支援任意環境**：提供終端機介面、桌面版 App，以及 IDE 擴充套件等多種使用形式。

📚 官方文件：[OpenCode Docs](https://opencode.ai/docs/)

---

## Block 1：自我介紹（10-15 min）

### 關於我 (Who am I)

🔗 GitHub: [G36maid](https://github.com/G36maid)

我熱衷於系統工程與資安領域的研發，並活躍於開源社群。我是 **Zed** (Rust-based Editor) 的 Contributor，同時也是 Zed Guild Bug Bashers 的成員，曾為 Zed 與 OpenCode 貢獻過程式碼。

*   **開源里程碑**：我開發的 [`zed-mcp-server-markitdown`](https://zed.dev/extensions?filter=context-servers) 在 Zed 擴充商店已累積近 3 萬次下載。
*   **技術守備範圍**：日常使用 Arch Linux、熱愛 Rust、有在打 CTF，也是個 Homelab 玩家。
*   **我的 AI 哲學**：我看待 AI 的方式，就和我看待 OS Kernel 的方式一樣。

let's all love lain." 
Arch user, 
homelab host, 
Rust enthusiast. 
CS / ME @NTNU  
- building systems, breaking illusions

[G36maid's GitHub](https://github.com/G36maid)

### 🍟 開胃菜

> 「你們有人把 ChatGPT / Claude / Gemini 的訂閱，接進去其他工具的 Plugin 使用過嗎？」

你們有想過，要如何用**最少、最低的成本**打完一場 CTF 嗎？
或者是，嘗試將一整個學期的魔王課程，甚至是公司累積的 Jira Tickets，**全部外包給 AI 處理，而且還能做得盡善盡美？**

如果你覺得這還不夠瘋狂，那有沒有試過：
*   **【架構理解】**：面對一個萬行起跳的未知開源專案，在己分鐘內讓 Agent 幫你摸透底層邏輯，並直接畫出系統架構圖？
*   **【基礎設施】**：丟一張隨手說的架構草圖，讓 AI 直接幫你寫完所有 Docker Compose 或 Kubernetes 的設定檔，一鍵部署到你的 Homelab？
*   **【資安與逆向】**：打 CTF 時，把一顆完全看不懂的 Binary 丟進去，讓 Agent 幫你做逆向分析，甚至連 Pwntools 的 Exploit Script 都順手幫你寫好？
*   **【程式碼重構】**：面對一坨公司的祖傳 Legacy Code，讓 Agent 像外科醫生一樣，精準地把這坨義大利麵重構成安全的程式碼？

這就是我們今天要聊的：**當你把 LLM 裝上「手腳」變成 Agent 後，它能做到的極限在哪裡。**


---

## Block 2：AI / Agent 到底是什麼（60-90 min）

這段是整個上午的知識核心。接下來的三個 Insight，將是完成「心智模型遷移」的階梯：**一旦你看穿 Agent 根本不是魔法，就會發現 OpenCode 說穿了，就只是一個「刻得很好的 Loop」而已。**

---

### INSIGHT-1：LLM 本質上就是個 I/O 黑盒子

不管外面包裝成 Chatbot、Agent，**LLM 說到底就是一台根據 Input 吐出 Output 的機器**。這跟最陽春的 Web Chatbot **在最底層沒有任何本質上的差別**。

**要改善 Output 的品質，你手上只有兩根槓桿**：
1. **改善 Input（也就是 Context，上下文）** ← 這是今天 80% 的重點。
2. **換一個更強的模型**。

市面上其餘所有花俏的名詞與技術（例如 Prompt、RAG、MCP、Skills、LOOP、HOOK⋯⋯），**全部都只是用來「改善 Input/O」的不同實作方式而已**。

**這個觀念能幫我們打破什麼迷思？**
*   **「AI 是魔法」** → 根本沒有魔法，純粹就是 I/O。
*   **「Vibe Coding」**（無腦按 Enter，不去塑造 Input） → 這等於是把產出的品質，完全交給模型當下的隨機性來決定，但我們可以改善他。
*   **「換個工具就會變強」** → 很多時候，新工具只是換了一種「包裝 Context 的方法」而已。

**💻 Live Demo**：
等等我會現場展示：同一個模型，在不同 Input 下，Output 會如何天差地別（我從早期的 Zed Text-thread 時代，就是靠這招來徹底搞懂 Context 運作原理的）。

---

### INSIGHT-2：把 LLM 當作系統來 Debug

LLM 雖然是個黑盒子，但不代表我們不能研究它——**工程師面對任何未知的黑盒子，用的其實都是同一套經驗與方法**。把 LLM 當作系統來 Debug，而不是把它當成「神諭」來求神問卜。

**四個 Debug 手法**（其實都是你日常開發早就在用的技巧）：

| LLM 操作手法 | 對應的工程概念 | 在 LLM 上的實質意義 |
| :--- | :--- | :--- |
| **重新 Roll 一次 (Re-generate)** | 重新跑一次測試 | 探索 Output 的機率分佈——這個答案是真正穩健，還是剛好運氣好？ |
| **修改 Input + Re-roll** | 調整參數後重跑 | 呼應 INSIGHT-1 的主迴圈：不斷迭代並塑造更好的 Context。 |
| **Fork 對話 / 雙 Thread A/B 測試** | 進行受控實驗 | 每次只變動一個維度並比較 Output，藉此釐清究竟是哪個 Input 因子發揮了作用。 |
| **偷看 Thinking Process (思考過程)** | 查閱 Stack Trace | 稍微打開黑盒子，檢查它的推理鏈 (Reasoning Chain) 在哪一步走偏了。 |

**實驗**：
用同一道題目，讓大家一起 Re-roll，親眼見證結果的差異。模型單次給出的 Output，永遠只是機率分佈裡的「其中一個樣本」，有時候多抽幾次，才能找到我們真正需要的答案。

---

### INSIGHT-3：Agent 說穿了就是一個 Loop

> 💡 **觀念出處**：這段源自 Adam 在 ThePrimeagen Standup Podcast [[04:32](https://youtu.be/VsTbgYawoVc?t=272)] 中的定義：「Agent = LLM + Tools + Loops」。這也是我建構這個心智模型的起點。

所謂的「AI Agent」根本不是什麼神祕的新科技，**它本質上就是一個迴圈 (Loop)**：

1. 給 LLM 一組 System Prompt 與工具定義（如 Read / Write / Edit / Bash 等）。
2. LLM 根據 Input 吐出 Output。
3. 若 Output 符合呼叫工具的格式 → 執行該工具，並將執行結果回灌到 Context 中。
4. 將更新後的 Context 再次送給 LLM。
5. 不斷重複，直到 LLM 判斷任務完成並自己決定停止。

**所謂的「Agentic 魔法」，說穿了就只是這五行 `while loop`。**

* **「Agent 是某種新型態的 AI」** → 錯，Agent = LLM + While Loop + Tools，核心依舊是那個 I/O 黑盒子。
* **「Agent 具備自主思考能力」** → 它並沒有真的在「想」，每一次的迴圈依然是死板的「給 Input、吐 Output」。
* **「各家 Agent 框架都很神祕高深」** → 無論是 Claude Code、Cursor Agent、Gemini CLI、Zed Agent、OpenCode 還是 Cline⋯⋯**底層全都是這個 Loop 的不同實作而已**。

---

### 🛠️ Mini Agent 現場實作（Block 2 重頭戲）

我現在直接從零刻一個 Mini Agent 給你看。核心結構大概長這樣：

```python
import os
import subprocess

SYSTEM = "You are a coding agent. Use your tools to explore and modify the codebase. Be concise."

def tool(name, desc, props, req=None):
    return {"type": "function", "function": {"name": name, "description": desc,
            "parameters": {"type": "object", "properties": props, "required": req or list(props)}}}

TOOLS = [
    tool("read_file", "Read a file's contents", {"path": {"type": "string"}}),
    tool("list_files", "List directory contents", {"path": {"type": "string", "default": "."}}),
    tool("write_file", "Create or overwrite a file (creates parent dirs)",
         {"path": {"type": "string"}, "content": {"type": "string"}}),
    tool("bash", "Run a shell command and return output", {"command": {"type": "string"}}),
]


def run_tool(name, args):
    try:
        if name == "read_file":
            return open(args["path"]).read()
        if name == "list_files":
            return "\n".join(sorted(os.listdir(args.get("path", "."))))
        if name == "write_file":
            os.makedirs(os.path.dirname(args["path"]) or ".", exist_ok=True)
            open(args["path"], "w").write(args["content"])
            return f"Wrote {args['path']}"
        if name == "bash":
            r = subprocess.run(args["command"], shell=True, capture_output=True, text=True, timeout=30)
            return (r.stdout + r.stderr).strip() or "(no output)"
    except Exception as e:
        return f"Error: {e}"
```

[How does Claude Code *actually* work? Theo - t3․gg ](https://youtu.be/I82j7AzMU80?si=EOQSyBSvxYYPgzIc)
[how-to-build-an-agent AMP](https://ampcode.com/notes/how-to-build-an-agent)
[How to Code Claude Code in 200 Lines of Code](https://www.mihaileric.com/The-Emperor-Has-No-Clothes/)

**這段 pesudo Code，同時展示了我們今天談到的多個 Insight**：

* **INSIGHT-1**：Loop 裡的 `llm_call` 依然是那個單純的 I/O 黑盒子。
* **INSIGHT-3**：Agent 的核心 Loop 結構。
* **INSIGHT-4 (預告)**：`config["model"]` 是可以切換的——暗示同一個 Loop，裝上不同的 Model 就等於換了個大腦（這會在主場 Block C 深入探討）。
* **INSIGHT-8 (預告)**：`AGENTS.md` 在系統中的定位就是 System Prompt。
* **INSIGHT-5 (預告)**：`read/write/edit/bash` 是基本工具，而 MCP 將是未來擴充工具的來源。

---

### 🧪 Mini Agent 實驗段落（互動）

寫完 Agent 不是重點，接下來我們直接把這支 Mini Agent 當作實驗台：

| 實驗目標 | 測試做法 | 我們會看見什麼？ |
| --- | --- | --- |
| **AGENTS.md 的威力** | 同一個任務，先在「沒有」AGENTS.md 的情況下跑一次，加上後再跑一次。 | Agent 的行為天差地別——當場驗證**寫不寫 AGENTS.md，表現真的差很多**。 |
| **各家 Model 大亂鬥** | 同一個 Agent + 同一份 AGENTS.md，抽換成不同的 LLM 去跑同一個任務。 | 同一個 Loop，換不同模型 → 品質、風格、能力落差一目了然，同時也為 Block C 的「多模型編排」埋下伏筆。 |

**為什麼要做這組實驗？**
因為這完美示範了「同一個 Agent、只改變一個維度、比較 Output 差異」的過程。這正是我們在 INSIGHT-2 提到的實驗手法，讓你在實作中直接內化這個 Debug 心法。


## Block 3：環境配置（30-40 min）

接下來的環節，我們要把環境架起來，確保大家都能在自己的電腦上實際跑動 Agent。

### 1. 安裝 OpenCode

```bash
# YOLO
curl -fsSL https://opencode.ai/install | bash

# Package managers
npm i -g opencode-ai@latest        # or bun/pnpm/yarn
scoop install opencode             # Windows
choco install opencode             # Windows
brew install anomalyco/tap/opencode # macOS and Linux (recommended, always up to date)
brew install opencode              # macOS and Linux (official brew formula, updated less)
sudo pacman -S opencode            # Arch Linux (Stable)
paru -S opencode-bin               # Arch Linux (Latest from AUR)
mise use -g opencode               # Any OS
nix run nixpkgs#opencode           # or github:anomalyco/opencode for latest dev branch
```

---

### 2. 訂閱 OpenCode Go（首月 $5，夠跑一整天）

**為什麼推薦用 OpenCode Go 方案？**
因為門檻低、直接打包 14 款強大的開源模型、給的額度用來打滿一整天的 Workshop 綽綽有餘。

**📊 方案細節：**

| 項目 | 內容說明 |
| --- | --- |
| **月費** | **首月 $5 USD**（之後 $10/月） |
| **5 小時上限** | 等同 $12 USD 的用量（對單一 Session 來說非常夠用） |
| **每週上限** | 等同 $30 USD 的用量 |
| **每月上限** | 等同 $60 USD 的用量 |
| **伺服器節點** | 美國 (US) / 歐洲 (EU) / 新加坡 (Singapore) |
| **隱私政策** | **Zero Data Retention（零資料留存）** |
| **取消與加值** | 可隨時取消；若額度打乾了也可以隨時手動加值 |

---

### 3. 運作方式與連線流程

OpenCode Go 的運作邏輯，就跟你在 OpenCode 裡串接任何其他 LLM 供應商一樣簡單：

1. **取得金鑰**：登入 OpenCode Zen 平台，訂閱 Go 方案，然後複製你的 API Key。
2. **終端機連線**：在你的 TUI (終端機介面) 中輸入 `/connect` 指令。
3. **貼上金鑰**：選擇 `OpenCode Go`，接著貼上剛剛複製的 API Key。
4. **確認模型**：在 TUI 中輸入 `/models`，就能看到所有透過 Go 方案解鎖的模型清單。

**Go 方案收錄的 14 款模型陣容：**

* GLM-5.1 / GLM-5.2
* Kimi K2.6 / Kimi K2.7 Code
* MiMo-V2.5 / MiMo-V2.5-Pro
* MiniMax M2.7 / MiniMax M3
* Qwen3.6 Plus / Qwen3.7 Plus / Qwen3.7 Max
* DeepSeek V4 Flash / DeepSeek V4 Pro


### 基本指令

| 指令 | 作用 | 為什麼需要 |
|---|---|---|
| `/init` | 初始化 session / 專案設定 | 進任何 repo 第一步——呼應 INSIGHT-8（AGENTS.md）|
| `/compact` | 壓縮對話 context | 對話太長時搶救——context 是有限資源 |
| `/session` | session 管理（list / resume / **fork**）| 呼應 INSIGHT-2 的 fork A/B |
| `/models` | 切換模型 | mini agent 的 model-swap 實驗，現在換你操作 |
| 其他 slash commands | 直接在 opencode 裡面看 | 自己去玩～|


### First run

給一個簡單任務，看 loop 跑——你剛學 agent = loop，現在親眼看見 loop。

### GLM 軌跡 hook

> 為什麼這個 workshop 選擇跑在 GLM 上？大約在 2026 年 1 月，我看到 Eno Reyes（Factory）在 X 上發文提到：「Opus plan + GLM-4.7 execute = same performance as Opus, fraction of tokens」——這正是我接觸開源 GLM 的起點。從 GLM-4.7、5.1 到現在的 5.2，我一路見證了它的發展軌跡。如今的 GLM-5.2 不僅已經達到 Opus 級別的水準，更是目前**最強的開源模型**。
>
> 至於為什麼堅持使用「開源最強」，而不是追求「絕對最強」？因為我曾經有過帳號被 ban 的慘痛教訓。關於這段完整的故事，我們留到主場的 Block C 再聊。

---

## Block A：MCP 到底是什麼（以 OpenCode 為例）— 40-60 min

### 🌉 從 Mini Agent 到 MCP 的橋樑

回想一下我們剛剛寫的 Mini Agent，裡面只有 `read / write / edit / bash` 這四個**Hardcode（寫死）**進去的基礎工具。

但在 OpenCode 裡，工具清單是**動態的**。**MCP 的強大之處在於：你只需要修改 Config 就能輕鬆擴充工具，完全不需要動到 Agent 的底層程式碼。**

---

### 🔌 MCP 的本質

**MCP（Model Context Protocol）說穿了，就是一個「通訊協定」**。
它的作用，是把 Local 端或 Remote 端的 RPC 服務，包裝成「Tool（工具）」加上「Tool Description（工具描述）」，然後掛載到 Agent 的可用清單底下。對 Agent 來說，呼叫這些外部擴充工具，就跟呼叫內建的 `bash` 一樣自然。

> 💡 **常常有人說：「MCP 就是 AI 模型的 USB 介面」**
> 這裡面沒有任何魔法。它純粹就是賦予 Agent 更多外掛能力。

---

### 🚀 現場實戰：直接 Configure 起來用！

講再多不如直接動手。現在我們直接在 OpenCode 的 Config 裡新增 MCP Server，大家可以親眼看看 Agent 是如何自動辨識、決定並呼叫這些新工具的。

**🛠️ 準備掛載的 MCP 工具陣容：**
*   **Context 7**：即時更新的函式庫資訊
*   **Exa Web Search**：網路搜尋與檢索能力
*   **Grep_app**：大規模程式碼搜尋
*   **MarkItDown**：將"任何"文件轉為 Markdown
*   **DeepWiki**：提供最新且可互動的文檔

**🔥 加碼展示 (Extra)：**
如果時間允許，我們再來掛載更硬核的工具：
*   **Ghidra**：讓 Agent 直接幫你做 Binary 逆向工程！
*   **Playwright**：賦予 Agent 操控瀏覽器、執行自動化測試的能力。

### INSIGHT-5：MCP 絕對不是越多越好 —— MCP 的兩種設計哲學

配置完 MCP 工具後，我要立刻戳破一個常見的迷思：「工具越多，Agent 就越強」。
錯了，**MCP 絕對不是越多越好**。這不是憑空猜測，而是來自多方實測與論文數據的血淋淋教訓：

| 觀測指標 | 驚人數據 / 發現 | 資料來源 |
| :--- | :--- | :--- |
| **Tool-selection 準確率** | **從 43%（4 個工具）暴跌至 2%（51 個工具）**——在同模型、同任務下，僅改變工具數量。 | [GPT-4o 控制實驗](https://alatirok.com/how-many-tools-can-an-ai-agent-have/) |
| **Speakeasy Benchmark** | 10 個工具時拿滿分 → 107 個工具時任務完全失敗。 | [基準測試](https://stackmcp.dev/blog/too-many-mcp-servers) |
| **Anthropic 官方警示** | Claude 在塞入 30-50 個工具後能力明顯衰退 → 逼得他們必須開發 Tool Search 來補救。 | [Anthropic 工程指引](https://www.anthropic.com/engineering/writing-tools-for-agents) |
| **血淋淋的真實案例** | 掛載 4 個 Server / 167 個工具 = 任務還沒開始，**光是讀工具描述就吃掉 60K Tokens**。 | [社群實測](https://stackmcp.dev/blog/too-many-mcp-servers) |
| **平台硬性上限** | Cursor 限制 40 個工具、Copilot 限制 128 個、Zed 甚至為此設計了 Profiles 切換功能。 | [各大 IDE 限制](https://github.com/microsoft/vscode/issues/282699) |
| **業界高姿態退場** | Perplexity CTO 甚至在 2026 年 3 月公開表示棄用 MCP。 | [業界動態](https://albato.com/blog/publications/embedded-mcp-context-bloat-hallucinations) |

---

既然工具不能無腦塞，那我們該怎麼設計？**MCP 工具的設計其實分為兩種模式**：

| 設計模式 | 工具數量 | 代表範例 | 軟體工程類比 |
| :--- | :--- | :--- | :--- |
| **A. 少量深實作 (Fat Tool)** | 1~3 個 | Context7、 MarkItDown | 「公開少量 API，內部深度實作」——**把複雜度在工具內部消化掉**。 |
| **B. 多量薄實作 (Thin Tool)** | 數十個 | GitHub MCP、Postgres MCP | 「提供大量 API，內部極薄實作」——**把編排的複雜度推給上層**。 |

**這兩種模式對 Agent 的影響天差地別：**
*   **A 模式是「幫模型開外掛」**：LLM 不需要知道怎麼去抓文件、怎麼解析，工具直接把「最乾淨、最相關的 Context」餵給它。
*   **B 模式是「讓 LLM 做苦工」**：LLM 必須自己判斷要呼叫哪個工具、按什麼順序組合。這會把編排負擔全部推給 LLM，有時候會導致 **Context 嚴重污染**，大幅壓低 Tool-call 成功率。如果你用弱模型去跑 B 模式，結果會很慘。

---

### 緩解手法（預告主場 Block C：INSIGHT-4 應用）

如果你真的非得用 B 模式（大量薄工具）不可，該怎麼辦？
這裡有一個實戰手法：**先讓強模型（如 GPT-4o / Claude 3.5 Sonnet）跑一遍建立「示範軌跡 (Trajectory)」，然後再切換給弱模型接手。**

弱模型雖然規劃能力差，但非常擅長「模仿」強模型已經走過的 Tool-call 序列。這正是我們下午主場 Block C 要深入探討的核心思路：**「昂貴模型負責規劃 + 便宜模型負責實作」**。

---

## 主場 Block B：SKILL 到底是什麼 + 現場手搓一個（20-30 min）

回顧一下我們的 Mini Agent：我們已經有了 Repo 級別的 System Prompt（`AGENTS.md`），也有了動態擴充的 Tools（MCP）。
**而 SKILL，就是我們的第三層架構——「任務級別 (Task-level)」的模組化 Context 注入。**

---

### 🧠 SKILL 的本質

說穿了，SKILL 就是一個 Markdown 檔，裡面定義了某個特定任務或領域的指令與先備知識。
它的本質，就是一個**「模組化、可隨選呼叫的 Prompt」**——你可以把它想像成專案級別 `AGENTS.md` 的縮小版，但它聚焦於單一任務，並且可以透過 Slash Command (`/`) 在你需要的時候才動態觸發。

---

### 🛠️ Hands-on 實戰：每個人手搓一個專屬 SKILL

接下來，我們不講理論了，大家直接動手做。

1. **定義主題**：寫（或是 Clone）一個 `<anything>.md`——挑一個你自己關心或熟悉的主題（例如：你的獨門讀書法、某種程式語言的 Design Pattern、Paper 研究方法、甚至是任何你想自動化的瑣事）。
2. **掛載進系統**：在 OpenCode 中使用 `@` 直接提及這個檔案，或是將它配置到系統的 Skill 目錄下。
3. **實際觸發**：在對話框用 Slash Command (`/`) 呼叫並操作它。

> 💡 **Tip**：
> 如果你當下腦袋空白想不到要寫什麼，也可以去 GitHub 上找星星數很高的現成 Skill 直接 Clone 下來玩玩看（例如社群很有名的 `ponytail`）。

---

## 主場 Block C: 多模型編排 + live config show-and-tell（40-50 min）

> **承接**：Block 3 環境配置提到「pure Go config = 成本安全邊界」、Mini Agent 實驗看到「換 model 行為變」、MCP 段提到「強模型示範 → 弱模型模仿」。這些都指向同一條 insight：**模型不是只能選一個**。這裡把它講透。

### INSIGHT-4：把多個模型當成「可組合的組件」

INSIGHT-1 說改善 output 有兩根槓桿：input 與模型。但「模型」這根槓桿**不必只能選一個**。實務上可以把多個模型當成可組合的組件，**依各自的長處調度，用 text 把它們串起來**。

每個模型有不同維度的長處：

| 長處 | 誰擅長 |
|---|---|
| 能力 / 規劃力 | Claude 4.8 / Opus、GPT-5.5 |
| 價格 | Gemini Flash / DeepSeek V4 Flash / MiMo-V2.5 |
| context 長度 | Gemini 1M vs Claude 短 |
| 模態 | Gemini 多模態 |
| **開源 vs 閉源** | GLM、Kimi、Qwen、MiniMax 開源 |

→ 把 text（markdown / 純文字）當成模型之間的橋樑，就能讓「貴但短」的模型負責規劃、「便宜但長」的模型負責實作、「有眼睛」的模型負責 OCR。

### 三個 compose pattern（我在實習時為最大化每月 API 用量發展出來的用法）

| Pattern | 做法 | 剖析 |
|---|---|---|
| **貴規劃 + 便宜實作** | 同 context 內先用 Claude / GPT 規劃架構，再切便宜模型實作 | 用便宜模型實作強模型的 plan |
| **長 context 當壓縮機** | Gemini 讀 AI-native 文件庫 → 總結 → 餵 Claude 實作 | 用 Gemini 1M context 把長 input 壓成 Claude 能消化的短 input |
| **多模態當 OCR** | Gemini 讀圖 → 轉文字 → 餵純文字模型 | 多模態模型當「模態轉換器」，把視覺資訊轉成任何模型都能讀的 text |

### 切身故事：被 Google ban 帳號 ＋ omo ↔ Anthropic 大戰（短講，10 min）

- **我被 Google ban 帳號的血淚史**：2026 年上半年，我用了一個名為 `opencode-antigravity-auth` 的 plugin，這工具能把 Google Antigravity IDE 的模型額度反向代理到 OpenCode 裡面。用得很爽，但沒過多久，我的帳號就直接被 Gemini 官方封鎖了。
- **同樣的邏輯，引爆了 omo ↔ Anthropic 大戰**：omo（也就是我們這個 session 正在跑的 orchestrator，[GitHub](https://github.com/code-yeongyu/oh-my-openagent)）當初把每月 $200 的 Claude Max 訂閱 OAuth token 直接接進 OpenCode，用來驅動龐大的 multi-agent 架構。
- **成為大廠眼中釘**：omo 的多 Agent 編排簡直是個「Token Burner」，讓訂閱帳號的 token 消耗量呈倍數暴增，遠超一般人類的使用極限。這股異常流量立刻引起了 Anthropic 的警戒。
- **封鎖與律師函**：Anthropic 隨即展開反擊。他們先是在 2026 年 1 月 9 日從伺服器端全面阻斷了第三方的 OAuth 存取，接著在 3 月 19 日直接祭出律師函，強硬要求 OpenCode 移除所有與 Claude 相關的整合。這場風波之大，連開發者後來都公開承認：「*Anthropic blocked OpenCode because of us [omo].*」

---

## 主場 Block D：自建 context 資料庫庫 + AGENTS.md（30-40 min）

> **承接**：上午學了 system prompt（AGENTS.md）+ tools（MCP）+ 任務級注入（SKILL）。這段是 INSIGHT-1 的最極致應用——改善 input 改到「**整個 repo 都是 input**」。

### INSIGHT-7：與其讓 AI 盲猜，不如主動把資訊搬進它的 Context

在 INSIGHT-1 中我們談到「改善 Input」。而改善 Input 最極致的做法，並不是去寫花俏的 Prompt，而是**為 Agent 預先打造一個專屬的、具備版本控管的 Markdown 知識庫，讓它直接在裡面工作**。

以我自己為例，針對**每門修課**，我有一套固定的 Routine：

1. **抓取素材**：下載所有的 slide、PDF、作業與講義。
2. **AI-Native 轉換**：把這些檔案全部轉成 Markdown 格式（這是 INSIGHT-1 的直接應用）。
3. **建置 Git Repo**：為這門課建立專屬的 Note Repo（包含 `course-materials/`、`notes/`、`exam/` 等標準目錄）。
4. **Context 內發問**：直接在這個 Repo 裡喚醒 Agent，讓它**自動以整門課的知識為背景**來回答問題，徹底告別盲猜。
5. **模組化引用**：當要做期末專題或寫作業時，直接把這個 Repo 當作 Submodule 引入。作業一開工，Agent 就自動繼承了整門課的背景知識。

這套流程，說穿了就是**「徒手搓出一個超越 NotebookLM 或 RAG 的系統」**。它比 NotebookLM 更強大，因為它具備版本控管、可自由組合（透過 Submodule）、可攜帶（純 Markdown），而且完全掌握在你手中。

---

### Context 架構三件套（我的 `~/School` 實證）

這套「Context 架構」的核心概念是將**知識庫**與**工作專案**分離，並用 Agent 操作手冊來當作橋樑。以下是三個核心組件：

| 組件 | 角色定位 | 真實案例 |
|---|---|---|
| **Note Repo（語料庫）** | 該領域的完整 Markdown 知識庫 | `ntu-2025fall-advanced-compiler-note`（包含 20 份 Markdown + 9 份簡報 + 5 份 PDF） |
| **Work Repo（作業/專題）** | 實際的工作產出，透過 Submodule 引用語料庫 | 某堂課的 `hw1`，或是引用了 4 個作業 Repo 的 `cs-computer-graphics` |
| **AGENTS.md（操作手冊）** | 告訴 Agent 在這個 Repo 裡該怎麼工作 | 在我的 `~/School` 目錄下，就有超過 15 處配置了 AGENTS.md |

---

### 為什麼這套 Workflow 最值得你立刻學起來？

*   **零門檻**：每個學生都要修課，且這套流程**不需要任何進階環境或付費 API**，現在就能開始做。
*   **一石四鳥**：在建置的過程中，你同時學會了 **Git、Markdown、Context Engineering 以及撰寫 Agent 操作手冊**，還能立刻提升課業與專題效率。
*   **心智模型的躍遷**：把「AI 輔助學習」從「把講義丟給 ChatGPT 幫我摘要」的層次，徹底升級成「**親手建一個讓 Agent 住進去的知識庫**」。

**這套做法能打破哪些迷思？**

*   ❌ **「有事問 AI 就對了」** → ✅ 「問」之前，請先決定你要在什麼 Context 裡問。同一個問題、同一個模型，在專屬語料庫裡問，跟在空白對話框裡問，結果絕對是天差地別。
*   ❌ **「一定要會弄 RAG 或向量資料庫才能玩這套」** → ✅ 只要你會用 Git、寫 Markdown，再加上任何一個能讀檔的 Agent，就能做出比向量 RAG 更可控、更透明、可重組的版本。
*   ❌ **「NotebookLM 是一種神奇的新科技」** → ✅ 它的底層邏輯就只是「語料庫 + LLM」，而我們已經用手邊的開源工具，搓出了一個。

### INSIGHT-8：AGENTS.md — 業已標準化的「Repo 級 System Prompt 注入」

從今天早上開始，你可能已經不斷看到 `AGENTS.md` 這個檔案。請注意，它絕對不是某家公司的專利或獨創，而是當今 AI Agent 領域的**業界事實標準**。

簡單來說：**`README.md` 是寫給人看的，而 `AGENTS.md` 則是寫給 Agent 看的。** 它的本質，就是一份放在專案根目錄、用來對整個 Workspace 注入「System Prompt」的 Markdown 文件。

#### AGENTS.md 的發展脈絡與江湖地位

*   **起源與推動**：2025 年 8 月由 **OpenAI** 帶頭起草，隨後 Sourcegraph Amp、Google (Jules)、Cursor、Factory 等大廠共同響應推動，並在 2025 年 12 月正式捐贈給 Linux Foundation (AAIF) 進行開放治理。（[了解 AGENTS.md 規範](https://agents.md/) | [GitHub Repo](https://github.com/openai/agents.md/)）
*   **終結碎片化**：過去每一家工具都有自己的格式（例如 `.cursorrules`、`CLAUDE.md`、`GEMINI.md`、`.windsurfrules` 等），而 `AGENTS.md` 的出現，成功統一了這場混戰，成為各家通用的 Vendor-neutral baseline。
*   **廣泛採用**：目前已有超過 30 種主流 Agent 原生支援（包括 Codex、Cursor、Copilot、Jules、Gemini CLI、Aider、Windsurf、**Zed**、Devin 等等），並在全球超過六萬個 Repo 中被使用。就連官方主推 `CLAUDE.md` 的 Claude Code，也會在找不到檔案時 Fallback 去讀取 `AGENTS.md`。

#### ⚠️ 實戰排雷指南 (Gotchas)

在實務教學或使用時，有一個很容易踩坑的地方：**各家工具對「巢狀目錄 (Nested) 的探索機制」並不一致**。
*   **會向下串接**：例如 Codex，會把從 Root 到當前目錄 (CWD) 的所有 `AGENTS.md` 串接起來。
*   **不會向下尋找**：Cursor 與 Claude Code 預設**不做 Nested 探索**，這意味著你放在子目錄裡的 `AGENTS.md` 很容易被無視。
*   **解法**：在 Claude Code 中，你可以透過在根目錄的檔案裡寫 `@AGENTS.md` 的 Import 機制來橋接子目錄的規則。

---

### 為什麼你現在就該開始寫 AGENTS.md？

**這條洞察能幫你打破哪些迷思？**

*   ❌ **「換一個工具，就要重學一套 Rules 系統」** → ✅ 其實底層的邏輯全都是一樣的：就是注入 System Prompt。而 `AGENTS.md` 就是那個最統一的介面。
*   ❌ **「AGENTS.md 只是某家公司的私有格式」** → ✅ 它是受 Linux Foundation 保護的開放標準，絕不綁死在單一廠商身上。
*   ❌ **「寫這個只是一種形式主義」** → ✅ 這其實是 INSIGHT-1 最直接的火力展示。與其讓模型在程式碼海中盲猜，不如主動、清晰地寫下它該知道的 Context。

> 💡 **最小投入，最高回報的開發習慣**
>
> 從今天起，當你第一次 clone 或建立任何一個新 Repo 時，第一件事就是寫一份 `AGENTS.md`。
> 這個簡單的動作，能把原本被視為玄學的「一次性 Prompt Engineering」，昇華成「**為整個專案建立一份持久、可控的系統工程說明書**」。
> 
> **實作題**：等一下請試著為你手邊正在寫的作業 Repo 新增一份 `AGENTS.md`，你將會親眼見證，加與不加，Agent 的表現絕對是天差地別（這就是我們早上 Mini Agent 實驗的「放大版」）。

---

# 下半場（下午）：subagent + omo（條件性）

> 若上午 opencode 講不完 → 下午順延。上午優先級 > 下午。

---

## 下午 Block 1：Subagent 的概念與配置（30-40 min）

早上我們學了 Agent 的本質是個 Loop（INSIGHT-3）、工具可以動態插拔（MCP）、任務級的 Context 可以注入（SKILL），還有多模型的編排（INSIGHT-4）。
而**Subagent 就是這四者的終極組合升級——它是 Loops within Loops**。

### 什麼是 Subagent？

簡單來說，Subagent 就是被主控端（Orchestrator）委派出去的**獨立 Agent Loop**，它擁有自己獨立的 Context 視窗。
Orchestrator 不必親自下海做所有事，它只需要 Spawn 一個 Subagent 在自己的 Context 裡去執行任務，最後再把結果收回來即可。

### 為什麼我們需要節省 Context？

因為 Orchestrator 的 Context 是非常珍貴且有限的資源（呼應 INSIGHT-1）。

*   ❌ **如果不 Delegate（委派）**：Orchestrator 必須自己讀完 20 個檔案 → Context 瞬間被灌爆 → 模型失去推理能力，開始胡言亂語。
*   ✅ **如果 Delegate 給 Explore Subagent**：Explore 會在**它自己**的 Context 裡讀完所有檔案 → 然後只回傳一句精煉的總結：「Auth 邏輯在 `src/auth/`，Token 的流向是 X→Y→Z」 → Orchestrator 的 Context 就能保持絕對乾淨。

### 💻 Live Demo：現場 Spawn 一個 Subagent

我們現在直接用 **OpenCode 內建的 Agent Creator**，搭配早上學過的 MCP 工具，現場生出一個 Subagent 來用。

*   **受控實驗（展示 Context 節省）**：我們用同一個任務，先不 Delegate 跑一次（讓大家看 Context 是怎麼被灌爆的），接著再 Delegate 給 Explore 跑一次（看 Context 如何保持乾淨）。這正是 INSIGHT-2 提到的受控實驗手法。
*   **你可以建的候選 Subagent**：
    *   **Explore**：專門在 Codebase 裡找東西，回答「X 放在哪」、「Y 怎麼運作」這類需要廣泛閱讀檔案的問題。
    *   **Librarian**：專責跨 Repo 分析、查閱外部文件、尋找開源實作範例（可掛載 GitHub CLI、Context7 或 Web Search 等 MCP 工具）。

### 這如何呼應 INSIGHT-4（多模型編排）？

不同的 Subagent 可以配置不同的模型。例如：Explore 可以用便宜又快的模型來掃檔案，而 Oracle（主控端）則用最聰明、最貴的模型來做決策。
**這就是 Subagent 編排的奧義——把早上的「多模型組合」從單純的 Config 路由，直接升級成系統架構級別的實作。**

---

## 下午 Block 2：omo 的進階玩法（若時間允許，20-30 min）

承接 Subagent 的概念，我要來向大家介紹 **[omo (oh-my-openagent)](https://github.com/code-yeongyu/oh-my-openagent)**——這是在 OpenCode 之上的一層進階 Harness，同時也是我們這場 Workshop 正在背後運作的 Orchestrator。

*   **Sisyphus Todo-driven 持續性**：Agent 有時候會偷懶，任務做到一半就想提早喊 Done。omo 會透過 Hook 注入機制，像監工一樣鞭策它繼續把 Todo list 做完。
*   **這就是我日常的真實工作模式**：Orchestrator + 平行的 Subagents + 隨選的 Skill 注入。
*   **Live 展示**：我可以直接切開本 Session 的 Config 給你看（目前正是 Sisyphus 跑在 GLM-5.2 上）。

### 關於「Agent 持續性」的兩派機制（INSIGHT-3 的延伸）

要讓 Agent 自動跑下去，目前有兩種主流做法：

| 機制名稱 | 誰來決定任務做完了沒？ | 記憶體狀態放在哪裡？ |
|---|---|---|
| **Sisyphus (Todo Continuation)** | Agent 自己建立並維護 Todo list | 放在同一個 Session 的對話 Context 裡 |
| **Ralph Loop** | 由外部的固定 Prompt 強制判定 | 存在檔案系統與 Git history 裡（每一輪都是全新的 Context） |

→ 我個人更偏好 **Sisyphus**，因為它是 Todo-driven，比較尊重 Agent 原本的規劃計畫。不過 omo 這兩種機制都有內建。
**（自我指涉時間）**：其實今天這個 Session 就是 Sisyphus 在背後跑——我現在一邊講，一邊其實正在被它驅動著。

**至於安裝**：omo 提供了自動配置腳本，裝完後預設的 Orchestrator 和 Subagent 結構就已經架好了，你只需要手動微調一下 Config 即可，門檻非常低，完全不需要從零手刻。

---

# 研究工具段（不只開發，還要懂研究）

> 教授明確要求：這場 Workshop 不能只有「開發」，還必須涵蓋「研究」。因此，以下是專為學術與研究所準備的工具流。

---

## 研究工具 1：Web Chatbot 的 Deep-Research 模式（15-20 min）

**主力工具**：Perplexity / Gemini 的 Deep Research 模式（或其他具備類似能力的 Web Chatbot）。

**它的核心超能力**：能夠在背景**自動、批量地搜尋數十甚至上百個網頁**——這是目前的 Local Agent 絕對做不到，或是做得極慢的領域。

### 正確用法：環境分工（INSIGHT-6）

| ❌ 錯誤用法（這叫 Vibe Coding） | ✅ 正確用法（這才是研究後端） |
|---|---|
| 把問題丟給 ChatGPT → 直接盲信答案 → 複製貼上到作業裡 | 用 Deep-research 跑深度研究題 → 導出成 Markdown 結果 → **貼回 Local Agent 當作 Context 繼續加工** |
| 把 Web Chatbot 當作**「答案產出機」** | 把 Web Chatbot 當作**「搜集資料的研究後端」** |

**觀念的關鍵轉換 (Reframe)**：
你們現在肯定都已經在用 Web Chatbot 了，我不是要你們丟掉它，而是要**升級你的用法**。
「用 Web Chatbot」不等於無腦的「Vibe Coding」，關鍵在於你把它當成研究後端，而不是直接要答案。只要觀念一轉，你現有的使用習慣立刻就會變成有價值的資產，完全不需要從零開始換軌。

**這跟 INSIGHT-4（多模型編排）有什麼關係？**
*   INSIGHT-4 是在**模型層**的組合（用貴模型規劃 + 便宜模型實作）。
*   INSIGHT-6 則是在**環境層**的組合（用 Web Chatbot 廣泛搜尋 + Local Agent 深度加工）。
*   它們共用著同一個底層邏輯：**「純文字 (Text) 是最通用的匯流排」**。只要能吐出文字的 AI 組件，通通可以被串聯、組合起來。

**💻 Live Demo**：
我現在現場用 Deep Research 跑一個研究題 → 把它存成 Markdown → 丟進 OpenCode 裡當作 Context 注入 → 最後讓 Agent 基於這份剛出爐的研究報告，繼續寫 Code 或是深入分析。整條工作鏈一氣呵成。

---

## 研究工具 2：alphaXiv + autoresearch（20-25 min）

### alphaXiv：為 arXiv 裝上社群與 AI 的大腦

**URL 神奇小把戲**：只要把任何一篇 arXiv 論文網址裡的 `arxiv` 改成 `alphaxiv`（只多了 5 個字母，或者直接造訪 [alphaxiv.org](https://alphaxiv.org/)），同一篇論文瞬間就會解鎖三大功能：
1. **Ask AI**：直接對論文提問。此時 AI 是**以這篇論文的本文作為 Context** 來回答你，比你把 PDF 丟給 ChatGPT 瞎猜，幻覺 (Hallucination) 要少太多了（這叫做 Grounded）。
2. **AI Blog Summary**：一鍵自動生成易懂的部落格風格摘要。
3. **行級社群討論**：你可以直接在特定的某一行、某個公式、或某張圖表上留言跟全世界討論。

這是一個史丹佛學生專為 Paper reading 設計的神器，而且完全免費。

### autoresearch：你的專屬論文重現 Agent

**URL 神奇小把戲之二**：把網址裡的 `arxiv` 改成 `autoarxiv`，就會立刻在雲端部署一個 **Agent** 來幫你做三件事：
1. **解決環境地雷 (Resolve setup issues)**：自動修復論文開源 Repo 裡那些殘缺不全的安裝與環境依賴問題。
2. **跑最小重現 (Run a minimal reproduction)**：直接幫你把 Code 跑起來，驗證它不是假的。
3. **估算成本 (Estimate full replication cost)**：幫你算算如果要完整復現這篇論文的結果，大概需要燒掉多少運算資源。

**這對研究生的價值在哪？**
以前讀完論文想跑 Code，常常卡在 Setup 地獄，最後只能放棄。現在，`autoresearch` 能自動幫你跨過這道檻。
更重要的是，它本身就是一個 INSIGHT-3 的完美體現（Agent = Loop + Tools + 部署 Codebase）——你早上才剛學完 Agent 的迴圈原理，現在你就親眼看到一個**用 Agent 來解決真實學術研究痛點**的產品。

**💻 Live Demo**：
現場隨便挑一篇論文，把 `arxiv` 改成 `autoarxiv`，我們直接看 Agent 怎麼跑。這個 URL Trick 的操作門檻極低，大家現在就可以拿起電腦試試看。

---

# 收尾：兩條 meta insight

---

## INSIGHT-9：想變得有 Insight，先換掉你的「資訊飲食」（15-25 min）

> **「LLM 是一個 I/O 黑盒子，其實人的大腦也是。」** 
> 你餵給大腦什麼樣的資訊飲食（Input），它就會長出什麼樣的判斷（Output）。「Garbage in, garbage out」這句話對 AI 模型和對人來說，在結構上是完全一致的。改善「人的 Input」，其實跟改善「LLM 的 Input」是同一件事。

我觀察到一個現象：目前繁中 AI 社群裡有大量的內容，**都只是在做資訊搬運，或者單純教你「某個工具怎麼按」**。這類內容看再多，也很難長出真正的 Insight。我的作法是：直接跨過語言的高牆，去吸收英文圈的**初級來源（Primary Sources）**，像是 YouTubers、X（Twitter）上的開發者辯論、或是 GitHub 上的 Issues 與 Discussions。

**這也是今天這個 Workshop 最核心的價值主張**：我不是來教你怎麼點擊介面的（那是搬運層在做的事），我是來**提供繁中社群最缺乏的 Insight 層**。我負責把英文圈裡「為什麼要這樣設計、為什麼要這樣用」的底層邏輯，用中文直接講給你聽，幫你省下親自去爬梳源頭的時間。

### 帶得走的行動指南：我的初級來源清單

> 這裡不是要求你全部都要看懂，而是給你一個起點。從裡面挑一兩個你感興趣的訂閱起來，維持三個月的「資訊飲食改變」，你會發現自己對技術的判斷力將完全不同。

| 來源頻道 / 平台 | 內容性質 | 為什麼要看？（對應的價值） |
|---|---|---|
| **[ThePrimeagen](https://www.youtube.com/@ThePrimeagen)** 系列 | Neovim/Lua、i3/tmux/vim 的極致工作流實戰 | 這是理解 CLI 與開發工具流的最源頭 |
| **[Low Level](https://www.youtube.com/channel/UC6biysICWOJ-C3P4Tyeggzg)** | 專攻 exploit / vulnerability 的硬核資安頻道（如 LPE, 0-day, UEFI） | 培養對系統底層架構、CVE 與 CTF 的敏銳度 |
| **[Tsoding](https://www.youtube.com/@TsodingDaily)** | 硬派 C/C++ 從零實作（能花 21 分鐘深論 dynamic array / realloc）| 讓你深刻理解底層實作的細節與代價 |
| **[Fireship](https://www.youtube.com/@Fireship)** | "X in 100 Seconds" 以及極快節奏的生態評論 | 讓你用最快的速度吸收技術新知與趨勢 |
| **[Theo - t3․gg](https://www.youtube.com/@t3dotgg)** | TypeScript / Web / JS 框架生態（t3 stack 創造者）| 建立現代 Web 乃至 JS 工程體系的宏觀視野 |
| **X / Twitter 開發者討論** | 即時的業界辯論與踩坑血淚史 | 掌握第一手趨勢，這也是 omo 等大戰爆發的戰場 |
| **GitHub Issues / Discussions**| 真實的工程討論與維護者的設計取捨 | 工具實際的設計妥協都在這裡（例如 AGENTS.md 的各種 Gotcha 都是從這裡看來的） |

**這條洞察能打破什麼迷思？**

*   ❌ **「我每天都看很多 AI 新聞，所以我很懂 AI」** → ✅ 如果你的來源都只是搬運層，吸收再多也只會停留在「工具用法」，長不出自己的 Insight。
*   ❌ **「繁中社群跟英文社群得到的資訊應該差不多吧？」** → ✅ 錯了，兩者之間有著巨大的結構性落差——一個是生產地，一個是搬運地。想要真正獲得 Insight，你必須主動跨過那道語言牆。
*   ❌ **「Insight 好難，我得自己從零悟出來」** → ✅ 其實不用這麼累。直接去初級來源，吸收別人已經提煉好的 Insight，然後把它內化成自己的東西。

---

## INSIGHT-10：AI 不會轉移工程責任，它只改變你的施力點（10-15 min）

今天整場講下來，我向你們展示了 AI 各種不可思議的能力。但最後，我必須強調一件事：**無論 AI 再怎麼強大，它永遠無法替你扛下「工程紀律」的最終責任。**

AI 能極大地加速產出，但責任並不會因此轉移到 AI 身上，它只是**改變了你在開發過程中需要施力的位置**而已。

**這四個全新的施力點，是你未來必須掌握的：**

| 開發觀念的轉變 | 具體內容 | 責任歸屬（你的施力點） |
|---|---|---|
| **TDD 是最適合 Agent 的模式** | 由你來定義「Done」的客觀標準（寫好測試），然後讓 Agent 去負責滿足它。 | **Verification (驗證)** 的責任留在你身上 |
| **Human-in-loop 不要變成教條** | 我認同人在迴圈裡很重要，但介入的密度應該依據「任務風險與複雜度」來彈性調整，而不是凡事都攔截。 | **Control (控制)** 的責任留在你身上 |
| **LSP 是助力，有時也是噪音** | LSP（Language Server Protocol）的回饋通常能幫助 AI 修正錯誤，但有時反而會讓它分心。 | **Signal-filtering (過濾雜訊)** 的責任留在你身上 |
| **Git 才是唯一聖旨，別迷信工具的 Revert** | 千萬不要過度依賴任何 Agent 或 IDE 內建的 Revert / Undo 功能；Git 才是經歷過幾十年考驗、唯一可信的 Source of Truth。 | **Safety (安全基準)** 的責任留在正統工具與你身上 |

### 🚨 反例警示：連 AI 安全總監都會翻車的「信箱事件」

Meta 的 AI 安全總監 Summer Yue 曾經分享過一個慘痛教訓：她讓 OpenClaw 幫忙整理信箱，並且明確下了指令「**確認前絕對不要動作**」。
結果呢？因為 Context Compaction（上下文壓縮）的機制剛好把那句「確認前不要動作」的指令給吃掉了，導致 Agent 進入 Speedrun 模式，**直接把她的信箱幾乎刪光**。她最後甚至得從位子上跳起來，一路狂奔去強制拔掉 Mac mini 的電源來搶救資料。

**你想想看，連大廠的 AI 安全總監都會被 Compaction 咬到，何況是我們？**

### 這條洞察能打破什麼迷思？

*   ❌ **「既然 AI 能全自動開發，那我以後就不用對 Code 負責了」** → ✅ AI 自動化的是「執行過程」，而不是「最終責任」。
*   ❌ **「寫錯了沒關係，用工具內建的 Revert 退回就好」** → ✅ IDE 的 Revert 會壞、會導致狀態不一致；只有 Git 才是真正經過時間檢驗的 Source of Truth。
*   ❌ **「LSP 或編譯器的報錯，無條件都是有用的訊號」** → ✅ 錯誤訊息有時會成為混淆 AI 的噪音，身為工程師，你必須具備主動判斷與過濾雜訊的能力（這也呼應了 INSIGHT-5 提到的 Context 污染）。

**學會駕馭 AI，絕對不等於你可以甩掉軟體工程的責任。相反的，它要求你站在更高的維度來把控全局。**
