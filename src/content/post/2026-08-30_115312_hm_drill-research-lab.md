---
title: "Drill-research-lab 第二次例會"
description: "測試項目、測試方法（?）"
pubDate: 2026-08-30 11:53:12 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1788061992
---

| 項目 | 連結 |
|---|---|
| 上次討論 | https://hackmd.io/KRxOXDKvTa2itKHGeof6DA |
| Spec（drill-docs） | https://github.com/drill-research-lab/drill-docs |
| GitHub Board | https://github.com/orgs/drill-research-lab/projects/5/views/1 |

---

## 議題 / TODO

### 1. 測試計畫

測試項目、測試方法（?）

- **人來測試**：系上的、朋友、自己
- **Agent 測試**
- **CI**：已 enabled（是否符合需求尚不確定；目前狀態為 failed，不確定是上游還是我們的問題）

### 2. Demo 展示流程

- 從頭到尾，調查到生成報告，都在一個平台上完成
- 展示流程：`pipeline` → `wiki` → `writer` → `latex reader` → `pdf`

---

## 老紀需求

> 完整原文與逐項討論結果見 [requirements/2026-08-19-neokent-followup.md](requirements/2026-08-19-neokent-followup.md)。

| # | 需求 | 說明 |
|---|---|---|
| 1 | 翻譯頁面 | 左側 UI 有獨立入口，不需要進聊天。上傳檔案 → 翻譯 → 直接預覽結果 → 可下載。本質上是 file-in / translated-file-out 的工具。 |
| 2 | 定時搜尋 | 設定關鍵字、搜尋來源、執行頻率，後端建立排程，定期搜尋相關資料集。屬 background scheduled job，不需要使用者一直開著頁面。 |
| 3 | PDF 預覽 | 在聊天裡，若 Agent 產生或修改了 PDF，訊息上直接提供「預覽」與「下載」；點預覽就在 DSH 裡看，不需要先下載到本機再開。 |
| 4 | 論文預覽 | 自行上傳的論文，或定時搜尋找到的論文／檔案，都能在左側 UI 直接選取並預覽。即「資料庫／論文庫 + viewer」。 |
| 5 | 工作區 | 屬 UI 組織層：把翻譯、論文、資料集、筆記等能力集中到一個 Workspace 區域，而不是全部塞在聊天頁。 |
| 6 | 共用資料集 | 過往已搜尋的部分可以直接取用，不需要重新跑。 |
| 7 | 筆記本 | 重點不是自由寫筆記，而是整理每個 conversation 的重點：session 結束後可得到本次討論的結論、重要資料、下一步，之後從 Notebook 回頭看。 |

---

## 優先進行

1. [wiki](features/wiki/spec.md)
2. [pipeline](features/pipeline/spec.md)
3. [writer](features/paper/spec.md)

> 進度追蹤：[GitHub Board](https://github.com/orgs/drill-research-lab/projects/5/views/1)

---

## Deadline / 下次開會

- **8/26（三）晚上**（暫定）
