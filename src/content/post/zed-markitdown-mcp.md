---
title: "自製 Zed 的 MarkItDown MCP Server：讓文字 Agent 也讀得懂 PPTX 和 PDF"
description: "為 Zed Editor 寫了一個包裝 Microsoft MarkItDown 的 MCP server 擴充：設計思路、Zed 擴充機制、安裝設定、Python 3.14 踩雷與誠實評價。"
pubDate: 2025-09-17T17:58:04+08:00
category: ai
tags: ["zed", "mcp", "markitdown", "rust", "ai", "文件轉換"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1758103084
---

> 本文擴寫自 2025-09-17 的 FB 隨筆，2026-11 重寫時補上這個工具鏈一年後的下場——它已經被我自己退役了，退役原因寫在最後兩節，那部分比 setup 教學更有參考價值。

手上常見的痛點：Zed 的 Agent Panel 很好用，但它是個**純文字** agent——你叫它分析一份簡報、讀一份 PDF 報告，它只會攤手。除非改用 multimodal model（貴、而且不一定是你想用的那顆），否則 PPTX、PDF、圖片這類資料根本進不了 context。

解法其實很樸素：與其讓模型「看懂」多媒體，不如**在進 context 之前先把東西轉成 Markdown**。文字 agent 就能處理了。所以我在 2025-09-16 一個晚上寫了 [zed-mcp-server-markitdown](https://github.com/G36maid/zed-mcp-server-markitdown)（MIT），把 Microsoft 的 [MarkItDown](https://github.com/microsoft/markitdown) 包成 Zed 的 MCP server 擴充，當時還在 Beta。

## MarkItDown：文件轉 Markdown 的瑞士刀

[MarkItDown](https://github.com/microsoft/markitdown) 是 Microsoft AutoGen 團隊 2024 年底開源的 Python 工具，設計立場很明確：輸出**不是給人看的高保真轉換**，而是給 LLM 消費的文字管線——保留標題、列表、表格、連結這些結構，其他裝飾通通丟掉。這個取捨對我的用途剛剛好。

它支援的格式相當貪心：PDF、Word、Excel、PowerPoint、圖片（EXIF + OCR）、音訊（語音轉錄）、HTML、CSV/JSON/XML、ZIP、YouTube 連結……官方還提供 [markitdown-mcp](https://github.com/microsoft/markitdown/tree/main/packages/markitdown-mcp) server，只暴露**一個 tool**：

```text
convert_to_markdown(uri: str) -> str
```

`uri` 可以是 `http:`、`https:`、`file:`、`data:` 任何一種。一個 tool 吃所有格式，這種 API 表面積我非常欣賞——agent 不用學一堆參數，丟 URI 進去拿 Markdown 出來就對了。

## 1. 擴充本身其實很薄：Zed 的 context_servers 機制

Zed 從 [2025 年初宣布支援 MCP](https://zed.dev/blog/mcp) 以來，MCP server 有兩種掛法：直接寫在 `settings.json` 的 `context_servers`，或包成[擴充](https://zed.dev/docs/extensions/mcp-extensions)。後者很貼心——裝完擴充就自動幫你把 server 跑起來。

做法是在 `extension.toml` 註冊 `[context_servers.mcp-server-markitdown]`，然後在 Rust 的 `context_server_command()` 裡回傳啟動指令。我的實作整個流程是：

1. 讀設定裡的 `package_version`（預設 `latest`）；
2. 用 Zed 擴充 API 的 `npm_package_installed_version()` / `npm_install_package()` 裝好 npm 套件；
3. 回傳 `{node_binary_path} node_modules/.bin/markitdown-mcp-npx` 這條指令。

也就是說：真正的 server 是 [xkiranj 的 markitdown-mcp-npx](https://github.com/xkiranj/markitdown-mcp-npx)（把官方 Python server 包成免 Docker 的 npm wrapper），轉換邏輯全是 Microsoft 上游的。我的 Rust 程式碼只做「把這條命令鏈正確接起來」這件事——寫擴充不等於寫功能，這是件好事。

## 2. 安裝（當時是 dev extension）

```sh
git clone https://github.com/G36maid/zed-mcp-server-markitdown.git
cd zed-mcp-server-markitdown
cargo build --release
```

然後在 Zed：`Extensions → Install Dev Extension → 選這個目錄`。想固定版本可以在 `settings.json` 加：

```json
{
  "context_servers": {
    "mcp-server-markitdown": {
      "settings": { "package_version": "latest" }
    }
  }
}
```

前置需求只有 Node.js（Zed 會自己處理 npm 安裝）和網路。裝好後重啟 Agent Panel，`convert_to_markdown` 就會出現在工具列表，記得到 Agent Profiles 裡確認它沒被關掉。

## 3. 實際用法：直接在對話裡丟東西給它

裝完之後的使用體驗就是自然語言，不用任何特殊指令：

```text
請分析這份 PDF 報告，摘出三個重點。
```

```text
把這個 Excel 轉成 Markdown，列出前五筆資料。
```

Agent 會自己呼叫 `convert_to_markdown`，拿到轉好的 Markdown 再回答。實際用下來最順的是**網頁和 PDF**：抓網頁做摘要幾乎無腦；PDF 看文件結構，純文字型 PDF 效果很好，重度排版的（多欄、表格嵌圖）就會有損傷——這是所有「轉 Markdown」路線的宿命。

## 4. 踩雷筆記

後來陸續有人回報（我自己在 Arch 上也撞到）的坑，都整理進 [README 的 Quick Fix](https://github.com/G36maid/zed-mcp-server-markitdown#%EF%B8%8F-python-314-quick-fix) 了：

- **Python 3.14 / Arch 系環境**：上游的 `onnxruntime` 依賴在 Python 3.14 上會卡住，安裝逾時。解法是繞過 npm wrapper，改用 `uvx` 直接指定 Python 3.13：

  ```json
  {
    "context_servers": {
      "markitdown": {
        "command": "uvx",
        "args": ["--python", "3.13", "markitdown-mcp"]
      }
    }
  }
  ```

- **首次啟動會下載模型**：MarkItDown 用 [Magika](https://github.com/google/magika) 做檔案類型偵測，第一次啟動下載 Python 環境 + 模型可能超過 Zed 的 60 秒啟動 timeout。先自己在終端跑一次 `uvx --python 3.13 markitdown-mcp`，等它連線成功再 Ctrl+C，重啟 Zed 就正常。
- **安全邊界要想清楚**：官方文件明說這個 server 不做驗證、以你當前帳號的權限跑，`file:` URI 可以讀你帳號能讀的**任何檔案**。拿來餵本地可信的 agent 沒問題，但別把它綁到 localhost 以外的介面。

## 當時的評價

整體而言我很滿意這個架構：轉換交給 MarkItDown、包裝交給 npx wrapper、Zed 擴充只負責接線，每一層都站在別人的肩膀上，自己只寫了最薄的一層 glue code。對「文字 agent 吃多媒體」這件事，轉 Markdown 在 2025 年當下確實是最省錢省事的解。缺點當時也清楚：轉換品質天花板在上游（OCR 和語音轉錄只是「能用」等級）、一份 50 頁簡報轉出來照樣是幾萬 token 全部塞進 context、以及整條 Python 依賴鏈在 Arch 這種滾動發行版上很脆。

## 2026 回顧：這個工具鏈被我退役了

一年後再來看這篇文章，重點已經不是「怎麼裝」——**這整套 MCP 路線我已經不用了**，而且原因值得講清楚，因為它是兩個獨立的教訓。

第一個教訓是工具層的：2026 年我的文件轉換改用 [anydoc CLI](https://github.com/firecrawl/anydoc)（Firecrawl 2026 年初釋出的純 Rust 轉換器，MIT），而且把它內建進了我自己的 [moodle-mcp](https://github.com/G36maid/moodle-mcp)。anydoc 一個 binary 吃 Word/PowerPoint/Excel/OpenDocument/RTF/EPUB/CSV/PDF 十四種格式、單一 document model 走同一個 Markdown serializer、中位數轉換低於 5ms、不用 Python 環境不用下載模型——MarkItDown 那一整套 onnxruntime 卡 Python 3.14、Magika 首啟下載、npm wrapper 包 Python server 的脆弱堆疊，在它面前顯得像上一個時代的產物。moodle-mcp 的 `fetch_file` 直接用它把作業 PDF 轉成可讀 Markdown，這條路徑每天在跑，沒有再碰過 MarkItDown。

第二個教訓更根本，也是我現在對 MCP 設計的一個立場：**「檔案轉換」這件事本身其實不太適合做成 MCP tool。**回頭看 `convert_to_markdown(uri)` 的形狀——它是一個純函數式的、無狀態的轉換，輸入一個檔案路徑、輸出一坨文字。這種工作根本不需要「協議」：agent 只要能跑 shell，`anydoc file.pdf` 一行就結束，連 server 都不用起。MCP 的價值在於狀態管理、鑑權、長連線互動——拿它包一個 stdin/stdout 的轉換器，是在用協議的重量去支付一個函數呼叫的成本。我還為此付了額外的代價：60 秒啟動 timeout、Node + Python 雙重依賴、以及 context 裡常駐一個工具描述。

有趣的是，這個判斷後來被工具生態自己印證了。pi 一開始的哲學就是「No MCP——要嘛寫 CLI 工具配 README，要嘛寫個 extension 加 MCP 支援」（[作者的論述](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)很值得一讀）；而 [opencode 2.0 的 Code Mode](https://anoma.ly/notes/opencode-2-0/)往另一個方向解了同一個問題：所有 MCP server 預設轉成函式目錄，模型在受限的 JS 沙盒裡寫腳本組合呼叫——一次 round trip、中間結果不出 context。這兩條路都在緩解「MCP 工具又多又吵」的老問題，也都支持同一個直覺：簡單的確定性工作交給程式碼/CLI，協議留給真正需要協議的事。

所以這篇的正確讀法是：前三節是一份 2025 年有效的、教「怎麼把外部能力接進編輯器 agent」的好教材（Zed 擴充機制那部分今天仍然成立），後兩節是一份 2026 年的撤離報告——工具換成 anydoc，架構判斷從「MCP 萬能」修正為「MCP 只適合需要 MCP 的事」。repo 我留著不刪，畢竟它教會我的事比它提供的功能多。

## 延伸閱讀

- [G36maid/moodle-mcp](https://github.com/G36maid/moodle-mcp)——anydoc 內建所在的 Rust MCP server（`fetch_file`：作業 PDF → markdown）
- [firecrawl/anydoc](https://github.com/firecrawl/anydoc)——2026 年的轉換器首選（Rust、MIT、npx 即用）
- [Zed blog: The Context Outside the Code](https://zed.dev/blog/mcp) — Zed 官方對 MCP 擴充的定位說明
- [Zed docs: MCP Servers](https://zed.dev/docs/ai/mcp) — `context_servers` 設定與自訂 server
- [Mario Zechner: What if you don't need MCP?](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)——「不用 MCP」陣營的論述
- [OpenCode 2.0: Code Mode](https://anoma.ly/notes/opencode-2-0/)——用 JS 沙盒組合 MCP 呼叫的另一條路
- [microsoft/markitdown](https://github.com/microsoft/markitdown) — 轉換引擎本體（MIT）
- 站內相關：[用 AUR 思維替 Zed Editor 做非官方 FreeBSD port](/blog/zed-freebsd-port/)、[cargo-zigbuild 交叉編譯 zed-remote-server](/blog/cargo-zigbuild-freebsd-cross/) —— 兩篇同樣是替 Zed 補齊它沒官方支援的環境
