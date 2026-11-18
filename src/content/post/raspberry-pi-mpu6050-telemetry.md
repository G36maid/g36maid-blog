---
title: "樹莓派 + MPU-6050 加速規遙測：2022 物件導向期末專題回顧"
description: "2022 年物件導向期末專題回顧：以樹莓派與 MPU-6050 加速規取樣交通工具加速度，經 HTTP POST 送進 node.js + PostgreSQL + TimescaleDB，再以 Grafana 呈現、LINE Notify 通報。文中重貼修正後的取樣程式碼，並以 2026 年的眼光檢討當年的執行緒 race、積分漂移與對已終止服務的依賴。"
pubDate: 2022-12-29 00:03:30 +0800
category: programming
tags: ["raspberry-pi", "mpu6050", "python", "timescaledb", "grafana", "iot"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1672243410
---

2022 年 12 月，物件導向程式設計的期末專題，我們那組四個人決定做一台「會自己回報狀況的交通工具監測器」：用樹莓派接一顆 MPU-6050 加速規，量行進間的加速度，把資料丟回實驗室電腦的資料庫，再用 Grafana 畫成即時圖表，偵測到異常數值時自動發 LINE 通報。當年新聞正好在報交通部的 110 年度道路交通事故統計——全年 35 萬 6,779 件事故、2,990 人死亡——學生專題當然改變不了什麼，但至少有個像樣的動機。

整條資料流是：取樣、HTTP POST、時序資料庫、Grafana、LINE Notify，五段各一個角色：

![](/media/2022-12/architecture.png)

## 取樣：樹莓派 + MPU-6050

MPU-6050 是 InvenSense（現併入 TDK）的六軸感測器，三軸加速規加三軸陀螺儀，16-bit ADC，透過 I2C 通訊，位址固定 0x68（AD0 腳拉高則變 0x69）。樹莓派在 raspi-config 打開 I2C、接上 SDA/SCL 兩條線就能讀。Python 端用 m-rtijn 寫的 mpu6050 套件，兩行拿到三軸加速度：

```python
from mpu6050 import mpu6050
sensor = mpu6050(0x68)
data = sensor.get_accel_data(g=True)  # {'x': ..., 'y': ..., 'z': ...}
```

比起 Arduino，樹莓派的好處是能直接跑 Python 和 HTTP client，取樣與傳輸在同一台機器上完成，期末 demo 不用多背一台筆電。

## 傳輸：兩個 thread、一秒一筆

當年的設計是兩條執行緒：一條每 0.1 秒讀一次感測器並累加，另一條每秒把平均值 POST 到實驗室 server。下面是照原稿改寫的版本，IP 換成 localhost，並修掉了全域變數的問題（後面會談）：

```python
import time, math, threading
from mpu6050 import mpu6050
import requests

url = 'http://127.0.0.1:8191/gsensor/log'
sensor = mpu6050(0x68)
dT = 0.1
samples = []                      # 用 list 暫存取樣值
vx = vy = 0.0
lock = threading.Lock()

def cal():                        # 每 0.1 秒取樣一次
    global vx, vy
    a = sensor.get_accel_data(g=True)
    with lock:
        samples.append(a)
        vx += a['x'] * dT
        vy += a['y'] * dT

def req():                        # 每秒 POST 平均值
    global vx, vy
    with lock:
        n = len(samples)
        if n == 0:
            return
        body = {
            'x': sum(s['x'] for s in samples) / n,
            'y': sum(s['y'] for s in samples) / n,
            'z': sum(s['z'] for s in samples) / n,
            'V': math.sqrt(vx * vx + vy * vy),
        }
        samples.clear()
        vx = vy = 0.0
    requests.post(url, json=body)

def loop(fn, sec):
    while True:
        fn()
        time.sleep(sec)

threading.Thread(target=loop, args=(cal, dT), daemon=True).start()
threading.Thread(target=loop, args=(req, 1), daemon=True).start()
```

## 儲存：PostgreSQL + TimescaleDB

資料是典型時間序列，server 端選了 PostgreSQL 加 TimescaleDB extension，用 hypertable 自動按時間分片，之後撈「最近一小時」這類查詢不會越撈越慢。node.js 只負責接 POST 寫入。可惜 server 端程式碼沒留下來，草稿裡只剩 client 這份 Python。

## 呈現：Grafana

Grafana 直接連 PostgreSQL 當 datasource，寫 SQL 撈最近幾分鐘的 x/y/z 與 V 畫成折線，超過門檻的尖峰一眼就能看到。到這裡，遠端監控已經成立：看圖的人不必坐在車上。

## 通報：LINE Notify

最後一段是異常通報。做法很粗糙——server 收到資料時若加速度超過門檻，就呼叫 LINE Notify API 推訊息到群組。選它的理由很單純：台灣人人有 LINE，免費、不必做 app。這個選擇在 2025 年 3 月 31 日之後已不存在，LINE Notify 正式終止服務，官方建議改用 LINE Messaging API 或其他方案。

## 用 2026 年的眼光回頭檢查

原稿的「結果」和「結論」章節是空的，報告大概交出去前大家就忙期末去了。四年後重讀這份 code，能補的不少：

race condition 是最要命的。原稿用 `global x, y, z, count` 在兩條 thread 間傳資料，cal 邊累加、req 邊歸零，count 可能在讀取和歸零之間被改走，平均值偶爾會怪；req 裡讀的 `Vx`、`Vy`、`V` 甚至沒宣告 global，`V` 在 req 的視野裡可能根本還沒被定義，直接 NameError。當年 demo 沒炸，純粹是運氣。

每秒 `Thread(target=req).start()` 起一個新 thread 也是反模式：thread 建立有成本，睡 1 秒、起一個、再睡 1 秒的節奏還會讓取樣與歸零的時序漂移。現在會用一條 worker thread 加 queue，或 `threading.Timer`。

物理上也有問題。`abs()` 累加得到的只是「抖動強度」，方向資訊全被吃掉，和任何方向的受力都對不起來。而 `V = sqrt(Vx² + Vy²)` 這種積分必然漂移：加速規的 bias 不為零，每 0.1 秒把 bias 加進積分，幾分鐘後「速度」就飄到毫無意義的數字。正規做法是扣掉重力分量與 bias 後做互補或卡爾曼濾波，再用 GPS 或輪速校正；學生專題做不到，但報告裡至少該承認，原稿連承認都沒有。

選型方面，2022 年的我們只知道 HTTP 和 PostgreSQL。MQTT 的 QoS 1 在車用斷網情境比裸 POST 靠譜，InfluxDB 開箱即用的 retention policy 也省掉自己管資料表。TimescaleDB 倒不算選錯：留在自己熟的關聯式資料庫裡，SQL 就能查，對一學期的專題很務實。LINE Notify 之死則是另一種教訓——依賴免費第三方通知服務，就得接受它隨時收掉，同樣需求現在會接 ntfy 或自架 webhook。

如果現在重做一次：取樣改成 worker + queue，通報換 Messaging API，然後真的把「結果」寫完——例如在校車上繞校園一圈，看 Grafana 上的煞車尖峰和站牌位置對不對得上。當年那張架構圖畫得挺認真，程式卻停在「能跑」的階段，這篇算是替那份草稿補上遲到四年的結論。

## References

- [MPU-6050 產品頁（TDK InvenSense）](https://invensense.tdk.com/products/motion-tracking/6-axis/mpu-6050/)
- [m-rtijn/mpu6050 Python 套件](https://github.com/m-rtijn/mpu6050)
- [樹莓派 MPU-6050 六軸感測器教學](https://blog.gtwang.org/iot/raspberry-pi-mpu6050-six-axis-gyro-accelerometer-1/)
- [Python threading 官方文件](https://docs.python.org/3/library/threading.html)
- [TimescaleDB](https://www.timescale.com/)
- [Grafana](https://grafana.com/)
- [LINE Notify 結束服務公告](https://notify-bot.line.me/)
- [交通部道路交通事故統計](https://stat.motc.gov.tw/)（110 年度數據為當年引用）

