---
title: "LLM 供應商也要搞 3-2-1 原則：3 個模型、2 個雲端訂閱、1 個地端"
description: "把備份界的 3-2-1 原則搬到 LLM 供應商：3 個不同實驗室的模型、2 個不同家的雲端訂閱、1 個不依賴雲端的地端部署，附我自己的 zai coding plan + 2× DGX Spark 現況。"
pubDate: 2026-08-25T07:55:03+08:00
category: ai
tags: ["llm", "backup", "opencode", "dgx-spark", "local-llm", "3-2-1"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1787615703
---

> 本文擴寫自 2026-08-25 的 Facebook 貼文（原稿一句話：「LLM 供應商也要搞3-2-1原則, 3個不同模型, 2個雲端訂閱, 1個地端.」）。擴寫於 2026-11-27，正文保留發文當時的硬體與工具現況，工具鏈的後續變化見文末 update。

備份界有條念了十幾年的老規則：**3-2-1**——重要資料留 3 份副本、放在 2 種不同媒體上、其中 1 份異地保存。US-CERT 的《[Data Backup Options](https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf)》把它寫成標準建議：1 份主要加 2 份備份、2 種媒體防不同災害、1 份異地。[Veeam 的官方部落格](https://www.veeam.com/blog/321-backup-rule.html)也拿它當 baseline，近年因為勒索軟體會直接打備份，升級成 3-2-1-1-0——多一份不可變副本。

今年 8 月底我在 Facebook 貼了一句話：LLM 供應商也要搞 3-2-1 原則。把「資料」換成「每天賴以寫程式的 LLM 供應商」，這條規則照樣成立，而且越是把工作流整個交給 coding agent 的人越需要。

## 訂閱制也有 failure domain

備份要 3-2-1，是因為任何單一副本都可能瞬間消失：硬碟壞、火災、勒索軟體連備份一起加密。LLM 訂閱的同構風險只多不少：服務 5xx 一整個下午、帳號被風控誤鎖、方案改約漲價、限流收緊、模型下架。你的 AGENTS.md、prompt 手感、跑一半的長 session 全綁在同一家 API 上——這就是沒備份的生產資料。

## 3 個不同模型

關鍵字是「不同」：三個模型要來自不同實驗室、不同架構。同一家內部挑三個，等於把備份副本放在同一組 RAID 陣列上——上游改一版 API、調一次對齊策略，三個一起變。GLM 這種 MoE、DeepSeek 的稀疏 MoE、Claude 這種閉源旗艦，訓練資料與失效模式互不相干，一家出狀況，另外兩家不會跟著倒。平常哪個順手用哪個就好，出事時有地方去。

## 2 個雲端訂閱

「2 種媒體」防同一種媒體一起壞；對應到訂閱，就是兩家不同供應商——計費、限流、營運風險各自獨立，一家燒起來另一家還站著。我自己目前的主力是 [z.ai](https://z.ai/blog/glm-5.3) 的 GLM coding plan（glm-5.3-flash），第二個雲端訂閱的挑選原則就一條：別買同家的第二個方案，那只是多付一份月費，備援價值是零。

這條還有個前提：agent 工具必須換供應商不用重練。我前一陣子用了整整一個月的 [oh-my-opencode](/blog/oh-my-opencode-one-month/)，它把工作流全打包成預設值，設定好了確實爽，但帳單和對單一生態的綁定程度都讓我後來收斂回純 [opencode](https://opencode.ai/)。工具越 provider-agnostic，切換供應商的成本越低，第 2 個雲端訂閱才買得便宜。

## 1 個地端

「1 份異地」對應到 LLM，就是一個不依賴任何雲端的本地部署：帳號被鎖、網路斷線、供應商收掉，照樣能跑。我的地端是兩台 [DGX Spark](https://docs.nvidia.com/dgx/dgx-spark/hardware.html)：貼這句話的當下跑的是 llama.cpp 的 DeepSeek-V4-Flash UD-Q2_K_XL——後來就是靠這套讓 pi agent 自己打完 [AoC 2025](/blog/dgx-spark-deepseek-pi-agent-aoc/)；五天後換成 [GLM-5.3-Flash EXL3](/blog/exl3-glm-local-deploy/)，vLLM 在兩台 Spark 上 TP=2 分散式推論。踩到的取捨很實際：EXL3 4-bpw 在 Spark 這種記憶體大、頻寬小的機器上 decode 很香、prefill 很痛，一度認真考慮回歸 NVFP4。

地端還有雲端訂閱給不了的東西：長 session 開到飽只有電費，沒有中間商賺 token。

## 2026-11 update

三個月過去，工具鏈收斂了很多：oh-my-opencode 已停用，現在是純 opencode + zai glm-5.3-flash 一條龍。3-2-1 本身沒變——zai 當主力、Spark 地端常駐、第二個雲端訂閱按專案需求輪替。「3 個不同模型」要補一句：它是保險額度，平常未必用得滿；真的遇到限流、下架、降智的時候，才知道那兩條退路值多少錢。
