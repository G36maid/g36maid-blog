---
title: "高等編譯器作業：Affine Partitioning 平行化"
description: "學號：g36maid"
pubDate: 2025-09-26 12:34:14 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1758861254
---

姓名：鍾詠傑
學校：NTNU
學號：g36maid
日期：2025/9/20

---

## 題目

考慮以下巢狀迴圈程式：

```c
FOR j = 1 TO n
    FOR i = 1 TO n
        A[i,j] = A[i,j] + B[i-1,j];      // (S1)
        B[i,j] = A[i,j-1] * B[i,j];      // (S2)
```

(a) 這個程式可否透過 Affine Partition 來做平行化？
(b) 系統化地展示如何產生 affine-partitioned code。

---

## (a) 可平行化性分析

### 依賴關係分析

- **S1:** `A[i,j] = A[i,j] + B[i-1,j];`
  - 依賴於 `B[i-1,j]`，即 S1(i, j) 依賴於 S1(i-1, j)。
- **S2:** `B[i,j] = A[i,j-1] * B[i,j];`
  - 依賴於 `A[i,j-1]`，即 S2(i, j) 依賴於 S1(i, j-1)。

這些依賴皆為仿射（affine）型態，屬於 i, j 的線性組合。

### 可平行化性結論

- **不能直接讓每個核心執行自己的 (i, j) iteration**，否則會破壞資料依賴。
- **可以透過 affine partitioning（如 wavefront/anti-diagonal 分割）來平行化**，即沿著 i+j=k 的方向，每個 wavefront 可平行執行。

---

## (b) Affine Partitioning 系統化步驟

### 步驟 1：依賴關係建模

- S1(i, j) 依賴於 S1(i-1, j)
- S2(i, j) 依賴於 S1(i, j-1)

### 步驟 2：決定 affine partitioning 方向

- 依賴分別為 (i-1, j) 和 (i, j-1)，屬於 wavefront pattern。
- 定義 k = i + j，則所有 (i, j) 滿足 i + j = k 的 iteration 可同時執行。

### 步驟 3：重寫 affine-partitioned code

```c
// Affine Partitioned (Wavefront) Parallel Code
for (int k = 2; k <= 2*n; ++k) {
    // 並行處理所有滿足 i + j = k 的 (i, j)
    #pragma omp parallel for
    for (int i = max(1, k - n); i <= min(n, k - 1); ++i) {
        int j = k - i;
        A[i][j] = A[i][j] + B[i-1][j];    // S1
        B[i][j] = A[i][j-1] * B[i][j];    // S2
    }
}
```

---

## (c) 圖解與說明

### 依賴關係視覺化

以 n = 4 為例，矩陣如下（每格標註 (i, j)）：

```
(1,1) (1,2) (1,3) (1,4)
(2,1) (2,2) (2,3) (2,4)
(3,1) (3,2) (3,3) (3,4)
(4,1) (4,2) (4,3) (4,4)
```

- K=2: (1,1)
- K=3: (1,2), (2,1)
- K=4: (1,3), (2,2), (3,1)
- K=5: (1,4), (2,3), (3,2), (4,1)
- K=6: (2,4), (3,3), (4,2)
- K=7: (3,4), (4,3)
- K=8: (4,4)

每一條 K 固定的 anti-diagonal 上的格子都可以同時計算，因為它們的依賴都在前一條 anti-diagonal 上。

### 結論

- **K = i + j 的 wavefront 掃描法**，可以確保所有依賴都已經被計算完，實現最大平行度。
- 這種 affine partitioning 方法廣泛應用於動態規劃、矩陣運算等領域。

---

## 參考資料

- 課堂講義 Week 5: Affine Partitioning

---
