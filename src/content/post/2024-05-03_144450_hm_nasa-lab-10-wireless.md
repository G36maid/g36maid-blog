---
title: "NASA Lab 10: Wireless"
description: "g36maid"
pubDate: 2024-05-03 14:44:50 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1714718690
---

- g36maid
- 鍾詠傑
 
## ref

**Ref:** [Wireless LAB](https://docs.google.com/presentation/d/1U6Ig4Oqgw1llAwnJMaGWxHvsajcHfcH-jbcnrQIv6LE/edit)

- 因為本人的電腦沒有無線網卡，所以本次lab實驗是跟41047033S 洪軾凱 一起完成的，感謝他的幫忙
 
<div style="page-break-after:always;"></div>

## 1. 尋找目標 AP
在德田館2樓尋找名為 "nasa-" 開頭的 SSID，並找出其名稱和 BSSID。帳號密碼同 csie & csie-5G。已知其中一個 AP 藏在下一頁地圖中。

- **解法:**
    1. 搜尋到 SSID "nasa-lab-5G" 和 "nasa-lab-2.4G"。
    2. 使用5GHz測量強度，因其衰減程度較明顯。
    3. R204距離最近的位置，測試得到最高的 Tx Rate，所以 R204 應為目標 AP。

至於5G WiFi的衰減問題，主要原因是其波長較短。5G WiFi使用的頻段在高頻率範圍內，波長較短，這使得它在穿透物體時會受到較大的阻礙。當WiFi信號穿過牆壁或其他障礙物時，5G WiFi相較於2.4G WiFi更容易被吸收，導致信號衰減更加嚴重

<div style="page-break-after:always;"></div>

### 截圖

![IMG_1367](https://hackmd.io/_uploads/HJ2WvOMMR.jpg)

<div style="page-break-after:always;"></div>

## 2. 測量數據
分別在以下地點測量數據：
1. 離 AP 最遠點（未隔牆）
2. 盡量離至少5公尺，盡量在連的到的情況越遠越好
3. 離 AP 最近點（204）
4. 和 AP 隔著牆壁（204外面）

**數據及單位：**
- Signal Strength (信號強度): RSSI (dBm)
- SNR (MacOS / Linux) / Quality (Windows) (信噪比): dB
- Transmission rate (傳輸速率): Tx Rate (Mbps)

| 測試地點      | RSSI (dBm) | SNR (dB) | Tx Rate (Mbps) |
|---------------|------------|----------|----------------|
| 5GHz 最近點   | -25        | 66       | 1053           |
| 5GHz 最遠點   | -56        | 35       | 1170           |
| 5GHz 隔牆     | -36        | 52       | 975            |
| 2.4GHz 最近點| -30        | 61       | 144            |
| 2.4GHz 最遠點| -44        | 47       | 144            |
| 2.4GHz 隔牆  | -25        | 65       | 130            |

<div style="page-break-after:always;"></div>

## 截圖
![IMG_1368](https://hackmd.io/_uploads/BJAMPdzGC.jpg)
![IMG_1369](https://hackmd.io/_uploads/rJNQvuffC.jpg)

<div style="page-break-after:always;"></div>


## 3. 分析數據

- **距離差異：** 根據上課內容，當距離變長時信號強度會降低，符合預期。
- **隔牆差異：** 5G受影響較大，因其波長較短且穿透力較弱；而2.4G信號穿透能力較強。

<div style="page-break-after:always;"></div>
