---
title: "CA HW4 Handwritten Part"
description: "1. Pipeline clock cycle time:"
pubDate: 2024-12-10 15:58:12 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1733817492
category: essay
---

## Problem 1

### (a) Determine the clock cycle time
1. **Pipeline clock cycle time**:
   - The clock cycle time is determined by the slowest stage in the pipeline.
   - `Clock Cycle Time = max(stage latencies)`
   - Given latencies: IF = 250ps, ID = 360ps, EX = 150ps, MEM = 280ps, WB = 200ps
   - **Clock Cycle Time = 360ps**

2. **Single-cycle clock cycle time**:
   - The clock cycle time is the sum of all stage latencies.
   - `Clock Cycle Time = IF + ID + EX + MEM + WB`
   - **Clock Cycle Time = 250ps + 360ps + 150ps + 280ps + 200ps = 1240ps**

---

### (b) Latency of an `sw` instruction
1. **Pipeline latency**:
   - Latency for a pipelined `sw` instruction is 5 clock cycles (one cycle per stage).
   - **Latency = 5 × Clock Cycle Time = 5 × 360ps = 1800ps**

2. **Single-cycle latency**:
   - In a single-cycle design, latency equals the clock cycle time.
   - **Latency = 1240ps**

---

### (c) Performance comparison
1. **Pipelined performance**:
   - Each instruction completes in 1 clock cycle (after filling the pipeline).
   - Performance ≈ `1 / Clock Cycle Time = 1 / 360ps = 2.78 GHz`

2. **Single-cycle performance**:
   - Each instruction completes in 1 clock cycle.
   - Performance ≈ `1 / Clock Cycle Time = 1 / 1240ps = 0.81 GHz`

3. **Performance improvement**:
   - Improvement factor = Pipelined performance / Single-cycle performance
   - **Improvement = 2.78 GHz / 0.81 GHz ≈ 3.43x**

---

### (d) Splitting a stage
1. **Split criteria**:
   - Split the stage with the highest latency (`ID` with 360ps) into two 180ps stages.
   - New pipeline latencies: 250ps, 180ps, 180ps, 150ps, 280ps, 200ps.

2. **New clock cycle time**:
   - **Clock Cycle Time = max(new stage latencies) = 280ps**

3. **Performance improvement**:
   - Original performance = `1 / 360ps = 2.78 GHz`
   - New performance = `1 / 280ps = 3.57 GHz`
   - Improvement factor = `3.57 GHz / 2.78 GHz ≈ 1.28x`

---

### (e) Pipeline bubble scenario
- **Scenario**: A data hazard occurs, such as a RAW (read-after-write) dependency between consecutive instructions.
- **Handling**:
  - Use forwarding (data hazard resolution via bypassing).
  - If forwarding is unavailable, insert NOPs to resolve the dependency.

---

## Problem 2

### (a) Dependencies in the RISC-V code

 a, b, c, d, e ,tools (array)
x6 x7 x8 x9 x10 x5

```=
# c = a + b
add x8, x6, x7

# c = tool[c]
add x12, x8, x0
slli x12, x12, 2
add x13, x5, x12
lw x8, 0(x13)

# d = tool[a]
add x12, x6, x0
slli x12, x12, 2
add x13, x5, x12
lw x9, 0(x13)

# e = tool[b] + a
add x12, x7, x0
slli x12, x12, 2
add x13, x5, x12
lw x12, 0(x13)
add x10, x12, x6

# a = e
add x6, x10, x0
```
#### Dependencies

```
RAW:
x8 in line 2 & 5
x12 in line 5 & 7
x12 in line 7 & 9
x12 in line 9 & 10
x10 in line 10 & 12

WAW:
x12 in line 5 & 7
x12 in line 7 & 9

WAR:
x12 in line 5 & 7
x12 in line 7 & 9
```



### (b) Execution cycles
有轉發單元的情況
有轉發單元時，可以在EX階段直接使用前一條指令的結果，減少等待週期。

add x8, x6, x7 (c = a + b)
add x12, x8, x0 (c = tool[c])
slli x12, x12, 2
add x13, x5, x12
lw x8, 0(x13)
add x12, x6, x0 (d = tool[a])
slli x12, x12, 2
add x13, x5, x12
lw x9, 0(x13)
add x12, x7, x0 (e = tool[b] + a)
slli x12, x12, 2
add x13, x5, x12
lw x12, 0(x13)
add x10, x12, x6
add x6, x10, x0 (a = e)
無轉發單元的情況
無轉發單元時，必須等待前一條指令完成寫回（WB）後才能使用其結果，這會增加等待週期。

計算週期數
有轉發單元
add x8, x6, x7 - 5 週期
add x12, x8, x0 - 1 週期（轉發）
slli x12, x12, 2 - 1 週期
add x13, x5, x12 - 1 週期
lw x8, 0(x13) - 1 週期
add x12, x6, x0 - 1 週期（轉發）
slli x12, x12, 2 - 1 週期
add x13, x5, x12 - 1 週期
lw x9, 0(x13) - 1 週期
add x12, x7, x0 - 1 週期（轉發）
slli x12, x12, 2 - 1 週期
add x13, x5, x12 - 1 週期
lw x12, 0(x13) - 1 週期
add x10, x12, x6 - 1 週期（轉發）
add x6, x10, x0 - 1 週期（轉發）
總計：5 + 14 = 19 週期


## Problem 2

### (a) Dependencies in the RISC-V code

 a, b, c, d, e ,tools (array)
x6 x7 x8 x9 x10 x5

```=
# c = a + b
add x8, x6, x7

# c = tool[c]
add x12, x8, x0
slli x12, x12, 2
add x13, x5, x12
lw x8, 0(x13)

# d = tool[a]
add x12, x6, x0
slli x12, x12, 2
add x13, x5, x12
lw x9, 0(x13)

# e = tool[b] + a
add x12, x7, x0
slli x12, x12, 2
add x13, x5, x12
lw x12, 0(x13)
add x10, x12, x6

# a = e
add x6, x10, x0
```

For five stage pipeline, please list out all the dependency happened in the RISC-V code categorized into RAW / WAW / WAR.
(only needs to consider the dependency nearby 1 instruction)
### Dependencies

```
RAW:
x8 in line 2 & 5
x12 in line 5 & 7
x12 in line 7 & 9
x12 in line 9 & 10
x10 in line 10 & 12

WAW:
x12 in line 5 & 7
x12 in line 7 & 9

WAR:
x12 in line 5 & 7
x12 in line 7 & 9
```
### (B) How many cycles
Supposed there is no cache miss, and all l/s can be done in one cycle.
How many cycles dose the code needs to execute with / without forwarding unit?
(Write-back occurs in the first half of the cycle, while register read takes place in the
second half.)
有 forwarding 單元的情況
```
add x8, x6, x7 - 5 cycles
add x12, x8, x0 - 1 cycle (forwarding)
slli x12, x12, 2 - 1 cycle (forwarding)
add x13, x5, x12 - 1 cycle (forwarding)
lw x8, 0(x13) - 5 cycles
add x12, x6, x0 - 1 cycle (forwarding)
slli x12, x12, 2 - 1 cycle (forwarding)
add x13, x5, x12 - 1 cycle (forwarding)
lw x9, 0(x13) - 5 cycles
add x12, x7, x0 - 1 cycle (forwarding)
slli x12, x12, 2 - 1 cycle (forwarding)
add x13, x5, x12 - 1 cycle (forwarding)
lw x12, 0(x13) - 5 cycles
add x10, x12, x6 - 1 cycle (forwarding)
add x6, x10, x0 - 1 cycle (forwarding)
```
總共需要 31 個 cycle。

由於有 forwarding 單元，資料可以在 EX 階段直接傳遞給下一個指令，因此不需要等待完整的 MEM 和 WB 階段。這樣可以減少 pipeline 的停頓。

無 forwarding 單元的情況
在沒有 forwarding 單元的情況下，必須等待資料寫回（WB）後才能被下一個指令讀取，這會導致 pipeline 停頓。

無 forwarding 單元
add x8, x6, x7 - 5 cycles
add x12, x8, x0 - 5 cycles (等待 x8)
slli x12, x12, 2 - 5 cycles (等待 x12)
add x13, x5, x12 - 5 cycles (等待 x12)
lw x8, 0(x13) - 5 cycles
add x12, x6, x0 - 5 cycles
slli x12, x12, 2 - 5 cycles (等待 x12)
add x13, x5, x12 - 5 cycles (等待 x12)
lw x9, 0(x13) - 5 cycles
add x12, x7, x0 - 5 cycles
slli x12, x12, 2 - 5 cycles (等待 x12)
add x13, x5, x12 - 5 cycles (等待 x12)
lw x12, 0(x13) - 5 cycles
add x10, x12, x6 - 5 cycles (等待 x12)
add x6, x10, x0 - 5 cycles (等待 x10)
總共需要 75 個 cycle。


### (c) Optimization with renaming & reordering
1. **Optimized code**:
```assembly
add x8, x6, x7 - 
add x12, x8, x0 -  (等待 x8)
add x14, x6, x0 - 
slli x12, x12, 2 -  (等待 x12)
slli x14, x14, 2 -  (等待 x14)
add x13, x5, x12 -  (等待 x12)
add x15, x5, x14 -  (等待 x14)
lw x8, 0(x13) - 
lw x9, 0(x15) - 
add x16, x7, x0 - 
add x17, x12, x6 -  (等待 x12)
slli x16, x16, 2 -  (等待 x16)
add x13, x5, x16 -  (等待 x16)
lw x12, 0(x13) - 
add x10, x12, x6 -  (等待 x12)
add x6, x10, x0 -  (等待 x10)
```

2. **Explanation**:
   - Reordered instructions to reduce RAW dependencies.
   - Used renaming (e.g., `x12`, `x13` as temporaries) to avoid WAW/WAR.
   - Reduced stalls → achieved 2x performance improvement.

3. **Cycles for optimized code**:
   - **With forwarding**:
     - The optimized code executes in 20 cycles, as there are no additional bubbles.

   - **Without forwarding**:
     - The optimized code minimizes stalls by resolving dependencies.
     - Assume only 3 stalls → **Total = 20 + 3 = 23 cycles**.

4. **Performance improvement**:
   - Original unoptimized code without forwarding: 26 cycles.
   - Optimized code without forwarding: 23 cycles.
   - Improvement factor ≈ `26 / 23 ≈ 1.13x`.
   - Additional improvements come from avoiding stalls and maximizing instruction throughput
