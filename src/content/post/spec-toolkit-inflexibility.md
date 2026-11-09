---
title: "用 spec-toolkit 反而讓我難以介入"
description: "Spec Kit 的 spec-driven 流程把我的 AI 協作變成「訂規格然後等待」——一段關於彈性、pair programming 體驗與便宜模型寫 spec 的成本風險的戰爭故事。"
pubDate: 2025-11-15T22:52:54+08:00
category: ai
tags: ["spec-driven-development", "claude", "gemini", "agents-md", "ai-coding"]
draft: false
source: "facebook"
sourceType: "分享的貼文"
sourceTimestamp: 1763218374
---

> 本文擴寫自 2025-11-15 的 Facebook 貼文。文末的 2026 回顧是原文沒有的：一年之後，立場變了很多，與其修修補補不如把轉變整個寫出來。

「大部分同意，用 spec-toolkit 反而讓我難以介入。我仍然是想要 pair programming 的體驗，但是 spec 一旦訂好就極度缺乏彈性。我還是喜歡自己寫 AGENTS.md 跟 SPEC.md。而且因為我用便宜的 Gemini 進行所有 spec 的編寫以節省 Claude 用量，但完全遵守 Gemini 的 spec 本來就會出現問題。」

這段話是我用 GitHub 的 Spec Kit 幾個禮拜之後的心得。它是我當時最想說、卻也最難在三分鐘內講清楚的一段。

## Spec-first 為什麼缺乏彈性

Spec Kit 的流程很完整：先用 `/speckit.constitution` 定下專案原則，接著 `/speckit.specify` 寫需求、`/speckit.plan` 決定技術方案、`/speckit.tasks` 拆任務，最後才讓 agent 進場實作。這套流程把整個開發過程前置成一連串文件審查——聽起來很嚴謹，實務上卻假設了一件事：**你在動手寫第一行 code 之前，就已經知道自己要什麼。**

我的經驗恰好相反。需求是在實作中演化的。很多「spec 裡寫錯了」的東西，是我在實作到一半時才發現的：某個資料結構的形狀不對、某個邊界條件原來存在、某個原本覺得必要的功能其實多餘。在 spec-first 的世界裡，這些發現代表的是：回去改 spec、重跑 plan、重新拆 tasks、再重新 implement。每次需求的微調都要走完一輪文書作業，而不是直接在 code 上折騰五分鐘。這對玩具專案或 side project 是災難——改動的成本大到我乾脆不想改了。

這不是 Spec Kit 獨有的問題，而是整波 spec-driven development 的結構性限制：它把「文件正確」當成「實作正確」的前提，但真實的軟體開發裡，正確性往往是從實作往回滲透到文件的。

## 我要的是 pair programming，不是交接文件

更根本的不滿是體驗層次的。Spec Kit 的官方敘事說得很明白：「你的角色是 steering，coding agent 負責大部分的撰寫。」換句話說，它的理想工作模式是：你寫好規格，退到審查者的位置，等 agent 交回一堆符合規格的 code 再驗收。

這比較像發包給外包廠商，比較不像 pair programming。我想要的是那種一來一往：我寫一段、agent 接著改、我中途插話說「這樣記憶體會爆，換個做法」、它立刻調整。這種工作方式裡，知識是流動的、決策是即時的，spec 只是一個鬆散的共識背景。而 spec-toolkit 把 spec 變成了合約——合約一旦簽了，任何改動都是一筆文書成本。

## 混合模型的成本帳：便宜模型寫 spec 的風險

我的工作流還有另一層問題。Claude 的用量很貴，所以我讓便宜的 Gemini 負責所有 spec 的撰寫，Claude 只做實作。這在帳面上很省，但等於把「決定這個專案長什麼樣」的最關鍵階段外包給了品質較弱的模型，而把執行階段交給強模型——方向反了。Gemini 寫出來的 spec 未必是錯的，但會有微妙的偏差：過度指定實作細節、漏掉它沒想到的邊界條件、或在 plan 階段做了我會後悔的技術選擇。而 Spec Kit 的流程恰恰強調「完全遵守 spec」：implement 階段是照著 `tasks.md` 一條條執行的。Gemini 的偏差於是被制度性地放大成整個專案的偏差，Claude 只是忠實地實現了一個有問題的計畫。

誠實地說，這個問題有一部分是我自己造成的——如果 spec 由我本人（或至少由 Claude）來寫，spec-first 也許不會那麼糟。但這就回到成本問題：我要省 Claude 用量的前提，本來就是不要讓它做前置文書。

## 我的替代做法：手寫 AGENTS.md 與 SPEC.md

所以我退回了土法煉鋼：自己維護一份 `AGENTS.md` 和一份鬆散的 `SPEC.md`。AGENTS.md 這個慣例源自 2025 年 8 月 OpenAI Codex 團隊與多家工具廠商的協作，現在被 Codex、Claude Code、Cursor 等大多數 coding agent 原生讀取。它沒有 schema、沒有流程、沒有必填欄位——就只是一份 markdown，告訴 agent 這個專案怎麼 build、怎麼 test、哪些地方不要碰。

這正是我喜歡它的地方：**它是持續在變的備忘，而不是一次訂死的合約。** 我可以在實作中途任何時刻修改它，agent 下一次讀到就是新的規則。SPEC.md 同理——它是我腦內需求的粗略外化，隨實作演化，不承諾完整性。這種做法當然有缺點：沒有 constitution 的莊嚴性、沒有 tasks.md 的可追蹤性、專案一大就會失序。但對我這種一個人、多個 side project、需求天天變的開發節奏，它的修改成本幾乎是零。

## 當時的結論

寫完上面這些之後，我當時的立場是「有條件的保留」：spec-driven 的理念我大部分同意，Spec Kit 也沒有完全丟掉——需求穩定、動手前就知道全貌的工作（接案有完整規格、多 agent 分工、改一個字很貴的正式專案）仍然值得用。但在需求還在演化的個人專案裡，我還是想自己握著方向盤。

## 2026 回頭看：上面的保留都太客氣了

一年過去，再翻出這篇舊文，我想把話說得更直白：**spec toolkit 對我來說根本就是垃圾——不是「有條件的保留」，是確認放棄。**當年那段「需求穩定時還是值得用」的善意推測，一年裡一次都沒有兌現過。

原因是那個前提從來不成立。回頭盤點我 2026 年寫的所有東西——side project、開源工具、研究 pipeline、課程專題——沒有任何一個是「動手前就知道全貌」的。更麻煩的是，2026 年的 agent 變強之後，spec-first 的成本結構整個崩壞了：以前「先想清楚再動手」是因為 agent 每一輪迭代又慢又貴，文書作業省下來的重工很划算；現在模型便宜到可以直接在 code 上試錯五輪，spec 流程省下的那點重工反而抵不上它自己產生的文書成本。當年說「接案有完整規格時值得用」，後來真的接到這種案子，我發現客戶給的「完整規格」到實作第三天就有三處要改——spec 越是號稱完整，過期得越快。

最後連我自己寫的 AGENTS.md/SPEC.md 路線也演化了：SPEC.md 現在很少維護，需求直接寫進對話；AGENTS.md 只留 build/test 指令和幾條硬規則，其他一切以實際 code 為準。整個 2025 年底那場「怎麼把 spec 做對」的糾結，方向本身就不對——該糾結的是怎麼讓實作循環夠便宜，讓「先改 code 再說」永遠比「先改 spec」快。2026 年的答案就是這樣，而且它讓 spec-toolkit 的整套儀式顯得多餘。

References:

- [github/spec-kit — Spec-Driven Development toolkit](https://github.com/github/spec-kit/)
- [Spec-driven development with AI: Get started with a new open source toolkit — GitHub Blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [Spec Kit Quickstart（constitution / specify / plan / tasks 流程）](https://github.com/github/spec-kit/blob/main/docs/quickstart.md)
- [AGENTS.md — 開放的 agent 指引檔慣例](https://agents.md/)
