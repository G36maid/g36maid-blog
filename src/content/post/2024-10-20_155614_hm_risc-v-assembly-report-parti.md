---
title: "RISC-V Assembly Report: Partition Function"
description: "The partition function is part of the quicksort algorithm, which rearranges elements in an array such that all elements less than a selec…"
pubDate: 2024-10-20 15:56:14 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1729410974
---

## Purpose
The `partition` function is part of the quicksort algorithm, which rearranges elements in an array such that all elements less than a selected pivot come before it, and all elements greater come after it. This function is crucial for the sorting process, enabling the recursive division of the array into sub-arrays.

## Parameters
The function takes three parameters:
- **a0**: Address (base) of the array in memory.
- **a1**: Low index (`lo`) of the segment to be partitioned.
- **a2**: High index (`hi`) of the segment to be partitioned.

## Implementation
The implementation of the `partition` function is as follows:

1. **Pivot Selection**:
   - The pivot is selected as the first element of the array segment defined by the `lo` index.
   - The address of the pivot is calculated and its value is loaded into register `t1`.

2. **Initialization**:
   - The index `i` is initialized to `lo + 1`.
   - The index `j` is initialized to `hi`.

3. **Partitioning Loop**:
   - The loop continues until `i` is greater than or equal to `hi`.
   - Elements from the left are scanned to find values greater than the pivot.
   - Simultaneously, elements from the right are scanned to find values less than the pivot.

4. **Swapping Elements**:
   - If an element from the left is found that is greater than or equal to the pivot and an element from the right is found that is less than or equal to the pivot, the two elements are swapped.
   - This continues until all elements are correctly positioned relative to the pivot.

5. **Final Pivot Placement**:
   - After scanning, the pivot is swapped with the element at index `j`, ensuring that the pivot is in its final position.
   - The function returns the index of the pivot, which can be used in recursive calls to sort the left and right partitions.

## Code
```assembly
.globl partition

partition:
    # Arguments: a0 = address (base of the array), a1 = low index (lo), a2 = high index (hi)
    slli t0, a1, 3            # t0 = lo * 8 (each int is 8 bytes)
    add t0, t0, a0            # t0 = address of the pivot
    ld t1, 0(t0)              # t1 = pivot value (array[lo])

    addi t2, a1, 1            # t2 = i = lo + 1
    addi t3, a2, 0            # t3 = j = hi

partition_loop:
    # Find an element greater than pivot from the left
left_scan:
    bge t2, a2, swap          # if (i >= hi), go to swap
    slli t4, t2, 3            # t4 = i * 8
    add t4, t4, a0            # t4 = address of array[i]
    ld t5, 0(t4)              # t5 = array[i]
    blt t5, t1, next_left     # if array[i] < pivot, continue
    j right_scan              # else, look for element from the right

next_left:
    addi t2, t2, 1            # i++

# Find an element less than pivot from the right
right_scan:
    blt t3, a1, done          # if (j < lo), done
    slli t4, t3, 3            # t4 = j * 8
    add t4, t4, a0            # t4 = address of array[j]
    ld t6, 0(t4)              # t6 = array[j]
    bgt t6, t1, next_right    # if array[j] > pivot, continue
    j left_scan               # else, look for element from the left

next_right:
    addi t3, t3, -1           # j--

    # Swap elements at i and j
    # Swap array[i] and array[j]
    slli t4, t2, 3            # t4 = i * 8
    add t4, t4, a0            # t4 = address of array[i]
    slli t7, t3, 3            # t7 = j * 8
    add t7, t7, a0            # t7 = address of array[j]

    ld t5, 0(t4)              # t5 = array[i]
    ld t6, 0(t7)              # t6 = array[j]

    sd t5, 0(t7)              # array[j] = array[i]
    sd t6, 0(t4)              # array[i] = array[j]

    j partition_loop           # Continue the loop

done:
    # Swap pivot with array[j]
    slli t4, t3, 3            # t4 = j * 8
    add t4, t4, a0            # t4 = address of array[j]
    sd t1, 0(t4)              # array[j] = pivot

    # Return the new pivot index
    mv a0, t3                  # Return value is j
    ret
```

## Example Usage
```
rars rv64 main.s sort.s
```
To utilize the `partition` function, it should be called from the `quicksort` function after preparing the parameters (address of the array, low index, and high index). After partitioning, the returned pivot index can be used to recursively sort the left and right segments of the array.

## Conclusion
The `partition` function efficiently organizes the elements of an array in preparation for the quicksort algorithm. Its implementation leverages the RISC-V assembly language's capabilities, allowing for direct manipulation of memory and registers to achieve optimal performance.
```

### Additional Notes
- Make sure to adjust the sections based on your project requirements or the context of the report.
- You can add diagrams or flowcharts if necessary to illustrate the process further.
- Consider including performance analysis or comparisons with other sorting algorithms if relevant to your report.
