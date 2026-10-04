---
title: "應用電子學期中考重點筆記 (Applied Electronics Midterm Cheat-Sheet)"
description: "範圍：Chapters 2 - 6"
pubDate: 2026-04-13 00:29:44 +0800
tags: ["模型", "midterm", "final"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1776011384
category: ai
---

**範圍：Chapters 2 - 6**

[TOC]

---

## 2. 半導體物理基礎 (Semiconductor Physics)
*   **本徵半導體 (Intrinsic)**: 純矽，載子來自熱激發。
*   **雜質半導體 (Extrinsic)**: 摻雜後的半導體。
    *   **N型 (N-type)**: 摻雜五價元素 (Pentavalent)，多數載子為 **電子 (Electrons)**。
    *   **P型 (P-type)**: 摻雜三價元素 (Trivalent)，多數載子為 **電洞 (Holes)**。
*   **PN 接面 (PN Junction)**: 
    *   **空乏區 (Depletion Region)**: 接面處無載子的區域。
    *   **障壁電位 (Barrier Potential)**: 矽 (Si) $\approx 0.7V$。
    *   **順偏 (Forward Bias)**: P接正、N接負 $\rightarrow$ 空乏區縮小 $\rightarrow$ 導通。
    *   **逆偏 (Reverse Bias)**: P接負、N接正 $\rightarrow$ 空乏區擴大 $\rightarrow$ 截止。

---

## 3. 二極體 (Diodes)
### 二極體模型 (Diode Models)
1.  **理想模型 (Ideal Model)**: 順偏為短路 ($0V$)，逆偏為斷路。
2.  **實際模型 (Practical Model)**: 順偏考慮 **$0.7V$ 壓降**，逆偏為斷路。 (**考試最常用**)
3.  **完整模型 (Complete Model)**: 考慮順向電阻 ($r'_d$)、逆向電阻 ($r'_R$) 與接面電容。
    *   **順向偏壓 (Forward)**:
        $$I_F = \frac{V_{BIAS} - 0.7V}{R_{LIMIT} + r'_d}$$
        $$V_D = 0.7V + I_F \cdot r'_d$$
    *   **逆向偏壓 (Reverse)**:
        $$I_R = \frac{V_{BIAS}}{r'_R + R_{LIMIT}}$$
        $$V_D = V_{BIAS} - I_R \cdot R_{LIMIT}$$


![slide-18](https://hackmd.io/_uploads/S1j6_5Kn-x.png)

---

## 4. 二極體應用 (Diode Applications)
### 變壓器與電壓換算 (Transformer & Voltage Conversion)
*   **匝數比 (Turns Ratio)**: $n = \frac{N_s}{N_p}$
*   **RMS 轉峰值**: $V_p = V_{rms} \times \sqrt{2} \approx 1.414 \times V_{rms}$
*   **峰對峰轉峰值**: $V_p = \frac{V_{p-p}}{2}$

### 整流器性能比較表 (Rectifier Performance)
| 特性 (Property) | 半波 (Half-Wave) | 中心抽頭 (Center-Tapped) | 橋式 (Bridge) |
| :--- | :--- | :--- | :--- |
| **輸出峰值 ($V_{p(out)}$)** | $V_{p(sec)} - 0.7V$ | $(V_{p(sec)} / 2) - 0.7V$ | $V_{p(sec)} - 1.4V$ |
| **平均電壓 ($V_{avg}$)** | $V_{p(out)} / \pi \approx 0.318 V_{p(out)}$ | $2V_{p(out)} / \pi \approx 0.636 V_{p(out)}$ | $2V_{p(out)} / \pi \approx 0.636 V_{p(out)}$ |
| **PIV (逆向耐壓)** | $V_{p(sec)}$ | **$V_{p(sec)} - 0.7V$** | $V_{p(out)} + 0.7V$ |
| **輸出頻率 ($f_{out}$)** | $f_{in}$ | $2f_{in}$ | $2f_{in}$ |

*   **關鍵重點**: 
    *   **降壓變壓器 (Step-down)**: 匝數比 $n = 1:4$ 代表二次側電壓 = 一次側 $\div 4$。
    *   **漣波因子 (Ripple Factor $r$)**: 負載電阻 $R_L$ 或電容 $C$ 越大 $\rightarrow$ $r$ 越小 (濾波越好)。
    *   **中心抽頭 PIV 另一種算法**: $PIV = 2V_{p(out)} + 0.7V$

* ![slide-16](https://hackmd.io/_uploads/S1U_35K2Wx.png)
* ![slide-19](https://hackmd.io/_uploads/ry4yoct2-g.png)

### 限幅器 (Clipper / Limiter) - 「切掉部分波形」
*   **判斷口訣**: 二極體與負載 **並聯**。看二極體箭頭指向。
    *   **二極體向下 (⬇️)**: 正限幅 (**Positive Clipper**)，切掉上方 (Top)。
    *   **二極體向上 (⬆️)**: 負限幅 (**Negative Clipper**)，切掉下方 (Bottom)。
*   **限幅位準 (Clipping Level)**: $V_{bias} \pm 0.7V$ (注意電池極性)。
*   **含串聯電阻時的計算** (二極體導通半週):
    $$I = \frac{V_{in} - 0.7V}{R_1 + R_2}$$
    $$V_{out} = 0.7V + I \cdot R_2$$
    
![slide-31](https://hackmd.io/_uploads/Bk6Zjqtnbl.png)
![slide-32](https://hackmd.io/_uploads/S1sGQjY3-g.png)


### 箝位器 (Clamper) - 「平移整體波形」
*   **判斷口訣**: 二極體與負載 **串聯** (含電容)。看二極體箭頭指向。
    *   **二極體向上 (⬆️)**: 正箝位 (**Positive Clamper**)，波形往 **上** 移。
    *   **二極體向下 (⬇️)**: 負箝位 (**Negative Clamper**)，波形往 **下** 移。
*   **電容電壓 ($V_C$)**: $V_C = V_{p(in)} - 0.7V$
*   **輸出峰值計算**:
    *   **正箝位 (上移)**: $V_{out(max)} = V_{p(in)} + V_C$, $V_{out(min)} = -V_{p(in)} + V_C$
    *   **負箝位 (下移)**: $V_{out(max)} = V_{p(in)} - V_C$, $V_{out(min)} = -V_{p(in)} - V_C$
    *   **峰對峰值不變**: $V_{p-p(out)} = V_{p-p(in)}$
* ![slide-34](https://hackmd.io/_uploads/HyuQoct3Wx.png)

---

## 5. 特殊用途二極體 (Special-Purpose Diodes)
*   **齊納二極體 (Zener Diode)**: 
    *   運作於 **逆向崩潰區 (Reverse Breakdown)**。
    *   用途：**電壓調整 (Voltage Regulation)**。
    *   等效模型：恆定電壓 $V_Z$ 串聯小阻抗 $Z_Z$。
*   **變容二極體 (Varactor)**: 利用逆向偏壓改變 **電容 (Capacitance)**。
*   **發光二極體 (LED)**: 運作於 **順向偏壓** ($V_F \approx 1.2V \sim 3.2V$)。
*   **光二極體 (Photodiode)**: 運作於 **逆向偏壓**。光強越強 $\rightarrow$ **逆向電流 ($I_{\lambda}$)** 越大 (成正比)。

---

## 6. BJT 電晶體直流分析 (BJT DC Analysis)

![slide-11](https://hackmd.io/_uploads/BJ7_95YnZg.png)


### 核心公式 (Core Equations)
*   $I_E = I_C + I_B$
*   $I_C = \beta_{DC} I_B$
*   $I_E = (\beta_{DC} + 1) I_B$
*   $\alpha_{DC} = \frac{I_C}{I_E} = \frac{\beta}{\beta + 1}$

### 偏壓電路公式 (Bias Circuit Equations)
*   **基極電流**: $I_B = \frac{V_{BB} - V_{BE}}{R_B}$, 其中 $V_{BE} \approx 0.7V$
*   **集極-射極電壓**: $V_{CE} = V_{CC} - I_C R_C$
*   **集極-基極電壓**: $V_{CB} = V_{CE} - V_{BE}$

### 區域判定法 (The "Duel Rule")
1.  **截止區 (Cutoff)**: 
    *   條件：$V_{BE} < 0.7V$。
    *   狀態：$I_B=0, I_C=0, V_{CE} = V_{CC}$。
2.  **飽和區 (Saturation)**: 
    *   條件：計算出的「理想需求」$I_{C(ideal)} (\beta I_B) >$ 「現實極限」$I_{C(sat)}$。
    *   狀態：$I_C = I_{C(sat)} = \frac{V_{CC} - V_{CE(sat)}}{R_C}$，且 $V_{CE} \approx 0.2V$。
3.  **主動區 (Active)**: 
    *   條件：$V_{BE} \approx 0.7V$ 且未達飽和。
    *   狀態：$I_C = \beta I_B$，$V_{CE} = V_{CC} - I_C R_C$。可用於 **放大器 (Amplifier)**。

### BJT 開關設計公式 (Switch Design)
*   **飽和所需最小基極電流**: $I_{B(min)} = \frac{I_{C(sat)}}{\beta_{DC}}$
*   **最大基極電阻**: $R_{B(max)} = \frac{V_{IN} - V_{BE}}{I_{B(min)}}$

## 🎯 解題流程（The Duel Rule）

① IB = (VBB - 0.7) / RB
② IC(ideal) = β × IB
③ IC(sat) = (VCC - 0.2) / RC
④ 比②和③，大的那個決定命運

1. **算 $I_B$**：$I_B = \frac{V_{BB} - 0.7V}{R_B}$。若 $V_{BB} < 0.7V$ → **截止區**，$I_C = 0$，$V_{CE} = V_{CC}$。
2. **算「理想需求」**：$I_{C(ideal)} = \beta_{DC} \times I_B$
3. **算「現實極限」**：$I_{C(sat)} = \frac{V_{CC} - 0.2V}{R_C}$
4. **決鬥判斷**：$I_{C(ideal)} > I_{C(sat)}$ → **飽和** ($V_{CE} = 0.2V$)；否則 → **主動區** ($V_{CE} = V_{CC} - I_C R_C$)

> 💡 記憶：「理想需求 vs 現實極限」，需求超過極限就飽和。

### 開關設計（反推 $R_B$）
1. $I_{C(sat)} = \frac{V_{CC} - 0.2V}{R_C}$
2. $I_{B(min)} = \frac{I_{C(sat)}}{\beta_{DC}}$
3. $R_{B(max)} = \frac{V_{IN} - 0.7V}{I_{B(min)}}$

![slide-18](https://hackmd.io/_uploads/rkDsi9Khbl.png)



---

## 🚀 應考重點 (Final Reminders)
1.  **單位 (Units)**: $mA \times k\Omega = V$。千萬別算錯小數點！
2.  **有效值 (RMS)**: 看到 $V_{rms}$ 必先乘 $\sqrt{2} \approx 1.414$ 得到 **峰值 (Peak)**。
3.  **畫圖 (Sketching)**: 輸出波形一定要標出 **峰點 (Peak values)** 的電壓值。
4.  **降壓變壓器**: 一次側峰值 $\div$ 匝數比 = 二次側峰值。
5.  **橋式整流**: 兩顆二極體同時導通，壓降 $= 2 \times 0.7V = 1.4V$。
