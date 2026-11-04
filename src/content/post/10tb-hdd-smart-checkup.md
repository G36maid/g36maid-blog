---
title: "10TB 硬碟到手先驗貨：SMART 檢測實錄（smartctl 7.4 × FreeBSD）"
description: "拿到一顆 5,277 小時的二手 Seagate BarraCuda Pro 10TB，怎麼確認它真的健康：smartctl -a 逐段判讀、五個該盯的 SMART 屬性與警惕值、Seagate raw 值的陷阱、smartctl -t long 與 self-test log 考古、7.4 的 FARM log、CMR/SMR 與 refurb 選盤底線，以及 FreeBSD 上跑 smartctl 的幾個坑。"
pubDate: 2025-10-08T12:53:20+08:00
category: hardware
tags: ["smart", "hdd", "freebsd", "smartmontools", "seagate", "nas", "refurb"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1759899200
---

> 本文擴寫自 2025-10-08 的 HackMD 筆記。原稿幾乎是一份完整的 `smartctl -a` 輸出（smartctl 7.4、FreeBSD 13.3-RELEASE-p4 amd64），判讀過程散落在輸出的各個角落；這裡把它整理成一篇「拿到一顆 10TB 硬碟該怎麼驗貨」的實錄。文中 smartctl 輸出皆節錄自原稿。

最近補了一顆 10TB 硬碟——Seagate BarraCuda Pro（ST10000DM0004）。這種等級的盤子，市面上多半是整批退役的資料中心盤流回來的 refurb 貨，也有人是買新品放在 NAS 裡當倉儲。不管是二手還是新購，開箱當下其實都一樣焦慮：規格表寫得再漂亮，這顆盤子到底健不健康？跑幾天就開始重定位、直接讓 ZFS pool 降級，那才是災難的開始。

硬碟的健康狀態不會印在外盒上，但它會自己講——透過 SMART。所以這篇就是我的驗貨流程實錄：跑什麼指令、看哪幾個屬性、什麼數值該警惕、什麼數值看起來嚇人其實沒事。

## 1. 開箱第一件事：`smartctl -a`

我的機器是 FreeBSD 13.3，smartmontools 是自己 build 的 7.4 版。SATA 盤在 FreeBSD 上掛在 `/dev/ada*`（AHCI 匯流排下），所以：

```bash
# FreeBSD：SATA 盤走 /dev/ada*；需要 root，因為 ATA passthrough 是特權操作
smartctl -a /dev/ada0
```

原稿裡的資訊段長這樣（節錄）：

```
=== START OF INFORMATION SECTION ===
Model Family:     Seagate BarraCuda 3.5 (CMR)
Device Model:     ST10000DM0004-1ZC101
Firmware Version: DN01
User Capacity:    10,000,831,348,736 bytes [10.0 TB]
Sector Sizes:     512 bytes logical, 4096 bytes physical
Rotation Rate:    7200 rpm
SMART overall-health self-assessment test result: PASSED
```

幾個值得停下來看的欄位：

- **Model Family 那行的 "(CMR)"** 是 smartmontools 從 drivedb 幫你標好的：這顆是傳統磁記錄，不是 SMR。選盤時這個比什麼都重要（後面第 7 節會講）。
- **Power_On_Hours**（在屬性表裡）：這顆只有 5,277 小時、Power_Cycle_Count 18 次。BarraCuda Pro 10TB 是 2016 年出的產品，一顆可能快九歲的盤平均每年只開機六百小時——大概率是前手的低用量桌上機，不是操到爆的資料中心盤。這是驗二手盤最基本的考古：時數高不一定壞，但時數低又開機次數少，前手用途通常溫和。
- **`PASSED` 只代表韌體的自我評估**。韌體說自己沒事，不等於真的沒事——真正要自己看屬性。

## 2. 屬性表：五個我會先盯著看的 ID

`smartctl -a` 會噴一大坨，但判讀其實有重點順位。這顆盤的關鍵列（節錄）：

```
ID# ATTRIBUTE_NAME          FLAGS    VALUE WORST THRESH FAIL RAW_VALUE
  5 Reallocated_Sector_Ct   PO--CK   100   100   010    -    0
187 Reported_Uncorrect      -O--CK   100   100   000    -    0
197 Current_Pending_Sector  -O--C-   100   100   000    -    0
198 Offline_Uncorrectable   ----C-   100   100   000    -    0
199 UDMA_CRC_Error_Count    -OSRCK   200   200   000    -    0
```

- **Reallocated_Sector_Ct = 0**：重定位扇區數。硬碟發現某個扇區讀寫不穩，會把它搬去備用區。這個數字只會增加、不會減少。**任何非零都要警惕**：1 還能觀察，開始爬升（尤其短時間內 +5、+10）就直接備份換盤。新盤應該是 0。
- **Current_Pending_Sector = 0**：等待重定位的可疑扇區。可以想成「重定位的前奏」，同樣是非零就要盯。
- **Offline_Uncorrectable、Reported_Uncorrect = 0**：離線測試中讀不回來的扇區、以及回報給主機的讀取失敗。這四個 ID 全 0，代表盤面目前乾淨。
- **UDMA_CRC_Error_Count = 0**：這個不是盤子壞——CRC 錯誤是傳輸層的鍋，通常是 SATA 線材沒插好、彎折或接頭氧化。非零先換線重插，別急著怪硬碟。

其他順手會看的：

- **191 G-Sense_Error_Rate = 942**：撞擊感應紀錄。這顆盤 942 次大概率是運輸途中被快遞摔出來的，不是運轉中撞的。驗二手盤時這個欄位是「物流品質指標」。
- **193 Load_Cycle_Count = 27165**：這顆盤額定 30 萬次（Seagate 規格書），用了不到十分之一，無聊但健康。
- **190/194 溫度**：目前 38°C，終身最高 43°C。3.5 吋盤長期 45°C 以上才需要認真處理散熱。

## 3. Seagate 的 raw 值騙人：先看 normalized，再看 raw

```
  1 Raw_Read_Error_Rate     POSR--   083   064   044    -    186547891
  7 Seek_Error_Rate         POSR--   091   060   045    -    1293346887
195 Hardware_ECC_Recovered  -O-RC-   006   004   000    -    186547891
```

第一次看 Seagate 輸出的人都會被嚇到：十幾億的 raw error？盤子要壞了？

**沒有。** Seagate 的 raw value 在這幾個屬性上塞的是編碼後的內部計數（讀取次數、ECC 修正次數混在一起），不是真的「錯誤」。判讀原則：**先看 normalized VALUE 有沒有跌到接近 THRESH**。這顆盤 Raw_Read_Error_Rate 的 VALUE 是 83、THRESH 44；Seek_Error_Rate 是 91 對 45，都還很遠。`Hardware_ECC_Recovered` 的 raw 跟 `Raw_Read_Error_Rate` 一模一樣，正說明了這些是「被 ECC 修掉的讀取」，屬於正常運作。

反過來說，同樣的 raw 值如果出現在 WD 或 HGST 盤上（它們的 raw 是誠實的），那才是真的要緊張。**同一家廠牌的屬性語意才可比，跨廠比 raw 值是沒有意義的**——這也是 smartmontools 要維護 drivedb 的原因。

## 4. 屬性過了還不夠：跑長測，順便考古 self-test log

快取的屬性只是「到目前為止」，盤面深處有沒有壞區要靠 self-test 掃出來：

```bash
# short test 約 1 分鐘；extended（long）這顆盤要 854 分鐘，約 14 小時
smartctl -t long /dev/ada0
# 不想等可以放著，之後看結果；跑的過程盤會變慢，別在服務尖峰時段跑
smartctl -l selftest /dev/ada0
```

這顆盤的 self-test log 很有意思（節錄）：

```
Num  Test_Description    Status                  Remaining  LifeTime(hours)  LBA_of_first_error
# 1  Short offline       Completed without error       00%      5277         -
# 3  Extended offline    Completed without error       00%      5248         -
# 4  Extended offline    Aborted by host               90%      5233         -
# 5  Extended offline    Interrupted (host reset)      40%      5233         -
# 8  Extended offline    Completed without error       00%        23         -
#10  Short offline       Completed without error       00%         0         -
```

這就是驗二手盤的樂趣所在——log 會說故事：第 10 筆在 0 小時、第 8 筆在 23 小時，那是**出廠前的測試**；第 5、4 筆兩次被打斷、第 3 筆在 5,248 小時完整跑完，那是** refurb 賣家收到貨之後先跑了一輪完整 long test** 才上架；第 1 筆 5,277 小時是我自己收貨後跑的。三個時間點都有完整通過的 extended test，這顆盤的履歷算乾淨。

判讀重點：`Completed without error` 是及格線；`Completed with read errors` 或 log 裡出現 LBA 錯誤位址就直接退貨；反覆 `Aborted` 不一定是壞（可能是前手不耐煩按了 Ctrl-C），但配合重複的 long test 沒有一次完整通過，就是紅燈。

## 5. smartmontools 7.4 的禮物：FARM log

這次特意自己 build 7.4，是因為它開始支援 Seagate 的 FARM（Field Access Reliability Metrics）log——輸出結尾也會提示：

```
Seagate FARM log (GP Log 0xa6) supported [try: -l farm]
```

```bash
smartctl -l farm /dev/ada0
```

FARM 是 Seagate 韌體內部的細節統計（磁頭飛行時數、各面的讀寫錯誤、重定位歷史等），比標準 SMART 更接近「原廠驗收單」。買二手 Seagate 盤的話，FARM 是最值得多看一眼的資料。另外這顆盤的 SCT Error Recovery Control 讀寫都是 7 秒，代表接進 RAID/ZFS 陣列時不會因為預設逾時太久被誤踢——挑盤放陣列時這個設定比 AFR 更實際。

## 6. 選盤筆記：CMR vs SMR、消費級 vs NAS 級

驗貨是事後，事前選盤的三條底線：

- **一定要 CMR**。SMR（疊瓦式）把磁軌重疊擺放來多塞容量，代價是隨機寫入要搬整個 band，寫入效能會突然崩掉，放 RAID/ZFS 更是重建地獄。問題是零售通路幾乎不標示，Backblaze 的[選盤指南](https://www.backblaze.com/blog/hard-drive-buying-guide/)就舉過例子：某款最便宜的 8TB 外接盒拆開是 SMR 盤，頁面上卻看不出來。最穩的確認方式是像我這樣：拿到貨跑 `smartctl -a`，看 drivedb 幫你標的 Model Family，或查原廠規格書的 recording technology。
- **桌上型 vs NAS 級的差別在 workload 額定與保固**。這顆 BarraCuda Pro 10TB 是消費線的頂規：5 年保固、300TB/年 workload 額定、7×24 可用（規格見 [Seagate 產品頁](https://www.seagate.com/em/en/support/internal-hard-drives/desktop-hard-drives/barracuda-pro-3-5/)與[產品手冊](https://www.seagate.com/www-content/product-content/barracuda-fam/barracuda-new/en-us/docs/100804071e.pdf)）。真正 NAS 級（IronWolf/Exos）是 180–550TB/年、有旋轉振動感測。我這種一年寫不到幾 TB 的家用倉儲，300TB/年其實綽綽有餘——我從這顆盤的 Device Statistics 算了總寫入量：約 2TB、總讀取約 17.8TB，離額定差兩個數量級。
- **refurb 市場的真實風險是「你不知道前手怎麼操它」**。我的緩解方式就是這套流程：低 POH + 屬性全 0 + 三輪完整 long test + FARM 沒有黑歷史。至於「哪個型號整體比較不容易壞」，Backblaze 每年公開的[故障率統計](https://www.backblaze.com/blog/backblaze-drive-stats-for-2025/)（2025 年整體 AFR 1.36%）是唯一敢看大樣本的資料源，選盤前值得先翻。

## 7. 踩雷：FreeBSD 上跑 smartctl 的幾個坑

- **一定要 root**。smartctl 要對原始磁碟裝置下 ATA passthrough 指令，這是特權操作（smartmontools 作者在 [issue #205](https://github.com/smartmontools/smartmontools/issues/205) 的解釋：passthrough 可以對裝置下任意指令，kernel 不會把這種權限開給一般帳號）。sudo 就好，不用學某些教學去 setuid。
- **裝置名是 `/dev/ada*`，不是 `/dev/da*`**。SATA 盤在 AHCI 下是 ada；`da` 是 CAM/SCSI 層（USB 轉接、SAS HBA 走 `da` 或 `pass`）。跑出 `error sending CAMIOCOMMAND ioctl: Inappropriate ioctl for device` 大多是裝置名或 device type 給錯，FreeBSD 論壇有[整串案例](https://forums.freebsd.org/threads/error-sending-camiocommand-ioctl-inappropriate-ioctl-for-de.84536/)可對照。
- **jail 裡面跑會撞同樣的 ioctl 錯誤**，因為 passthrough 需要完整 device node 存取。要監控就讓 host 跑，或用 `smartd` 把結果導出來。
- **我這份是 local build**。FreeBSD 的套件庫本來就有 smartmontools，`pkg install smartmontools` 即可；我自己編是為了第一時間拿到 7.4 的 FARM 支援。一般使用不需要這麼做。

## 個人評價

先說缺點，誠實列：

- 這顆盤的 **Load_Cycle_Count 前置紀錄顯示磁頭停泊頻率不低**（27,165 次對應 5,277 小時），代表前手環境有激進的省電設定。對我來說只是觀察值，但長期看磁頭負載循環的消耗，會建議關掉過激的 APM/STANDBY。
- **BarraCuda Pro 是桌上型盤，沒有旋轉振動感測（RV sensor）**。多顆同機箱時，NAS 級盤對機箱共振的容忍度真的比較好；我目前單盤倉儲沒差，要組陣列我會直上 Exos。
- **Seagate 的屬性語意太「有創意」**，raw 值不能直接讀，新人很容易被十億級的 error rate 嚇到誤判。這點 WD/HGST 透明得多。
- Device Statistics 裡有些 Seagate 欄位的單位很謎（spindle power-on hours 那格的數字明顯對不上 SMART 屬性 9），看看就好，別拿去考證。

但優點也是真的：CMR、氦氣、7200 轉、256MB 快取、5 年保固、300TB/年 workload，5,277 小時的二手盤價格只有新盤零頭。驗完這一輪——屬性全 0、三輪完整 long test 通過、溫度紀錄溫和——我有信心把它放進 pool 當倉儲盤。硬碟終究會壞，SMART 不能替你免掉備份，但至少能讓你**在它壞之前先知道**，而不是從 dmesg 的錯誤洪水裡事後考古。

## 延伸閱讀

- [smartmontools Release 7.4](https://github.com/smartmontools/smartmontools/releases/tag/RELEASE_7_4)（FARM log 支援）
- [smartctl(8) FreeBSD man page](https://man.freebsd.org/cgi/man.cgi?query=smartctl&sektion=8)（裝置路徑與 `-d` 型別）
- [Backblaze Drive Stats for 2025](https://www.backblaze.com/blog/backblaze-drive-stats-for-2025/)／[原始資料下載頁](https://www.backblaze.com/cloud-storage/resources/hard-drive-test-data)
- [Backblaze Hard Drive Buying Tips](https://www.backblaze.com/blog/hard-drive-buying-guide/)（CMR/SMR 選購陷阱）
- [Seagate BarraCuda Pro 10TB 產品手冊](https://www.seagate.com/www-content/product-content/barracuda-fam/barracuda-new/en-us/docs/100804071e.pdf)（workload、額定與屬性定義）

站內相關：[Zed 的 FreeBSD port 記](/blog/zed-freebsd-port/)——同一台 FreeBSD 機器上折騰的另一次紀錄。
