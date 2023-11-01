---
title: "ADA  cheetsheet"
description: "$O(g(n))$={$f(n)$: $\exists$ c,$n0$=0 , 0<= $f(n)$ <= $cg(n)$ for all $n$ = $n0$ }"
pubDate: 2023-11-02 04:21:06 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1698870066
---

# ADA cheetsheet

## 0.Recurrence and asympotic notations
### time complexity
$O(g(n))$={$f(n)$: $\exists$ c,$n_0$>=0 , 0<= $f(n)$ <= $cg(n)$ for all $n$ >= $n_0$ }

$\Omega(g(n))$={$f(n)$: $\exists$ c,$n_0$>=0 , 0<= $cf(n)$ <= $g(n)$ for all $n$ >= $n_0$ }

$\Theta(g(n))$={$f(n)$: $\exists$ $c_1$,$c_2$,$n_0$ >=0 , 0<= $c_1g(n)$ <= $f(n)$ <= $c_2g(n)$ for all $n$ >= $n_0$ }
## 1.devide and conquer
### complexity
$T(n) =\Theta(1)$ if(n<=c) 
$T(n) =aT(n/b)+f(n)$ otherwise
### method
#### Substitution method
Step 1: Guess the form of the solution using symbolic constants
Step 2: Use mathematical induction to show that the solution works, and find the constants
⌕ If the guess is proven wrong, go back to Step 1.


Advices and useful tricks
⌕ Prove E and Ω separately when using the substitution method
⌕ Recursion trees help generate good guesses
⌕ Set loose bounds first and then reduce the range of uncertainty
⌕ Be aware of the constant hidden by the asymptotic notations
⌕ Strengthen the inductive hypothesis by subtracting a low-order term
⌕ Simplify the expression by changing variables

數學歸納法（ mathematical induction）的常⾒形式
⌕ 給出歸納法假設（Induction hypothesis）
⌕ Base case: 證明此假設對 n = 1 成立
⌕ Inductive step: 證明若此假設對 n = k 成立，則對 n = K + 1 也成立
⌕ 若 base case 和 Inductive step 都成立，則歸納出此假設對所有正整
數都成立
#### Recursion-tree method
1. Expand a recurrence into a tree
2. Sum up the cost of all nodes as an educated guess
3. Verify the guess as in the substitution method
⌕ Advantages
⌕ Promote intuition and generate good guesses for the substitution
method (so we can tolerate some sloppiness to simplify the math)
⌕ Can be used as a direct proof If you are meticulous enough

Geometric series:
if (r<1)
1 + r + r^2 ...
= 1/(1-r)

#### Master theorem 
特定型式: T(n) = aT(n/b) + f(n)
a: D&C + combine 子問題數量
n/b: devide number 子問題規模
f(n): cross case
3 case
1. F(n) polynomially slower than $\left(n^{{\log _{b}a}}\right)$
2. F(n) and $\left(n^{{\log _{b}a}}\right)$ grow  at similar rates
3. F(n) polynomially faster than $\left(n^{{\log _{b}a}}\right)$

##### 1 Total cost dominated by cost of leaves

如果存在常數$\epsilon >0$
  $f(n)=O\left(n^{{\log _{b}(a)-\epsilon }}\right)$（可不嚴謹的視作多項式地小於）
則
$T(n)=\Theta \left(n^{{\log _{b}a}}\right)$
##### 2 Total cost evenly distributed among levels
如果存在常數$K \geq 0$，有
${\displaystyle f(n)=\Theta \left(n^{\log _{b}a}\log ^{K }n\right)}$
則
${\displaystyle T(n)=\Theta \left(n^{\log _{b}a}\log ^{K +1}n\right)}$
##### 3 Total cost dominated by cost of root
如果存在常數 $\epsilon >0$，有
$f(n)=\Omega \left(n^{{\log _{b}(a)+\epsilon }}\right)$（多項式地大於）
同時存在常數$c<1$以及充分大的$n$，滿足額外條件 !
additionally satisfies the regularity condition!
$af\left({\frac  {n}{b}}\right)\leq cf(n)$
則
$T\left(n\right)=\Theta \left(f\left(n\right)\right)$

### 1.Tower of Hanoi (河內塔)
T(n)=2^n-1
### 2.Merge Sort (合併排序法)
T(n)=2T(n/2)+$\Theta$(n) n>1
### 3.矩陣相加
切4份，算8次合併
$T(n)=8T(n/2)+\Theta(n)$ n>1
$T(n)=\Theta(n^3)$
Strassen’s algorithm:
recursive calls from 8 to 7
$T(n)=8T(n/2)+\Theta(n)$ n>1
$T(n)=\Theta(n^{log_27})$
### 4.Maximum Subarray Problem (最⼤⼦序列問題)

$T(n)=2T(n/2)+$\Theta$(n)$ n>1
$T(n)=\Theta(nlogn)$
Kadane's algorithm(DP): $\Theta(n)$
```python
def max_subarray(A):
    max_ending_here = max_so_far = A[0]
    for x in A[1:]:
        max_ending_here = max(x, max_ending_here + x)
        max_so_far = max(max_so_far, max_ending_here)
    return max_so_far
```
### 5.(最近點對問題)
遞迴的去找 2δ*δ grid
排序可以預處理
```
//termination condition (base case)
If |P|≤3, brute-force finding closest pair and return it
//Divide
Find a vertical line L s.t. both left and right planes
____contain half of the points
//Conquer (by recursion)
left-pair <- Closest-Pair(points in the left)
right-pair <- Closest-Pair(points in the right)
left-min <- Distance(left-pair)
right-min <- Distance(right-pair)
//Combine
δ = min{left-min, right-min}
Remove points that are δ or more away from L //Observation 1
Sort remaining points by y-coordinate into p0, …, pk
For point pi:
____Compute distances with pi+1, Pi+2, …, pi+7
____//at most 7 distance calculations based on Observation 3
____Update δ if a closer pair is found
Return the closest pair
```
O(1) n<=3
T(n)=2T(n/2)+O(n) n>3
T(n)=O(nlogn)
## 2.dynamic programing
![image.png](https://hackmd.io/_uploads/Sy-tPcxQ6.png)

Optimal sol = min/max (possible choice + Optimal) subproblem

DP就是狀態轉移

### 背包問題
![image.png](https://hackmd.io/_uploads/HkaVFcemp.png)
複雜度=表格大小*每格常數
$\Theta(nW)$ pesudo polynomial
n=# of objects
W=capacity 
### 有限背包問題
$DP[w]=0$ if $w=0,or \forall i,w<w_i\forall i$
$DP[w]={( max{\forall(i,w>=wi)} DP[w-w_i])}$
O(N+W)

## 3.Greedy algorithm

Optimal sol = greedy choice property + Optimal subproblem
![image.png](https://hackmd.io/_uploads/S1vLXjlQa.png)

### Interval scheduling 
找各種反例
#### (swap method)
![image.png](https://hackmd.io/_uploads/rkBj7ilmT.png)

Suppose OPT is an optimal solution.
If OPT contains job 1, done
If not, modify OPT into another solution containing job 1 and is at least as good as OPT

![image.png](https://hackmd.io/_uploads/SyinQoxQa.png)

### Huffman Codes
Proof by the exchange argument
![image.png](https://hackmd.io/_uploads/Sk3FeoeXa.png)
Proof of optimal substructure
![image.png](https://hackmd.io/_uploads/H1kIbseXa.png)

### Scheduling to minimize lateness 
Greedy choice: earliest-deadline-first
```
Input: n, t[1..n], d[1..n]
Minimize-lateness(n, t[], d[])
Sort jobs by deadlines such that d[1]≤d[2]≤ …≤d[n]
ct = 0 //current time
for j = 1 to n
____Assign job j to interval ct, ct+t[j]
____s[j] = ct
____f[j] = s[j] + t[j]
____ct = ct + t[j]
return s[], f[]
```
proof by no inversions (OPT)
### k-Huffman Codes
initialization: add dummy node
$n = 1(modk-1)$
Greedy choice:merge the min frequence roots
add $F(z)=\Sigma_{1<=i<=k}F(x_i)$
