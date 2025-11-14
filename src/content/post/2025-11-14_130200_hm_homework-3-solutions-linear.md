---
title: "Homework 3 Solutions: Linear Algebra (2025)"
description: "Problem: Find generating sets for the range and null space of linear transformation T defined as"
pubDate: 2025-11-14 13:02:00 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1763096520
---

## Question 1 (16%)
**Problem:** Find generating sets for the range and null space of linear transformation T defined as
$$
T \left(\begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix}\right) = \begin{bmatrix} x_1 + x_2 \\ x_2 + x_3 \\ x_1 - x_3 \\ x_1 + 2x_2 + x_3 \end{bmatrix}
$$

**Solution:**

First, we find the standard matrix A for the linear transformation T.
$$
A = \begin{bmatrix} 1 & 1 & 0 \\ 0 & 1 & 1 \\ 1 & 0 & -1 \\ 1 & 2 & 1 \end{bmatrix}
$$

**Range of T:**
The range of T is the column space of A. A generating set for the range is the set of column vectors of A.
$$
\text{Generating set for Range(T)} = \left\{ \begin{bmatrix} 1 \\ 0 \\ 1 \\ 1 \end{bmatrix}, \begin{bmatrix} 1 \\ 1 \\ 0 \\ 2 \end{bmatrix}, \begin{bmatrix} 0 \\ 1 \\ -1 \\ 1 \end{bmatrix} \right\}
$$
To find a basis, we row reduce A:
$$
\left[\begin{array}{ccc}
1 & 1 & 0 \\
0 & 1 & 1 \\
1 & 0 & -1 \\
1 & 2 & 1
\end{array}\right] \rightarrow \left[\begin{array}{ccc}
1 & 0 & -1 \\
0 & 1 & 1 \\
0 & 0 & 0 \\
0 & 0 & 0
\end{array}\right]
$$
The first two columns are pivot columns, so a basis for the range is:
$$
\text{Basis for Range(T)} = \left\{ \begin{bmatrix} 1 \\ 0 \\ 1 \\ 1 \end{bmatrix}, \begin{bmatrix} 1 \\ 1 \\ 0 \\ 2 \end{bmatrix} \right\}
$$

**Null Space of T:**
We need to solve $Ax = 0$. From the reduced row echelon form:
$x_1 - x_3 = 0 \Rightarrow x_1 = x_3$
$x_2 + x_3 = 0 \Rightarrow x_2 = -x_3$
$x_3$ is a free variable.

The general solution is:
$$
\mathbf{x} = \begin{bmatrix} x_3 \\ -x_3 \\ x_3 \end{bmatrix} = x_3 \begin{bmatrix} 1 \\ -1 \\ 1 \end{bmatrix}
$$
A generating set (and a basis) for the null space is:
$$
\text{Generating set for Null(T)} = \left\{ \begin{bmatrix} 1 \\ -1 \\ 1 \end{bmatrix} \right\}
$$

## Question 2 (12%)
**Problem:** Given a linear transformation T defined as
$$
T \left(\begin{bmatrix} x_1 \\ x_2 \\ x_3 \\ x_4 \end{bmatrix}\right) = \begin{bmatrix} -2x_1 - x_2 + x_4 \\ 0 \\ x_1 + 2x_2 + 3x_3 + 4x_4 \\ 2x_1 + 3x_2 + 4x_3 + 5x_4 \end{bmatrix}
$$
(a) Find a basis for the range of T;
(b) If the null space of T is nonzero, find a basis for the null space of T.

**Solution:**
The standard matrix A is:
$$
A = \begin{bmatrix} -2 & -1 & 0 & 1 \\ 0 & 0 & 0 & 0 \\ 1 & 2 & 3 & 4 \\ 2 & 3 & 4 & 5 \end{bmatrix}
$$
Row reducing A:
$$
\left[\begin{array}{cccc}
-2 & -1 & 0 & 1 \\
0 & 0 & 0 & 0 \\
1 & 2 & 3 & 4 \\
2 & 3 & 4 & 5
\end{array}\right] \rightarrow \left[\begin{array}{cccc}
1 & 0 & -1 & -2 \\
0 & 1 & 2 & 3 \\
0 & 0 & 0 & 0 \\
0 & 0 & 0 & 0
\end{array}\right]
$$
**(a) Basis for the range of T:**
The pivot columns are 1 and 2. So a basis for the range is the first two columns of the original matrix A.
$$
\text{Basis for Range(T)} = \left\{ \begin{bmatrix} -2 \\ 0 \\ 1 \\ 2 \end{bmatrix}, \begin{bmatrix} -1 \\ 0 \\ 2 \\ 3 \end{bmatrix} \right\}
$$
**(b) Basis for the null space of T:**
From the RREF of A, we have:
$x_1 - x_3 - 2x_4 = 0 \Rightarrow x_1 = x_3 + 2x_4$
$x_2 + 2x_3 + 3x_4 = 0 \Rightarrow x_2 = -2x_3 - 3x_4$
$x_3$ and $x_4$ are free variables.

The solution in vector form is:
$$
\mathbf{x} = \begin{bmatrix} x_3 + 2x_4 \\ -2x_3 - 3x_4 \\ x_3 \\ x_4 \end{bmatrix} = x_3 \begin{bmatrix} 1 \\ -2 \\ 1 \\ 0 \end{bmatrix} + x_4 \begin{bmatrix} 2 \\ -3 \\ 0 \\ 1 \end{bmatrix}
$$
The null space is nonzero. A basis for the null space is:
$$
\text{Basis for Null(T)} = \left\{ \begin{bmatrix} 1 \\ -2 \\ 1 \\ 0 \end{bmatrix}, \begin{bmatrix} 2 \\ -3 \\ 0 \\ 1 \end{bmatrix} \right\}
$$

## Question 3 (12%)
**Problem:** Let $\mathcal{L} = \left\{ \begin{bmatrix} 0 \\ 0 \\ 1 \\ 0 \end{bmatrix} \right\}$ and $V = \text{Col} \begin{bmatrix} 1 & -1 & 1 & -3 & 3 & 2 \\ 1 & -1 & -3 & 1 & -1 & -1 \\ 2 & -2 & 1 & -6 & -1 & -1 \\ -1 & 1 & 6 & -7 & 6 & -7 \end{bmatrix}$. Find a basis for the subspace V that contains the given linearly independent subset L of V.

**Solution:**
Let the vector in $\mathcal{L}$ be $l_1$ and the columns of the matrix be $v_1, ..., v_6$. We want to find a basis for $V = \text{Span}\{v_1, ..., v_6\}$ that includes $l_1$. We form a matrix with $l_1$ and the columns of the matrix for V, and then find the pivot columns. The corresponding vectors will form the basis.
$$
\begin{bmatrix} l_1 & v_1 & v_2 & v_3 & v_4 & v_5 & v_6 \end{bmatrix} = \left[\begin{array}{ccccccc}
0 & 1 & -1 & 1 & -3 & 3 & 2 \\
0 & 1 & -1 & -3 & 1 & -1 & -1 \\
1 & 2 & -2 & 1 & -6 & -1 & -1 \\
0 & -1 & 1 & 6 & -7 & 6 & -7
\end{array}\right]
$$
Row reducing this matrix:
$$
\left[\begin{array}{ccccccc}
1 & 0 & 0 & 0 & 0 & 0 & 0 \\
0 & 1 & -1 & 0 & 0 & 0 & 0 \\
0 & 0 & 0 & 1 & 0 & 0 & 0 \\
0 & 0 & 0 & 0 & 1 & 0 & 0
\end{array}\right]
$$
The pivot columns are 1, 2, 4, and 5. These correspond to the vectors $l_1, v_1, v_3, v_4$.
A basis for V containing L is:
$$
\left\{ \begin{bmatrix} 0 \\ 0 \\ 1 \\ 0 \end{bmatrix}, \begin{bmatrix} 1 \\ 1 \\ 2 \\ -1 \end{bmatrix}, \begin{bmatrix} 1 \\ -3 \\ 1 \\ 6 \end{bmatrix}, \begin{bmatrix} -3 \\ 1 \\ -6 \\ -7 \end{bmatrix} \right\}
$$

## Question 4 (12%)
**Problem:** Given a linearly independent subset $\mathcal{L} = \left\{ \begin{bmatrix} 5 \\ -9 \\ -2 \\ -1 \end{bmatrix}, \begin{bmatrix} 1 \\ -2 \\ 0 \\ 1 \end{bmatrix} \right\}$ of the subspace $V = \text{Span} \left\{ \begin{bmatrix} 1 \\ -1 \\ -2 \\ 3 \end{bmatrix}, \begin{bmatrix} 0 \\ 1 \\ -2 \\ 10 \end{bmatrix} \right\}$, find a basis for the subspace V that contains the given linearly independent subset L of V.

**Solution:**
Let the vectors in $\mathcal{L}$ be $l_1, l_2$ and the spanning vectors of V be $v_1, v_2$. We form a matrix $[l_1 \ l_2 \ v_1 \ v_2]$ and row reduce to find the pivot columns.
$$
\left[\begin{array}{cccc}
5 & 1 & 1 & 0 \\
-9 & -2 & -1 & 1 \\
-2 & 0 & -2 & -2 \\
-1 & 1 & 3 & 10
\end{array}\right] \rightarrow \left[\begin{array}{cccc}
1 & 0 & 0 & -1 \\
0 & 1 & 0 & 2 \\
0 & 0 & 1 & 3 \\
0 & 0 & 0 & 0
\end{array}\right]
$$
The pivot columns are 1, 2, and 3. This means the vectors $l_1, l_2, v_1$ form a basis for the space spanned by all four vectors. Since V is a subspace of this, and L is in V, this set is a basis for V.
A basis for V containing L is:
$$
\left\{ \begin{bmatrix} 5 \\ -9 \\ -2 \\ -1 \end{bmatrix}, \begin{bmatrix} 1 \\ -2 \\ 0 \\ 1 \end{bmatrix}, \begin{bmatrix} 1 \\ -1 \\ -2 \\ 3 \end{bmatrix} \right\}
$$

## Question 5 (12%)
**Problem:** For the linear transformation defined by
$$
T \left(\begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix}\right) = \begin{bmatrix} -x_1 - x_2 + x_3 \\ x_1 + 2x_2 + x_3 \\ x_1 + x_2 \end{bmatrix}
$$
determine
(a) the dimension of the range of T
(b) the dimension of the null space of T
(c) whether T is one-to-one or on-to.

**Solution:**
The standard matrix A is:
$$
A = \begin{bmatrix} -1 & -1 & 1 \\ 1 & 2 & 1 \\ 1 & 1 & 0 \end{bmatrix}
$$
Row reducing A:
$$
\left[\begin{array}{ccc}
-1 & -1 & 1 \\
1 & 2 & 1 \\
1 & 1 & 0
\end{array}\right] \rightarrow \left[\begin{array}{ccc}
1 & 0 & -3 \\
0 & 1 & 2 \\
0 & 0 & 1
\end{array}\right] \rightarrow \left[\begin{array}{ccc}
1 & 0 & 0 \\
0 & 1 & 0 \\
0 & 0 & 1
\end{array}\right]
$$
The matrix has 3 pivots.
(a) The dimension of the range of T is the rank of A, which is 3.
(b) The dimension of the null space of T is the nullity of A, which is the number of columns minus the rank. Nullity = 3 - 3 = 0.
(c) T is one-to-one because the nullity is 0. T is onto because the rank (3) is equal to the dimension of the codomain $\mathbb{R}^3$.

## Question 6 (12%)
**Problem:** Find the unique representation of $u = \begin{bmatrix} a \\ b \\ c \end{bmatrix}$ as a linear combination of $b_1 = \begin{bmatrix} 1 \\ -1 \\ 2 \end{bmatrix}$, $b_2 = \begin{bmatrix} 1 \\ 0 \\ 2 \end{bmatrix}$, and $b_3 = \begin{bmatrix} 0 \\ 1 \\ 1 \end{bmatrix}$.

**Solution:**
We want to find scalars $x_1, x_2, x_3$ such that $x_1b_1 + x_2b_2 + x_3b_3 = u$. We can write this as an augmented matrix and row reduce.
$$
\left[\begin{array}{ccc|c}
1 & 1 & 0 & a \\
-1 & 0 & 1 & b \\
2 & 2 & 1 & c
\end{array}\right]
$$
Row operations:
$R_2 = R_2 + R_1$
$R_3 = R_3 - 2R_1$
$$
\left[\begin{array}{ccc|c}
1 & 1 & 0 & a \\
0 & 1 & 1 & a+b \\
0 & 0 & 1 & c-2a
\end{array}\right]
$$
Now we back substitute:
$x_3 = c-2a$
$x_2 = a+b - x_3 = a+b - (c-2a) = 3a+b-c$
$x_1 = a - x_2 = a - (3a+b-c) = -2a-b+c$

The unique representation is:
$$
u = (-2a-b+c)b_1 + (3a+b-c)b_2 + (c-2a)b_3
$$

## Question 7 (12%)
**Problem:** Let $\mathcal{B} = \{b_1, b_2, b_3\}$, where $b_1 = \begin{bmatrix} 1 \\ -2 \\ 1 \end{bmatrix}$, $b_2 = \begin{bmatrix} -1 \\ 3 \\ 0 \end{bmatrix}$, and $b_3 = \begin{bmatrix} 0 \\ 2 \\ 1 \end{bmatrix}$.
(a) Show that $\mathcal{B}$ is a basis for $\mathbb{R}^3$.
(b) Determine the matrix $A = \begin{bmatrix} [e_1]_{\mathcal{B}} & [e_2]_{\mathcal{B}} & [e_3]_{\mathcal{B}} \end{bmatrix}$.
(c) What is the relationship between A and $B = \begin{bmatrix} b_1 & b_2 & b_3 \end{bmatrix}$?

**Solution:**
(a) To show that $\mathcal{B}$ is a basis for $\mathbb{R}^3$, we can form a matrix B with these vectors as columns and show it is invertible.
$$
B = \begin{bmatrix} 1 & -1 & 0 \\ -2 & 3 & 2 \\ 1 & 0 & 1 \end{bmatrix}
$$
The determinant of B is $1(3) - (-1)(-2-2) + 0 = 3 - 4 = -1$. Since the determinant is non-zero, the matrix is invertible, and the vectors are linearly independent and span $\mathbb{R}^3$. Thus, $\mathcal{B}$ is a basis for $\mathbb{R}^3$.

(b) The columns of A are the coordinate vectors of the standard basis vectors with respect to $\mathcal{B}$. This means we need to solve $Bx = e_i$ for $i=1,2,3$. This is equivalent to finding $B^{-1}$.
We find the inverse of B by augmenting it with the identity matrix and row reducing.
$$
\left[\begin{array}{ccc|ccc}
1 & -1 & 0 & 1 & 0 & 0 \\
-2 & 3 & 2 & 0 & 1 & 0 \\
1 & 0 & 1 & 0 & 0 & 1
\end{array}\right] \rightarrow \left[\begin{array}{ccc|ccc}
1 & 0 & 0 & -3 & -1 & 2 \\
0 & 1 & 0 & -4 & -1 & 2 \\
0 & 0 & 1 & 3 & 1 & -1
\end{array}\right]
$$
So, $A = B^{-1} = \begin{bmatrix} -3 & -1 & 2 \\ -4 & -1 & 2 \\ 3 & 1 & -1 \end{bmatrix}$.

(c) The relationship between A and B is that A is the inverse of B. $A = B^{-1}$.

## Question 8 (12%)
**Problem:** Let $\mathcal{A} = \{u_1, u_2, \dots, u_n\}$ be a basis for $\mathbb{R}^n$. Then, $\mathcal{B} = \{u_1, u_1+u_2, \dots, u_1+u_n\}$ is also a basis for $\mathbb{R}^n$. If v is a vector in $\mathbb{R}^n$ and $[v]_{\mathcal{A}} = \begin{bmatrix} a_1 \\ a_2 \\ \vdots \\ a_n \end{bmatrix}$, compute $[v]_{\mathcal{B}}$.

**Solution:**
Let $[v]_{\mathcal{B}} = \begin{bmatrix} b_1 \\ b_2 \\ \vdots \\ b_n \end{bmatrix}$.
From the definition of coordinate vectors, we have:
$v = a_1u_1 + a_2u_2 + \dots + a_nu_n$
$v = b_1(u_1) + b_2(u_1+u_2) + \dots + b_n(u_1+\dots+u_n)$

Expanding the second expression for v:
$v = (b_1 + b_2 + \dots + b_n)u_1 + (b_2 + \dots + b_n)u_2 + \dots + b_nu_n$

Since $\mathcal{A}$ is a basis, the representation is unique. We can equate the coefficients of $u_i$:
$a_1 = b_1 + b_2 + \dots + b_n$
$a_2 = b_2 + \dots + b_n$
...
$a_n = b_n$

Now we can solve for the $b_i$ terms starting from the bottom:
$b_n = a_n$
$b_{n-1} = a_{n-1} - (b_n) = a_{n-1} - a_n$
$b_{n-2} = a_{n-2} - (b_{n-1} + b_n) = a_{n-2} - (a_{n-1} - a_n + a_n) = a_{n-2} - a_{n-1}$
...
$b_1 = a_1 - (b_2 + \dots + b_n) = a_1 - a_2$

So, for $i = 1, \dots, n-1$, $b_i = a_i - a_{i+1}$, and $b_n = a_n$.
Therefore,
$$
[v]_{\mathcal{B}} = \begin{bmatrix} a_1 - a_2 \\ a_2 - a_3 \\ \vdots \\ a_{n-1} - a_n \\ a_n \end{bmatrix}
$$
