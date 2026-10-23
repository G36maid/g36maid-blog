---
title: "AI 搞炸生產環境：我預言的那場災難，真的發生了"
description: "我一直覺得未來必定會發生「AI 修改 Terraform 等 IaC，人類在 Code Review 漏看幾行，最終生產環境被搞炸」的災難。沒想到 2026 年 2 月底，這個事情就發生了——DataTalks.Club 的 Claude Code 對生產環境跑了 terraform destroy。"
pubDate: 2026-03-07T03:17:53+08:00
category: ai
tags: ["ai", "devops", "terraform", "claude-code", "security"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1772824673
---

> 本文擴寫自 2026-03-07 的 Facebook 貼文草稿，以下引用段落為當時的原始紀錄。

## 預言

雖然我個人因害怕、或是了解了開發與生產環境的隔離而能安全控管 AI，但我一直覺得未來必定會發生「AI 修改 Terraform 等 IaC 程式碼，卻因人類在 Code Review 時漏看幾行，最終導致生產環境被搞炸」的災難。

沒想到這個事情今天就發生了。

## 發生了什麼

2026 年 2 月 26 日晚上，DataTalks.Club（一個超過十萬學員的線上學習平台）創辦人 Alexey Grigorev 想把 side project「AI Shipping Labs」從 GitHub Pages 搬進既有的 AWS Terraform 架構裡省點錢。Claude Code 一開始就建議他不要這樣做——兩個環境應該分開管理——他否決了這個建議。

接下來的連鎖反應，是教科書等級的災難鏈：

1. 他換了新電腦，**Terraform state file 沒跟著搬**。`terraform plan` 看不到任何既有資源，把整個生產環境判定成「待建立的新資源」。
2. 他中途取消 apply，請 agent 用 AWS CLI 清掉重複建立的資源。
3. Claude Code 為了做比對，**自行解壓縮了舊的 Terraform 封存檔，覆蓋掉當前的 state file**——現在 Terraform「知道」生產環境的所有資源了。
4. 清理工作變得複雜時，agent 決定升級手段：「I will do a terraform destroy. Since the resources were created through Terraform, destroying them through Terraform would be cleaner and simpler.」
5. Grigorev 看了這段輸出，覺得合理，沒有阻止。auto-approve 開著，沒有任何確認提示。

PostgreSQL 資料庫、VPC、ECS cluster、load balancer、bastion host，全部消失。連自動備份都是 Terraform 管理的，一起被刪了。兩年半的學生作業資料瞬間歸零，平台離線約 24 小時，最後靠 AWS 內部才找得到的 snapshot 救回來。

## 我預言錯了哪裡，又對了哪裡

我原本預想的劇本是「AI 改了幾行 Terraform，人類在 Code Review 漏看，merge 進去之後炸」。實際發生的版本更糟：**根本沒有 Code Review 這個關卡**。Agent 不是遞交 PR 等人審——它直接在終端機裡執行 `terraform destroy`，人類的角色退化成「看到輸出覺得合理就按 Enter」。

但核心預測是對的：出事的那個環節，永遠是人類的注意力。Grigorev 自己在事後報告裡也承認，錯在他過度依賴 agent。諷刺的是，agent 在第一步就警告過他；他沒聽，後來卻把「agent 覺得合理」當成了安全訊號。人類監督的悖論就在這裡：我們一邊不聽 AI 的警告，一邊又盲信 AI 的判斷。

## 這場事故的三個教訓

**State integrity 是 IaC 的生命線。** 本地 state file 本身就是反模式——state 應該放 S3 + DynamoDB lock（或 Terraform Cloud）這種遠端 backend，換電腦、換人才不會出現「state 憑空消失」的劇本。Gruntwork 的分析把這次事故歸因於 local state、state integrity 和 direct CLI execution 三個疊加的常見壞習慣，而不是「AI 太危險」。

**破壞性操作必須有物理性的關卡。** `terraform destroy` 這種指令，在生產環境應該要求人類明確輸入確認、甚至要走獨立的審批流程。auto-approve 加上一個「自主升級手段」的 agent，等於把鑰匙交給了一個推理鏈很長但沒有後果感的實體。

**Agent 的權限要最小化。** 那個 agent 拿著能碰生產環境全部資源的憑證。規劃與執行沒有分離，任何指令都能直接改動或刪除基礎設施。就算要讓 agent 碰 IaC，也應該是它出 plan、人類 apply——Grigorev 事後也是這樣改的：完全禁止 agent 執行 Terraform 指令。

## 我的立場

我還是會用 AI 寫 Terraform，但我把界線畫得很清楚：AI 可以生成、修改、解釋 IaC，但 apply 和 destroy 的按鍵在我手上，state 在遠端，權限開最小。開發與生產環境的隔離不是偏執，是這行唯一沒有變過的東西——變的只是現在站在終端機前面的，換成了一個語氣很有說服力的 agent。

這次死的是一個課程平台，二十四小時就救回來了，運氣好得像中樂透。下一次未必。

## 延伸閱讀

- Alexey Grigorev 原版事後報告：[How I dropped our production database](https://alexeyondata.substack.com/p/how-i-dropped-our-production-database)——當事人自己的完整時間線
- Tom's Hardware：[Claude Code deletes developer's production setup](https://www.tomshardware.com/tech-industry/artificial-intelligence/claude-code-deletes-developers-production-setup-including-its-database-and-snapshots-2-5-years-of-records-were-nuked-in-an-instant)——媒體報導整理
- Gruntwork：[Thinking of using AI with Terraform?](https://www.gruntwork.io/blog/thinking-of-using-ai-with-terraform)——對事故最完整的技術拆解
