---
title: "Engineering Mathematics 1 Homework 14"
description: "g36maid"
pubDate: 2026-06-16 05:03:00 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1781557380
---

- 鍾詠傑
- g36maid

## Prob #1


(a)
$$
A = \begin{bmatrix} 2 & -3 \\ -2 & 1 \end{bmatrix}
$$

$\det(A - \lambda I) = 0$
$$
\begin{vmatrix} 2-\lambda & -3 \\ -2 & 1-\lambda \end{vmatrix} = (2-\lambda)(1-\lambda) - 6 = \lambda^2 - 3\lambda - 4 = (\lambda - 4)(\lambda + 1) = 0
$$
$\lambda_1 = 4, \lambda_2 = -1$

For $\lambda_1 = 4$:
$$
(A - 4I)\mathbf{v}_1 = \mathbf{0} \implies \begin{bmatrix} -2 & -3 \\ -2 & -3 \end{bmatrix} \begin{bmatrix} v_{11} \\ v_{12} \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \end{bmatrix} \implies \mathbf{v}_1 = \begin{bmatrix} 3 \\ -2 \end{bmatrix}
$$

For $\lambda_2 = -1$:
$$
(A + I)\mathbf{v}_2 = \mathbf{0} \implies \begin{bmatrix} 3 & -3 \\ -2 & 2 \end{bmatrix} \begin{bmatrix} v_{21} \\ v_{22} \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \end{bmatrix} \implies \mathbf{v}_2 = \begin{bmatrix} 1 \\ 1 \end{bmatrix}
$$

<div style="page-break-after:always;"></div>

(b)
$$
\mathbf{y}'' = A\mathbf{y}, \quad \mathbf{y} = \begin{bmatrix} y_1 \\ y_2 \end{bmatrix}
$$

Let $\mathbf{y} = \mathbf{v}e^{\omega t} \implies \mathbf{y}'' = \omega^2 \mathbf{v}e^{\omega t}$

$$
A\mathbf{v} = \omega^2 \mathbf{v} \implies \omega^2 = \lambda
$$

For $\lambda_1 = 4 \implies \omega^2 = 4 \implies \omega = \pm 2$
For $\lambda_2 = -1 \implies \omega^2 = -1 \implies \omega = \pm i$

General solution:
$$
\mathbf{y}(t) = c_1 \begin{bmatrix} 3 \\ -2 \end{bmatrix} e^{2t} + c_2 \begin{bmatrix} 3 \\ -2 \end{bmatrix} e^{-2t} + c_3 \begin{bmatrix} 1 \\ 1 \end{bmatrix} \cos t + c_4 \begin{bmatrix} 1 \\ 1 \end{bmatrix} \sin t
$$


<div style="page-break-after:always;"></div>

## **Prob #2** 

$$
\mathbf{X}' = B\mathbf{X}, \quad B = \begin{bmatrix} 1 & 1 & 0 \\ 1 & 1 & 0 \\ 0 & 0 & 2 \end{bmatrix}, \quad \mathbf{X} = \begin{bmatrix} x \\ y \\ z \end{bmatrix}
$$

$\det(B - \lambda I) = 0$
$$
\begin{vmatrix} 1-\lambda & 1 & 0 \\ 1 & 1-\lambda & 0 \\ 0 & 0 & 2-\lambda \end{vmatrix} = (2-\lambda) \left[ (1-\lambda)^2 - 1 \right] = (2-\lambda)(\lambda^2 - 2\lambda) = -\lambda(\lambda - 2)^2 = 0
$$
$\lambda_1 = 0, \lambda_2 = 2, \lambda_3 = 2$

For $\lambda_1 = 0$:
$$
(B - 0I)\mathbf{v}_1 = \mathbf{0} \implies \begin{bmatrix} 1 & 1 & 0 \\ 1 & 1 & 0 \\ 0 & 0 & 2 \end{bmatrix} \begin{bmatrix} v_{11} \\ v_{12} \\ v_{13} \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \\ 0 \end{bmatrix} \implies \mathbf{v}_1 = \begin{bmatrix} 1 \\ -1 \\ 0 \end{bmatrix}
$$

For $\lambda_2 = \lambda_3 = 2$:
$$
(B - 2I)\mathbf{v} = \mathbf{0} \implies \begin{bmatrix} -1 & 1 & 0 \\ 1 & -1 & 0 \\ 0 & 0 & 0 \end{bmatrix} \begin{bmatrix} v_{21} \\ v_{22} \\ v_{23} \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \\ 0 \end{bmatrix}
$$
$v_{21} = v_{22}, v_{23} \in \mathbb{R}$
$$
\mathbf{v}_2 = \begin{bmatrix} 1 \\ 1 \\ 0 \end{bmatrix}, \quad \mathbf{v}_3 = \begin{bmatrix} 0 \\ 0 \\ 1 \end{bmatrix}
$$

General solution:
$$
\mathbf{X}(t) = c_1 \begin{bmatrix} 1 \\ -1 \\ 0 \end{bmatrix} + c_2 \begin{bmatrix} 1 \\ 1 \\ 0 \end{bmatrix} e^{2t} + c_3 \begin{bmatrix} 0 \\ 0 \\ 1 \end{bmatrix} e^{2t}
$$
