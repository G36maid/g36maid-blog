---
title: "CA HW5 Handwritten part"
description: "Block size (B) can affect both miss rate & miss latency. Assuming a machine base CPI = 1,"
pubDate: 2024-12-29 13:40:48 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1735450848
---

## Problem 1
Block size (B) can affect both miss rate & miss latency. Assuming a machine base CPI = 1,
average 1.35 references per instruction. find the block size that minimizes the total miss
latency
block size 8 16 32 64 128
miss rate 4% 3% 2% 1.5% 1%
* (1) What is the optimal block size for a miss latency of 20 * B cycles?
* (2) What is the optimal block size for a miss latency of 24 + B cycles?
* (3) For constant miss latency, what is the optimal block size?

#### Given:
- Base CPI = 1
- 1.35 references per instruction
- Block sizes and miss rates:  
  **8B**: 4%, **16B**: 3%, **32B**: 2%, **64B**: 1.5%, **128B**: 1%

#### (1) **Miss Latency = $20 \times B$:**  
**Miss penalty:** $MP = 20 \times B \times \text{Miss Rate}$  
**Total CPI = Base CPI + Average Memory Stalls:**  
$$
\text{CPI}_{\text{total}} = 1 + 1.35 \times MP
$$

For each block size:  
$$
\text{CPI}_{\text{total}} = 1 + 1.35 \times (20 \times B \times \text{Miss Rate})
$$

| **B (Bytes)** | **Miss Rate** | **Miss Penalty** ($20 \times B$) | **Total CPI** |
|---------------|---------------|-----------------------------------|---------------|
| 8             | 4%            | $20 \times 8 = 160$            | $1 + 1.35 \times (160 \times 0.04) = 1.864$ |
| 16            | 3%            | $20 \times 16 = 320$           | $1 + 1.35 \times (320 \times 0.03) = 2.296$ |
| 32            | 2%            | $20 \times 32 = 640$           | $1 + 1.35 \times (640 \times 0.02) = 2.728$ |
| 64            | 1.5%          | $20 \times 64 = 1280$          | $1 + 1.35 \times (1280 \times 0.015) = 2.596$ |
| 128           | 1%            | $20 \times 128 = 2560$         | $1 + 1.35 \times (2560 \times 0.01) = 2.456$ |

**Optimal Block Size:** 8 Bytes (minimizes total CPI).

#### (2) **Miss Latency = $24 + B$:**  
**Miss penalty:** $MP = (24 + B) \times \text{Miss Rate}$

| **B (Bytes)** | **Miss Rate** | **Miss Penalty** ($24 + B$) | **Total CPI** |
|---------------|---------------|-------------------------------|---------------|
| 8             | 4%            | $24 + 8 = 32$              | $1 + 1.35 \times (32 \times 0.04) = 1.172$ |
| 16            | 3%            | $24 + 16 = 40$             | $1 + 1.35 \times (40 \times 0.03) = 1.162$ |
| 32            | 2%            | $24 + 32 = 56$             | $1 + 1.35 \times (56 \times 0.02) = 1.151$ |
| 64            | 1.5%          | $24 + 64 = 88$             | $1 + 1.35 \times (88 \times 0.015) = 1.178$ |
| 128           | 1%            | $24 + 128 = 152$           | $1 + 1.35 \times (152 \times 0.01) = 1.205$ |

**Optimal Block Size:** 32 Bytes.

---

#### (3) **Constant Miss Latency:**  
If miss latency is constant, **smaller miss rates** are better.

**Optimal Block Size:** 128 Bytes (minimum miss rate of 1%).

---

<div style="page-break-after:always;"></div>

## Problem 2
In this exercise we look at memory locality properties of matrix computation. The following
code is written in C, where elements within the same row are stored contiguously. Assume
each word is a 64-bit integer.
```clike
for (I=0; I<8; I++)
    for (J=0; J<8000; J++)
        A[I][J]=B[I][0]+A[J][I];
```
* (1) How many 64-bit integers can be stored in a 16-byte cache block?
* (2) Which variable references exhibit temporal locality?
* (3) Which variable references exhibit spatial locality?
* (4) How many 16-byte cache blocks are needed to store all 64-bit matrix elements being
referenced? (Assume each row contains more than one element.)


#### Given:
- Cache block: 16 bytes
- Word size: 64 bits = 8 bytes  
  **1 Cache Block = $16 / 8 = 2$ integers**

---

#### (1) **Number of 64-bit integers per cache block:**  
**Answer:** 2 integers per block.

---

#### (2) **Temporal Locality:**  
**Temporal locality** refers to reusing the same memory location.  
- $B[I][0]$ is accessed repeatedly for the same $I$.

**Answer:** $B[I][0]$.

---

#### (3) **Spatial Locality:**  
**Spatial locality** refers to accessing contiguous memory locations.  
- $A[J][I]$ accesses elements in the same row as $J$ increments.

**Answer:** $A[J][I]$.

---

#### (4) **Number of cache blocks:**  
Matrix $A[8][8000]$ and $B[8][1]$:  
- $A[8][8000]$: $8 \times 8000 = 64000$ integers  
  $\text{Blocks} = \lceil 64000 / 2 \rceil = 32000$ blocks.  
- $B[8][1]$: $8$ integers  
  $\text{Blocks} = \lceil 8 / 2 \rceil = 4$ blocks.

**Answer:** $32000 + 4 = 32004$ blocks.

---

<div style="page-break-after:always;"></div>


## Problem 3
In this exercise, we will examine how replacement policies affect miss rate. Assume a twoway set associative cache with four one-word blocks. Consider the following word address
sequence:
0, 1, 2, 3, 4, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 0
* (1) Assuming an LRU replacement policy, which accesses are hits? (List only the addresses that are hits.)
* (2) Assuming an MRU (most recently used) replacement policy, which accesses are hits? (List only the addresses that are hits.)
* (3) Describe an optimal replacement policy for this sequence. Which accesses are hits using this policy? (List only the addresses that are hits.)

#### Given:
- 2-way set associative cache
- Sequence: $0, 1, 2, 3, 4, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 0$

---

#### (1) **LRU Replacement Policy Hits:**  
Track cache sets dynamically using LRU.

**Answer:** $2, 3, 4, 5, 6, 7, 0$.

---

#### (2) **MRU Replacement Policy Hits:**  
Replace least recently used entries first.

**Answer:** $2, 3, 4, 5, 6, 7, 0$.

---

#### (3) **Optimal Replacement Policy:**  
Evict blocks based on **future use**.  

**Answer:** $2, 3, 4, 5, 6, 7, 0$.

---

<div style="page-break-after:always;"></div>

## Problem 4
Consider the following portions of two different programs running at the samw time on four
processors in a symmetric multicore processor(SMP). Assume that before this code is run,
both x & y are 0.

Core 1: x = 2;
Core 2: y = 2;
Core 3: w = x + y + 1;
Core 4: z = x + y;

(1) list all the possible resulting values of w, x, y and z. For each possible outcome explain how to achieve this result.
(2) How to make the outcome more stable?

#### (1) **Possible Results:**  
$x = 2, y = 2, w \in \{1, 5, 7\}, z \in \{0, 2, 4\}$.

**Explanation:**  
Outcomes depend on instruction ordering and memory consistency model.

---

#### (2) **Making Outcomes More Stable:**  
Use memory barriers or atomic operations.

---

<div style="page-break-after:always;"></div>


## Problem 5
In this exercise, we compare the design of CPU and GPU.
* (1) In terms of hardware architecture, what are the key differences between CPU and GPU.
* (2) Consider the following tasks. For each of them, determine which kinds of processor we should use to get better performance, please also explain why.
    * sorting 10000 integers by quick sort
    * sorting 10000 integers by counting sort
    * training a large neural network
    * summing 1073741824 numbers
    * running physics simulation
    * running a virtual machine



#### (1) **Key Differences:**
- **CPU:** Fewer cores, optimized for sequential processing.  
- **GPU:** Many cores, optimized for parallel tasks.

---

#### (2) **Processor Choice:**  
- **Quick Sort:** CPU (sequential nature).  
- **Counting Sort:** GPU (parallelizable).  
- **Neural Network Training:** GPU (highly parallel).  
- **Summing Numbers:** GPU (parallelizable).  
- **Physics Simulation:** GPU (parallelizable).  
- **Virtual Machine:** CPU (requires low latency).

---
