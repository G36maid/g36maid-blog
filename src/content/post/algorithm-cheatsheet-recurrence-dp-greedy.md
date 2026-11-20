---
title: "演算法考試 cheat sheet：從 recurrence 到 DP 與 greedy 的複習重點"
description: "把 2023 年 ADA 演算法課的 HackMD 考前速查筆記整理成複習文：Master theorem 三 case、Strassen、Kadane、最近點對、背包 DP 與 greedy 證明模板。"
pubDate: 2023-11-02T04:21:06+08:00
category: programming
tags: ["algorithm", "python", "study-note", "dp", "greedy"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1698870066
slug: algorithm-cheatsheet-recurrence-dp-greedy
---

> 擴寫自 2023-11 的 HackMD 課堂速查筆記，擴寫於 2026-11。

演算法課的期中考前，我把整學期的證明和範式壓成一份 HackMD 速查筆記：從 asymptotic notation、recurrence 三種解法，到 divide and conquer、DP、greedy 的代表題，目標是考前一小時能從頭掃到尾。三年後回頭補上當年省略的推導細節和可跑的程式碼。當年卡最久的兩個地方——Master theorem case 2 的 log 次方從哪冒出來、最近點對為什麼只檢查 7 個鄰居——這次都寫清楚。

## 1. Asymptotic notation

考前最容易被問倒的不是定義，而是三者關係：

- `O(g(n))`：存在常數 c、n₀，所有 n ≥ n₀ 滿足 0 ≤ f(n) ≤ c·g(n)——成長不超過的上界。
- `Ω(g(n))`：不等式反向，0 ≤ c·g(n) ≤ f(n)——成長不低於的下界。
- `Θ(g(n))`：c₁·g(n) ≤ f(n) ≤ c₂·g(n) 同時成立——上下界夾住，成長率一樣。

實務記法：merge sort 是 O(n log n) 沒錯，但它其實是 Θ(n log n)。考試寫證明時這個差別會被扣分。

## 2. 解 recurrence 的三個方法

Divide and conquer 的時間都長同一個樣子：規模夠小花常數時間，否則拆成 a 個規模 n/b 的子問題、外加合併成本 f(n)：

$$T(n) = a\,T(n/b) + f(n)$$

### Substitution method

先猜答案的形式（用符號常數），再用數學歸納法驗證並把常數找出來，猜錯就重猜。當年筆記裡的實戰技巧：

- 上界 O 和下界 Ω 分開證，不要一次證 Θ。
- 先放寬界線再逐步收緊。
- asymptotic notation 裡藏的常數係數不能假設是 1。
- 歸納假設證不動時，減掉一個低次項來「加強假設」。

### Recursion-tree method

把 recurrence 展開成樹、每層成本加總當作有根據的猜測，最後仍用 substitution 驗證。它的價值是產生好猜測——展開 merge sort 的樹，每層 Θ(n)、共 log n 層，答案幾乎自己跳出來。背後的工具是等比級數：r < 1 時 1 + r + r² + ⋯ 收斂到 1/(1−r)，所以每層成本遞減時，總成本被 root 主導。

### Master theorem

長得像 T(n) = aT(n/b) + f(n) 的 recurrence，直接查表。關鍵是比較 f(n) 和 n^(log_b a) 的成長速度，差一個多項式因子才適用：

| case | 條件 | 結論 | 直覺 |
|------|------|------|------|
| 1 | f(n) = O(n^(log_b a − ε))，f 多項式地小 | Θ(n^(log_b a)) | 葉節點成本主導 |
| 2 | f(n) = Θ(n^(log_b a) · log^K n) | Θ(n^(log_b a) · log^(K+1) n) | 每層成本均勻分攤 |
| 3 | f(n) = Ω(n^(log_b a + ε))，且 regularity condition a·f(n/b) ≤ c·f(n)，c < 1 | Θ(f(n)) | root 成本主導 |

當年卡住的點在 case 2：多出來的 log 是把每層 Θ(n^(log_b a)) 乘上 log n 層，log^K n 就變成 log^(K+1) n。case 3 的 regularity condition 是容易忘記的陷阱——f(n) 長得夠大還不夠，還要往下每層遞減得夠快，少了這條件 theorem 根本不適用。

## 3. Divide and conquer 經典題

**河內塔**：T(n) = 2T(n−1) + Θ(1)，展開是 2ⁿ − 1 步。沒有更快的解。

**Merge sort**：T(n) = 2T(n/2) + Θ(n)，套 case 2（K=0）得 Θ(n log n)。

**矩陣乘法與 Strassen**：樸素分治把矩陣切四份、做 8 次子矩陣乘法加合併，T(n) = 8T(n/2) + Θ(n²)，得 Θ(n³)。Strassen 把乘法次數從 8 壓到 **7**——7 個線性組合（各是一次子塊乘法）再加減湊出結果的四個子塊。少一次遞迴，指數就從 log₂8 = 3 掉到 log₂7 ≈ 2.807：

$$T(n) = 7\,T(n/2) + \Theta(n^2) = \Theta(n^{\log_2 7})$$

這是 case 1 的教科書例子：合併成本 Θ(n²) 被 n^2.807 的葉節點吃掉。當年我以為「8 變 7」只是小改良，後來才理解乘法次數直接進指數——省一次乘法比省任何多項式合併成本都值錢。

**最大子序列和**：分治版切半，答案在其中一半、或跨越中線（往左右各線性掃一次），T(n) = 2T(n/2) + Θ(n) = Θ(n log n)。但有更快的 DP：

```python
def max_subarray(A):
    max_ending_here = max_so_far = A[0]
    for x in A[1:]:
        max_ending_here = max(x, max_ending_here + x)
        max_so_far = max(max_so_far, max_ending_here)
    return max_so_far
```

Kadane's algorithm 的狀態轉移只有一行：到目前為止的最大和，要嘛延續前面（`max_ending_here + x`），要嘛從自己重開（`x`）。Θ(n) 對 Θ(n log n)，DP 贏過分治的標準反例。

**最近點對**：暴力 O(n²)。分治版照 x 座標切半、遞迴兩半得 δ = min(左, 右)，麻煩在跨越中線的點對。解法：只看距離中線 2δ 寬的帶狀區，按 y 排序，每個點往後檢查——在 δ×2δ 的格子裡同格兩點會比 δ 更近（矛盾），所以每個點最多 7 個鄰居要檢查。合併只要 O(n)：

$$T(n) = 2T(n/2) + O(n) = O(n \log n)$$

「為什麼是 7」這個 magic number 當年背得很痛苦，格子圖畫一遍就忘不掉了。

## 4. Dynamic programming

DP 的成立條件是 optimal substructure 加重疊子問題：最優解 = 各種選擇 + 對應子問題的最優解，且子問題會被反覆算到。跟分治的差別就在重疊——分治的子問題互不相干，DP 的要建表。

**0/1 背包**：n 個物品、容量 W，`dp[i][w]` 是前 i 個物品、容量 w 的最大價值。一維版更好寫：

```python
def knapsack(values, weights, W):
    dp = [0] * (W + 1)
    for v, w in zip(values, weights):
        for cap in range(W, w - 1, -1):  # 倒序 = 每物只用一次
            dp[cap] = max(dp[cap], dp[cap - w] + v)
    return dp[W]
```

複雜度 = 表格大小 × 每格成本 = Θ(nW)。但 W 以二進位表示只有 log W 位，輸入大小其實是 n + log W，所以這是 **pseudo-polynomial**：對 W 來說是指數的。背包問題是 NP-hard，pseudo-polynomial 不等於 polynomial。

## 5. Greedy algorithm

Greedy 比 DP 多一個 **greedy choice property**：局部最優選擇可以安全納入全域最優解，之後只需解剩下的子問題。證明工具是 exchange argument：拿任意最優解 OPT，把第一步換成 greedy 選擇，證明換完不會更差，再歸納下去。

**Interval scheduling**（選最多不重疊區間）：greedy 選擇是「最早結束的先選」。證明用 swap method：若 OPT 不包含最早結束的 job 1，把 OPT 的第一個 job 換成 job 1——job 1 最早結束，騰出的時間只多不少，換完仍是合法解且個數不變。最早開始、最短時長等直覺策略都能構造出反例。

```python
def interval_scheduling(intervals):  # (start, end) tuples
    count, free_at = 0, float("-inf")
    for s, e in sorted(intervals, key=lambda iv: iv[1]):  # 最早結束優先
        if s >= free_at:
            count += 1
            free_at = e
    return count
```

**Scheduling to minimize lateness**：n 個工作各需時 t[i]、有期限 d[i]，最小化最大延遲。Greedy 是 earliest-deadline-first：按 d 排序即可。證明用「無逆序」——任何最優解都能在不增加最大延遲的前提下逐步消去逆序，收斂到 EDF。

**Huffman coding**：每次合併頻率最小的兩棵樹。最優性靠 exchange argument：最優樹裡頻率最小的兩個符號 x、y 若不是兄弟，可以換到最深的兄弟位置，交換不會讓總編碼長度變長；剩下的部分正是合併 (x+y) 後的子問題。推廣到 k 進位時，若節點數不滿足 n ≡ 1 (mod k−1)，要先補頻率 0 的 dummy node，否則最後一層會有樹落單、編碼長度反而變差——當年小考的送分題。

## 6. 三種範式怎麼選

回頭看，這份筆記的骨架就是一張決策表：能切一半、合併便宜，就分治（套 master theorem）；子問題重疊，就 DP（建表）；greedy choice 證得出來，就 greedy（exchange argument 一段話收工）。當年考試最花時間的不是寫程式，是把「為什麼這樣做是對的」寫成證明——三種範式各對應一套證明模板，考場上比任何演算法本身都好用。

## References

- [Master theorem (analysis of algorithms) — Wikipedia](https://en.wikipedia.org/wiki/Master_theorem_(analysis_of_algorithms))
- [Strassen algorithm — Wikipedia](https://en.wikipedia.org/wiki/Strassen_algorithm)
- [Finding the nearest pair of points — cp-algorithms.com](https://cp-algorithms.com/geometry/nearest_points.html)
- [Huffman coding — Wikipedia](https://en.wikipedia.org/wiki/Huffman_coding)
- [Introduction to Algorithms (CLRS) — Wikipedia](https://en.wikipedia.org/wiki/Introduction_to_Algorithms)
