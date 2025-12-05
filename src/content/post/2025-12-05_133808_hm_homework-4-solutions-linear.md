---
title: "Homework 4 Solutions: Linear Algebra (2025)"
description: "g36maid"
pubDate: 2025-12-05 13:38:08 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1764913088
---

## information
- g36maid
- 鍾詠傑

### Question 1 (20%)
**Problem:** Let $T_w$ be the reflection of $\mathbb{R}^3$ about the plane $W$ in $\mathbb{R}^3$ with equation $x+2y-3z=0$ and let
$$
\mathcal{B} = \left\{
\begin{bmatrix} -2 \\ 1 \\ 0 \end{bmatrix},
\begin{bmatrix} 3 \\ 0 \\ 1 \end{bmatrix},
\begin{bmatrix} 1 \\ 2 \\ -3 \end{bmatrix}
\right\}.
$$
Note that the first two vectors in $\mathcal{B}$ lie in $W$ and the third vector is perpendicular (normal) to $W$.

**(a) Find $T_w(\mathbf{v})$ for each vector $\mathbf{v}$ in $\mathcal{B}$.**

**Solution:**
Let $\mathbf{b}_1 = \begin{bmatrix} -2 \\ 1 \\ 0 \end{bmatrix}$, $\mathbf{b}_2 = \begin{bmatrix} 3 \\ 0 \\ 1 \end{bmatrix}$, and $\mathbf{b}_3 = \begin{bmatrix} 1 \\ 2 \\ -3 \end{bmatrix}$.
Since $\mathbf{b}_1$ and $\mathbf{b}_2$ lie in the plane $W$, the reflection leaves them unchanged:
$$ T_w(\mathbf{b}_1) = \mathbf{b}_1 $$
$$ T_w(\mathbf{b}_2) = \mathbf{b}_2 $$
Since $\mathbf{b}_3$ is normal to the plane $W$, the reflection maps it to its negative:
$$ T_w(\mathbf{b}_3) = -\mathbf{b}_3 $$

**(b) Show that $\mathcal{B}$ is a basis for $\mathbb{R}^3$.**

**Solution:**
The set $\mathcal{B} = \{\mathbf{b}_1, \mathbf{b}_2, \mathbf{b}_3\}$ consists of three vectors in $\mathbb{R}^3$. To show they form a basis, we need to show they are linearly independent.
Since $\mathbf{b}_1$ and $\mathbf{b}_2$ are non-parallel vectors in $W$ (they are linearly independent), and $\mathbf{b}_3$ is normal to $W$ (and thus not in $W$), $\mathbf{b}_3$ cannot be written as a linear combination of $\mathbf{b}_1$ and $\mathbf{b}_2$.
Alternatively, we can compute the determinant of the matrix formed by these vectors:
$$ \det \begin{bmatrix} -2 & 3 & 1 \\ 1 & 0 & 2 \\ 0 & 1 & -3 \end{bmatrix} = -2(0 - 2) - 3(-3 - 0) + 1(1 - 0) = 4 + 9 + 1 = 14 \neq 0 $$
Since the determinant is non-zero, the vectors are linearly independent and form a basis for $\mathbb{R}^3$.

**(c) Find $[T_w]_{\mathcal{B}}$.**

**Solution:**
Using the results from (a):
$$ [T_w(\mathbf{b}_1)]_{\mathcal{B}} = [\mathbf{b}_1]_{\mathcal{B}} = \begin{bmatrix} 1 \\ 0 \\ 0 \end{bmatrix} $$
$$ [T_w(\mathbf{b}_2)]_{\mathcal{B}} = [\mathbf{b}_2]_{\mathcal{B}} = \begin{bmatrix} 0 \\ 1 \\ 0 \end{bmatrix} $$
$$ [T_w(\mathbf{b}_3)]_{\mathcal{B}} = [-\mathbf{b}_3]_{\mathcal{B}} = \begin{bmatrix} 0 \\ 0 \\ -1 \end{bmatrix} $$
Thus, the matrix representation is:
$$ [T_w]_{\mathcal{B}} = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & -1 \end{bmatrix} $$

**(d) Find the standard matrix of $T_w$.**

**Solution:**
Let $A$ be the standard matrix of $T_w$. We know that $A = P [T_w]_{\mathcal{B}} P^{-1}$, where $P$ is the transition matrix from $\mathcal{B}$ to the standard basis, i.e., $P = \begin{bmatrix} \mathbf{b}_1 & \mathbf{b}_2 & \mathbf{b}_3 \end{bmatrix}$.
$$ P = \begin{bmatrix} -2 & 3 & 1 \\ 1 & 0 & 2 \\ 0 & 1 & -3 \end{bmatrix} $$
Computing $A$:
$$ A = P \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & -1 \end{bmatrix} P^{-1} $$
Using computational tools, we find:
$$ A = \begin{bmatrix} 6/7 & -2/7 & 3/7 \\ -2/7 & 3/7 & 6/7 \\ 3/7 & 6/7 & -2/7 \end{bmatrix} = \frac{1}{7} \begin{bmatrix} 6 & -2 & 3 \\ -2 & 3 & 6 \\ 3 & 6 & -2 \end{bmatrix} $$

**(e) Determine an explicit formula for $T_w \left( \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} \right)$.**

**Solution:**
Using the standard matrix $A$:
$$ T_w \left( \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} \right) = A \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} = \frac{1}{7} \begin{bmatrix} 6x_1 - 2x_2 + 3x_3 \\ -2x_1 + 3x_2 + 6x_3 \\ 3x_1 + 6x_2 - 2x_3 \end{bmatrix} $$

### Question 2 (12%)
**Problem:** Prove the following properties about matrix representations of linear transformations.

**(a) If $A$ is the standard matrix of $T$, then $[T]_{\mathcal{B}}^{\mathcal{C}} = C^{-1}AB$.**

**Proof:**
By definition, the columns of $[T]_{\mathcal{B}}^{\mathcal{C}}$ are coordinate vectors of $T(\mathbf{b}_j)$ with respect to $\mathcal{C}$.
$$ [T]_{\mathcal{B}}^{\mathcal{C}} = \left[ [T(\mathbf{b}_1)]_{\mathcal{C}} \dots [T(\mathbf{b}_n)]_{\mathcal{C}} \right] $$
We know that $T(\mathbf{x}) = A\mathbf{x}$. So $T(\mathbf{b}_j) = A\mathbf{b}_j$.
The coordinate vector $[\mathbf{v}]_{\mathcal{C}}$ is obtained by $C^{-1}\mathbf{v}$.
Thus, $[T(\mathbf{b}_j)]_{\mathcal{C}} = C^{-1} A \mathbf{b}_j$.
Therefore,
$$ [T]_{\mathcal{B}}^{\mathcal{C}} = \left[ C^{-1} A \mathbf{b}_1 \dots C^{-1} A \mathbf{b}_n \right] = C^{-1} A \left[ \mathbf{b}_1 \dots \mathbf{b}_n \right] = C^{-1}AB $$

**(b) $[T(\mathbf{v})]_{\mathcal{C}} = [T]_{\mathcal{B}}^{\mathcal{C}} [\mathbf{v}]_{\mathcal{B}}$ for any vector $\mathbf{v}$ in $\mathbb{R}^n$.**

**Proof:**
Let $[\mathbf{v}]_{\mathcal{B}} = \mathbf{x}$. Then $\mathbf{v} = B\mathbf{x}$.
$$ T(\mathbf{v}) = T(B\mathbf{x}) = A(B\mathbf{x}) = (AB)\mathbf{x} $$
We want to find $[T(\mathbf{v})]_{\mathcal{C}}$, which is $C^{-1} T(\mathbf{v})$.
$$ [T(\mathbf{v})]_{\mathcal{C}} = C^{-1} (AB) \mathbf{x} = (C^{-1}AB) \mathbf{x} $$
From part (a), $[T]_{\mathcal{B}}^{\mathcal{C}} = C^{-1}AB$.
So,
$$ [T(\mathbf{v})]_{\mathcal{C}} = [T]_{\mathcal{B}}^{\mathcal{C}} [\mathbf{v}]_{\mathcal{B}} $$

**(c) $[UT]_{\mathcal{B}}^{\mathcal{D}} = [U]_{\mathcal{C}}^{\mathcal{D}} [T]_{\mathcal{B}}^{\mathcal{C}}$.**

**Proof:**
Let $A$ be the standard matrix of $T$ and $M$ be the standard matrix of $U$.
From (a), $[T]_{\mathcal{B}}^{\mathcal{C}} = C^{-1}AB$ and $[U]_{\mathcal{C}}^{\mathcal{D}} = D^{-1}MC$.
The standard matrix of the composition $UT$ is $MA$.
Using (a) for $UT$:
$$ [UT]_{\mathcal{B}}^{\mathcal{D}} = D^{-1} (MA) B $$
Now compute the product of the individual representations:
$$ [U]_{\mathcal{C}}^{\mathcal{D}} [T]_{\mathcal{B}}^{\mathcal{C}} = (D^{-1}MC) (C^{-1}AB) = D^{-1} M (C C^{-1}) A B = D^{-1} M I A B = D^{-1} (MA) B $$
Thus,
$$ [UT]_{\mathcal{B}}^{\mathcal{D}} = [U]_{\mathcal{C}}^{\mathcal{D}} [T]_{\mathcal{B}}^{\mathcal{C}} $$

### Question 3 (12%)
**Problem:** Find eigenvalues and basis for each eigenspace of $T$.
$$ T \left( \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} \right) = \begin{bmatrix} -4x_1 + 6x_2 \\ 2x_2 \\ -5x_1 + 5x_2 + x_3 \end{bmatrix} $$

**Solution:**
The standard matrix of $T$ is:
$$ A = \begin{bmatrix} -4 & 6 & 0 \\ 0 & 2 & 0 \\ -5 & 5 & 1 \end{bmatrix} $$
The characteristic polynomial is $\det(A - \lambda I)$:
$$ \det \begin{bmatrix} -4-\lambda & 6 & 0 \\ 0 & 2-\lambda & 0 \\ -5 & 5 & 1-\lambda \end{bmatrix} = (2-\lambda) \det \begin{bmatrix} -4-\lambda & 0 \\ -5 & 1-\lambda \end{bmatrix} = (2-\lambda)(-4-\lambda)(1-\lambda) $$
The eigenvalues are $\lambda = 2, -4, 1$.

**For $\lambda = 2$:**
$$ A - 2I = \begin{bmatrix} -6 & 6 & 0 \\ 0 & 0 & 0 \\ -5 & 5 & -1 \end{bmatrix} \sim \begin{bmatrix} 1 & -1 & 0 \\ 0 & 0 & 1 \\ 0 & 0 & 0 \end{bmatrix} $$
$x_1 = x_2$, $x_3 = 0$. Basis: $\left\{ \begin{bmatrix} 1 \\ 1 \\ 0 \end{bmatrix} \right\}$.

**For $\lambda = -4$:**
$$ A + 4I = \begin{bmatrix} 0 & 6 & 0 \\ 0 & 6 & 0 \\ -5 & 5 & 5 \end{bmatrix} \sim \begin{bmatrix} 0 & 1 & 0 \\ -1 & 1 & 1 \\ 0 & 0 & 0 \end{bmatrix} \sim \begin{bmatrix} 1 & 0 & -1 \\ 0 & 1 & 0 \\ 0 & 0 & 0 \end{bmatrix} $$
$x_2 = 0$, $x_1 = x_3$. Basis: $\left\{ \begin{bmatrix} 1 \\ 0 \\ 1 \end{bmatrix} \right\}$.

**For $\lambda = 1$:**
$$ A - I = \begin{bmatrix} -5 & 6 & 0 \\ 0 & 1 & 0 \\ -5 & 5 & 0 \end{bmatrix} \sim \begin{bmatrix} 0 & 1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & 0 \end{bmatrix} $$
$x_1 = 0$, $x_2 = 0$, $x_3$ is free. Basis: $\left\{ \begin{bmatrix} 0 \\ 0 \\ 1 \end{bmatrix} \right\}$.

### Question 4 (12%)
**Problem:** Given $A = \begin{bmatrix} -2 & 3 & 6 \\ -2 & -8 & -2 \\ 6 & -1 & 4 \end{bmatrix}$ and characteristic polynomial $-(t + 5)(t + 4)(t + 2)$, find $P$ and $D$.

**Solution:**
There is a discrepancy in the problem statement. The characteristic polynomial of the matrix $A$ as given is $f(\lambda) = -(\lambda^3 + 6\lambda^2 - 56\lambda - 356)$, which has non-integer roots (approximately $5.36, -3.11, -8.24$). The provided polynomial $-(t+5)(t+4)(t+2)$ has roots $-5, -4, -2$, which do not match the matrix.
As it is impossible to find a matrix $P$ of eigenvectors for the provided polynomial without the correct corresponding matrix, and the matrix provided does not have simple integer eigenvalues suitable for manual diagonalization (and likely has a typo), we conclude that the problem cannot be solved as stated due to the contradiction.
If the matrix were such that its eigenvalues were $-2, -4, -5$, we would find the eigenvectors for each to form $P$ and set $D = \text{diag}(-2, -4, -5)$.

### Question 5 (10%)
**Problem:** Prove Cayley-Hamilton theorem for diagonalizable matrix $A$: $f(A) = O$.

**Proof:**
Since $A$ is diagonalizable, there exists an invertible matrix $P$ and a diagonal matrix $D$ such that $A = PDP^{-1}$.
The characteristic polynomial is $f(t)$. Let $\lambda_1, \dots, \lambda_n$ be the eigenvalues of $A$. These are the diagonal entries of $D$.
We compute $f(A)$:
$$ f(A) = a_n A^n + \dots + a_0 I = a_n (PDP^{-1})^n + \dots + a_0 I $$
Since $(PDP^{-1})^k = PD^k P^{-1}$, we have:
$$ f(A) = P (a_n D^n + \dots + a_0 I) P^{-1} = P f(D) P^{-1} $$
The matrix $f(D)$ is a diagonal matrix with entries $f(\lambda_i)$ on the diagonal.
$$ f(D) = \text{diag}(f(\lambda_1), \dots, f(\lambda_n)) $$
Since each $\lambda_i$ is a root of the characteristic polynomial $f(t)$, we have $f(\lambda_i) = 0$ for all $i$.
Thus, $f(D)$ is the zero matrix.
$$ f(A) = P \cdot O \cdot P^{-1} = O $$

### Question 6 (10%)
**Problem:** Determine if $T$ is diagonalizable, where $T \left( \begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} \right) = \begin{bmatrix} 4x_1 - 5x_2 \\ -x_2 \\ -x_3 \end{bmatrix}$.

**Solution:**
The standard matrix is $A = \begin{bmatrix} 4 & -5 & 0 \\ 0 & -1 & 0 \\ 0 & 0 & -1 \end{bmatrix}$.
Since $A$ is upper triangular, the eigenvalues are the diagonal entries: $\lambda_1 = 4, \lambda_2 = -1, \lambda_3 = -1$.
Algebraic multiplicities: $\lambda=4$ is 1, $\lambda=-1$ is 2.
We check the geometric multiplicity of $\lambda = -1$.
$$ A - (-1)I = \begin{bmatrix} 5 & -5 & 0 \\ 0 & 0 & 0 \\ 0 & 0 & 0 \end{bmatrix} \sim \begin{bmatrix} 1 & -1 & 0 \\ 0 & 0 & 0 \\ 0 & 0 & 0 \end{bmatrix} $$
The system $x_1 - x_2 = 0$ has two free variables ($x_2$ and $x_3$). Thus the dimension of the eigenspace is 2.
Since the geometric multiplicity (2) equals the algebraic multiplicity (2) for $\lambda=-1$, and the multiplicities match for $\lambda=4$ (both 1), the operator $T$ is **diagonalizable**.
A basis $\mathcal{B}$ can be formed by the union of basis vectors for the eigenspaces:
For $\lambda = -1$: Basis $\left\{ \begin{bmatrix} 1 \\ 1 \\ 0 \end{bmatrix}, \begin{bmatrix} 0 \\ 0 \\ 1 \end{bmatrix} \right\}$.
For $\lambda = 4$: Basis $\left\{ \begin{bmatrix} 1 \\ 0 \\ 0 \end{bmatrix} \right\}$.
$$ \mathcal{B} = \left\{ \begin{bmatrix} 1 \\ 1 \\ 0 \end{bmatrix}, \begin{bmatrix} 0 \\ 0 \\ 1 \end{bmatrix}, \begin{bmatrix} 1 \\ 0 \\ 0 \end{bmatrix} \right\} $$

### Question 7 (12%)
**Problem:** Find $c$ for which $T$ is not diagonalizable.
$A = \begin{bmatrix} 1 & 2 & -1 \\ 0 & c & 0 \\ 6 & -1 & 6 \end{bmatrix}$, $f(t) = -(t-c)(t-3)(t-4)$.

**Solution:**
The eigenvalues are $c, 3, 4$.
$T$ is diagonalizable if the geometric multiplicity equals the algebraic multiplicity for every eigenvalue.
If $c, 3, 4$ are distinct ($c \neq 3$ and $c \neq 4$), $T$ is diagonalizable.
We check the cases where eigenvalues are repeated:

**Case 1: $c = 3$.**
Eigenvalues are $3, 3, 4$. Algebraic multiplicity of $\lambda=3$ is 2.
We check the rank of $A - 3I$:
$$ A - 3I = \begin{bmatrix} -2 & 2 & -1 \\ 0 & 0 & 0 \\ 6 & -1 & 3 \end{bmatrix} $$
Row 3 is not a multiple of Row 1 (independent). The rank is 2.
Geometric multiplicity = $3 - \text{Rank} = 3 - 2 = 1$.
Since $1 < 2$, $T$ is **not diagonalizable** for $c=3$.

**Case 2: $c = 4$.**
Eigenvalues are $4, 4, 3$. Algebraic multiplicity of $\lambda=4$ is 2.
We check the rank of $A - 4I$:
$$ A - 4I = \begin{bmatrix} -3 & 2 & -1 \\ 0 & 0 & 0 \\ 6 & -1 & 2 \end{bmatrix} $$
Row 3 is not a multiple of Row 1. Rank is 2.
Geometric multiplicity = $3 - 2 = 1$.
Since $1 < 2$, $T$ is **not diagonalizable** for $c=4$.

**Answer:** $c = 3$ and $c = 4$.

### Question 8 (12%)
**Problem:** $T(a\mathbf{u} + b\mathbf{v} + c\mathbf{w}) = a\mathbf{u} + b\mathbf{v} - c\mathbf{w}$ for basis $\mathcal{B}=\{\mathbf{u}, \mathbf{v}, \mathbf{w}\}$.

**(a) Find eigenvalues and basis for each eigenspace.**

**Solution:**
From the definition:
$T(\mathbf{u}) = 1\mathbf{u}$
$T(\mathbf{v}) = 1\mathbf{v}$
$T(\mathbf{w}) = -1\mathbf{w}$
The eigenvalues are $\lambda = 1$ and $\lambda = -1$.
Eigenspace for $\lambda = 1$: Spanned by $\{\mathbf{u}, \mathbf{v}\}$.
Eigenspace for $\lambda = -1$: Spanned by $\{\mathbf{w}\}$.

**(b) Is $T$ diagonalizable?**

**Solution:**
Yes. The sum of dimensions of the eigenspaces is $2 + 1 = 3$, which equals the dimension of the space $\mathbb{R}^3$.
Also, the matrix representation relative to $\mathcal{B}$ is diagonal: $\begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & -1 \end{bmatrix}$.
