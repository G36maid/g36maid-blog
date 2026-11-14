---
title: "一個 prompt 換一個魚群模擬器：拿 Gemini 3 試 boids 演算法"
description: "用一個 prompt 要 Gemini 3 生出魚群演算法（boids）模擬器，結果還蠻好看的而且效果不錯。本文拆解它自動做對的細節：spatial hashing 鄰居查詢、調校過的 separation/alignment/cohesion 權重，以及跟 2023 年模型輸出的差距。"
pubDate: 2025-11-20T18:23:58+08:00
category: ai
tags: [ai, gemini, boids, vibe-coding, canvas, 演算法, prompt]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1763634238
---
> 本文擴寫自 2025-11-20 的 Facebook 相片貼文原稿（當時正文只有三句話），擴寫於 2026-11，技術細節按 2025 年 11 月當下的脈絡補齊。

前陣子 Google 把 Gemini 3 Pro 丟出來（2025-11-18，緊接在 GPT-5.1 之後不到一週），宣傳主軸之一就是 vibe coding——「描述你想要的東西，它直接給你」。這種宣稱聽多了會麻痺，所以那天我開了 Gemini 3，丟了一個 prompt，要它做一個魚群演算法（boids / flocking）的模擬器。結果就是下面這張圖：還蠻好看的，而且效果不錯。一個 prompt 就有這個效果。

![用 Gemini 3 做的魚群演算法模擬器截圖](/media/2025-11/122133439664958395.jpg)

## 為什麼挑魚群演算法來測

boids 是 Craig Reynolds 在 1986 年提出的模型，歷史快四十年了，行為卻依然好看。它好用的地方在於規則極小、效果極明顯：每隻魚只遵守三條規則——

1. **Separation**：別撞上鄰居，靠太近就推開
2. **Alignment**：朝附近鄰居的平均方向對齊
3. **Cohesion**：稍微往鄰居的質心靠攏

沒有領袖、沒有全域編排，整群魚的游動完全由個體互動湧現（emergent）出來。Conrad Parker 寫的 [boids pseudocode 頁](http://www.vergenet.net/~conrad/boids/pseudocode.html)用幾十行 pseudocode 就講完了核心，實作上就是在 `move_all_boids_to_new_positions()` 迴圈裡對每隻魚算三個速度向量再加總。

正因為規則這麼小，它是很好的 vibe coding 試金石：模型要同時懂向量數學、懂湧現行為的視覺節奏、還要懂怎麼把它畫得好看。規則寫錯一個係數，畫面不是炸開就是凍結，騙不了人——這跟叫模型生一篇文章不一樣，模擬器的好壞是直接呈現在像素上的。

## 一個 prompt 到底發生了什麼

實際跑下來，Gemini 3 給的是一個單檔的 HTML + JavaScript + Canvas 實作，打開就能跑，不需要裝任何東西。拆開看它生成的程式碼，幾個細節處理得比我想像中好：

- **空間切割**：它自己上了 grid-based spatial hashing 鄰居查詢，而不是 O(n²) 的暴力兩兩比對。魚的數量一多（幾百隻以上），這是效能能不能撐住的分水嶺。這種最佳化你不下指令它通常不會做，但它做了。
- **參數有調過**：三條規則的權重不是教科書預設值，separation 半徑和 cohesion 的拉力明顯調校過，所以魚群是「聚而不擠」——有團塊感但不會糊成一坨。
- **視覺層**：魚不是小圓點，有身體形狀和朝向、尾巴擺動，還加了輕微的速度漸層讓快的魚看起來不一樣。畫面好看這件事一半的功勞在這。

以 Reynold 的術語來說，這三條規則各自的影響力是幾個乘數（multiplier），乘上去再相加。要讓畫面從「能動」變「好看」，就是調這幾個乘數——這種需要反覆試錯的審美判斷，本來是我以為模型最弱的一環。

## 跟以前一個 prompt 生成的差距

2023 年拿同樣的需求丟給當時的模型，典型產物是：三條規則背出來了、魚會動，但參數是亂設的——魚群要嘛瞬間凝聚成單點，要嘛整群飛出畫面再也回不來，而且給你一個 O(n²) 迴圈，兩百隻魚開始掉幀。

同一個 prompt 兩年後的差距不在「能不能寫出 boids」——這早就是任何模型都能做到的事——而在模型能不能在腦內跑一次模擬，預判哪些參數組合會做出好看的湧現行為。這比較接近工程經驗而不是知識召回，也是 Gemini 3 發表時強調 reasoning 能力的實際感受：不是 benchmark 分數高了幾分，而是「少 prompting 就拿到你要的東西」這句話是真的。

## 缺點

效果不錯，但離「完成品」有距離。它給的是一個靜態模擬，沒有互動：不能滑鼠丟飼料擾動魚群、不能調參數面板即時看變化、也沒有把分離／對齊／凝聚三個權重暴露出來讓人玩。要做互動式版本，還是得自己接手改。另外單檔輸出雖然方便，但要把它變成正式專案，結構上還是要重切。

## 結論

一個 prompt 換到一個視覺上過得去、效能上有正確資料結構的魚群模擬器，這在 2025 年 11 月是成立的。boids 這種「規則簡單、好壞立現」的題目，往後大概會變成我每次試新模型的固定考題——比問它會不會寫 sorting algorithm 有鑑別度多了。

延伸：之前拆解過 [Layoutit Terra 怎麼用純 CSS 堆出 3D 地形](/blog/terra-pure-css-terrain/)，同樣是「視覺模擬好壞立現」的題目；怎麼透過持續 review 把 Gemini 調教得更懂自己，寫在[這篇](/blog/gemini-preference-distillation/)。

## References

- [Google: A new era of intelligence with Gemini 3（2025-11-18）](https://blog.google/products/gemini/gemini-3/)
- [Conrad Parker: Boids Pseudocode](http://www.vergenet.net/~conrad/boids/pseudocode.html)
- [Wikipedia: Boids（Craig Reynolds, 1986）](https://en.wikipedia.org/wiki/Boids)
- [TechCrunch: Google launches Gemini 3（2025-11-18）](https://techcrunch.com/2025/11/18/google-launches-gemini-3-with-new-coding-app-and-record-benchmark-scores)
