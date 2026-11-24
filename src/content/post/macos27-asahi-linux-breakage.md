---
title: "macOS 27 beta 破壞了 Asahi Linux 的開機相容"
description: "WWDC 2026 後的 macOS 27 Golden Gate beta 改變了開機選單對「合法 OS」的判定，Asahi Linux 分割區直接從開機選項消失。本文補齊 Asahi 安裝原理、Apple 弄壞安裝器的前科，與正式版出貨後的後續。"
pubDate: 2026-06-11T11:19:28+08:00
category: linux
tags: ["linux", "apple-silicon", "asahi"]
source: facebook
sourceType: "連結分享"
sourceTimestamp: 1781147968
draft: false
---

本文擴寫自 2026 年 6 月 11 日的臉書貼文，原始內容只有一行標題加一條 Phoronix 連結；2026 年 11 月擴寫，補齊 Asahi Linux 的安裝原理、Apple 弄壞安裝器的前科，以及 macOS 27 正式版出貨後的後續發展。

## 連 Linux 都找不到的分割區

WWDC 2026 過後沒幾天，Asahi Linux 在 Mastodon 發出 PSA：不要升級 macOS 27「Golden Gate」beta。升級之後，開機選單（長按電源鍵出現的那個）和 macOS 中的「開機磁碟」設定裡，Asahi 的選項直接消失，整個 Linux 安裝被 Apple 的開機工具無視。Phoronix 在 6 月 9 日報導了這件事，標題下得很直接：macOS 27 Beta Breaks The Ability To Boot Asahi Linux。

Asahi 團隊的第一時間反應很果斷：把安裝器改成偵測到 macOS 27 就拒絕執行，同時向 Apple 提交 Feedback 報告（編號 FB22994760），並且明講，沒有留一個穩定版 macOS 當後路的使用者，他們不會支援。資料倒是安全：用 diskutil 檢查，所有 Asahi 相關分割區都還在，只是選不到。

## 這套系統本來就走在鋼索上

Asahi 的安裝方式值得回頭講一次，因為這次事故完全踩在它的設計前提上。Apple Silicon 的開機工具只認「合法的 macOS 安裝」——一個 APFS container，裡面要有像樣的 Preboot、recoveryOS、XNU kernel。Asahi 想借用 iBoot 這條已簽署的開機鏈（platform bring-up 自己從零做過一輪了，開機鏈不必重來），所以安裝器會先縮小 macOS 的 APFS container，擠出一個約 2.5 GB 的 stub 容器：塞進剛好能讓 Apple 工具點頭的最小 macOS 檔案，再把 m1n1 放在 XNU kernel 的位置，由 iBoot 載入後 chainload 到 EFI 分割區的 U-Boot、GRUB，最後才是 Linux。這也是為什麼安裝過程必須保留內部的 macOS，連「要留 38 GB 給 macOS 更新用」都白紙黑字寫在 FAQ 裡。

我之前寫過一篇 [APFS 的檔案系統考據](/blog/apfs-design-vs-btrfs/)，這次的事故就發生在 APFS 的 metadata 層，有興趣可以接著讀。

這個 stub 安排從 macOS 12 一路工作到 macOS 26，四年沒動過，Apple 甚至修過幾個只在載入非 XNU 的 raw binary 時才會踩到的自家工具 bug。Asahi 團隊在 6 月底的進度報告裡寫：「This arrangement worked completely unchanged from macOS 12 to macOS 26.」然後 macOS 27 來了。

## 病根是 APFS 裡一個以前沒人理的旗標

追兇的是開發者 chaos_princess。她翻 Apple 自己的 macOS Installer 和幾年前摸索開機工具時的直播紀錄，發現安裝程式在重開機前會寫入一個 APFS metadata 旗標，把 volume 標成「可開機」。在 macOS 26 以前，開機工具完全無視這個旗標；macOS 27 開始強制檢查。手動把旗標設上去，Asahi 容器就重新出現在開機選單，其他什麼都不用改。

修復在 6 月 12 日合進 asahi-installer（PR #428），6 月 13 日推出 v0.8.3：新安裝自動設旗標，既有安裝可以重跑安裝器、選「Fix macOS 27 boot picker compatibility」。當然，諷刺的是你得先有辦法開進 macOS 才能跑安裝器，所以 Asahi 也另外做了能從 Linux 端修的工具，只是他們自己也承認還需要更多測試才敢自動部署。

## Apple 慣犯

這不是 Apple 第一次把 Asahi 弄壞。上一輪是 macOS 15 Sequoia：15.0 上安裝器最後一步 bless 直接失敗（"Failed to create paired recovery local policy"），GitHub issue #328 裡整串人貼出同一個錯誤；同年還有 FileVault 機器升級後 Preboot 資料庫壞掉、卡在空登入畫面的案例。這些都發生在正式版。

macOS 27 beta 這次附帶的第二顆地雷更陰：SMC 韌體把一個電池管理介面的回傳值從 32 位元整數改成單一 byte，Asahi 的電源驅動讀不懂，某些情況下判定電池故障，觸發緊急關機保護。這個修復進了 kernel 7.0.12。Asahi 在進度報告裡的呼籲值得整段記下：developer beta 就是 developer beta，不要裝在生產機器上；全域韌體更新實質上不可逆，只有 DFU restore 能回滾。他們自己養了犧牲打機器，輪不到使用者拿幾萬塊的筆電去賭。

## marcan 走了之後

值得一提的是，這整套應對發生在 Hector Martin（marcan）2025 年 2 月辭去專案領導之後。他走的原因講得很白：上游 Linux kernel 社群對 Rust 的抵制，加上使用者無止境的索求，把他燒乾了。接手的治理結構是七位開發者共享決策——這次修 boot picker 的 chaos_princess、寫進度報告的 James Calligeros 都在名單上。核心人物離開後一年多，專案照樣在事件發生三天內完成調查、修復、發版。他們 2025 年把「不能只有一個人扛」寫進章程時想要的證明，大概就是這個。

## 我的立場

Apple 從來沒有禁止你在 Apple Silicon Mac 上跑第三方 OS：Permissive Security 模式放行自簽 kernel，安裝流程一路官方工具伺候。但 Apple 也從來沒有承諾過任何東西。開機選單怎麼判斷「合法 OS」、SMC 介面長什麼樣，全是內部實作細節，沒有 ABI 文件、沒有相容性承諾、沒有棄用預告。x86 PC 靠 UEFI 加 GPT 這套跨廠商標準活了下來，Apple Silicon 上的第三方 OS 卻是對著黑箱逆向出來的相容層；Apple 每年一次大版本更新，就等於每年一次未經通知的介面審查。

我認為這是這類平台最根本的張力：法律上你被允許，工程上你被允許到 Apple 的下一個 commit 為止。Asahi 團隊實際上在做 Apple 的免費相容性測試，成本自負。四年來他們接住了每一次（stub 從 macOS 12 撐到 26），但每次都是幾天的搶工換來的，而且沒有人保證下一次的修復會一樣便宜。

## 2026-11 update

macOS 27「Golden Gate」正式版已在 2026 年 9 月 14 日推出。追蹤到的狀況：開機選單的旗標檢查在正式版沒有回退，正式版同樣只認有設旗標的 volume；Asahi 端因為 v0.8.3 起新安裝自動相容、既有安裝跑一次安裝器修復即可，之後沒有再出現大規模「消失」的回報。SMC 電池問題倒是持續有人中招：Fedora 論壇 9 月和 10 月都有「升級 macOS 27 後開機十秒斷電」的討論串，升級到 kernel 7.1.13 之後解決。查不到的：Apple 對 FB22994760 有沒有回應、是否把旗標變更視為 bug，至今沒有公開說法。
