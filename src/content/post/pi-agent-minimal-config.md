---
title: "我的 Pi agent 極簡配置：把 oh-my-opencode 砍掉之後"
description: "從 oh-my-opencode 一大陀配置回歸 pi coding agent 極簡 harness 的取捨：settings.json、mcp.json、models.json、subagent 零件與踩雷紀錄。"
pubDate: 2026-08-30 02:33:06 +0800
draft: false
category: ai
tags: ["agent", "pi", "opencode", "config", "dotfiles"]
source: "facebook"
sourceType: "facebook"
sourceTimestamp: 1788028386
---

> 這篇是 2026-11-25 把 2026-08-30 發在 FB 的一句話短文（「我的 Pi agent 配置做完了」）擴寫成的配置教學，當時的語氣照舊，細節按現在的配置檔補齊。

## 從一大陀到一小疊

八月底我把 agent 配置整個砍掉重練。起因很簡單：oh-my-opencode 用了一個月之後（心得寫在[上一篇](/blog/oh-my-opencode-one-month/)），我發現自己的配置目錄已經長成一陀我不太敢動的東西——subagent 分工很爽，但 token 帳單跟著爽、設定檔互相依賴、上游一更新我就得跟著修。最後 omo 滾蛋，opencode 也砍到剩一個 opencode.jsonc 加四個 plugin。

換上的是 [pi coding agent](https://github.com/earendil-works/pi)（當時還叫 badlogic/pi-mono，後來搬到 earendil-works）。它的定位是一個極簡的 agent harness：內建只有 read/bash/edit/write 幾個工具，沒有 subagent、沒有 plan mode，README 明寫「Adapt Pi to your workflows, not the other way around」，要什麼自己用 extension 或 package 組。MIT 授權，裝完丟進任何專案目錄就能跑，安裝一行：

```bash
curl -fsSL https://pi.dev/install.sh | sh
# 或 npm install -g --ignore-scripts @earendil-works/pi-coding-agent（需 Node 22.19+）
```

## 配置檔

pi 的配置集中在 `~/.pi/agent/`（可用 `PI_CODING_AGENT_DIR` 改位置），專案層級則放工作目錄下的 `.pi/`，要授予 project trust 才會載入。我的整份配置都在 [dotfiles](https://github.com/G36maid/dotfiles) 的 `pi/` 目錄，GNU Stow 一推就進 home。

`settings.json` 是核心，我留了這些：

```json
{
  "theme": "dark",
  "defaultProvider": "zai",
  "defaultModel": "glm-5.3-flash",
  "defaultTools": ["read", "bash", "edit", "write", "grep", "find"],
  "packages": [
    "npm:pi-web-access",
    "npm:pi-tool-display",
    "npm:@juicesharp/rpiv-ask-user-question",
    "npm:pi-tps-meter",
    "git:github.com/G36maid/pi-interactive-subagents",
    "git:github.com/G36maid/pi-nested-agents-md",
    "git:github.com/G36maid/pi-unhappy-index"
  ]
}
```

`defaultTools` 在預設四個之外補了 grep 和 find；`packages` 是 pi 的資源打包機制，npm 或 git 來源都行，我把自己寫的三個小 package（subagent 橋接、巢狀 AGENTS.md、unhappy index）直接用 git 掛進來。

MCP 只留真的會用到的四個（`mcp.json`）：

```json
{
  "mcpServers": {
    "deepwiki": { "url": "https://mcp.deepwiki.com/mcp" },
    "context7": { "url": "https://mcp.context7.com/mcp" },
    "grep-app": { "url": "https://mcp.grep.app" },
    "ghidra": { "command": "uv", "args": ["run", "--script", ".../bridge_mcp_ghidra.py"] }
  }
}
```

本地模型另外寫在 `models.json`：DGX Spark 上自架的 EXL3 端點包成一個 provider，context window 開到 1M、費用全零。跑法跟細節在[這篇](/blog/dgx-spark-deepseek-pi-agent-aoc/)。

`skills/`、`themes/`、`keybindings.json` 這些我全空著，夠用再放。手動改完任何配置檔跑一次 `/reload` 就生效，重開整個 session 都不用。

subagent 也沒有消失，只是從 framework 功能降級成我自己組的零件：`agents/` 底下的 worker.md 用 frontmatter 聲明 `tools`、`model`、`subagent_agents`，內文一段「你在隔離 context 裡工作、context 有限、先派 explore/librarian 去踩線」的指示。`prompts/` 放 init、init-deep、review 三個 slash command。全部加起來二十個檔案以內，omitted 的都比留下的貴。

## 為什麼不繼續用大而全的方案

大而全的價值是開箱即用，代價是每一層抽象都在替你做決定。omo 的 subagent 派工邏輯好用，但我改不了它的計費行為；framework 升級時，它認為你該有的東西會整批回來。pi 反過來：harness 小到我可以整份讀完，每個功能都是我親手掛上去的，掛了什麼、為什麼掛，dotfiles 的 git log 就是答案。配置從幾百行變成一疊小檔，每個檔案只為一件事負責。

## 踩雷

- **project trust**：`.pi/` 底下的 settings、extensions、MCP 要在互動模式授予 trust 才會載，headless 跑 batch 前記得先處理，不然會默默用預設配置。
- **AGENTS.md 階層**：pi 會從 agent 目錄和工作目錄的祖先一路收 AGENTS.md，同一目錄 AGENTS.md 優先於 CLAUDE.md；忘了這件事會以為全域規則沒生效。
- **extension 版本水位**：settings.json 裡的 `extensionChangelogVersions` 記著每個 extension 的 changelog 看到哪裡，手動整理 settings 時別清掉。
- **repo 搬家**：寫這篇的八月還是 badlogic/pi-mono，後來搬去 earendil-works/pi，舊連結會 redirect，書籤該更新。

## 2026-11 update

三個月過去，pi 已經從當時的 v0.84.x 滾到 v1.6.0（2026-11-20），repo 搬家、npm 包名定為 `@earendil-works/pi-coding-agent`，星數爬到十二萬。上游加了一堆新模型的支援，但「harness 保持極小、功能靠 package 外掛」的路線沒動過，這也是我當初押它的原因。我的配置大方向沒變：packages 多了幾個自己寫的，models.json 的本地端點跟著 DGX Spark 換模型。極簡這條路到目前為止沒有回頭的理由。
