---
title: "ada hw02 handwriten"
description: "NO. : G36maid (ntnu)"
pubDate: 2023-12-05 00:46:10 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1701708370
---

## info
NO. : G36maid (ntnu)
Name : 鍾詠傑

ref: in class ppt + my think + chatgpt

<div style="page-break-after:always;"></div>

## Problem 5 - Nathan at Small Circle Village 
### a
Initialize a 2D array dp of size (N + 1) x (M + 1) and initialize all values to 0.

For each type of bubble tea (from 1 to N), iterate through the DP table and update it as follows:

For each budget value j from 0 to M, calculate the maximum happiness that can be obtained considering two choices:
a. Not buying the current bubble tea, which means dp[i][j] = dp[i-1][j].
b. Buying the current bubble tea, which means dp[i][j] = dp[i-1][j - c[i]] + h[i]

Set dp[i][j] to the maximum value from the above two choices.

dp[N][M] will represent the maximum happiness 

<div style="page-break-after:always;"></div>

### b
we first sort the happiness values in descending order. than we choose the top K element，

the sum of K_0 to K_n is the answar

This algorithm has a time complexity of O(Nlogn)
also O(N^2)

<div style="page-break-after:always;"></div>

### C (c-2)
using DP algorithm 
dp[i][j][0] represents the maximum happiness Nathan can obtain after visiting the first i bubble tea shops and buying at most j cups. 

also storage the last bying shop dp[i][j][1] to avoid the inner loop to calculate the last bying shop L times , need to update if buy $h_i$ shops
to make sure every L consecutive shops has least one buy

The time complexity of this algorithm is O(N * K), as it uses a two-dimensional array of size N x K.

<div style="page-break-after:always;"></div>

### d
To design an O(NKL) algorithm to find the maximum happiness Nathan can obtain after buying at most K cups to drink with Fysty's help, you can use dynamic programming. The idea is to create a 3D array, dp[i][j][t], where:

- `i` represents the index of the bubble tea shop (1 to N).
- `j` represents the number of cups Nathan has bought so far (0 to K).
- `t` represents whether Nathan has used his swap opportunity (0 for not used, 1 for used).

The state `dp[i][j][t]` represents the maximum happiness Nathan can obtain up to the `i`-th bubble tea shop, having bought `j` cups, and using the swap opportunity `t` times.

Here's the algorithm:

1. Initialize a 3D array `dp` with dimensions [N+1][K+1][2]. Set all elements to negative infinity to indicate that these states haven't been calculated yet.

2. Set `dp[0][0][0] = 0` to indicate the base case where Nathan hasn't bought any cups yet.

3. Iterate
Iterate through the bubble tea shops from 1 to N.
    for `i` from 1 to N:
Iterate through the number of cups Nathan has bought so far from 0 to K.
    for `j` from 0 to K:
Iterate through whether Nathan has used his swap opportunity (0 or 1).
    for `t` from 0 to 1:

Calculate the maximum happiness at dp[i][j][t]:

dp[i][j][t] = max(dp[i][j][t], dp[i-1][j][t])  // Don't buy from the current shop.

if (j >= L && t == 0):
   dp[i][j][t] = max(dp[i][j][t], dp[i-L][j-L][t] + sum(h[k] for k in range(i-L, i)))  // Use the swap opportunity.

if (j < K):
   dp[i][j+1][t] = max(dp[i][j+1][t], dp[i-1][j][t] + h[i])  // Buy a cup from the current shop.

4. After iterating through all possible states, the maximum happiness Nathan can obtain will be stored in dp[N][K][0] (without using the swap) and dp[N][K][1] (using the swap). The larger of these two values is the answer.

5. Return max(dp[N][K][0], dp[N][K][1]).

The time complexity of this algorithm is O(NKL) because there are N * K * 2 states to be computed, and for each state, you perform constant-time operations.

<div style="page-break-after:always;"></div>

### (E)

(e - 2) Algorithm:

This algorithm is a more efficient version that leverages the fact that swapping doesn't depend on consecutive shops, so we can reduce the dimension of the dynamic programming array.

Let's create a 2D DP array dp, where dp[i][j] represents the maximum happiness Nathan can obtain after visiting the first i bubble tea shops and having used j swaps. The dimensions of this array are as follows:

- i: The shop number (1 to N).
- j: The number of swaps used so far.

Initialize the dp array with -INF values, except for dp[0][0] = 0.

Now, for each i from 1 to N, iterate through j from 0 to T. For each (i, j), update the dp[i][j] as follows:

- dp[i][j] = max(dp[i][j], dp[i-1][j]) (Nathan chooses not to buy a cup at this shop).
- For k from 1 to min(K, i), if j > 0 and k >= L, dp[i][j] = max(dp[i][j], dp[i-k][j-1] + sum(hi for i-k < i)) (Nathan buys k cups, swaps once, and gains happiness from the last k visited shops).

After filling the dp array, check if dp[N][T] is equal to H. If it is, Nathan can achieve the same happiness H within the limits; otherwise, it's not possible.

The time complexity of this algorithm is O(N * L * T + N * log(N)).

<div style="page-break-after:always;"></div>

## Problem 6 ADA FTP server
### (A)
#### (A-1)
1. If the ADA FTP server first serves student 1:

Student 1:
- $d_1$ (download speed of student 1) = min(d1, u) = min(3, 6) = 3
- Time  s1 = 36 with $d_1$ = 3: t1 = s1 / $d_1$ = 36 / 3 = 12
c1 = t1 = 12

Student 2:
- Since student 1 has already finished downloa$d_n$g, the server can now serve student 2.
- $d_2$ (download speed of student 2) = min(d2, u) = min(15, 6) = 6
- Time  s2 = 30 with $d_2$ = 6: t2 = s2 / $d_2$ = 30 / 6 = 5
c2 = c1 (time when student 1 finishes) + t2 = 12 + 5 = 17

student 1 first is: cavg = (c1 + c2) / 2 = (12 + 17) / 2 = 29 / 2 = 14.5
#### (A-2)
2. If the ADA FTP server first serves student 2:

Student 2:
- $d_2$ (download speed of student 2) = min(d2, u) = min(15, 6) = 6
- Time  s2 = 30 with $d_2$ = 6: t2 = s2 / $d_2$ = 30 / 6 = 5
c2 = t2 = 5

Student 1:
- Now, the server serves student 1.
- $d_1$ (download speed of student 1) = min(d1, u) = min(3, 6) = 3
- Time  s1 = 36 with $d_1$ = 3: t1 = s1 / $d_1$ = 36 / 3 = 12
c1 = c2 (time when student 2 finishes) + t1 = 5 + 12 = 17

student 2 first is: cavg = (c1 + c2) / 2 = (17 + 5) / 2 = 22 / 2 = 11

So, the average completion time when serving student 1 first is 14.5, 
and the average completion time when serving student 2 first is 11.
<div style="page-break-after:always;"></div>

### (b)
Greedy Algorithm with O(n log n) Time Complexity:
1. Create an array of students, where each student is represented as a tuple (di, si) and assign them an index from 1 to n.
2. Sort the students in non-decreasing order of si/di. This step takes O(n log n) time.
3. Initialize an empty priority queue (min-heap) Q.
4. Initialize an empty dictionary D to keep track of when each student completes.
5. For each student i in the sorted order:
   a. If Q is not empty and student i can be served immediately (si / di ≤ Q.peek()):
      - Pop the top student from Q and denote their completion time as ci.
      - Update D[i] = ci.
   b. Otherwise, enqueue student i into Q with a priority of di/si.
6. Calculate cavg as the average of completion times in dictionary D.
7. Return cavg.

This algorithm runs in O(n log n) time because the sorting step dominates the time complexity.

<div style="page-break-after:always;"></div>

### (c)
Greedy Algorithm with O(n log n) Time Complexity (With Suspension and Resumption):
1. Create an array of students, where each student is represented as a tuple (di, si) and assign them an index from 1 to n.
2. Sort the students in non-decreasing order of si/di. This step takes O(n log n) time.
3. Initialize an empty priority queue (min-heap) Q.
4. Initialize an empty dictionary D to keep track of when each student completes.
5. For each student i in the sorted order:
   a. If Q is not empty and student i can be served immediately (si / di ≤ Q.peek()):
      - Pop the top student from Q and denote their completion time as ci.
      - Update D[i] = ci.
   b. Otherwise, enqueue student i into Q with a priority of di/si.
6. Calculate cavg as the average of completion times in dictionary D.
7. Return cavg.

This algorithm is the same as the one in part (b?) because the ability to suspend and resume file transmission does not change the algorithm's structure.

i dont know how to improve wive the Suspension and Resumption

<div style="page-break-after:always;"></div>

###  (d) 
Greedy Algorithm with O(n log n) Time Complexity (With Variable Connection Times):
1. Create an array of students, where each student is represented as a tuple (ti, di, si) and assign them an index from 1 to n.
2. Sort the students in non-decreasing order of ti. This step takes O(n log n) time.
3. Initialize an empty priority queue (min-heap) Q.
4. Initialize an empty dictionary D to keep track of when each student completes.
5. Initialize a variable t_server to 0 to keep track of the server's current time.
6. For each student i in the sorted order:
   a. Update t_server to max(t_server, ti). This ensures that the server waits until student i is connected.
   b. If Q is not empty and student i can be served immediately (si / di ≤ Q.peek()):
      - Pop the top student from Q and denote their completion time as ci.
      - Update D[i] = ci.
   c. Otherwise, enqueue student i into Q with a priority of di/si.
7. Calculate cavg as the average of completion times in dictionary D.
8. Return cavg.

This algorithm runs in O(n log n) time because the sorting step dominates the time complexity.

<div style="page-break-after:always;"></div>

### (E)
To design an algorithm that runs in O(n) time complexity and solves the problem of selecting a subset of ADA FTP servers to maximize the total transmission speed while ensuring that neighboring servers don't interfere (F(a, b) = |a - b| ≤ 1), you can use a simple dynamic programming approach. Here's a step-by-step algorithm and its proof of correctness:

Algorithm:
1. Initialize two arrays:
   - `include_max`: An array of size N, where `include_max[i]` represents the maximum total transmission speed considering server i is included in the subset.
   - `exclude_max`: An array of size N, where `exclude_max[i]` represents the maximum total transmission speed considering server i is excluded from the subset.

2. Set `include_max[0]` to the transmission speed of the first server (i.e., `include_max[0] = u[0]`) and `exclude_max[0]` to 0 (i.e., `exclude_max[0] = 0`).

3. Loop from i = 1 to N-1 (inclusive):
   - Calculate the maximum total transmission speed including server i:
     - `include_max[i] = u[i] + exclude_max[i-1]`
   - Calculate the maximum total transmission speed excluding server i:
     - `exclude_max[i] = max(include_max[i-1], exclude_max[i-1])`

4. Return the maximum of the last elements in `include_max` and `exclude_max` as the maximum total transmission speed.

Proof of Correctness:
To prove the correctness of this algorithm, we will show that it follows the required conditions:

1. **No interference between neighboring servers (F(a, b) = |a - b| ≤ 1):** This is guaranteed by the way we update the `include_max` and `exclude_max` arrays. When we consider server i, we calculate the maximum total transmission speed by either including it or excluding it. This choice ensures that no two neighboring servers are included in the subset simultaneously because we are maximizing the total transmission speed while following the interference constraint.

2. **Time Complexity O(n):** The algorithm iterates through the array of servers only once in a single pass, and for each server, it performs a constant amount of work. Therefore, the time complexity is O(n).

3. **Maximizing the total transmission speed:** By comparing the maximum total transmission speed with and without each server and choosing the one that maximizes it, the algorithm guarantees that the subset A will maximize the sum of the transmission speeds (Since the servers are positioned in a strictly increasing sequence)while adhering to the interference constraints.

The algorithm ensures that the subset A will contain servers such that no two neighboring servers are in the subset, and the total transmission speed is maximized.

<div style="page-break-after:always;"></div>


### (F)

To solve this problem and find a subset of ADA FTP servers to activate that maximizes the total transmission speed while avoiding interference, you can use a greedy algorithm that leverages the concept of intervals. 

The key idea is to select servers with non-overlapping interference zones that have the highest transmission speeds. This problem can be solved in O(n log n) time complexity using the following algorithm:

1. Create a list of server objects, each containing the server's position (xi), transmission speed (ui), and interference radius (ri).

2. Sort the list of server objects in ascending order of their positions (xi).

3. Initialize an empty set A to store the selected servers.

4. Iterate through the sorted list of servers from left to right, and for each server (server i):

   a. Calculate the rightmost position that this server can interfere with, which is `xi + ri`.

   b. If there is no server in set A that interferes with the current server, add the current server to set A.

5. The set A now contains the selected servers with non-overlapping interference zones, maximizing the total transmission speed.

Proof of Correctness:

1. The algorithm sorts the servers by their positions in ascending order (xi). This ensures that as we iterate through the list of servers, we encounter servers from left to right.

2. When considering a server (server i), the algorithm calculates the rightmost position that it can interfere with (`xi + ri`). Since the servers are sorted in ascending order, no server to the left of the current server can interfere with it. Therefore, if the current server can be added to set A without interference, it will not interfere with any of the servers to its left.

3. The algorithm ensures that for any pair of servers (ai, aj) in set A, the condition F(ai, aj) = False holds because it only adds servers that do not interfere with each other.

4. By selecting servers with non-overlapping interference zones and maximizing the total transmission speed, the algorithm achieves the objective of the problem.

5. The time complexity of the algorithm is O(n log n), primarily due to the sorting step, which is a standard approach for solving such problems in O(n log n) time complexity.

<div style="page-break-after:always;"></div>
