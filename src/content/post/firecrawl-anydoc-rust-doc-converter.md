---
title: "Firecrawl anydoc：把 14 種辦公文件轉成 Markdown 的 Rust 函式庫"
description: "Firecrawl 開源的 anydoc 用純 Rust 把 Word、PowerPoint、Excel、OpenDocument、RTF、EPUB、CSV 與文字型 PDF 統一轉成 GitHub 風格 Markdown，官方實測中位數 4.4ms。本文整理實查的支援格式清單、CLI 用法、Cargo.toml 依賴、與 markitdown／pandoc 的 benchmark 對比，附本機 prebuilt binary 的轉換實測，並標註官方數據的利益關係與 open issues 回報的限制。"
pubDate: 2026-08-05T11:55:17+08:00
category: programming
tags: ["rust", "markdown", "llm", "document-conversion"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1785902117
---

> 本文擴寫自 2026-08-05 的臉書連結分享，當時 anydoc 才開源兩天、上線版本是 v0.1.2；擴寫於 2026-11-22，實查版本為 v0.2.5。

把文件餵給 LLM 之前先轉成 Markdown，已經是標準前處理：Markdown 夠扁平，模型讀標題層級和表格也遠比讀 OOXML 的 XML 樹或 PDF 的座標流順。亂源在「怎麼轉」——docx、xlsx、pptx、odt 的 parser 各家各套，同一份報告用不同工具轉出來，標題記法、表格跳脫、清單縮排經常對不上。Python 系工具還有第二個毛病：依賴樹重，docling 光 torch 就要抓兩 GB，批次跑幾百份文件時程序啟動成本比轉換本身還高。Firecrawl 在 2026 年 8 月開源的 [anydoc](https://github.com/firecrawl/anydoc) 針對的就是這件事：純 Rust、MIT 授權、單一 binary，把常見辦公文件一律轉成 GitHub-Flavored Markdown，官方宣稱單份文件中位數轉換時間不到 5ms。

## 支援格式

官方說法是「14 種格式」，逐項列出是：docx、doc、docm、xlsx、xls、xlsm、pptx、ppt、rtf、odt、ods、odp、epub、csv——這是[發布公告](https://firecrawl.dev/blog/anydoc-and-pdf-inspector)裡給的清單，PDF 不算在內、是額外的第十五項，由同公司的 [pdf-inspector](https://github.com/firecrawl/pdf-inspector) 處理。repo 的 README 表格則按副檔名列得更細，連 .pps、.pot、.ppsx、.ppsm、.xlsb 這種邊角都吃。掃描版 PDF 不做 OCR：遇到影像頁會回 `NeedsOcr`，CLI 加 `--ocr hosted` 可以把文件送去 Firecrawl Parse 的 OCR 服務（免註冊；純 Rust crate 無此選項、也不發網路請求）。

## 安裝與使用

不必裝 Rust 工具鏈，npx 會抓平台對應的 prebuilt binary：

```bash
npx @firecrawl/anydoc report.docx               # Markdown 輸出到 stdout
npx @firecrawl/anydoc slides.pptx -o slides.md  # 或寫入檔案
npx @firecrawl/anydoc - --format csv < data.csv # stdin 需要 --format csv
anydoc scan.pdf --ocr hosted                    # 掃描頁送 Firecrawl Parse
```

要常駐指令就 `npm install -g @firecrawl/anydoc`。其他入口：Rust 用 `cargo add anydoc`，Python 用 `pip install firecrawl-anydoc`，瀏覽器有 WASM 版 `@firecrawl/anydoc-wasm`（官方[線上 demo](https://firecrawl.github.io/anydoc/) 就是它，檔案不出本機），四個入口的 API 都是 `to_markdown`／`toMarkdown` 一顆函式。它還附了 Agent Skill：`npx skills add firecrawl/anydoc`，裝完 Claude Code、Codex、Cursor 這類 agent 遇到讀不了的辦公文件會自己去叫 CLI。

## 實測

本機以 npx 安裝 v0.2.5 prebuilt binary 實測，樣本是我用 Python stdlib 手刻的最小 OOXML 檔（docx 含標題、粗體、表格與清單定義；xlsx 含 inline string 與數字欄；另備 csv 和合規轉義的 rtf）。結果：docx 的標題正確映射成 `#`/`##`、粗體保留、表格轉成 GFM 表格；xlsx 與 csv 輸出完全相同的表格；rtf 的粗體斜體都在。把 docx 改名成 .txt 再丟進去，內容偵測照樣正確轉換。計時連跑 20 次 xlsx，中位數 0.37 秒——這含 node 程序啟動與 npx 解析，官方的 4.4ms 是扣除 spawn 後的純轉換時間，兩者別混著比。

兩個樣本層面的觀察：RTF 非 ASCII 內容必須照規範用 `\'xx` 或 `\uN` 轉義，我第一版直接塞 UTF-8 位元組，輸出整頁亂碼；我手刻的 numbering 定義在輸出裡沒長出清單記號，真實 Word 檔的 numbering.xml 更完整，這點我沒用真實檔案驗證過，不定案。品質極限部分我沒跑過大型語料，引用官方 benchmark 與 open issues 的回報：[#233](https://github.com/firecrawl/anydoc/issues/233) 指儲存格數字格式永遠輸出 en-US 分隔符；[#224](https://github.com/firecrawl/anydoc/issues/224) 是全空欄位的表格欄被丟棄；[#220](https://github.com/firecrawl/anydoc/issues/220)、[#221](https://github.com/firecrawl/anydoc/issues/221) 是 PPTX 圖表數值在 cache 有缺口時會位移。

## 底層與輸出一致性

從 [Cargo.toml](https://github.com/firecrawl/anydoc/blob/main/Cargo.toml) 實查，依賴只有八個：cfb（OLE 複合檔，對付 .doc/.xls/.ppt 這些上古格式）、quick-xml、zip、csv、flate2、encoding_rs、log，加上自家 pdf-inspector。沒有 calamine、沒有 lopdf、也沒有叫 pandoc，各格式的 parser 全部從零寫，所以沒有 ML 模型、沒有系統依賴——markitdown 134.8ms、docling 513.6ms 的中位數裡有一大段是 Python 直譯器和模型載入，anydoc 的 4.4ms 是純解析。

輸出一致性的設計在架構圖裡寫得很白：每種格式先解析進同一個 Document model（blocks、inlines、tables、footnotes、assets），再走單一 GFM serializer，表格跳脫的 bug 修一次，docx、rtf、odt 全部受惠。格式偵測也是看內容不看副檔名：PDF header、RTF 開放群組、OLE stream 名稱、ZIP package mimetype。

## 跟 markitdown、pandoc 比

數字來自 README 的 benchmark：100 份真實文件、Claude Sonnet 5 對照 LibreOffice 渲染頁盲評，共 482 次 verdict。

| 工具 | 格式覆蓋 | 中位時間 | 總分 |
| --- | --- | --- | --- |
| anydoc | 14/14 | 4.4ms | 81 |
| markitdown（Microsoft） | 6/14 | 134.8ms | 65 |
| pandoc | 5/14 | 102.1ms | 56 |
| docling | 4/14 | 513.6ms | 57 |
| LibreOffice | 12/14 | 1129.5ms | 40 |

先講這張表的利益關係：Firecrawl 自家跑的，corpus 不可轉散、repo 裡沒有，第三方無法重現，judge 又是 LLM，當相對量級參考就好，別當絕對分數。就算打個折扣，格局面的事實仍然成立：markitdown 只碰 6 種格式，pandoc 5 種——pandoc 快、輸出品質也不差，但 xlsx、pptx、xls 這類常見格式根本不支援，真實 pipeline 收到混合文件還是得再拼一套工具；docling 的 513.6ms 主要是模型成本。per-format 表另見 mammoth：docx 單項 70 分輸 anydoc 的 88，輸出乾淨，但只做 docx。

生態定位值得記一筆：anydoc 就是 Firecrawl Parse 的本機引擎，[/parse](https://firecrawl.dev/blog/anydoc-and-pdf-inspector) 收到非 PDF 文件交給它，PDF 交給 pdf-inspector；自己跑 library 和打 hosted API，拿到的是同一套轉換。

## 個人評價

優點很集中：一個 binary 吃下整個辦公文件光譜、輸出風格統一到可以直接寫進 prompt 模板、依賴樹輕到能塞進任何 pipeline、MIT 授權、Node/Python/WASM/CLI 四個入口 API 一致，錯誤型別分得清楚（`Encrypted`、`NeedsOcr`、`ResourceLimit` 各自命名）。缺點就寫在這裡：benchmark 自家跑、不可重現；Markdown 的天花板本來就低，合併儲存格攤平、PPT 動畫、Word 版面這些資訊注定留不下來；上列 issues 顯示數字分隔符、空表格欄、圖表數值這些邊角還在修；OCR 一旦要解掃描 PDF 就綁回 Firecrawl 自家服務，離線場景只能自己接 tesseract。我的取捨是：混合格式、量大的 LLM 前處理用 anydoc，本來就有 pandoc 且只處理純文字類格式的場景不必換。
