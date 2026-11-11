---
title: "用 MarkItDown MCP 把無聊課程的教材變成隨查筆記"
description: "把每門課的 PPT/PDF 原始檔放進專案目錄，用 MarkItDown MCP 讓 Zed Agent 隨時把教材轉成 markdown 筆記，課中直接向筆記提問，答案出自真教材所以幻覺少。"
pubDate: 2025-09-17T19:50:40+08:00
category: ai
tags: ["ai", "mcp", "zed", "markitdown", "筆記工具"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1758109840
media:
  - 122120702510958395.jpg
---

> 擴寫自 2025-09-17 的 Facebook 貼文（原稿三行＋一張截圖），擴寫於 2026-11-11，工具版本以當時為準。

大學裡總有那種課程，你會去上課、會抄板書、會繳作業，但實際上心根本不在教室裡。機動學就是其中一門：老師上課用的教材是一份份 pptx 和 PDF 講義，考試範圍全在裡面，可我坐在底下能做的只有滑手機。某天我決定讓 AI 代勞做筆記，把整個流程自動化成一套工作流，截圖裡那個畫面就是成果。

![使用 MarkItDown-MCP 自動整理無聊課程的筆記，左側是課程專案的檔案樹與整理好的 ch2.md 筆記，右側 Zed Agent 正把 PDF 講義轉成 markdown](/media/2025-09/122120702510958395.jpg)

截圖裡是 Zed 編輯器，專案叫 mech，放在 `~/School/ntnu/mech`。左邊檔案樹分兩個目錄：`original_files/` 放原始教材（ch1 的 ppt、pptx、odp，ch2 到 ch7 的 PDF），`notes/` 放轉出來的 markdown 筆記。右邊的 Agent 面板標題寫著「Mechanisms Lecture Notes to Markdown」，Claude Sonnet 4 正把 PDF 講義一段段整理成筆記，跑了大約 29k tokens，跑完按 Keep All 就收工。上課想不起來某個公式的時候，直接在筆記裡搜——整學期的教材變成可以全文查詢的目錄。

整個工作流可以拆成四步：建一個放原始教材的目錄、讓編輯器裡的 agent 能讀懂那些檔案、下 prompt 叫它轉檔、之後把筆記目錄當成隨時查詢的 context。

## 目錄結構

第一件事是把每門課的原始檔集中到一個專案目錄。我用兩個子目錄把「來源」和「產物」分開：

```
~/School/ntnu/mech/
├── original_files/    # 老師發的原始教材，動都不動
│   ├── ch1.pptx
│   └── ch2.pdf ...
├── notes/             # AI 轉出來的筆記
│   └── ch1.md ...
└── README.md
```

原始檔一律不手改，notes 丟了隨時可以重轉。這個分隔很重要：之後跟 agent 對話時，我會明確說「參考 notes/ 底下的筆記」，它就不會去碰原始的 pptx，也不會把兩邊混著講。

## 讓 agent 讀得懂 pptx 和 PDF

[MarkItDown](https://github.com/microsoft/markitdown) 是微軟開源的工具，MIT 授權，專門把各種辦公室檔案轉成 markdown：pdf、pptx、docx、xlsx 都吃，圖片裡有文字的話還會嘗試 OCR。單獨裝一個 CLI 也能用，但真正方便的是它的 [MCP server 版本](https://pypi.org/project/markitdown-mcp/)。

[MCP（Model Context Protocol）](https://modelcontextprotocol.io) 是 Anthropic 提出的開放協議，用來讓 LLM 應用跟外部工具接線，任何人都能寫自己的 MCP server 給任何支援 MCP 的 client 用。這代表我可以把 MarkItDown 包成一個 tool 掛進 Zed 的 agent，之後只要說一句「把 ch2.pdf 轉成 markdown」，agent 就自己呼叫工具、讀內容、寫出筆記，不用我開 terminal 複製貼上。我之前也做過一個給 Zed 用的 MarkItDown MCP server 擴充，這篇講的是使用端。

Zed 這邊的設定寫在 `settings.json`（jsonc 格式）：

```jsonc
{
  "context_servers": {
    "markitdown-mcp": {
      "source": "extension",
      "settings": {
        "command": {
          "path": "uvx",
          "args": ["markitdown-mcp"]
        }
      }
    }
  }
}
```

官方版用 pip 裝（`pip install markitdown-mcp`），以 stdio 模式跑，Zed 會把它當成一個外部 process 養著，agent 需要轉檔時就去呼叫它的 `convert_to_markdown` tool。用 uvx 的好處是不用碰系統 Python 環境。

## 實際轉檔的 prompt 流程

設定好之後，剩下的就是對 agent 說話。我通常開一個新的 agent thread，prompt 大概長這樣：

```text
把 original_files/ 裡的每一份教材轉成 markdown，
存到 notes/ 底下，檔名對應章節（ch1.pdf -> notes/ch1.md）。
轉出來的筆記要保留章節結構和重要公式，圖片位置用文字註明。
```

agent 會自己排程：先呼叫 MarkItDown 把 PDF 轉成 markdown，再按講義的章節段落整理、補上標題層級，最後一次寫入 notes/。截圖裡那次跑的是 ch2，內容是螺旋運動、球面運動這些機動學主題，筆記裡連 `v = ds/dt`、`ω = 2πn/T` 這種公式都保留下來了。跑完 agent 會顯示 Edits 讓你逐檔確認，我通常直接 Keep All——反正 notes 隨時能重轉，出錯的成本很低。

課中或寫作業時，同一個 agent thread 直接問：「ch3 講義裡關於齒輪干涉的定義是什麼？」agent 會去搜 notes/ 底下的 markdown 回答。因為答案能對照到原始教材的頁面，內容不是我憑空聊出來的，幻覺自然就少了。

## 為什麼這樣能杜絕幻覺

關鍵在於 agent 回答問題時拿到的 context 是真教材的逐字轉換，不是模型的記憶。PDF 講義轉成 markdown 之後，agent 用全文搜尋就能精確引用「講義第 X 頁寫了這句」，我也能自己打開 notes/ch3.md 對照原文驗證。模型就算想唬爛，旁邊擺著一份它剛剛才讀過的文件，胡扯的成本很高；就算它真的亂講，我立刻能抓到。

這其實就是 RAG 的手工版：不做向量資料庫，就是把教材變成純文字放在目錄裡，靠 agent 的檔案搜尋去撈。對一份幾十頁的講義來說，根本不需要 embedding，grep 就夠了。

## 效果和缺點

用下來最直接的收益是省時間。每章轉檔加整理大概花幾分鐘，之後整學期隨時可以問。以前上課聽不懂的地方要回家翻 PDF 一頁頁找，現在直接問筆記，答案還能對照原始教材驗證。

缺點也確實有。轉出來的 markdown 對數學公式的還原度普普——講義裡的方程式轉出來常常是亂碼或斷掉的文字，截圖裡 `v = ω(R² - x²)` 那行能保留下來算運氣好，碰上複雜的積分符號或矩陣就慘了。圖片更麻煩，MarkItDown 會把圖片位置標出來但內容得靠 agent 自己從上下文補，這一步就是模型在猜，品質看模型臉色。要是教材排版很花俏（多欄、大量圖表），轉出來的結構會散掉，得手動救。

另一個考量是隱私：把課程 PDF 餵給雲端模型，等於把老師的教材上傳到別人的伺服器。這是我自己的推測，課程內容版權上嚴格來說可能不適合外傳，只是我都用於個人筆記、不散布轉出來的檔案，就先這樣用了。介意的話可以改跑本地模型，只是品質會差一截。

整體來說這套工作流的核心想法很簡單：教材本來就是檔案，只是格式讓人和 agent 都不好讀；把格式問題交給 MarkItDown，剩下的目錄管理、提問、驗證都是 agent 本來就會的事。無聊的課程還是無聊，但至少筆記不用自己寫了。
