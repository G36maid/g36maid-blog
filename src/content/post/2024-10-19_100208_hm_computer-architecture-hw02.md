---
title: "computer architecture HW02"
description: "Assignment 2 - Handwritten Part (50%)"
pubDate: 2024-10-19 10:02:08 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1729303328
category: essay
---

Assignment 2 - Handwritten Part (50%)

## Question 1

Following is a C code for comparing a value in `comp` with `k`.

```c
int i = 0;
while (comp[i] == k) {
    i += 1;
}
```

And here is the assembly code version of the code above:
(Array `comp`'s base address is saved in `x25`.)

```asm
add    x22, x0, x0      // i = 0
Loop:  slli   x10, x22, 2     // x10 = i * 4
       add    x10, x10, x25   // x10 = address of comp[i]
       lw     x9,  0(x10)     // x9 = comp[i]
       bne    x9,  x24, Exit  // go to Exit if comp[i] != k
       addi   x22, x22, 1     // i = i + 1
       beq    x0,  x0,  Loop  // go to Loop

Exit:
   // code..
```

There are two labels: `Loop` and `Exit` inside this code.

### Task:
Convert this assembly code into a one-label version. (Annotations are encouraged.)

### ANS

To convert the RISC-V assembly code into a one-label version, the idea is to eliminate the `Exit` label and rely on conditional branches to directly jump out of the loop when the condition is met. Here's a one-label version of the given assembly code:

```asm
add    x22, x0, x0       // i = 0
Loop:  
       slli   x10, x22, 2     // x10 = i * 4
       add    x10, x10, x25   // x10 = address of comp[i]
       lw     x9,  0(x10)     // x9 = comp[i]
       bne    x9,  x24, Done  // if comp[i] != k, skip the loop body (go to Done)
       addi   x22, x22, 1     // i = i + 1
       beq    x0,  x0,  Loop  // unconditional branch back to Loop

Done:
   // code continues here..
```

### Explanation:
- Instead of having an `Exit` label, we introduce a `Done` label where the execution continues after the loop terminates.
- The `bne` instruction is used to break out of the loop by branching directly to `Done` when `comp[i] != k`.
- The loop continues with the `beq` instruction that unconditionally branches back to the `Loop` label.

This solution maintains the functionality of the original code while reducing the label count to one.

## Question 2

Following are three groups of hexadecimal instructions. Please:

1. Convert them into binary.
2. Translate them into assembly code.
3. Explain what these instructions do.

```
0x00A484B3
0x40A48533
0x40A484B3
```
### ANS

### 1. Convert to binary

Here are the binary representations of the hexadecimal instructions:

1. `0x00A484B3`
   - Binary: `0000 0000 1010 0100 1000 0100 1011 0011`

2. `0x40A48533`
   - Binary: `0100 0000 1010 0100 1000 0101 0011 0011`

3. `0x40A484B3`
   - Binary: `0100 0000 1010 0100 1000 0100 1011 0011`

---

### 2. Translate to assembly code

Now let's decode these instructions into their respective RISC-V assembly commands.

1. **`0x00A484B3`**:
   - **Opcode**: `0110011` (R-type instruction)
   - **Funct3**: `000` (ADD or SUB)
   - **Funct7**: `0000000` (ADD operation)
   - **rs1**: `x9` (binary `01001`)
   - **rs2**: `x10` (binary `01010`)
   - **rd**: `x9` (binary `01001`)

   **Assembly**: `add x9, x9, x10`

   **Explanation**: This instruction performs an addition of registers `x9` and `x10` and stores the result in `x9`.

2. **`0x40A48533`**:
   - **Opcode**: `0110011` (R-type instruction)
   - **Funct3**: `000` (ADD or SUB)
   - **Funct7**: `0100000` (SUB operation)
   - **rs1**: `x9` (binary `01001`)
   - **rs2**: `x10` (binary `01010`)
   - **rd**: `x10` (binary `01010`)

   **Assembly**: `sub x10, x9, x10`

   **Explanation**: This instruction subtracts register `x10` from `x9` and stores the result in `x10`.

3. **`0x40A484B3`**:
   - **Opcode**: `0110011` (R-type instruction)
   - **Funct3**: `000` (ADD or SUB)
   - **Funct7**: `0100000` (SUB operation)
   - **rs1**: `x9` (binary `01001`)
   - **rs2**: `x10` (binary `01010`)
   - **rd**: `x9` (binary `01001`)

   **Assembly**: `sub x9, x9, x10`

   **Explanation**: This instruction subtracts register `x10` from `x9` and stores the result in `x9`.

---

### 3. Explanation of what these instructions do

1. **`add x9, x9, x10`**: Adds the contents of register `x9` and `x10`, then stores the result back in `x9`.
   - This updates `x9` with the sum of the previous values of `x9` and `x10`.

2. **`sub x10, x9, x10`**: Subtracts the value of register `x10` from `x9`, and stores the result in `x10`.
   - This updates `x10` with the result of `x9 - x10`.

3. **`sub x9, x9, x10`**: Subtracts the value of register `x10` from `x9`, and stores the result in `x9`.
   - This updates `x9` with the result of `x9 - x10`.

Together, these instructions perform basic arithmetic operations on the `x9` and `x10` registers, updating their values as they execute.

## Question 3


Bob wants to use RISC-V assembly to calculate `f = x + min(y, z)`. The input `x`, `y`, and `z` are first placed in registers `x10`, `x11`, and `x12`, and the return value `f` should be placed in `x10` at the end of the program. Here is his code:

```asm
Main:  jal  x1, Min
       add  x10, x10, x12
       jal  x0, Exit

Min:   bge  x10, x11, L
       jalr x0, 0(x1)

L:     add  x10, x11, x0
       jalr x0, 0(x1)

Exit:
```

However, the output of this program is incorrect.

### Task:
Help Bob fix his code to produce the correct output. You can only insert a few lines in the main function. Modifying the existing code is not allowed!!

### ANS

To fix Bob's code, the issue lies in how the registers are being used in the `Min` function. Specifically:

- The inputs `y` (`x11`) and `z` (`x12`) are not handled properly.
- The `Min` function is comparing `x10` (which contains `x` initially) instead of comparing `y` (`x11`) and `z` (`x12`), which leads to incorrect behavior.
  
The fix involves updating `x10` with the result of `min(y, z)` in the `Min` function before it adds `x` to the result. However, since modifying the existing code is not allowed, the solution will be to set the correct registers for `Min` in the `Main` function.

### Fixed Code (with added lines in `Main`):

```asm
Main:  
       add  x10, x11, x0       // Move y into x10 (prepare for min comparison)
       jal  x1, Min            // Call Min function to get min(y, z)
       add  x10, x10, x12      // Add x to min(y, z) result (f = x + min(y, z))
       jal  x0, Exit

Min:   
       bge  x11, x12, L        // If y >= z, go to L (return z)
       jalr x0, 0(x1)          // Return y (already in x10)

L:     
       add  x10, x12, x0       // Move z into x10 (return z)
       jalr x0, 0(x1)

Exit:
```

### Explanation:

1. **Added line:**  
   ```asm
   add  x10, x11, x0
   ```
   This moves the value of `y` (`x11`) into `x10` before the `Min` function is called. This ensures that `x10` is initialized properly with `y` for comparison within `Min`.

2. **Main logic:**  
   After calling `Min`, which computes `min(y, z)` and places the result in `x10`, the program proceeds to add the value of `x` (initially stored in `x12`) to the result of `min(y, z)`. The final result `f = x + min(y, z)` is stored in `x10`.

### `Min` function:
- **`bge  x11, x12, L`**: This compares `y` (`x11`) and `z` (`x12`). If `y >= z`, it jumps to label `L`, which returns `z` by placing it in `x10`.
- If `y < z`, the function returns `y` (which was initially moved into `x10` in `Main`).

This fix correctly calculates `f = x + min(y, z)` by setting up the right registers before calling the `Min` function.
