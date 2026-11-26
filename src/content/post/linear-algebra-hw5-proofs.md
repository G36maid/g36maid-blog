---
title: "線性代數正交性章證明題全解：從 A^T A 的 null space 到譜分解"
description: "正交性章節八題證明與計算的教學版整理：雙包含與範數平方技巧、Gram-Schmidt 到 QR 的免費紅利、Parseval 恆等式、投影矩陣與距離、正規方程的幾何意義、Householder 反射構造，以及對稱矩陣譜分解，每題補上「為什麼這樣想」的解題引導。"
pubDate: 2025-12-20T16:33:28+08:00
category: programming
tags: ["linear-algebra", "mathematics", "proof", "study-notes"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1766219608
---

> 本文擴寫自 2025-12-20 的 HackMD 作業筆記。

這一章的主軸是正交性：內積空間、Gram-Schmidt、投影、最小平方、譜分解。八題作業剛好把整條線走完一遍，我把它整理成教學版，重點放在每題下筆前，是什麼線索讓人往那個方向做。

## 第一題：$$A^T A$$ 與 $$A$$ 有相同的 null space

**題目**：設 $$A$$ 為任意 $$m \times n$$ 矩陣。(a) 證明 $$A^T A$$ 與 $$A$$ 的 null space 相等；(b) 用 (a) 證明 $$\operatorname{rank}(A^T A) = \operatorname{rank}(A)$$。

**為什麼這樣想**：證兩集合相等，標準動作是雙包含。$$\subseteq$$ 方向把 $$A\mathbf{x} = \mathbf{0}$$ 左乘 $$A^T$$ 就到手，幾乎免費；卡人的是反方向——從 $$(A^T A)\mathbf{x} = \mathbf{0}$$ 擠出 $$A\mathbf{x} = \mathbf{0}$$，不能直接「消去」$$A^T$$，因為它不必可逆。直覺是把等式再左乘 $$\mathbf{x}^T$$，製造出範數平方：實數世界裡「範數平方為零 ⟺ 向量為零」，這一步把矩陣等式壓成純量事實，是這類證明最常用的鑰匙。

**(a)** 先證 $$\operatorname{Null}(A) \subseteq \operatorname{Null}(A^T A)$$：若 $$A\mathbf{x} = \mathbf{0}$$，左乘 $$A^T$$ 得 $$(A^T A)\mathbf{x} = \mathbf{0}$$。

再證 $$\operatorname{Null}(A^T A) \subseteq \operatorname{Null}(A)$$：若 $$(A^T A)\mathbf{x} = \mathbf{0}$$，左乘 $$\mathbf{x}^T$$：

$$ \mathbf{x}^T (A^T A)\mathbf{x} = (A\mathbf{x})^T (A\mathbf{x}) = \|A\mathbf{x}\|^2 = 0 $$

實數的平方和為零，故每個分量皆零，$$A\mathbf{x} = \mathbf{0}$$。兩個包含都成立，得證。

**(b)** 對 $$m \times n$$ 矩陣用秩— nullity 定理：$$\operatorname{rank}(M) + \operatorname{nullity}(M) = n$$。$$A$$ 與 $$A^T A$$（後者是 $$n \times n$$）的 column 數都是 $$n$$，而 (a) 說它們 nullity 相同，所以 rank 也相同：

$$ \operatorname{rank}(A) = n - \operatorname{nullity}(A) = n - \operatorname{nullity}(A^T A) = \operatorname{rank}(A^T A) $$

## 第二題：Gram-Schmidt、QR 分解與解方程組

**題目**：給定 $$\Sigma = \left\{ \begin{bmatrix} 1 \\ -1 \\ 0 \\ 2 \end{bmatrix}, \begin{bmatrix} 1 \\ 1 \\ 1 \\ 3 \end{bmatrix}, \begin{bmatrix} 3 \\ 1 \\ 1 \\ 5 \end{bmatrix} \right\}$$。(a) 做 Gram-Schmidt 求正交正規集合；(b) 求以 $$\Sigma$$ 為行的矩陣 $$A$$ 之 QR 分解；(c) 解 $$A\mathbf{x} = \mathbf{b}$$，其中 $$\mathbf{b} = [8, 0, 1, 11]^T$$。

**為什麼這樣想**：三小題其實是一道題。QR 不是新的計算——$$Q$$ 的行向量就是 Gram-Schmidt 吐出來的 $$\mathbf{e}_1, \mathbf{e}_2, \mathbf{e}_3$$，$$R$$ 只是順手把每一步「扣掉了多少」記下來，係數就是 $$r_{ij} = \mathbf{e}_i \cdot \mathbf{v}_j$$，(b) 幾乎免費。(c) 則是 QR 的紅利：$$Q^T Q = I$$，$$A\mathbf{x} = \mathbf{b}$$ 左乘 $$Q^T$$ 得 $$R\mathbf{x} = Q^T\mathbf{b}$$，上三角直接回代，不用做高斯消去、也不用動 $$\mathbf{b}$$。

**(a)** 逐步做：

1. $$\mathbf{u}_1 = \mathbf{v}_1 = [1, -1, 0, 2]^T$$，$$\|\mathbf{u}_1\| = \sqrt{6}$$，$$\mathbf{e}_1 = \frac{1}{\sqrt{6}}[1, -1, 0, 2]^T$$。
2. $$\mathbf{v}_2 \cdot \mathbf{u}_1 = 6 = \|\mathbf{u}_1\|^2$$，所以 $$\mathbf{u}_2 = \mathbf{v}_2 - \mathbf{u}_1 = [0, 2, 1, 1]^T$$，$$\|\mathbf{u}_2\| = \sqrt{6}$$，$$\mathbf{e}_2 = \frac{1}{\sqrt{6}}[0, 2, 1, 1]^T$$。
3. $$\mathbf{v}_3 \cdot \mathbf{u}_1 = 12$$、$$\mathbf{v}_3 \cdot \mathbf{u}_2 = 8$$：

$$ \mathbf{u}_3 = \mathbf{v}_3 - 2\mathbf{u}_1 - \frac{4}{3}\mathbf{u}_2 = \left[1, \frac{1}{3}, -\frac{1}{3}, -\frac{1}{3}\right]^T = \frac{1}{3}[3, 1, -1, -1]^T $$

$$\|\mathbf{u}_3\| = \frac{2\sqrt{3}}{3}$$，故 $$\mathbf{e}_3 = \frac{\sqrt{3}}{6}[3, 1, -1, -1]^T$$。

**(b)** $$Q = [\mathbf{e}_1 \;\mathbf{e}_2 \;\mathbf{e}_3]$$，$$R$$ 為上三角：

$$ Q = \frac{1}{\sqrt{6}} \begin{bmatrix} 1 & 0 & 3/\sqrt{2} \\ -1 & 2 & 1/\sqrt{2} \\ 0 & 1 & -1/\sqrt{2} \\ 2 & 1 & -1/\sqrt{2} \end{bmatrix}, \quad R = \begin{bmatrix} \sqrt{6} & \sqrt{6} & 2\sqrt{6} \\ 0 & \sqrt{6} & 4\sqrt{6}/3 \\ 0 & 0 & 2\sqrt{3}/3 \end{bmatrix} $$

（對角線就是各 $$\|\mathbf{u}_i\|$$，右邊各項是 $$\mathbf{e}_i \cdot \mathbf{v}_j$$。）

**(c)** 算 $$\mathbf{y} = Q^T\mathbf{b}$$：$$y_1 = 5\sqrt{6}$$、$$y_2 = 2\sqrt{6}$$、$$y_3 = 2\sqrt{3}$$。回代：

$$ \frac{2\sqrt{3}}{3}x_3 = 2\sqrt{3} \implies x_3 = 3, \qquad \sqrt{6}x_2 + \frac{4\sqrt{6}}{3}(3) = 2\sqrt{6} \implies x_2 = -2 $$

$$ \sqrt{6}x_1 + \sqrt{6}(-2) + 2\sqrt{6}(3) = 5\sqrt{6} \implies x_1 = 1 $$

解為 $$\mathbf{x} = [1, -2, 3]^T$$。驗算：$$A\mathbf{x} = \mathbf{v}_1 - 2\mathbf{v}_2 + 3\mathbf{v}_3 = [8, 0, 1, 11]^T = \mathbf{b}$$，正確。

## 第三題：正交基底的三個恆等式

**題目**：設 $$\{w_1, \dots, w_n\}$$ 是 $$\mathbb{R}^n$$ 的正交正規基底，證明 (a) $$(u+v)$$ 的基底展開等於各分量展開相加；(b) $$u \cdot v = \sum_{i=1}^n (u \cdot w_i)(v \cdot w_i)$$；(c) $$\|u\|^2 = \sum_{i=1}^n (u \cdot w_i)^2$$。

**為什麼這樣想**：三小題共用同一個出發點——座標公式。對正交正規基底，把 $$z = \sum c_i w_i$$ 與 $$w_j$$ 做內積，因為 $$w_i \cdot w_j = \delta_{ij}$$，雙重和裡其他項全部歸零，只剩 $$c_j$$。有了這條，(a) 是線性、(b) 是 cross term 消失、(c) 在 (b) 取 $$v = u$$，三題變成一題。

**(a)** 任意 $$z$$ 可寫成 $$z = \sum (z \cdot w_i) w_i$$。套到 $$u + v$$，用內積的線性性：

$$ u+v = \sum_{i=1}^n ((u+v) \cdot w_i) w_i = \sum_{i=1}^n (u \cdot w_i + v \cdot w_i) w_i $$

**(b)** 把兩個展開式相乘，$$w_i \cdot w_j = \delta_{ij}$$ 殺掉所有 $$i \neq j$$ 的項：

$$ u \cdot v = \sum_{i=1}^n \sum_{j=1}^n (u \cdot w_i)(v \cdot w_j)(w_i \cdot w_j) = \sum_{i=1}^n (u \cdot w_i)(v \cdot w_i) $$

**(c)** 令 (b) 中 $$v = u$$：

$$ \|u\|^2 = u \cdot u = \sum_{i=1}^n (u \cdot w_i)^2 $$

這就是 Parseval 恆等式。

## 第四題：投影矩陣與點到子空間的距離

**題目**：設 $$W$$ 為聯立方程 $$x_1 + 2x_2 - 3x_3 = 0$$、$$x_1 + x_2 - 3x_3 = 0$$ 的解集合，$$\mathbf{u} = [1, 3, -2]^T$$。求 $$W$$ 上的投影矩陣、$$\mathbf{u}$$ 在 $$W$$ 上的投影與分解、以及 $$\mathbf{u}$$ 到 $$W$$ 的距離。

**為什麼這樣想**：先看清 $$W$$ 的形狀：兩個通過原點的平面方程聯立，解集合是通過原點的直線，投影到一維子空間有現成公式 $$P_W = \frac{\mathbf{a}\mathbf{a}^T}{\|\mathbf{a}\|^2}$$，不必從頭推導。分解 $$\mathbf{u} = \mathbf{w} + \mathbf{z}$$ 之後，殘差 $$\mathbf{z} = \mathbf{u} - \mathbf{w}$$ 依正交投影的定義自動垂直於 $$W$$，距離就是 $$\|\mathbf{z}\|$$。驗算可用畢氏定理：$$\|\mathbf{z}\|^2 = \|\mathbf{u}\|^2 - \|\mathbf{w}\|^2$$。

**(a)** 兩式相減得 $$x_2 = 0$$，代回得 $$x_1 = 3x_3$$。取 $$\mathbf{a} = [3, 0, 1]^T$$，$$\|\mathbf{a}\|^2 = 10$$：

$$ P_W = \frac{1}{10}\begin{bmatrix} 3 \\ 0 \\ 1 \end{bmatrix} \begin{bmatrix} 3 & 0 & 1 \end{bmatrix} = \begin{bmatrix} 0.9 & 0 & 0.3 \\ 0 & 0 & 0 \\ 0.3 & 0 & 0.1 \end{bmatrix} $$

**(b)** $$\mathbf{w} = P_W\mathbf{u} = [0.3, 0, 0.1]^T$$，$$\mathbf{z} = \mathbf{u} - \mathbf{w} = [0.7, 3, -2.1]^T$$。

**(c)** $$\|\mathbf{z}\| = \sqrt{0.49 + 9 + 4.41} = \sqrt{13.9} \approx 3.73$$。驗算：$$\|\mathbf{u}\|^2 - \|\mathbf{w}\|^2 = 14 - 0.1 = 13.9$$，一致。

## 第五題：投影算子的正交性 $$P_W P_{W^\perp} = P_{W^\perp} P_W = O$$

**題目**：證明 $$P_W P_{W^\perp} = P_{W^\perp} P_W = O$$，且 $$P_{W^\perp} = I - P_W$$。

**為什麼這樣想**：矩陣等式最乾淨的證法是「作用在任意向量上看結果」。正交分解 $$\mathbf{x} = \mathbf{w} + \mathbf{z}$$ 讓兩個投影各管一半，串接時對方那一半已經落在自己的 kernel 裡，乘起來自然是零矩陣。$$I = P_W + P_{W^\perp}$$ 則直接從分解式讀出來。

**證明**：對任意 $$\mathbf{x}$$，寫 $$\mathbf{x} = \mathbf{w} + \mathbf{z}$$，其中 $$\mathbf{w} = P_W\mathbf{x} \in W$$、$$\mathbf{z} = P_{W^\perp}\mathbf{x} \in W^\perp$$。

$$P_W P_{W^\perp}\mathbf{x} = P_W\mathbf{z} = \mathbf{0}$$，因為 $$\mathbf{z} \in W^\perp$$ 垂直於整個 $$W$$，投影到 $$W$$ 上是零。同理 $$P_{W^\perp} P_W\mathbf{x} = P_{W^\perp}\mathbf{w} = \mathbf{0}$$（$$\mathbf{w} \in W = (W^\perp)^\perp$$）。由 $$\mathbf{x}$$ 任意，得 $$P_W P_{W^\perp} = P_{W^\perp} P_W = O$$。又 $$\mathbf{x} = P_W\mathbf{x} + P_{W^\perp}\mathbf{x} = (P_W + P_{W^\perp})\mathbf{x}$$，故 $$P_W + P_{W^\perp} = I$$，即 $$P_{W^\perp} = I - P_W$$。

## 第六題：正規方程與最小平方解

**題目**：$$A = \begin{bmatrix} 1 & 2 \\ 1 & -1 \\ 2 & 1 \end{bmatrix}$$、$$\mathbf{b} = \begin{bmatrix} 1 \\ 3 \\ 1 \end{bmatrix}$$。(a) 解正規方程 $$A^T A\mathbf{z} = A^T\mathbf{b}$$；(b) 證明此解也是最小範數的最小平方解。

**為什麼這樣想**：正規方程不是憑空發明——它就是「殘差 $$\mathbf{b} - A\mathbf{z}$$ 垂直於 $$A$$ 的 column space」這句幾何話的代數形式。這跟第一題一體兩面：正因為 $$A^T A$$ 不丟失 null space 資訊，正規方程才可靠。(b) 不必再做任何操作：$$A$$ 的行線性獨立時 $$A^T A$$ 可逆，最小平方解唯一——唯一的解當然同時是最小範數的解。

**(a)**

$$ A^T A = \begin{bmatrix} 6 & 3 \\ 3 & 6 \end{bmatrix}, \qquad A^T\mathbf{b} = \begin{bmatrix} 6 \\ 0 \end{bmatrix} $$

由 $$2z_1 + z_2 = 2$$ 與 $$z_1 = -2z_2$$ 得 $$z_2 = -\frac{2}{3}$$、$$z_1 = \frac{4}{3}$$，即 $$\mathbf{z} = \left[\frac{4}{3}, -\frac{2}{3}\right]^T$$。

**(b)** $$A$$ 的兩行不成比例，行線性獨立，故最小平方解唯一，(a) 的 $$\mathbf{z} = \left[\frac{4}{3}, -\frac{2}{3}\right]^T$$ 即為該唯一解，同時也是最小範數解。

## 第七題：把一個單位向量送到另一個的正交算子

**題目**：求 $$\mathbb{R}^3$$ 上的正交算子 $$T$$ 使 $$T(\mathbf{v}) = \mathbf{w}$$，其中 $$\mathbf{v} = \frac{1}{\sqrt{10}}[3, 1, 0]^T$$、$$\mathbf{w} = \frac{1}{\sqrt{5}}[0, -2, 1]^T$$。

**為什麼這樣想**：把 $$\mathbf{v}$$ 送到 $$\mathbf{w}$$ 的正交算子有一整族（旋轉、反射都算），構造一個就夠，挑最省事的候選——反射。以 $$\mathbf{u} = \mathbf{v} - \mathbf{w}$$ 為法向量做 Householder 反射 $$T = I - 2\frac{\mathbf{u}\mathbf{u}^T}{\|\mathbf{u}\|^2}$$。它真的會把 $$\mathbf{v}$$ 送到 $$\mathbf{w}$$，原因是係數恰好等於 1：$$\|\mathbf{v}\| = \|\mathbf{w}\| = 1$$ 時，$$\|\mathbf{v}-\mathbf{w}\|^2 = 2 - 2\mathbf{v}\cdot\mathbf{w}$$ 是 $$(\mathbf{v}-\mathbf{w})\cdot\mathbf{v} = 1 - \mathbf{v}\cdot\mathbf{w}$$ 的兩倍，代進公式後投影項剛好整個吃掉 $$\mathbf{v} - \mathbf{w}$$。我原本懷疑反射是否只對特別選的向量對成立，其實算一次係數就知道對所有單位向量對都成立。

**證明**：先確認 $$\|\mathbf{v}\| = \|\mathbf{w}\| = 1$$。令 $$\mathbf{u} = \mathbf{v} - \mathbf{w}$$，定義

$$ T = I - 2\frac{(\mathbf{v}-\mathbf{w})(\mathbf{v}-\mathbf{w})^T}{\|\mathbf{v}-\mathbf{w}\|^2} $$

這是對法向量 $$\mathbf{u}$$ 之超平面的反射，形式為 $$I - 2\hat{u}\hat{u}^T$$，是正交算子。作用在 $$\mathbf{v}$$ 上：

$$ T(\mathbf{v}) = \mathbf{v} - 2\frac{(\mathbf{v}-\mathbf{w})\cdot\mathbf{v}}{\|\mathbf{v}-\mathbf{w}\|^2}(\mathbf{v}-\mathbf{w}) $$

係數 $$2\frac{1 - \mathbf{v}\cdot\mathbf{w}}{2(1 - \mathbf{v}\cdot\mathbf{w})} = 1$$，故 $$T(\mathbf{v}) = \mathbf{v} - (\mathbf{v}-\mathbf{w}) = \mathbf{w}$$。具體代入 $$\mathbf{v}\cdot\mathbf{w} = -\frac{\sqrt{2}}{5}$$ 可得 $$\|\mathbf{v}-\mathbf{w}\|^2 = 2 + \frac{2\sqrt{2}}{5}$$，矩陣元素展開只是代數苦工，算子已由此構造確定。

## 第八題：對稱矩陣的譜分解

**題目**：求對稱矩陣 $$A = \begin{bmatrix} 0 & 2 & 2 \\ 2 & 0 & 2 \\ 2 & 2 & 0 \end{bmatrix}$$ 的譜分解。

**為什麼這樣想**：譜定理保證對稱矩陣的特徵值全為實數、不同 eigenspace 互相正交，流程是死的：求特徵值 → 各 eigenspace 挑基底 → 重根的空間內部自己正交化 → 標準化後寫成 $$A = \sum \lambda_i \mathbf{u}_i\mathbf{u}_i^T$$。每個 $$\mathbf{u}_i\mathbf{u}_i^T$$ 就是投影矩陣，跟第五題的 $$P_W$$ 同一種東西，只是投影到特徵方向上。

**解**：特徵多項式

$$ \det(A - \lambda I) = -\lambda^3 + 12\lambda + 16 = -(\lambda - 4)(\lambda + 2)^2 $$

特徵值為 $$4$$ 與 $$-2$$（重根）。

$$\lambda = 4$$：解 $$(A - 4I)\mathbf{x} = \mathbf{0}$$ 得 $$\mathbf{v}_1 = [1, 1, 1]^T$$，標準化 $$\mathbf{u}_1 = \frac{1}{\sqrt{3}}[1, 1, 1]^T$$。

$$\lambda = -2$$：eigenspace 是平面 $$x + y + z = 0$$。取 $$\mathbf{v}_2 = [-1, 1, 0]^T$$ 與 $$\mathbf{v}_3 = [-1, -1, 2]^T$$（對此平面內的向量已互相正交），標準化得 $$\mathbf{u}_2 = \frac{1}{\sqrt{2}}[-1, 1, 0]^T$$、$$\mathbf{u}_3 = \frac{1}{\sqrt{6}}[-1, -1, 2]^T$$。

譜分解：

$$ A = 4\,\mathbf{u}_1\mathbf{u}_1^T - 2\,\mathbf{u}_2\mathbf{u}_2^T - 2\,\mathbf{u}_3\mathbf{u}_3^T $$

三個投影矩陣分別為：

$$ P_1 = \frac{1}{3}\begin{bmatrix} 1 & 1 & 1 \\ 1 & 1 & 1 \\ 1 & 1 & 1 \end{bmatrix}, \quad P_2 = \frac{1}{2}\begin{bmatrix} 1 & -1 & 0 \\ -1 & 1 & 0 \\ 0 & 0 & 0 \end{bmatrix}, \quad P_3 = \frac{1}{6}\begin{bmatrix} 1 & 1 & -2 \\ 1 & 1 & -2 \\ -2 & -2 & 4 \end{bmatrix} $$

同一特徵值的投影可合併成 $$P_{-2} = P_2 + P_3$$，即往平面 $$x+y+z=0$$ 的正交投影。

## 寫在最後

八題走完回頭看，反覆出現的招式只有幾個：雙包含證集合相等、左乘 $$\mathbf{x}^T$$ 製造範數平方（第一題）、正交正規基底下座標直接由內積讀出（第三題、QR）、殘差垂直於 column space（第四、五、六題的幾何核心）、投影矩陣的加法性（第五、八題）。計算題看起來花俏，骨頭都是這幾根。
