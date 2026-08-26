---
title: "Drill-research-lab 第三次例會"
description: "https://github.com/MiaAI-Lab/DeepSeek-v4-Flash-One-DGX-Spark"
pubDate: 2026-08-26 15:45:50 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1787730350
---

| 項目 | 連結 |
|---|---|
| 上次討論 | https://hackmd.io/IREcKfjcTmeQ_k-aYRfjSg |
| Spec（drill-docs） | https://github.com/drill-research-lab/drill-docs |
| GitHub Board | https://github.com/orgs/drill-research-lab/projects/5/views/1 |

## 議題 / TODO


### infra

更新配方
https://github.com/MiaAI-Lab/DeepSeek-v4-Flash-One-DGX-Spark
新增system daskboard
https://github.com/MiaAI-Lab/sparkDash
微調系統
關閉桌面系統(降低顯存負載)
打降溫補丁




### 驗收成果
#### sandbox

agnet path 問題
使用 類似 chroot 的方式修正，他們不會去開認為不存在的 dir

#### writer

[writer](features/paper/spec.md)

保存方式
lsp
模版 + sysmpt prompt
diff
手動存檔 + ctrl+s -> 編譯
LaTeX UI 盡可能讓可視範圍變大
聊天區浮在編輯＋預覽上
寫作區放到左邊工作區下方


non blocking: 
可選 latex 編譯器


#### Wiki
1. [wiki](features/wiki/spec.md)

完成 issue 內需求
允許 main agent 調用

#### Pipeline

3. [pipeline](features/pipeline/spec.md)
尚未完成
已經在 hermes 內實現，驗證成功


## rebase 上游

0.1 rc5 (我們在這裡)
0.1 rc7
0.2 rc1
0.2 rc2 (上游在這裡)


## 確認整合_> 對接

## 跑 end to end

## 下次開會

週日 0830 晚上十點

issue review ，嘗試對接


## 下下次
對接成功。

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
