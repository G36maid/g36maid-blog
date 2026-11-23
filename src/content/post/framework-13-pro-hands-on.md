---
title: "摸到 Framework 13 Pro 了：一次從頭重新設計的開箱上手"
description: "Framework 13 Pro（2026-04 發表）第一手上手感：全 CNC 鋁合金機身、haptic 觸控板、30–120Hz 2.8K 觸控螢幕與 74Wh 電池，對照作者手上 7840U 舊款 Framework 13 的規格差異、LPCAMM2 的取捨、主板雙向跨世代相容與 $449 起單買價、二手主板流向 homelab 的觀察，以及「該不該從舊 13 升級」的個人判斷。"
pubDate: 2026-06-02T17:20:56+08:00
category: hardware
tags: ["framework", "hardware", "laptop", "framework-13-pro", "repairability", "hands-on"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1780392056
---

> 原稿是 2026-06-02 的一句話 Facebook 相片貼文「摸到新的 framework 13 pro 了」＋一張照片；本篇擴寫於 2026-11，補上發表半年後的官方規格、實測與社群評價。規格與價格以 frame.work 頁面當前狀態為準。

終於摸到新的 Framework 13 Pro 了。發表是四月二十一日的事，[Framework Next Gen Event](https://frame.work/blog/framework-laptop-13-pro-and-highlights-from-the-framework-next-gen-event) 那場直播我看了大半，之後就是漫長的等實機。摸到的那一刻，第一個念頭是：這跟兩年前我拆箱那台塑膠感明顯的 Framework 13 完全不是同一個產品線的東西了。

![摸到新的 framework 13 pro 了——2026-06-02 原貼文照片](/media/2026-06/122164143050958395.jpg)

## 上手印象：終於有一台「貴」的樣子

整個上蓋、鍵盤框架、底蓋都是從 6000 系鋁塊 CNC 切出來的 unibody，石墨陽極黑，[官方頁面](https://frame.work/laptop13pro)標 15.85mm、1.44kg（含四張 Expansion Card）。拿起來的第一印象是剛性——單手施壓鍵盤面幾乎看不到形變，[Tom's Hardware 的評價](https://www.tomshardware.com/laptops/framework-laptop-13-pro-review)說這是 Framework 做過最扎實的筆電，我不反駁。鍵盤鍵程 1.5mm，比舊款好一截；觸控板換成壓電式 haptic touchpad（123.7 × 76.7mm，四顆壓電元件驅動），整面都能按、回饋強度可調，從 Mac 陣營搬過來的設計，但這次終於不輸了。

螢幕是 Framework 第一次做觸控：13.5 吋 3:2、2880×1920 維持不變，但更新率改成 30–120Hz VRR、標稱 700 nit（實測約 [770 nit](https://www.notebookcheck.net/Framework-Laptop-13-Pro-review-The-king-of-repairability-is-back.1351246.0.html)）、霧面抗反射加上逐片出廠校色。VRR 最低到 30Hz 這件事對續航是實質幫助。

## 規格對照：跟我的 7840U 舊款差在哪

我手上那台舊機是 [AMD 7840U 版、2024 年裝 Arch 的那台](/blog/framework-13-arch-linux-install/)，對照官方 specs，這代 Pro 的重點變化：

| 項目 | Framework 13 Pro | 我的 Framework 13 (7040) |
|---|---|---|
| CPU | Core Ultra Series 3（Panther Lake） | Ryzen 7 7840U |
| 記憶體 | LPCAMM2 LPDDR5X，最高 64GB、7467 MT/s | SO-DIMM DDR5-5600 |
| 螢幕 | 2.8K 觸控、30–120Hz、700 nit | 2.8K 霧面、120Hz、500 nit |
| 電池 | 74Wh | 61Wh |
| 儲存 | PCIe 5.0（最高 2TB）/ Gen 4（8TB） | PCIe Gen 4 |
| 機身 | 全 CNC 鋁合金 | 塑膠 |

Panther Lake 的 [Core Ultra X7 358H](https://frame.work/laptop13pro?tab=specs) 是 4P+8E+4LPE 16 執行緒、內顯 Arc B390（12 Xe-cores），效能模式 30W 持續 / 60W boost。真正驚人的是續航：官方標 20 小時以上，[Phoronix 實測](https://www.phoronix.com/review/framework-laptop-13-pro)Netflix 串流跑到 22 小時又 8 分——比上一代多 12 小時。LPCAMM2 是這代的賭注：把 LPDDR5X 做成可換模組，保住「記憶體能升級」的承諾，代價是模組目前比同容量 SO-DIMM 貴不少。

## 可升級性與跨世代相容

好消息是 [官方相容性文件](https://knowledgebase.frame.work/en_us/framework-laptop-13-and-framework-laptop-13-pro-part-compatibility-HJ2uwC6Ze)寫得比想像中慷慨：主板雙向全互換——新的 Core Ultra Series 3 主板可以裝進任何一代舊 Laptop 13，連第一代 11 代 Intel 主板都能塞進新 Pro 機殼；螢幕、Expansion Card、上蓋也全部通用。壞消息是內部幾何改了：Input Cover、電池、喇叭、散熱鰭片都跟舊款不互通，鍵盤與 haptic 觸控板只能整套買新的 Pro Input Cover Kit。所以「升級」從來不是換一塊板的事——LPCAMM2 也要跟著重買，這點出手前要先想清楚。

主板單買方面，[Intel Ultra 5 325 主板 $449 起、X7 358H $799](https://videocardz.com/newz/framework-laptop-13-pro-intel-mainboard-now-starts-at-449-with-optional-lpcamm2-memory-from-439)，LPCAMM2 另計（16GB $239 / 32GB $439 / 64GB $849）。整機 DIY 版 $1,199 起、AMD 版 $1,399 起。更有意思的是二手市場：發表才半年，[r/hardwareswap 已經有人出二手 Core Ultra 325 主板](https://reddit.com/r/hardwareswap/comments/1wm4uew/usaks_h_framework_13_pro_core_ultra_325_mainboard)、開價 $350 左右——舊主板退役後流去當 homelab 小主機或轉手，這條循環真的在動，也是這個生態最值錢的部分。

## 值不值得從舊 13 升級

我的判斷分兩種。第一次買 Framework 的人：買，這代把前七代被抱怨的電池、機身剛性、觸控板一次補完，代價只是價格往上走。跟我一樣拿著 7040 系舊機的人：不急。7840U 的效能對我日常工作綽綽有餘，舊機真正的痛點是續航與機身樸素感，而換 Pro 主板得連記憶體整套重買，算下來不如把舊機留在手邊，等下一代主板或二手價沉澱再說——反正 Expansion Card 全通用，隨時可以無痛搬過去。摸實機的結論是：這一步跨得漂亮，但不逼人跳。

順帶一提，社群端也不是全無雜音：出貨前曾因 haptic 觸控板與螢幕的量產問題[延後一個月出貨](https://www.reddit.com/r/hardware/comments/1u2ur32/framework_delays_laptop_13_pro_shipments_by_a/)，我摸到的這台已經是最終量產版本。價格策略也有爭議——[reddit 上有人整理](https://www.reddit.com/r/framework/comments/1tohy9k/is_it_worth_getting_a_framework_13_pro/)發現某些配置「買整機比單買零件便宜」，自己組 DIY 的樂趣這次反而不太划算。Linux 這邊倒是延續了好傳統：韌體照舊走 fwupd/LVFS，Ubuntu 有預載認證，Panther Lake 要夠新的 kernel，滾動更新的發行版問題不大；等我真的把它裝上 Arch，再寫下一篇。
