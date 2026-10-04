---
title: "CA HW4 Handwritten Part"
description: "Block sizes: $B = 8, 16, 32, 64, 128$"
pubDate: 2024-12-16 21:46:58 +0800
tags: ["記憶體", "memory", "gpu", "cpu", "neural"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1734356818
category: programming
---

## g36maid

### **Problem 1**  
**Given:**  
- Block sizes: $B = 8, 16, 32, 64, 128$  
- Miss rates: $4\%, 3\%, 2\%, 1.5\%, 1\%$  
- Miss latency (ML): $20 \times B$ or $24 + B$ cycles  

**Tasks:**  
1. **For $ML = 20 \times B$:**
   Total miss penalty = $\text{Miss Rate} \times ML$  
   Calculate for each block size:
   $$
   \text{Penalty} = \text{Miss Rate} \times (20 \times B)
   $$

   Find the block size minimizing the penalty.

2. **For $ML = 24 + B$:**
   Total miss penalty = $\text{Miss Rate} \times ML$  
   Calculate:
   $$
   \text{Penalty} = \text{Miss Rate} \times (24 + B)
   $$

   Find the block size minimizing the penalty.

3. **For constant $ML$:**
   Optimal block size depends only on miss rate. Choose the block size with the lowest miss rate.
第一題主要是探討區塊大小 \(B\) 與快取記憶體的 **缺失率 (Miss Rate)** 和 **缺失延遲 (Miss Latency)** 的關係，並找出使總缺失延遲最小的最佳區塊大小。以下是詳細解釋與解法步驟：

---

### **題目給定的條件**
1. **區塊大小 (Block size \(B\))：**  
   \( B = 8, 16, 32, 64, 128 \)

2. **缺失率 (Miss Rate)：**  
   \[
   \text{Miss Rate} = 4\%, 3\%, 2\%, 1.5\%, 1\%
   \]

3. **缺失延遲 (Miss Latency, \(ML\))：**
   - \(ML = 20 \times B\)  
   - \(ML = 24 + B\)

4. **指令的記憶體存取行為：**  
   - 機器的基礎 CPI（每指令週期數）= 1  
   - 每個指令平均有 1.35 次記憶體存取。  

   總記憶體存取的延遲 (Total memory access penalty)：  
   \[
   \text{Total Miss Latency} = \text{Miss Rate} \times ML
   \]  
   我們的目標是找出最小化這個值的 \(B\)。

---

### **第 (1) 小題**：\(ML = 20 \times B\)  
缺失延遲與區塊大小成正比，公式如下：  
\[
\text{ML} = 20 \times B
\]  

**計算各區塊大小的總缺失延遲：**  
\[
\text{Total Miss Latency} = \text{Miss Rate} \times (20 \times B)
\]  

將給定數據代入計算：  

| \(B\)  | \(\text{Miss Rate}\) | \(\text{ML (cycles)} = 20 \times B\) | \(\text{Total Miss Latency}\) |
|-------|-----------------------|-------------------------------------|-------------------------------|
| 8     | 4%                   | \(20 \times 8 = 160\)               | \(0.04 \times 160 = 6.4\)     |
| 16    | 3%                   | \(20 \times 16 = 320\)              | \(0.03 \times 320 = 9.6\)     |
| 32    | 2%                   | \(20 \times 32 = 640\)              | \(0.02 \times 640 = 12.8\)    |
| 64    | 1.5%                 | \(20 \times 64 = 1280\)             | \(0.015 \times 1280 = 19.2\)  |
| 128   | 1%                   | \(20 \times 128 = 2560\)            | \(0.01 \times 2560 = 25.6\)   |

**結論：** 當 \( B = 8 \) 時，總缺失延遲最小 \(6.4\)。因此，最佳區塊大小為 **8 bytes**。

---

### **第 (2) 小題**：\(ML = 24 + B\)  
缺失延遲隨區塊大小增加而線性增長，公式如下：  
\[
\text{ML} = 24 + B
\]  

**計算各區塊大小的總缺失延遲：**  
\[
\text{Total Miss Latency} = \text{Miss Rate} \times (24 + B)
\]  

將給定數據代入計算：  

| \(B\)  | \(\text{Miss Rate}\) | \(\text{ML (cycles)} = 24 + B\) | \(\text{Total Miss Latency}\) |
|-------|-----------------------|---------------------------------|-------------------------------|
| 8     | 4%                   | \(24 + 8 = 32\)                | \(0.04 \times 32 = 1.28\)     |
| 16    | 3%                   | \(24 + 16 = 40\)               | \(0.03 \times 40 = 1.2\)      |
| 32    | 2%                   | \(24 + 32 = 56\)               | \(0.02 \times 56 = 1.12\)     |
| 64    | 1.5%                 | \(24 + 64 = 88\)               | \(0.015 \times 88 = 1.32\)    |
| 128   | 1%                   | \(24 + 128 = 152\)             | \(0.01 \times 152 = 1.52\)    |

**結論：** 當 \( B = 32 \) 時，總缺失延遲最小 \(1.12\)。因此，最佳區塊大小為 **32 bytes**。

---

### **第 (3) 小題**：常數 \(ML\)  
假設缺失延遲 \(ML\) 為常數，則總缺失延遲僅取決於缺失率：  
\[
\text{Total Miss Latency} \propto \text{Miss Rate}
\]  
因此，選擇缺失率最低的區塊大小即可：  

| \(B\)  | \(\text{Miss Rate}\) |
|-------|-----------------------|
| 8     | 4%                   |
| 16    | 3%                   |
| 32    | 2%                   |
| 64    | 1.5%                 |
| 128   | 1%                   |

**結論：** 當 \( B = 128 \) 時，缺失率最小 \(1\%\)。因此，最佳區塊大小為 **128 bytes**。

---

### **整體結論**
- \(ML = 20 \times B\)：最佳區塊大小為 **8 bytes**  
- \(ML = 24 + B\)：最佳區塊大小為 **32 bytes**  
- 常數 \(ML\)：最佳區塊大小為 **128 bytes**  

如果還有任何疑問，可以進一步討論！
---

### **Problem 2**  
**Given:**  
- Cache block size = 16 bytes  
- Each word = 64 bits = 8 bytes  
- Matrix $A[8][8000]$, $B[8][8000]$  

**Tasks:**  
1. **Number of 64-bit integers in a 16-byte block:**  
   A 16-byte cache block stores $\frac{16}{8} = 2$ integers.

2. **Temporal locality:**  
   Variables reused within a short time exhibit temporal locality.  
   Identify variable references accessed repeatedly in close loops.

3. **Spatial locality:**  
   Variables stored contiguously exhibit spatial locality.  
   Identify references where nearby elements are accessed consecutively.

4. **Cache blocks needed:**  
   Total matrix size: $8 \times 8000$ elements  
   Cache block size: $2$ elements per block  
   Blocks required:
   $$
   \text{Blocks} = \frac{\text{Total elements}}{2}
   $$

---

### **Problem 3**  
**Given:**  
- Two-way set-associative cache, 4 one-word blocks  
- Word address sequence: $0, 1, 2, 3, 4, \dots$  

**Tasks:**  
1. **LRU policy:**  
   Simulate cache updates using the Least Recently Used policy. Track hits.

2. **MRU policy:**  
   Simulate cache updates using the Most Recently Used policy. Track hits.

3. **Optimal policy:**  
   For minimal misses, replace the block not needed for the longest time in the future. Identify hits.

---

### **Problem 4**  
**Given:**  
- Cores:  
  - Core 1: $x = 2$  
  - Core 2: $y = 2$  
  - Core 3: $w = x + y + 1$  
  - Core 4: $z = x + y$  

**Tasks:**  
1. **Possible values:**  
   Examine interleavings of instructions and memory updates. List outcomes for $w, x, y, z$.

2. **Stabilizing outcomes:**  
   Suggest mechanisms (e.g., memory barriers, synchronization) to reduce variability.

---

### **Problem 5**  
**Given:**  
- CPU vs. GPU hardware differences  
- Task assignments:  
  - Sorting (quick/counting)  
  - Neural network training  
  - Summing numbers  
  - Physics simulation  
  - Running a virtual machine  

**Tasks:**  
1. **Hardware differences:**  
   Compare architecture traits: parallelism, cache hierarchy, control logic, etc.

2. **Processor suitability:**  
   Assign tasks to CPU or GPU based on characteristics such as compute intensity, parallelism, and data dependency.
