---
title: "把 MarkItDown 包成 Zed Extension：mcp-server-markitdown 開發與上架記"
description: "看到有人在推 MarkItDown，才想起我三個月前就替它寫了 Zed Editor 的 extension 並上架官方 registry。這篇補完當時的開發動機、包裝架構與使用心得。"
pubDate: 2025-12-04T10:22:42+08:00
category: ai
tags: [ai, zed, mcp]
draft: false
source: facebook
sourceType: "分享的貼文"
sourceTimestamp: 1764814962
---
> 本文擴寫自 2025-12-04 的 Facebook 貼文。當時看到有人在 FB 上推薦 Microsoft 的 MarkItDown，而我三個月前剛好替它寫了 Zed Editor 的 extension 並上架官方 registry，於是回了一篇推坑文。原文只有一句話：「推 剛好我有幫 Zed Editor 寫了對應的 Extension，喜歡用 Zed 的朋友可以直接在編輯器內調用」。

## 為什麼需要 MarkItDown

LLM agent 有個很現實的限制：它只吃文字。你把一份 PDF、一份 PPTX 丟給 assistant，它要嘛讀不了，要嘛得靠多模態模型硬看，而且看過的東西也很難留在 context 裡反覆查詢。Microsoft AutoGen 團隊在 2024 年 11 月開源的 [MarkItDown](https://github.com/microsoft/markitdown) 就是衝著這個問題來的：把 PDF、Word、Excel、PowerPoint 轉成 Markdown，圖片走 OCR、音訊走轉錄，網頁和 CSV/JSON/XML 也通吃，讓純文字的 agent 也能消化這些「不是純文字」的資料。這個專案爆紅得很快，寫這篇貼文的 2025 年 12 月初，GitHub 上已經累積八萬多顆星星，差不多是同類文件轉換工具的事實標準。

它的 [官方 MCP server](https://github.com/microsoft/markitdown/tree/main/packages/markitdown-mcp) 只暴露一個工具：`convert_to_markdown(uri)`，`uri` 可以是 `http:`、`https:`、`file:` 或 `data:`。介面小到不能再小，但也正因為這樣，接上任何支援 MCP 的 client 都是幾行設定的事。

## Zed 當時的缺口

2025 年 9 月我的主要編輯器是 Zed。它的 Assistant 已經支援 MCP，官方稱這類 server 為 context server，但接 MCP server 的方式是直接改 `settings.json`——自己寫 command、自己管 Python 環境。MarkItDown 的 MCP server 是 Python 套件，跑 `uvx markitdown-mcp` 就起得來，可對不想碰終端機的 Zed 用戶來說，門檻就卡在「你得知道 uvx 是什麼」。

那陣子 Zed 剛把 extension registry 開放到 MCP server 類型，我就把包裝寫了出來，也就是 [mcp-server-markitdown](https://zed.dev/extensions/mcp-server-markitdown)。目的很單純：讓 Zed 用戶在 extension 頁面按一個安裝，Assistant 裡就能直接叫 MarkItDown 轉文件，不用自己組 command line。

## Extension 本體在做什麼

Zed 的 extension 是用 Rust 寫、編譯成 WebAssembly 跑的，原始碼放在 GitHub repo 之後，再以 submodule 的形式掛進 [zed-industries/extensions](https://github.com/zed-industries/extensions) 這個總倉庫，官方 registry 才會列出來。整個 extension 的 Rust 部分做的事情不多：宣告自己是 context server、把上游 MCP server 的啟動命令接進來、暴露設定介面。

真正的轉換邏輯一行都不在我手上。上游是 Python 寫的 `markitdown-mcp`，但 Zed 啟動 context server 時不一定有合適的 Python 環境，所以我選了 [markitdown-mcp-npx](https://www.npmjs.com/package/markitdown-mcp-npx) 這個 npm wrapper 當載體，靠 Node 的 `npx` 把上游跑起來——Zed 的環境裡有 Node 的比例遠比有乾淨 Python 環境高。extension 提供一個 `package_version` 設定，預設 `latest`，想鎖版本的人可以自己指定。

從 [repo 的 commit 歷史](https://github.com/G36maid/zed-mcp-server-markitdown/commits/main/) 看得出這是個週末專案：9 月 16 日 init 和 prototype，9 月 17 日收尾，9 月 25 日上架 registry 更新到 0.0.1。整個 repo 100% Rust、MIT 授權、十四個 commit，轉換能力全部來自上游。

## 實際用起來像什麼

裝好之後在 Assistant 裡就是多了一個可呼叫的工具。幾個我實際用過的場景：

- 課堂上教授丟的 PPTX 或 PDF，直接叫 agent「把這份講義轉成 markdown 並整理重點」，轉出來的東西可以留在工作目錄裡當成可查詢的知識庫，之後的問答都引用同一份文本，比每次讓模型憑記憶重講一遍可靠得多。
- 網頁文章：丟 `https://` 的 URL 進去轉成 Markdown 再摘要，繞過一堆網站不給 raw text 的問題。
- Excel 報表：轉成 Markdown 表格後讓 agent 挑欄位、算摘要，比截圖給多模態模型看還準。

「把文件先轉成文字再餵 agent」這件事的價值不只是省 token：文字化的中間產物可以進版本控制、可以 diff、可以給多個 agent 共用。Anthropic 後來那篇講 code execution with MCP 的文章把這個思路講得更透，方向是一致的——能變成檔案和文字的東西，就不要塞在對話裡。

## 這個 extension 的侷限

先說清楚它有多薄：它就是個包裝器，MarkItDown 的 bug 就是它的 bug，上游的 Python 依賴問題它一個也躲不掉。npx wrapper 是第三人寫的（xkiranj），等於我的 extension 還多依賴一層別人的維護。後續也確實遇到過：Arch 系發行版升上 Python 3.14 之後，`onnxruntime` 相依會卡住安裝，README 補了一整套改用 `uvx --python 3.13` 直連上游的 workaround。諷刺的是，那個 workaround 的形態反而繞回了 extension 想消滅的手動設定——工具鏈成熟之前，包裝器能省的痛就是有限。

另外 Zed 對 context server 的 UI 支援在 2025 年底還很陽春，沒有像 VS Code 那樣的 MCP 面板，設定都得進 `settings.json`。extension 解決的是「裝」的問題，「用」的體驗還是 Zed 本體在決定。

## 2026-11 update

回頭看這個專案的數據：registry 顯示的累積下載已經超過 44,000 次，對一個 0.0.1 之後就沒再發新版的包裝器來說算意外的好。上游 MarkItDown 也還活躍，0.1.8 把 MCP server 遷到了 MCP SDK 2.x 以相容 2026-07-28 之後的 client spec。我自己後來的 agent 工具鏈換了好幾輪，但「文件先轉 Markdown 再進 context」這個模式一路沒變，這大概是這個週末專案最值得的部分。

## 延伸閱讀

- [mcp-server-markitdown 在 Zed Extension Registry 的頁面](https://zed.dev/extensions/mcp-server-markitdown)
- [zed-mcp-server-markitdown 原始碼](https://github.com/G36maid/zed-mcp-server-markitdown)
- [Microsoft MarkItDown](https://github.com/microsoft/markitdown) 與 [官方 markitdown-mcp](https://github.com/microsoft/markitdown/tree/main/packages/markitdown-mcp)
- 站內相關：[用 AUR 思維替 Zed Editor 做非官方 FreeBSD port](/blog/zed-freebsd-port/)（同樣是把軟體包裝進生態系的思路）、[讓 agent 用寫程式的方式呼叫 MCP](/blog/mcp-code-execution-mode/)、[Zed Remote 為什麼不做成 VS Code Server](/blog/zed-remote-architecture/)
