---
title: "HITCON 2025 議程抉擇：三軌並行的勾選戰記"
description: "HITCON 2025 兩天三廳議程的選擇紀錄：以 reverse、Linux kernel、硬體攻擊鏈為主軸勾了十一場，從 FQDN 過濾陷阱、PeckBirdy JavaScript 後門框架、Airoha 耳機 SoC、Pixel 8 DSP 繞 MTE，到 kernelCTF 的 net/sched 0-day、AMD SEV 側頻道與不靠 kallsyms 的 rootkit；附放棄清單、取捨理由與 AI/agent 議題佔比觀察。"
pubDate: 2025-08-06T05:49:58+08:00
category: security
tags: ["hitcon", "hitcon-2025", "security", "conference", "kernel", "reverse-engineering", "mte", "hardware-hacking", "apt", "llm"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1754430598
---

> 擴寫自 2025-08-06 的 HackMD 筆記（原稿為議程清單與勾選紀錄），擴寫於 2026-11-11；勾選場次的內容描述為依議程標題的背景補完，非現場逐字記錄。

HITCON 2025 的主題是「Perimeter Security is Dead, Long Live Resilience」（[官方網站](https://hitcon.org/2025/)），八月中旬兩天的年會，三天前才把議程表打開來慢慢勾。麻煩在於議程有三個廳外加 hands-on 課程並行，常常一個時段同時開四場，而我想聽的場次偏偏擠在同一格——13:00 開場那格一口氣有 LLM 自動挖漏洞、Concolic PowerShell、ROP on ARM64 和防火牆過濾四個方向。我的選法很主觀：以平常在做的事為軸，reverse、Linux kernel、硬體攻擊鏈優先，離工作太遠的題目就算名氣再大也忍痛放掉，回頭看共筆。勾完的結果就是原稿那張 checkbox 清單，兩天共十一場，這篇把當時取捨的邏輯攤開來記。

## 8/15：防火牆、APT、硬體與一台 Pixel 8

第一場勾了[現代防火牆中以 FQDN 為基礎之過濾機制的隱藏陷阱](https://hitcon.org/2025/zh-TW/agenda/)，放棄了同時段的 ARTIPHISHELL Agents。會選這場是因為它離日常維運最近。光看標題能推測的難題不少：防火牆多半把 FQDN 先解析成 IP 再套規則，DNS 快取的時間差、不支援 DNS over TCP、CDN 一個 IP 綁多個網域造成誤擋或漏擋，都會讓規則「設定成功」卻靜默失效；到了應用層，TLS 1.3 加密憑證、SNI 加密與 ECH 普及後，靠連線內容辨識網域的路也會越來越窄。官方摘要寫著講者系統性測了 Cisco、FortiGate、SonicWall、Sophos、Palo Alto 等多家產品，發現廠牌間的處理差異足以造成政策靜默失效——細節以[議程頁摘要](https://hitcon.org/2025/zh-TW/agenda/)為準，我這裡只做標題延伸。

14:00 撞了三場：ReVault、數發部防制網路詐騙、無聲滲透，勾了後者。這場講者來自趨勢科技，議程頁介紹他們追蹤到一個長期運作的中國關聯團體，命名了名為 PeckBirdy 的 JScript 後門框架——同一套工具能跑在瀏覽器、WScript、HTA、.NET ScriptControl 等多種環境，初始入侵與遠端控管共用一套骨架，摘要還提到與 Earth Lusca 基礎設施的關聯。惡意 JavaScript 走系統內建直譯器這條路完全不需要落地下載，對防守方來說既難擋又難追。這場我後來還等到趨勢科技把研究寫成[正式技術報告](https://www.trendmicro.com/en_us/research/26/a/peckbirdy-script-framework.html)，算是勾選場次裡「賽後補完」最完整的一場。

15:10 選了「只需一次 API 呼叫的致命一擊」，放掉 Hacking Cloud-Native AI Agents。官方在社群貼文裡預告這是 DEVCORE 對 AeoTec Smart Home Hub 的破解：從硬體加解焊、逆向 Rust 程式，最後靠一個 API request 奪權。硬體攻擊鏈有趣的地方在於每一段的技能樹都不一樣——熱風槍、韌體 dump、Rust 逆向、協定分析——串起來之後結論卻乾淨得像笑話：防護再多，一個 API 呼叫就收工。

16:10 的耳機劫持術同樣在周邊設備這條線上。議程頁的描述是講者在 Airoha 的藍牙音訊 SoC 上找到三個漏洞，可以完全控制耳機，再利用手機對配對裝置的信任關係回頭攻擊手機。耳機這種「一直連著、很少更新、廠商當成啞巴周邊」的東西，正是信任邊界上最鬆的一顆螺絲。

17:10 壓軸勾了破解 Pixel 8。MTE（Memory Tagging Extension）是 Arm 針對記憶體破壞類漏洞設計的硬體防線，Pixel 8 是第一波讓人實際摸到的消費端實作，所以「繞過 MTE」四個字在 2025 年的分量很重。官方提供了[講者投影片](https://hitcon.org/2025/slides/b7635c13-282e-4673-8297-43ed3550b3d3.pdf)：攻擊面選在 Pixel GXP——那顆未公開文件的 DSP coprocessor。思路與 2024 年 Mali GPU 的 CVE-2023-6241 一脈相承（[GitHub Security Lab 有完整分析](https://github.blog/security/vulnerability-research/gaining-kernel-code-execution-on-an-mte-enabled-pixel-8/)）：MTE 的 tag check 只看守護 CPU 端的記憶體存取，讓另一顆處理器單元直接去碰實體記憶體，防線就從旁邊繞過去了。一場講硬體漏洞的議程同時是對「軟體記憶體安全防護到底守得住哪裡」的提問，這是我當天最想聽的理由。

## 8/16：kernel、側頻道與 rootkit

第二天 11:20 同樣四場齊發：hypervisor 模糊測試、MCP 安全、PCB badge、IoT 韌體取證，我勾了[正確入侵 Linux 的方式](https://hitcon.org/2025/slides/cabe6fee-cc20-413b-83e4-ed079f522e12.pdf)。講者 Pumpkin（@u1f383）在 DEVCORE 做 Linux kernel 研究，投影片的骨架是 kernelCTF 與 net/sched 子系統：兩個 0-day、劫持次級物件簡化 UAF、用攻擊者可控制的 kernel 變數在只有 kernel base 外洩時拼出偽造物件；連「分析別人的 1-day 時順手多撿到兩個 CVE 但被搶先通報」的失敗經驗都放進來講。從失敗裡提煉方法論的議程，比成功案例少見得多。

13:00 勾了 Reload+Reload：從支援 SEV 的 AMD 處理器上逆向出兩條側頻道，hypervisor 能反過來窺探 VM 的記憶體存取行為，實作成 covert channel 之後可以替 Spectre 搬運資料、抽出 AES-128 金鑰（同題研究發表於 [ASPLOS 2025](https://dblp.org/rec/conf/asplos/ChiangL25.html)）。機密運算的賣點是「資料加密到連 hypervisor 都看不到」，側頻道卻從實體層把這條信任邊界戳穿——兩種防禦模型撞在同一顆 CPU 上，是我最喜歡的那種題目。

14:00 我同時勾了兩場：Satoki Tsuji 的超越 OSxP（門卡複製、惡意硬體植入、GitHub 橫向移動的實戰紅隊）與 R3 的 RAMN 車用 hack workshop（從 CAN bus 打到 ECU）。前者聽、後者動手，兩場塞進同一格只能取捨現場停留的比重。同一時段還有 hrtng——Kaspersky 的 IDA plugin，拿過 2024 年 IDA Plugin Contest 第一名，[repo 開源](https://github.com/kasperskylab/hrtng)——平常做 reverse 最該聽的其實是這場，被我放掉是當天最心虛的一個決定。

15:10 再勾兩場。ksymless 是陳麒升的 Linux rootkit 研究：不依賴 kallsyms（某些 kernel 設定下可以整個關掉）也不靠 kprobe，改用其他 kernel 機制解析系統呼叫、hook 函式、藏模組藏連線，[程式碼在 GitHub](https://github.com/rota1001/ksymless)，目標 x86-64、Linux 6.11 以上。rootkit 研究講的是拿到 kernel code execution 之後的那段路，跟上午的 kernel exploit 剛好接成完整一條線。From Spoofing to Tunneling 則是紅隊網路技術，講者把 IP spoofing 拿來掃 GRE tunnel 當初始立足點，同一份研究也在 [Black Hat USA 2025](https://i.blackhat.com/BH-USA-25/Presentations/USA-25-Tung-From-Spoofing-To-Tunneling-New-wp.pdf) 發表過。

## 放棄清單與觀察

沒勾的場次大致三類。AI 相關的最擠：ARTIPHISHELL（AIxCC 出身的自動挖洞修補）、Atlantis、利用 LLM 自動化軟體安全分析、Agentic ProbLLMs、MCP or Malicious Control Path，幾乎都跟我的勾選場次同格，最後只撿了共筆。政策與詐騙類——數發部防制網路詐騙、PhaaS、日本金融內部詐欺——是同一個下午被硬體與 APT 擠掉。剩下的是硬體深水區：ReVault（Broadcom ControlVault SoC，事後 Talos 的[技術文章](https://blog.talosintelligence.com/revault-when-your-soc-turns-against-you/)補完得很完整）、Navigation broadcast 欺騙、hypervisor fuzzing，都只好看錄影。

把原稿清單掃一遍就會發現 2025 年議程的組成變了：AI 相關至少七場，而且分兩面長出來——「用 LLM 做資安」（AIxCC 系的自動找洞修洞）與「攻擊 LLM 系統」（agent、MCP）。我自己後來也走上這條路：把本地 LLM 接上 Ghidra 做[半自動逆向](/blog/glm-ghidra-llm-reverse/)，再拼出一套[多 agent 資安分析流水線](/blog/multi-agent-security-analysis/)——當年在會場只能看共筆的題目，一年後變成自己桌上的日常工具。

議程表上勾勾的意義，過幾個月再看通常只剩「當時的自己在想什麼」。這篇算是把 2025 年八月那個選擇當下的判斷固定下來：三軌並行時，聽離自己手感最近的場，剩下的交給共筆與錄影。
