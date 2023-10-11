---
title: "ada hw01 handwriten"
description: "Problem 5 : all by my self"
pubDate: 2023-10-12 06:07:04 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1697062024
---

## P0 
Problem 5 : all by my self

Problem 6 : Ta Tian on Discord and chatGPT

<div style="page-break-after:always;"></div>

## Problem 5 : Asymptotic Notations 

### (a) Finding prime numbers

Alexander’s algorithm:
```=
ans = Empty Stack
    for i = 2..n:
    flag = true
    for j = 2..i:
        if j * j > i:
            if flag is true:
                ans.push(i)
            break
        if i % j == 0:
            flag = false
return ans
```
Bambooboo’s algorithm:
```=
ans = Empty Stack
is_prime = bool array with size n

for i = 2..n:
    is_prime[i] = true

for i = 2..n:
    j = i * 2
    while j <= n:
        is_prime[j] = false
        j += i

for i = 2..n:
    if is_prime[i]:
        ans.push(i)
return ans
```

<div style="page-break-after:always;"></div>

#### 1
The outer loop runs from 2 to n, so it iterates n - 2 + 1 = n - 1 times.
The inner loop runs from 2 to i, where i is the current value of the outer loop. In the worst case, it iterates roughly i/2 times.
So, the total number of iterations in the inner loop can be approximated as (1/2) * (2 + 3 + 4 + ... + n) = (1/2) * [(n * (n + 1)) / 2] = (n^2 + n) / 4.
the time complexity of Alexander's algorithm is Θ((n^2 + n



#### 2

The first loop for initializing the is_prime array runs from 2 to n, which is n - 2 + 1 = n - 1 times.
The second loop for marking multiples as non-prime runs from 2 to n. In the worst case, it iterates n/2 times (considering only odd multiples for efficiency).
The third loop for collecting prime numbers also runs from 2 to n.
Hence, the time complexity of Bambooboo's algorithm is approximately Θ(n) + Θ(n/2) + Θ(n) = Θ(n).



#### 3
Alexander's algorithm has a time complexity of Θ(n^2).
Bambooboo's algorithm has a time complexity of Θ(n).
Bambooboo's algorithm is faster when n is very large


<div style="page-break-after:always;"></div>

### (b) Sorting

3>1>4>5>1


<div style="page-break-after:always;"></div>

### ( c ) Strange recursions 
#### 1
Given the recurrence relation for f(n):

f(n) = f(4n/9) + f(n/2) + 49n

=>f(n) = f(4/9 * n) + f(1/2 * n) + 49n

= 49n + (4/9) * 49n + 1/2 * 49n
//+ f(4/9 * 4/9 * n) + f(1/2 * 4/9 * n) 
//+ f(1/2 * 4/9 * n) + f(1/2 * 1/2 * n) 

=49n * ( 1+ (4/9 + 1/2) ) 
//+ f(4/9 * 4/9 * n) + f(1/2 * 4/9 * n) 
//+ f(1/2 * 4/9 * n) + f(1/2 * 1/2 * n) 

=49n * ( 1+ (4/9 + 1/2) + (4/9 + 1/2)^2) + 
//all the 8 recursions 

=> f(n) = 49n  * (1 + 17/18) + (17/18)^2 ...)

we can see the Geometric series R < 1
by the define of Geometric series if R < 1 will convergence.
f(n)
= 49n * 1/(1-17/18)
= 49n * 18
= Θ(n)

 f(n) = Θ(n). 
 QED

<div style="page-break-after:always;"></div>

#### 2
Given the recurrence relation for f(n):
f(n) = f(an) + f(bn) + n

f(n) 
= f(an) + f(bn) + n
= n + 
 f(aan) + f(ban) + an +
 f(abn) + f(bbn) + bn
= n + an + bn + (all the 4 recursions) 
= n* (1+(a+b)) +(all the 4 recursions)
= n* (1+(a+b)+(a+b)^2 )+(all the 8 recursions)
= n* (1+ (a+b) + (a+b)^2 + .....)

we can see the Geometric series R =(a+b)
by the define of Geometric series if R < 1 will convergence.
f(n) = n * 1/(1-a+b) 
1/(1-a+b) is const

when (a+b)<1 
if and only if f(n) = Θ(n). 
QED

<div style="page-break-after:always;"></div>

#### 3

For f(n):

a1 × f(b1n) and a2 × g(b2n) must both be less than or equal to 1 to ensure that f(n) remains less than or equal to 1.
Specific values of a1, a2, b1, and b2 should be chosen such that these constraints are met.

For g(n):

a3 × f(b3n) and a4 × g(b4n) must both be less than or equal to 1 to ensure that g(n) remains less than or equal to 1.
Specific values of a3, a4, b3, and b4 should be chosen such that these constraints are met.

i think all b need in range of 0<b1,2,3,4<1
and a1,2,3,4 no limit 

<div style="page-break-after:always;"></div>

## Problem 6 - Arctan and Inversions 
### (a) 
```
function count_inversions(arr):
    if length(arr) <= 1:
        return 0, arr
    
    mid = length(arr) / 2
    left_half = arr[0:mid]
    right_half = arr[mid:]

    count_left, left_sorted = count_inversions(left_half)
    count_right, right_sorted = count_inversions(right_half)
    count_merge, merged_arr = merge_and_count(left_sorted, right_sorted)
    
    total_count = count_left + count_right + count_merge
    
    return total_count, merged_arr

function merge_and_count(left, right):
    merged = []
    count = 0
    i = 0
    j = 0

    while i < length(left) and j < length(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
            count += length(left) - i  # Count inversions

    merged.extend(left[i:])
    merged.extend(right[j:])

    return count, merged
```

<div style="page-break-after:always;"></div>

### (b) 
```
function find_happiness_and_sort(arr):
    if length(arr) <= 1:
        return 0, arr
    
    mid = length(arr) / 2
    left_half = arr[0:mid]
    right_half = arr[mid:]

    happiness_left, left_sorted = find_happiness_and_sort(left_half)
    happiness_right, right_sorted = find_happiness_and_sort(right_half)
    happiness_merge, merged_arr = merge_and_find_happiness(left_sorted, right_sorted)
    
    total_happiness = happiness_left + happiness_right + happiness_merge
    
    return total_happiness, merged_arr

function merge_and_find_happiness(left, right):
    merged = []
    happiness = 0
    i = 0
    j = 0

    while i < length(left) and j < length(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            happiness += left[i] + right[j]
            i += 1
        else:
            merged.append(right[j])
            j += 1

    # After merging, add any remaining elements to the merged array
    merged.extend(left[i:])
    merged.extend(right[j:])

    return happiness, merged
```
<div style="page-break-after:always;"></div>

### ( c ) 
```
function find_happiness_kth_day(arr, k):
    if length(arr) <= 1:
        return 0, arr
    
    mid = length(arr) / 2
    left_half = arr[0:mid]
    right_half = arr[mid:]

    happiness_left, left_sorted = find_happiness_kth_day(left_half, k)
    happiness_right, right_sorted = find_happiness_kth_day(right_half, k)
    happiness_merge, merged_arr = merge_and_find_happiness_kth_day(left_sorted, right_sorted, k)
    
    total_happiness = happiness_left + happiness_right + happiness_merge
    
    return total_happiness, merged_arr

function merge_and_find_happiness_kth_day(left, right, k):
    merged = []
    happiness = 0
    i = 0
    j = 0

    while i < length(left) and j < length(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            happiness += (left[i] + right[j])^k
            i += 1
        else:
            merged.append(right[j])
            j += 1

    # After merging, add any remaining elements to the merged array
    merged.extend(left[i:])
    merged.extend(right[j:])

    return happiness, merged
```
<div style="page-break-after:always;"></div>

### (d)
answer:
```=
insert 1
insert 2
...
insert 2n/3
delete 2n/3   or 2n/3-1 //delete all the odd number
delete 2n/3-2 or 2n/3-3
...
delete 1
```
The minimum possible number of stack operations:

we need 2n/3 to insert

for every delete
1st delete is 1 pop
2nd delete is 2 pop + 1 push
3rd delete is 3 pop + 2 push
...

the total delete need 1+3+5+...2*(n/3)+1 operations
(2 * (n/3) * ((n/3)+1) /2 ) + 2n/3 
= (n/3) * (n/3+1) + 2*n/3 
= Θ(n^2)

<div style="page-break-after:always;"></div>

### (e)
using a divide and conquer approach
This approach involves breaking the sequence into two halves and efficiently combining them by comparing the operations on the right side of the first stack with the left side of the second stack.

managing the stack operations during the divide and conquer process, it has  a complexity of O(n log n).

Here's a pseudocode for completing a sequence of n set operations in O(n log n) stack operations using a divide and conquer approach:
```
# Function to perform set operation based on the operation symbol
def perform_set_operation(stack, operation):
    if operation[0] == '+':
        stack.push(operation[1:])  # Insert set
    elif operation[0] == '-':
        stack.pop(operation[1:])  # Delete set

# Function to combine two stacks efficiently
def combine_stacks(left_stack, right_stack):
    while left_stack is not empty and right_stack is not empty:
        left_top = left_stack.pop()  # Get the top element of the left stack
        right_top = right_stack.pop()  # Get the top element of the right stack

        # Perform set operation based on the operation symbol
        perform_set_operation(left_top, right_top)

        # Push the result back to the left stack
        left_stack.push(left_top)

    # Push any remaining elements from the right stack to the left stack
    while right_stack is not empty:
        left_stack.push(right_stack.pop())

# Function to complete the sequence of set operations using divide and conquer
def complete_set_sequence(operations):
    n = length of operations
    if n == 0:
        return Empty Stack

    if n == 1:
        stack = Empty Stack
        perform_set_operation(stack, operations[0])
        return stack

    # Find the middle point
    mid = n // 2

    # Recursively process the left and right halves
    left_stack = complete_set_sequence(operations[0:mid])
    right_stack = complete_set_sequence(operations[mid:n])

    # Combine the left and right stacks efficiently
    combine_stacks(left_stack, right_stack)

    return left_stack
```

<div style="page-break-after:always;"></div>
