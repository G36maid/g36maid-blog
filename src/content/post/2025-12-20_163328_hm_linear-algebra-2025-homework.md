---
title: "Linear Algebra 2025 Homework 5"
description: "g36maid"
pubDate: 2025-12-20 16:33:28 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1766219608
category: essay
---

## info

- g36maid
- 鍾詠傑


## Question 1 (10%)
**Problem:** Let $A$ be any $m \times n$ matrix.
(a) Prove that $A^T A$ and $A$ have the same null space.
(b) Use (a) to prove that $\text{rank}(A^T A) = \text{rank}(A)$.

**Solution:**

**(a)** We want to show $\text{Null}(A) = \text{Null}(A^T A)$.

($\subseteq$) Let $\mathbf{x} \in \text{Null}(A)$. Then $A\mathbf{x} = \mathbf{0}$.
Multiplying by $A^T$ on the left: $A^T(A\mathbf{x}) = A^T \mathbf{0} \implies (A^T A)\mathbf{x} = \mathbf{0}$.
Thus $\mathbf{x} \in \text{Null}(A^T A)$.

($\supseteq$) Let $\mathbf{x} \in \text{Null}(A^T A)$. Then $(A^T A)\mathbf{x} = \mathbf{0}$.
Multiplying by $\mathbf{x}^T$ on the left:
$$ \mathbf{x}^T (A^T A \mathbf{x}) = \mathbf{x}^T \mathbf{0} = 0 $$
$$ (A\mathbf{x})^T (A\mathbf{x}) = 0 $$
$$ \| A\mathbf{x} \|^2 = 0 $$
This implies $A\mathbf{x} = \mathbf{0}$, so $\mathbf{x} \in \text{Null}(A)$.

Since both inclusions hold, $\text{Null}(A) = \text{Null}(A^T A)$.

**(b)** By the Rank-Nullity Theorem, for an $m \times n$ matrix $M$, $\text{rank}(M) + \text{nullity}(M) = n$.
Applying this to $A$ (which is $m \times n$):
$$ \text{rank}(A) = n - \text{nullity}(A) $$
Applying this to $A^T A$ (which is $n \times n$):
$$ \text{rank}(A^T A) = n - \text{nullity}(A^T A) $$
From part (a), $\text{nullity}(A) = \text{dim}(\text{Null}(A)) = \text{dim}(\text{Null}(A^T A)) = \text{nullity}(A^T A)$.
Therefore, $\text{rank}(A) = \text{rank}(A^T A)$.

<div style="page-break-after:always;"></div>

## Question 2 (18%)
**Problem:** Let $\Sigma = \left\{ \begin{bmatrix} 1 \\ -1 \\ 0 \\ 2 \end{bmatrix}, \begin{bmatrix} 1 \\ 1 \\ 1 \\ 3 \end{bmatrix}, \begin{bmatrix} 3 \\ 1 \\ 1 \\ 5 \end{bmatrix} \right\}$.
(a) Apply Gram-Schmidt to find an orthonormal set.
(b) Find QR factorization of $A$ (matrix with columns from $\Sigma$).
(c) Solve $A\mathbf{x}=\mathbf{b}$ where $\mathbf{b} = [8, 0, 1, 11]^T$.

**Solution:**

**(a)** Let $\mathbf{v}_1, \mathbf{v}_2, \mathbf{v}_3$ be the given vectors. We calculate orthogonal vectors $\mathbf{u}_1, \mathbf{u}_2, \mathbf{u}_3$ and orthonormal vectors $\mathbf{e}_1, \mathbf{e}_2, \mathbf{e}_3$.

1. $\mathbf{u}_1 = \mathbf{v}_1 = [1, -1, 0, 2]^T$.
   $\|\mathbf{u}_1\| = \sqrt{1+1+0+4} = \sqrt{6}$.
   $\mathbf{e}_1 = \frac{1}{\sqrt{6}}[1, -1, 0, 2]^T$.

2. $\mathbf{u}_2 = \mathbf{v}_2 - \text{proj}_{\mathbf{u}_1}\mathbf{v}_2 = \mathbf{v}_2 - \frac{\mathbf{v}_2 \cdot \mathbf{u}_1}{\|\mathbf{u}_1\|^2}\mathbf{u}_1$.
   $\mathbf{v}_2 \cdot \mathbf{u}_1 = 1 - 1 + 0 + 6 = 6$.
   $\mathbf{u}_2 = [1, 1, 1, 3]^T - \frac{6}{6}[1, -1, 0, 2]^T = [0, 2, 1, 1]^T$.
   $\|\mathbf{u}_2\| = \sqrt{0+4+1+1} = \sqrt{6}$.
   $\mathbf{e}_2 = \frac{1}{\sqrt{6}}[0, 2, 1, 1]^T$.

3. $\mathbf{u}_3 = \mathbf{v}_3 - \text{proj}_{\mathbf{u}_1}\mathbf{v}_3 - \text{proj}_{\mathbf{u}_2}\mathbf{v}_3$.
   $\mathbf{v}_3 \cdot \mathbf{u}_1 = 3 - 1 + 0 + 10 = 12$.
   $\mathbf{v}_3 \cdot \mathbf{u}_2 = 0 + 2 + 1 + 5 = 8$.
   $\mathbf{u}_3 = \mathbf{v}_3 - \frac{12}{6}\mathbf{u}_1 - \frac{8}{6}\mathbf{u}_2 = [3, 1, 1, 5]^T - 2[1, -1, 0, 2]^T - \frac{4}{3}[0, 2, 1, 1]^T$.
   $\mathbf{u}_3 = [1, 3, 1, 1]^T - [0, 8/3, 4/3, 4/3]^T = [1, 1/3, -1/3, -1/3]^T$.
   To simplify normalization, note $\mathbf{u}_3 = \frac{1}{3}[3, 1, -1, -1]^T$.
   $\|\mathbf{u}_3\| = \frac{1}{3}\sqrt{9+1+1+1} = \frac{\sqrt{12}}{3} = \frac{2\sqrt{3}}{3}$.
   $\mathbf{e}_3 = \frac{\mathbf{u}_3}{\|\mathbf{u}_3\|} = \frac{[1, 1/3, -1/3, -1/3]^T}{2/\sqrt{3}} = \frac{\sqrt{3}}{6}[3, 1, -1, -1]^T$.

Orthonormal set: $\{ \mathbf{e}_1, \mathbf{e}_2, \mathbf{e}_3 \}$.

**(b)** $A = QR$. $Q = [\mathbf{e}_1, \mathbf{e}_2, \mathbf{e}_3]$. $R$ entries are $r_{ij} = \mathbf{e}_i \cdot \mathbf{v}_j$.

$$
Q = \begin{bmatrix}
1/\sqrt{6} & 0 & 3\sqrt{3}/6 \\
-1/\sqrt{6} & 2/\sqrt{6} & \sqrt{3}/6 \\
0 & 1/\sqrt{6} & -\sqrt{3}/6 \\
2/\sqrt{6} & 1/\sqrt{6} & -\sqrt{3}/6
\end{bmatrix} = \frac{1}{\sqrt{6}} \begin{bmatrix}
1 & 0 & 3/\sqrt{2} \\
-1 & 2 & 1/\sqrt{2} \\
0 & 1 & -1/\sqrt{2} \\
2 & 1 & -1/\sqrt{2}
\end{bmatrix}
$$

$R$ is upper triangular:
$r_{11} = \|\mathbf{u}_1\| = \sqrt{6}$.
$r_{12} = \mathbf{e}_1 \cdot \mathbf{v}_2 = 6/\sqrt{6} = \sqrt{6}$.
$r_{13} = \mathbf{e}_1 \cdot \mathbf{v}_3 = 12/\sqrt{6} = 2\sqrt{6}$.
$r_{22} = \|\mathbf{u}_2\| = \sqrt{6}$.
$r_{23} = \mathbf{e}_2 \cdot \mathbf{v}_3 = 8/\sqrt{6} = 4\sqrt{6}/3$.
$r_{33} = \|\mathbf{u}_3\| = 2\sqrt{3}/3$.

$$
R = \begin{bmatrix}
\sqrt{6} & \sqrt{6} & 2\sqrt{6} \\
0 & \sqrt{6} & 4\sqrt{6}/3 \\
0 & 0 & 2\sqrt{3}/3
\end{bmatrix}
$$

**(c)** Solve $R\mathbf{x} = Q^T\mathbf{b}$.
Compute $\mathbf{y} = Q^T\mathbf{b}$:
$y_1 = \mathbf{e}_1 \cdot \mathbf{b} = \frac{1}{\sqrt{6}}(8 + 0 + 0 + 22) = \frac{30}{\sqrt{6}} = 5\sqrt{6}$.
$y_2 = \mathbf{e}_2 \cdot \mathbf{b} = \frac{1}{\sqrt{6}}(0 + 0 + 1 + 11) = \frac{12}{\sqrt{6}} = 2\sqrt{6}$.
$y_3 = \mathbf{e}_3 \cdot \mathbf{b} = \frac{\sqrt{3}}{6}(24 + 0 - 1 - 11) = \frac{12\sqrt{3}}{6} = 2\sqrt{3}$.

Solve triangular system:
1. $r_{33}x_3 = y_3 \implies \frac{2\sqrt{3}}{3}x_3 = 2\sqrt{3} \implies x_3 = 3$.
2. $r_{22}x_2 + r_{23}x_3 = y_2 \implies \sqrt{6}x_2 + \frac{4\sqrt{6}}{3}(3) = 2\sqrt{6} \implies \sqrt{6}x_2 + 4\sqrt{6} = 2\sqrt{6} \implies x_2 = -2$.
3. $r_{11}x_1 + r_{12}x_2 + r_{13}x_3 = y_1 \implies \sqrt{6}x_1 + \sqrt{6}(-2) + 2\sqrt{6}(3) = 5\sqrt{6} \implies x_1 - 2 + 6 = 5 \implies x_1 = 1$.

Solution: $\mathbf{x} = [1, -2, 3]^T$.

<div style="page-break-after:always;"></div>

## Question 3 (15%)
**Problem:** Prove properties for orthonormal basis $\{w_1, \dots, w_n\}$ of $\mathbb{R}^n$.

**Solution:**

**(a)** Since $\{w_i\}$ is a basis, any vector $z$ can be written as $z = \sum c_i w_i$.
Dotting with $w_j$: $z \cdot w_j = \sum c_i (w_i \cdot w_j) = c_j$.
So $z = \sum (z \cdot w_i) w_i$.
Applying this to $u+v$:
$$ u+v = \sum_{i=1}^n ((u+v) \cdot w_i) w_i = \sum_{i=1}^n (u \cdot w_i + v \cdot w_i) w_i $$

**(b)** $u \cdot v = (\sum (u \cdot w_i) w_i) \cdot (\sum (v \cdot w_j) w_j) = \sum_i \sum_j (u \cdot w_i)(v \cdot w_j)(w_i \cdot w_j)$.
Since $w_i \cdot w_j = \delta_{ij}$:
$$ u \cdot v = \sum_{i=1}^n (u \cdot w_i)(v \cdot w_i) $$

**(c)** Let $v=u$ in (b):
$$ \|u\|^2 = u \cdot u = \sum_{i=1}^n (u \cdot w_i)^2 $$

<div style="page-break-after:always;"></div>

## Question 4 (15%)
**Problem:** Let $\mathbf{u} = [1, 3, -2]^T$ and $W$ be the solution set of:
$x_1 + 2x_2 - 3x_3 = 0$
$x_1 + x_2 - 3x_3 = 0$

**Solution:**

**(a)** Find basis for $W$.
Subtract eq2 from eq1: $x_2 = 0$.
Substitute into eq2: $x_1 - 3x_3 = 0 \implies x_1 = 3x_3$.
Let $x_3 = t$. Then $\mathbf{x} = t[3, 0, 1]^T$.
Basis vector $\mathbf{a} = [3, 0, 1]^T$.
$P_W = \frac{\mathbf{a}\mathbf{a}^T}{\|\mathbf{a}\|^2}$.
$\|\mathbf{a}\|^2 = 9+1=10$.
$$
P_W = \frac{1}{10} \begin{bmatrix} 3 \\ 0 \\ 1 \end{bmatrix} \begin{bmatrix} 3 & 0 & 1 \end{bmatrix} = \begin{bmatrix} 0.9 & 0 & 0.3 \\ 0 & 0 & 0 \\ 0.3 & 0 & 0.1 \end{bmatrix}
$$

**(b)** $\mathbf{w} = P_W \mathbf{u} = \frac{1}{10} \begin{bmatrix} 9 & 0 & 3 \\ 0 & 0 & 0 \\ 3 & 0 & 1 \end{bmatrix} \begin{bmatrix} 1 \\ 3 \\ -2 \end{bmatrix} = \frac{1}{10} \begin{bmatrix} 9 - 6 \\ 0 \\ 3 - 2 \end{bmatrix} = \begin{bmatrix} 0.3 \\ 0 \\ 0.1 \end{bmatrix}$.
$\mathbf{z} = \mathbf{u} - \mathbf{w} = [1, 3, -2]^T - [0.3, 0, 0.1]^T = [0.7, 3, -2.1]^T$.

**(c)** Distance is $\|\mathbf{z}\| = \sqrt{0.7^2 + 3^2 + (-2.1)^2} = \sqrt{0.49 + 9 + 4.41} = \sqrt{13.9} \approx 3.73$.

<div style="page-break-after:always;"></div>

## Question 5 (10%)
**Problem:** Prove $P_W P_{W^\perp} = P_{W^\perp} P_W = O$ and $P_{W^\perp} = I - P_W$.

**Solution:**
For any $\mathbf{x}$, let $\mathbf{x} = \mathbf{w} + \mathbf{z}$ with $\mathbf{w} \in W, \mathbf{z} \in W^\perp$.
By definition $P_W \mathbf{x} = \mathbf{w}$ and $P_{W^\perp} \mathbf{x} = \mathbf{z}$.

Consider $P_W P_{W^\perp} \mathbf{x} = P_W \mathbf{z}$. Since $\mathbf{z} \in W^\perp$, its projection onto $W$ is $\mathbf{0}$. So $P_W P_{W^\perp} = O$.
Similarly $P_{W^\perp} P_W \mathbf{x} = P_{W^\perp} \mathbf{w} = \mathbf{0}$ since $\mathbf{w} \in W = (W^\perp)^\perp$.

Since $\mathbf{x} = P_W \mathbf{x} + P_{W^\perp} \mathbf{x} = (P_W + P_{W^\perp})\mathbf{x}$, we have $I = P_W + P_{W^\perp}$.

<div style="page-break-after:always;"></div>

## Question 6 (12%)
**Problem:** $A = \begin{bmatrix} 1 & 2 \\ 1 & -1 \\ 2 & 1 \end{bmatrix}, \mathbf{b} = \begin{bmatrix} 1 \\ 3 \\ 1 \end{bmatrix}$.

**Solution:**

**(a)** Solve $A^T A \mathbf{z} = A^T \mathbf{b}$.
$$ A^T A = \begin{bmatrix} 1 & 1 & 2 \\ 2 & -1 & 1 \end{bmatrix} \begin{bmatrix} 1 & 2 \\ 1 & -1 \\ 2 & 1 \end{bmatrix} = \begin{bmatrix} 6 & 3 \\ 3 & 6 \end{bmatrix} $$
$$ A^T \mathbf{b} = \begin{bmatrix} 1 & 1 & 2 \\ 2 & -1 & 1 \end{bmatrix} \begin{bmatrix} 1 \\ 3 \\ 1 \end{bmatrix} = \begin{bmatrix} 6 \\ 0 \end{bmatrix} $$
System:
$6z_1 + 3z_2 = 6 \implies 2z_1 + z_2 = 2$
$3z_1 + 6z_2 = 0 \implies z_1 = -2z_2$
Sub: $2(-2z_2) + z_2 = 2 \implies -3z_2 = 2 \implies z_2 = -2/3$.
$z_1 = 4/3$.
$\mathbf{z} = [4/3, -2/3]^T$.

**(b)** Since cols of $A$ are linearly independent (rank 2), the least squares solution is unique. Thus the vector found in (a) is also the one of least norm.
$\mathbf{z} = [4/3, -2/3]^T$.

<div style="page-break-after:always;"></div>

## Question 7 (10%)
**Problem:** Find orthogonal operator $T$ on $\mathbb{R}^3$ such that $T(\mathbf{v}) = \mathbf{w}$ where $\mathbf{v} = \frac{1}{\sqrt{10}}[3, 1, 0]^T$ and $\mathbf{w} = \frac{1}{\sqrt{5}}[0, -2, 1]^T$.

**Solution:**
Note $\|\mathbf{v}\| = 1$ and $\|\mathbf{w}\| = 1$.
We can use a Householder reflection. The reflection across the hyperplane perpendicular to $\mathbf{u} = \mathbf{v} - \mathbf{w}$ swaps $\mathbf{v}$ and $\mathbf{w}$.
$\mathbf{u} = [3/\sqrt{10}, 1/\sqrt{10} + 2/\sqrt{5}, -1/\sqrt{5}]^T$.
Let's simplify vectors for calculation (scaling doesn't affect Householder direction, but we need normalized $u$ for formula $I - 2uu^T$).
Let's keep exact values.
$T = I - 2\frac{(\mathbf{v}-\mathbf{w})(\mathbf{v}-\mathbf{w})^T}{\|\mathbf{v}-\mathbf{w}\|^2}$.
Since it's a reflection, it is orthogonal. And reflections satisfy $T(\mathbf{x}-\mathbf{y}) = -(\mathbf{x}-\mathbf{y})$ if $\mathbf{x},\mathbf{y}$ are the reflected pair? No, reflection across hyperplane normal to $\mathbf{u}$ maps $\mathbf{x}$ to $\mathbf{x} - 2\text{proj}_{\mathbf{u}}\mathbf{x}$.
If we reflect $\mathbf{v}$, we get $\mathbf{v} - 2 \frac{(\mathbf{v}-\mathbf{w})\cdot \mathbf{v}}{\|\mathbf{v}-\mathbf{w}\|^2}(\mathbf{v}-\mathbf{w})$.
$\|\mathbf{v}-\mathbf{w}\|^2 = \|\mathbf{v}\|^2 + \|\mathbf{w}\|^2 - 2\mathbf{v}\cdot\mathbf{w} = 2 - 2\mathbf{v}\cdot\mathbf{w}$.
$(\mathbf{v}-\mathbf{w})\cdot \mathbf{v} = 1 - \mathbf{v}\cdot\mathbf{w}$.
So coeff is $2 \frac{1 - \mathbf{v}\cdot\mathbf{w}}{2(1 - \mathbf{v}\cdot\mathbf{w})} = 1$.
Result is $\mathbf{v} - (\mathbf{v}-\mathbf{w}) = \mathbf{w}$.
So the Householder matrix $H$ works.
$\mathbf{v} \cdot \mathbf{w} = \frac{1}{\sqrt{50}}(0 - 2 + 0) = \frac{-2}{5\sqrt{2}} = \frac{-\sqrt{2}}{5}$.
Calculation of specific matrix entries is tedious but the operator is uniquely defined by this construction (or a rotation).

<div style="page-break-after:always;"></div>

## Question 8 (10%)
**Problem:** Spectral decomposition of symmetric matrix $A = \begin{bmatrix} 0 & 2 & 2 \\ 2 & 0 & 2 \\ 2 & 2 & 0 \end{bmatrix}$.

**Solution:**
Characteristic poly: $\det(A-\lambda I) = -\lambda^3 + 12\lambda + 16 = -(\lambda-4)(\lambda+2)^2$.
Eigenvalues: $4, -2, -2$.

For $\lambda=4$: Basis for Null$(A-4I)$ is $\mathbf{v}_1 = [1, 1, 1]^T$. Normalized $\mathbf{u}_1 = \frac{1}{\sqrt{3}}[1, 1, 1]^T$.
For $\lambda=-2$: Null$(A+2I)$ is plane $x+y+z=0$.
Basis: $\mathbf{v}_2 = [-1, 1, 0]^T$, $\mathbf{v}_3 = [-1, -1, 2]^T$ (orthogonalized).
Normalized: $\mathbf{u}_2 = \frac{1}{\sqrt{2}}[-1, 1, 0]^T$, $\mathbf{u}_3 = \frac{1}{\sqrt{6}}[-1, -1, 2]^T$.

Spectral Decomposition:
$$ A = 4 \mathbf{u}_1 \mathbf{u}_1^T - 2 \mathbf{u}_2 \mathbf{u}_2^T - 2 \mathbf{u}_3 \mathbf{u}_3^T $$
$$ P_1 = \mathbf{u}_1 \mathbf{u}_1^T = \frac{1}{3}\begin{bmatrix} 1 & 1 & 1 \\ 1 & 1 & 1 \\ 1 & 1 & 1 \end{bmatrix} $$
$$ P_2 = \mathbf{u}_2 \mathbf{u}_2^T = \frac{1}{2}\begin{bmatrix} 1 & -1 & 0 \\ -1 & 1 & 0 \\ 0 & 0 & 0 \end{bmatrix} $$
$$ P_3 = \mathbf{u}_3 \mathbf{u}_3^T = \frac{1}{6}\begin{bmatrix} 1 & 1 & -2 \\ 1 & 1 & -2 \\ -2 & -2 & 4 \end{bmatrix} $$
(Note: Eigenspace for $\lambda=-2$ can be combined into one projection $P_{-2} = P_2 + P_3$).
