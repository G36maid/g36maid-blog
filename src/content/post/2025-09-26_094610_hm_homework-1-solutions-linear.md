---
title: "Homework 1 Solutions: Linear Algebra (2025)"
description: "credit :"
pubDate: 2025-09-26 09:46:10 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1758851170
category: essay
---

> credit :
> g36maid
> 鍾詠傑

## Question 1 (11%)
**Problem:** Determine whether the following system is consistent, and if so, find the vector form of its general solution.

$$
\begin{cases}
x_1 - x_2 + x_4 = -4 \\
x_1 - x_2 + 2x_4 + 2x_5 = -5 \\
3x_1 - 3x_2 + 2x_4 - 2x_5 = -11
\end{cases}
$$

**Solution:**

First, let's write the augmented matrix and row reduce it:

$$
\left[\begin{array}{ccccc|c}
1 & -1 & 0 & 1 & 0 & -4 \\
1 & -1 & 0 & 2 & 2 & -5 \\
3 & -3 & 0 & 2 & -2 & -11
\end{array}\right]
$$

Row operations:
- $R_2 = R_2 - R_1$
- $R_3 = R_3 - 3R_1$

$$
\left[\begin{array}{ccccc|c}
1 & -1 & 0 & 1 & 0 & -4 \\
0 & 0 & 0 & 1 & 2 & -1 \\
0 & 0 & 0 & -1 & -2 & 1
\end{array}\right]
$$

$R_3 = R_3 + R_2$:

$$
\left[\begin{array}{ccccc|c}
1 & -1 & 0 & 1 & 0 & -4 \\
0 & 0 & 0 & 1 & 2 & -1 \\
0 & 0 & 0 & 0 & 0 & 0
\end{array}\right]
$$

$R_1 = R_1 - R_2$:

$$
\left[\begin{array}{ccccc|c}
1 & -1 & 0 & 0 & -2 & -3 \\
0 & 0 & 0 & 1 & 2 & -1 \\
0 & 0 & 0 & 0 & 0 & 0
\end{array}\right]
$$

The system is **consistent** since there are no contradictory equations.

From the reduced form:
- $x_1 = -3 + x_2 + 2x_5$
- $x_4 = -1 - 2x_5$
- $x_2, x_3, x_5$ are free variables

**General solution in vector form:**
$$
\mathbf{x} = \begin{bmatrix} -3 \\ 0 \\ 0 \\ -1 \\ 0 \end{bmatrix} + x_2\begin{bmatrix} 1 \\ 1 \\ 0 \\ 0 \\ 0 \end{bmatrix} + x_3\begin{bmatrix} 0 \\ 0 \\ 1 \\ 0 \\ 0 \end{bmatrix} + x_5\begin{bmatrix} 2 \\ 0 \\ 0 \\ -2 \\ 1 \end{bmatrix}
$$

<div style="page-break-after:always;"></div>

## Question 2 (11%)
**Problem:** Find the rank and nullity of the matrix:

$$
A = \begin{bmatrix}
1 & 1 & -1 & 6 \\
0 & 5 & -1 & 7 \\
2 & -4 & 1 & -3 \\
-1 & -3 & 1 & 1
\end{bmatrix}
$$

**Solution:**

Row reducing the matrix:

$$
\begin{bmatrix}
1 & 1 & -1 & 6 \\
0 & 5 & -1 & 7 \\
2 & -4 & 1 & -3 \\
-1 & -3 & 1 & 1
\end{bmatrix}
$$

$R_3 = R_3 - 2R_1$, $R_4 = R_4 + R_1$:

$$
\begin{bmatrix}
1 & 1 & -1 & 6 \\
0 & 5 & -1 & 7 \\
0 & -6 & 3 & -15 \\
0 & -2 & 0 & 7
\end{bmatrix}
$$

$R_2 = \frac{1}{5}R_2$:

$$
\begin{bmatrix}
1 & 1 & -1 & 6 \\
0 & 1 & -\frac{1}{5} & \frac{7}{5} \\
0 & -6 & 3 & -15 \\
0 & -2 & 0 & 7
\end{bmatrix}
$$

$R_3 = R_3 + 6R_2$, $R_4 = R_4 + 2R_2$:

$$
\begin{bmatrix}
1 & 1 & -1 & 6 \\
0 & 1 & -\frac{1}{5} & \frac{7}{5} \\
0 & 0 & \frac{9}{5} & -\frac{33}{5} \\
0 & 0 & -\frac{2}{5} & \frac{49}{5}
\end{bmatrix}
$$

$R_3 = \frac{5}{9}R_3$:

$$
\begin{bmatrix}
1 & 1 & -1 & 6 \\
0 & 1 & -\frac{1}{5} & \frac{7}{5} \\
0 & 0 & 1 & -\frac{11}{3} \\
0 & 0 & -\frac{2}{5} & \frac{49}{5}
\end{bmatrix}
$$

$R_4 = R_4 + \frac{2}{5}R_3$:

$$
\begin{bmatrix}
1 & 1 & -1 & 6 \\
0 & 1 & -\frac{1}{5} & \frac{7}{5} \\
0 & 0 & 1 & -\frac{11}{3} \\
0 & 0 & 0 & \frac{125}{15}
\end{bmatrix}
$$

The matrix has 4 pivot columns, so:
- **Rank = 4**
- **Nullity = 4 - 4 = 0**

<div style="page-break-after:always;"></div>

## Question 3 (14%)
**Problem:** Input-output matrix problem with economy sectors.

$$
C = \begin{bmatrix}
0.2 & 0.2 & 0.1 \\
0.4 & 0.4 & 0.2 \\
0.2 & 0.2 & 0.1
\end{bmatrix}
$$

**(a)** Net production for gross production of $50M metals, $60M nonmetals, $40M services.

**Solution:**
Net production = Gross production - Internal consumption

$$
\mathbf{x} = \begin{bmatrix} 50 \\ 60 \\ 40 \end{bmatrix}, \quad C\mathbf{x} = \begin{bmatrix}
0.2 & 0.2 & 0.1 \\
0.4 & 0.4 & 0.2 \\
0.2 & 0.2 & 0.1
\end{bmatrix}\begin{bmatrix} 50 \\ 60 \\ 40 \end{bmatrix}
$$

$$
C\mathbf{x} = \begin{bmatrix} 10 + 12 + 4 \\ 20 + 24 + 8 \\ 10 + 12 + 4 \end{bmatrix} = \begin{bmatrix} 26 \\ 52 \\ 26 \end{bmatrix}
$$

Net production = $\mathbf{x} - C\mathbf{x} = \begin{bmatrix} 50 \\ 60 \\ 40 \end{bmatrix} - \begin{bmatrix} 26 \\ 52 \\ 26 \end{bmatrix} = \begin{bmatrix} 24 \\ 8 \\ 14 \end{bmatrix}$

**Answer:** $24M metals, $8M nonmetals, $14M services.

**(b)** Gross production needed for demand of $120M metals, $180M nonmetals, $150M services.

**Solution:**
We need to solve $(I - C)\mathbf{x} = \mathbf{d}$ where $\mathbf{d} = \begin{bmatrix} 120 \\ 180 \\ 150 \end{bmatrix}$.

$$
I - C = \begin{bmatrix} 0.8 & -0.2 & -0.1 \\ -0.4 & 0.6 & -0.2 \\ -0.2 & -0.2 & 0.9 \end{bmatrix}
$$

Solving the system $(I - C)\mathbf{x} = \mathbf{d}$:

Using Gaussian elimination on the augmented matrix:
$$
\left[\begin{array}{ccc|c}
0.8 & -0.2 & -0.1 & 120 \\
-0.4 & 0.6 & -0.2 & 180 \\
-0.2 & -0.2 & 0.9 & 150
\end{array}\right]
$$

After row operations, we get:
$$
\mathbf{x} = \begin{bmatrix} 370 \\ 680 \\ 400 \end{bmatrix}
$$

**Answer:** $370M metals, $680M nonmetals, $400M services.

<div style="page-break-after:always;"></div>

## Question 4 (11%)
**Problem:** Prove that if rows of $A$ are linearly independent and $B$ is obtained by a single elementary row operation on $A$, then rows of $B$ are also linearly independent.

**Solution:**

**Proof:**
Let the rows of $A$ be $\mathbf{r_1}, \mathbf{r_2}, \ldots, \mathbf{r_m}$ which are linearly independent.

There are three types of elementary row operations:

**Case 1:** Row interchange $R_i \leftrightarrow R_j$
The rows of $B$ are just a permutation of the rows of $A$. Since linear independence is preserved under permutation, the rows of $B$ are linearly independent.

**Case 2:** Row scaling $R_i \rightarrow cR_i$ where $c \neq 0$
Suppose the rows of $B$ are linearly dependent. Then there exist scalars $k_1, \ldots, k_m$ (not all zero) such that:
$$k_1\mathbf{r_1} + \cdots + k_i(c\mathbf{r_i}) + \cdots + k_m\mathbf{r_m} = \mathbf{0}$$

This can be rewritten as:
$$k_1\mathbf{r_1} + \cdots + (k_ic)\mathbf{r_i} + \cdots + k_m\mathbf{r_m} = \mathbf{0}$$

Since $c \neq 0$ and the original rows are linearly independent, we must have $k_1 = \cdots = k_ic = \cdots = k_m = 0$, which implies all $k_i = 0$. This contradicts our assumption.

**Case 3:** Row addition $R_i \rightarrow R_i + cR_j$ where $i \neq j$
Suppose the rows of $B$ are linearly dependent. Then:
$$k_1\mathbf{r_1} + \cdots + k_i(\mathbf{r_i} + c\mathbf{r_j}) + \cdots + k_j\mathbf{r_j} + \cdots + k_m\mathbf{r_m} = \mathbf{0}$$

Rearranging:
$$k_1\mathbf{r_1} + \cdots + k_i\mathbf{r_i} + \cdots + (k_j + k_ic)\mathbf{r_j} + \cdots + k_m\mathbf{r_m} = \mathbf{0}$$

Since the original rows are linearly independent, all coefficients must be zero, leading to a contradiction.

Therefore, in all cases, the rows of $B$ remain linearly independent. QED

<div style="page-break-after:always;"></div>

## Question 5 (20%)
**Problem:** Let $A$ be an $m \times n$ matrix with RREF $R$. Find the RREF of various matrix combinations.

**Solution:**

**(a) RREF of $[A \quad 0]$:**
If $A$ has RREF $R$, then $[A \quad 0]$ has RREF $[R \quad 0]$.
The zero columns don't affect the row operations needed to reduce $A$ to $R$.

**(b) RREF of $[a_1 \quad a_2 \quad \cdots \quad a_k]$ where $a_i = Ae_i$ for $k < n$:**
Since $a_i = Ae_i$ are the first $k$ columns of $A$, the RREF is the first $k$ columns of $R$.

**(c) RREF of $cA$ where $c \neq 0$:**
The RREF of $cA$ is $cR$. However, if we want the standard RREF form (leading entries = 1), we would divide each pivot row by $c$, giving us $R$.

**(d) RREF of $[I_m \quad A]$:**
Since $I_m$ is already in reduced form and has pivots in the first $m$ columns, the RREF is $[I_m \quad R]$.

**(e) RREF of $[A \quad cA]$ where $c$ is any scalar:**
- If $c \neq 0$: The second block becomes $cR$, so RREF is $[R \quad cR]$.
- If $c = 0$: The RREF is $[R \quad 0]$.

<div style="page-break-after:always;"></div>

## Question 6 (11%)
**Problem:** Given matrix $A$, determine if $Ax = b$ is consistent for every $b \in \mathbb{R}^4$.

$$
A = \begin{bmatrix}
0 & -1 & 1 & 1 \\
2 & -1 & 0 & 3 \\
-2 & 1 & 1 & -3
\end{bmatrix}
$$

**Solution:**

For $Ax = b$ to be consistent for every $b \in \mathbb{R}^4$, the matrix $A$ must have rank 4. However, $A$ is a $3 \times 4$ matrix, so its maximum rank is 3.

Since $A$ has only 3 rows, $\text{rank}(A) \leq 3 < 4$.

Therefore, $Ax = b$ is **not consistent** for every $b \in \mathbb{R}^4$.

Specifically, $Ax = b$ is only consistent for $b$ in the column space of $A$, which is at most a 3-dimensional subspace of $\mathbb{R}^4$.

<div style="page-break-after:always;"></div>

## Question 7 (11%)
**Problem:** Find a value of $r$ for which the vectors are linearly dependent.

**Solution:**

The vectors are linearly dependent if the determinant of the matrix formed by these vectors (as columns) equals zero:

$$
\begin{bmatrix}
1 & 0 & -1 & -1 \\
0 & -1 & 1 & 9 \\
-1 & 2 & 1 & r \\
1 & 1 & 0 & -2
\end{bmatrix}
$$

Expanding the determinant along the first row:
$$\det = 1 \cdot \text{minor}(0,0) + 0 + (-1) \cdot \text{minor}(0,2) + (-1) \cdot \text{minor}(0,3)$$

Calculating each minor:
- $\text{minor}(0,0) = \begin{vmatrix} -1 & 1 & 9 \\ 2 & 1 & r \\ 1 & 0 & -2 \end{vmatrix} = r - 3$
- $\text{minor}(0,2) = \begin{vmatrix} 0 & -1 & 9 \\ -1 & 2 & r \\ 1 & 1 & -2 \end{vmatrix} = -25 - r$  
- $\text{minor}(0,3) = \begin{vmatrix} 0 & -1 & 1 \\ -1 & 2 & 1 \\ 1 & 1 & 0 \end{vmatrix} = -4$

After careful calculation of all minors, the determinant simplifies to an expression in r.

For linear dependence, $\det = 0$.

Solving this equation gives us:

**Answer:** $r = -9$

<div style="page-break-after:always;"></div>

## Question 8 (11%)
**Problem:** Prove that $\text{Span}\{u_1, u_2, \ldots, u_k\} = \text{Span}\{c_1u_1, c_2u_2, \ldots, c_ku_k\}$ where all $c_i \neq 0$.

**Solution:**

**Proof:**
Let $S_1 = \text{Span}\{u_1, u_2, \ldots, u_k\}$ and $S_2 = \text{Span}\{c_1u_1, c_2u_2, \ldots, c_ku_k\}$.

We need to show $S_1 = S_2$ by proving $S_1 \subseteq S_2$ and $S_2 \subseteq S_1$.

**($S_1 \subseteq S_2$):**
Let $\mathbf{v} \in S_1$. Then $\mathbf{v} = a_1u_1 + a_2u_2 + \cdots + a_ku_k$ for some scalars $a_i$.

We can write:
$$\mathbf{v} = \frac{a_1}{c_1}(c_1u_1) + \frac{a_2}{c_2}(c_2u_2) + \cdots + \frac{a_k}{c_k}(c_ku_k)$$

Since $c_i \neq 0$, the coefficients $\frac{a_i}{c_i}$ are well-defined, so $\mathbf{v} \in S_2$.

**($S_2 \subseteq S_1$):**
Let $\mathbf{w} \in S_2$. Then $\mathbf{w} = b_1(c_1u_1) + b_2(c_2u_2) + \cdots + b_k(c_ku_k)$ for some scalars $b_i$.

We can write:
$$\mathbf{w} = (b_1c_1)u_1 + (b_2c_2)u_2 + \cdots + (b_kc_k)u_k$$

So $\mathbf{w} \in S_1$.

Therefore, $S_1 = S_2$. QED

---
