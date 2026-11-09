---
title: "我把本地部署的 GLM-5.3-Flash 接上 Ghidra：本地 LLM 逆向工程實戰"
description: "用 GhidraMCP 把 Ghidra 接上兩台 DGX Spark 上的 GLM-5.3-Flash-EXL3，以 opencode 當 MCP client 讓模型自主反編譯、改名、加註解，看著他逆向工程任何東西真的很酷。"
pubDate: 2026-08-30T16:02:08+08:00
category: self-hosting
tags: ["llm", "ghidra", "reverse-engineering", "self-hosting"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1788076928
---

> 本文擴寫自 2026-08-30 的 Facebook 貼文：「我今天把本地部署的 GLM5.3-Flash 接上 Ghidra，看著他逆向工程任何東西真的很酷。推薦大家拿去玩一下。」

## 半自動化逆向的痛

平常做 reverse，我的主力是 [Ghidra](https://ghidra-sre.org)——NSA 開源的那套逆向工程平台。標準流程：binary 丟進去跑 auto analysis，開 decompiler，然後對著一排 `FUN_00101234` 逐一點開、讀 pseudo-C、猜語意、rename、寫註解。函式一多——實務上樣本動輒上百個——光是 survey 就能吃掉半天。寫 Ghidra script 可以半自動化一部分，但 script 只會做你預先寫好的事，碰到需要「理解程式在幹嘛」的環節還是得自己上。

所以看到 [GhidraMCP](https://github.com/LaurieWired/GhidraMCP) 的瞬間我就知道這東西該怎麼用了：把它接上我自己跑的本地模型。模型端就是[前一篇](/blog/exl3-glm-local-deploy/)部署好的 GLM-5.3-Flash-EXL3。接上之後，看著他自主逆向工程任何東西，真的很酷，推薦大家拿去玩一下。

## 架構：GhidraMCP 當 Ghidra 與 LLM 之間的橋

GhidraMCP（Apache 2.0 授權）由兩部分組成：一個 Ghidra plugin，會在 Ghidra 裡開一個 HTTP server（預設 `127.0.0.1:8080`）；加上一個 MCP server，負責把 Ghidra 的功能以 [Model Context Protocol](https://modelcontextprotocol.io) 工具的形式暴露給 LLM。工具涵蓋 `decompile_function`、`decompile_function_by_address`、`disassemble_function`、`list_methods`、`list_strings`、`search_functions_by_name`，以及 `rename_function`、`set_function_prototype`、`set_decompiler_comment` 這類寫回操作——換句話說，模型不只讀，還能直接在資料庫裡改名、加註解。

MCP client 我用 [opencode](https://opencode.ai/docs/mcp-servers/)：它的設定支援 local（stdio）與 remote 兩種 MCP server，加進 `opencode.json` 的 `mcp` 區塊後，工具就會自動出現在模型可用的清單裡。模型端則指向[前一篇](/blog/exl3-glm-local-deploy/)用 vLLM 起的 OpenAI 相容 endpoint（兩台 DGX Spark 的 head，port 8888），opencode 支援自訂 provider，把 baseURL 導過去就行。

## 動手裝

### 1. Ghidra 端：裝 plugin

從 [GhidraMCP releases](https://github.com/LaurieWired/GhidraMCP/releases) 抓對應 Ghidra 版本的 zip（內含 plugin 與 Python MCP client），然後：

1. Ghidra → `File` → `Install Extensions` → 按 `+` 選 zip
2. 重啟 Ghidra，到 `File` → `Configure` → `Developer` 確認 GhidraMCPPlugin 已啟用
3. 打開要逆的 binary；HTTP server 預設聽 `8080`，要改去 `Edit` → `Tool Options` → `GhidraMCP HTTP Server`

### 2. opencode 端：接上 MCP 與本地模型

```jsonc
{
  "mcp": {
    "ghidra": {
      "type": "local",
      "command": [
        "uvx", "--from", "git+https://github.com/LaurieWired/GhidraMCP",
        "ghidra-mcp", "--ghidra-server", "http://127.0.0.1:8080/"
      ],
      "enabled": true
    }
  }
}
```

`ghidra-mcp` 用 [uv](https://docs.astral.sh/uv/) 直接從 repo 跑，`--ghidra-server` 指向剛才的 Ghidra。模型 provider 設成自訂 OpenAI 相容端點，指到 Spark 上的 vLLM。

### 3. 下 prompt

```text
先用 list_methods 看這個 binary 有哪些函式，
挑 main 附近看起來像加密流程的三個，decompile 出來；
判斷彼此的呼叫關係後，用 rename_function 和 set_decompiler_comment
把你推斷的名稱與說明寫回 Ghidra。
```

接下來就是看戲：模型自己 list、decompile、交叉比對字串與 xref，然後一個一個改名。看著 `FUN_00101234` 變成 `aes_round_key_expand`，比我自己讀一下午快得多。中途我也會插話修正方向——例如叫它先 `search_functions_by_name` 找特定關鍵字，或把某個函式的 xref 全部列出來再下判斷。

## 為什麼堅持本地模型

逆向樣本多半見不得光：惡意樣本不能外流，客戶交付物有保密條款，把反編譯結果整包丟給雲端 API 等於把案源貼到公海。自己跑的模型沒有這層顧慮，資料根本不出機器。成本上也不吃虧——逆向這種動輒幾百個 tool call 的 agent 迴圈，按 token 計費的雲端 API 累積起來很可觀，掛在自己機器上跑整晚頂多心疼電費。

## 誠實列缺點

- **幻覺改名**：模型偶爾會很自信地把函式取錯名，語意完全錯誤。我的做法是把所有 rename 當成建議，關鍵函式驗證過才採信。
- **context 限制**：幾百個函式的 decompile 結果塞不進一次對話，大樣本要分段處理，或先用 `list_strings` 的 filter 縮小範圍。
- **慢**：prefill 是前一篇抱怨過的老問題，幾百 KB 的 pseudo-C 餵進去，等待時間是拿 decode 快換來的，急件還是手動比較快。
- **工具集有限**：GhidraMCP 沒涵蓋 Ghidra 全部功能，深度的資料型別重建還是得自己進 GUI。

整體而言，這套組合把「讀懂、改名、註解」這段最枯燥的流程交給模型，我留著判斷與驗證——以半自動化工具來說，這是我用過體感最好的形態。之後再來試更激進的玩法：讓模型自己寫 Ghidra script。

延伸閱讀：[前作的 EXL3 部署踩雷記](/blog/exl3-glm-local-deploy/)、[同款模型的進步調查](/blog/miaai-exl3-progress/)。
