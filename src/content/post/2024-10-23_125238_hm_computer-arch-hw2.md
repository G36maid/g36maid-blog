---
title: "computer arch HW2"
description: "在 RISC-V 64 位元架構 (RV64) 中，有 32 個通用暫存器，每個暫存器都是 64 位元長度，另外還有一些特殊用途的暫存器。以下是所有可用的通用暫存器及其對應名稱和用途："
pubDate: 2024-10-23 12:52:38 +0800
tags: ["指標", "arch", "執行緒", "程式", "thread"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1729659158
category: programming
---

在 RISC-V 64 位元架構 (RV64) 中，有 32 個通用暫存器，每個暫存器都是 64 位元長度，另外還有一些特殊用途的暫存器。以下是所有可用的通用暫存器及其對應名稱和用途：

### 通用暫存器 (x0 - x31)
| 暫存器名稱 | 編號 | 別名  | 功能簡介                                        |
|------------|------|-------|------------------------------------------------|
| `x0`       | 0    | `zero`| 常數 0，讀時永遠返回 0，寫入將被忽略。              |
| `x1`       | 1    | `ra`  | 返回位址（Return Address），存放函數返回地址。       |
| `x2`       | 2    | `sp`  | 堆疊指標（Stack Pointer），指向當前堆疊的頂部。      |
| `x3`       | 3    | `gp`  | 全域指標（Global Pointer），用於全域變數。          |
| `x4`       | 4    | `tp`  | 執行緒指標（Thread Pointer），用於指向執行緒本地儲存。|
| `x5`       | 5    | `t0`  | 臨時暫存器（Temporary Register），在函數間不保留值。  |
| `x6`       | 6    | `t1`  | 臨時暫存器（Temporary Register），在函數間不保留值。  |
| `x7`       | 7    | `t2`  | 臨時暫存器（Temporary Register），在函數間不保留值。  |
| `x8`       | 8    | `s0`/`fp` | 保存暫存器（Saved Register）或幀指標（Frame Pointer），保存於函數間，幀指標用於堆疊框架。 |
| `x9`       | 9    | `s1`  | 保存暫存器（Saved Register），保存於函數間。        |
| `x10`      | 10   | `a0`  | 函數參數/返回值（Argument/Return Value），函數前 8 個參數之一，也是函數返回值的寄存器。 |
| `x11`      | 11   | `a1`  | 函數參數/返回值（Argument/Return Value），函數前 8 個參數之一。 |
| `x12`      | 12   | `a2`  | 函數參數（Argument），函數前 8 個參數之一。         |
| `x13`      | 13   | `a3`  | 函數參數（Argument），函數前 8 個參數之一。         |
| `x14`      | 14   | `a4`  | 函數參數（Argument），函數前 8 個參數之一。         |
| `x15`      | 15   | `a5`  | 函數參數（Argument），函數前 8 個參數之一。         |
| `x16`      | 16   | `a6`  | 函數參數（Argument），函數前 8 個參數之一。         |
| `x17`      | 17   | `a7`  | 函數參數（Argument），函數前 8 個參數之一。         |
| `x18`      | 18   | `s2`  | 保存暫存器（Saved Register），保存於函數間。        |
| `x19`      | 19   | `s3`  | 保存暫存器（Saved Register），保存於函數間。        |
| `x20`      | 20   | `s4`  | 保存暫存器（Saved Register），保存於函數間。        |
| `x21`      | 21   | `s5`  | 保存暫存器（Saved Register），保存於函數間。        |
| `x22`      | 22   | `s6`  | 保存暫存器（Saved Register），保存於函數間。        |
| `x23`      | 23   | `s7`  | 保存暫存器（Saved Register），保存於函數間。        |
| `x24`      | 24   | `s8`  | 保存暫存器（Saved Register），保存於函數間。        |
| `x25`      | 25   | `s9`  | 保存暫存器（Saved Register），保存於函數間。        |
| `x26`      | 26   | `s10` | 保存暫存器（Saved Register），保存於函數間。        |
| `x27`      | 27   | `s11` | 保存暫存器（Saved Register），保存於函數間。        |
| `x28`      | 28   | `t3`  | 臨時暫存器（Temporary Register），在函數間不保留值。  |
| `x29`      | 29   | `t4`  | 臨時暫存器（Temporary Register），在函數間不保留值。  |
| `x30`      | 30   | `t5`  | 臨時暫存器（Temporary Register），在函數間不保留值。  |
| `x31`      | 31   | `t6`  | 臨時暫存器（Temporary Register），在函數間不保留值。  |

### 特殊暫存器
除了以上的通用暫存器，RISC-V 還有一些特殊的控制與狀態暫存器（CSR），例如：
- `pc`: 程式計數器，指向當前正在執行的指令。
- `fcsr`: 浮點控制和狀態寄存器（若支援浮點運算）。

通用暫存器之間的主要區別在於它們在函數調用過程中的保存約定（例如，`t0-t6` 是臨時寄存器，不需要在函數之間保持值，而 `s0-s11` 則是保存寄存器，需要保存它們的值）。
