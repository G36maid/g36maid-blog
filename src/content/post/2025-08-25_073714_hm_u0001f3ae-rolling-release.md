---
title: "\U0001F3AE 遊戲概念：《Rolling Release》"
description: "靈感來自 Arch Linux 的「滾動更新」（Rolling Release）發行哲學。"
pubDate: 2025-08-25 07:37:14 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1756078634
---

# 🎮 遊戲概念發想：《Rolling Release》

**主題來源**
靈感來自 Arch Linux 的「滾動更新」（Rolling Release）發行哲學。

* 「滾動」 → 遊戲角色的 **翻滾形態**（速度、攻擊）
* 「發行」 → **套件安裝系統（pacman）**，玩家在 run 中動態選擇技能

**遊戲目標**
玩家操縱 Arch chan，在一個 **循環軌道關卡**（rolling track）中不斷翻滾、射擊、安裝新模組。

* 生存越久，系統越「更新」，危險性也越高。
* 如果系統「滾掛」（崩潰、kernel panic、進入 grub），遊戲結束。

---
## 想法來源

sonic
![intro-import](https://hackmd.io/_uploads/SJr1eqFFee.jpg)
metroid
![82hdd11gsa951](https://hackmd.io/_uploads/ByKiZqttex.png)

filpside form nitrome（雙人旋轉賽車）
![maxresdefault](https://hackmd.io/_uploads/S1OcZqFYee.jpg)


## 玩法機制

### 角色形態切換

* **人型態**：普通移動、射擊、跳躍 → 靈活但速度慢。
* **球型態**：快速滾動、衝撞傷害 → 難以控制，但輸出爆炸。
* 靈感來源：Splatoon 潛水 / Sonic 滾動 / Metroid Morph Ball。

### 關卡設計

* **巡迴軌道式平台**：像 Pizza tower 或雙人旋轉賽車(Flipside from nitrome)，2D 橫向但場景環形循環。
* **吸附性平台**：球型態能沿著軌道黏附。像是雙人旋轉賽車跟索尼克的雲霄飛車到轉

* **更新事件**：隨機觸發「pacman -Syu」，刷新敵人/模組/地形。

* 特殊關卡：解迷關卡 or 開放式關卡 or 惡魔城


### 敵人：

像是賽車的騎乘決鬥 or 單純平台跳躍敵人？

### 3. pacman 技能系統

玩家可在 run 中透過「安裝套件」獲得技能。
是 rouge-like, 有 dependency

#### 📂 分類方式（對應檔案系統）

* `/usr` → 使用者技能（射擊模組、衝刺、增益 buff）
* `/dev` → 裝置技能（跳躍模組、翻滾加速器、磁力吸附）
* `/etc` → 系統設定（自動回復、配置快捷鍵、冷卻減免）
* `/opt` → 插件技能（UI 變更、隱藏 buff、特殊彩蛋）
* `/proc` → 敵人監控（弱點顯示、下一步預測、debug log 攻擊）
* `/var` → 資源管理（隨機彈藥掉落、RAM 擴充、swap 機制）

可能也可以對應其他像是軟體分類？

#### ⚠️ 套件風險性（來源分類）

* `core` → 核心穩定，基礎必備（
* `base` → 安全泛用（初期技能池）
* `extra` → 功能增強，中等風險（副作用輕微）
* `multilib` → 額外有趣效果（steam 必須套件）
* `AUR` → 社群提供，高風險高回報（強力但會 crash/bug）
* `testing` → 前沿未驗證，隨機性極大（可能變超強，也可能直接掛掉）

#### 🏷️ 特殊套件 tag（技能屬性）

* `-git` → 最新 commit，**隨機 buff/debuff** 每次更新都會變動數值
* `-nightly` → 爆發力強，但有冷卻時間 / 崩潰機率？
* `-bin` → 即刻生效（立刻獲得技能，但無法升級或修改？）

---

##  敵人與系統錯誤

* **Kernel panic**：使玩家技能失效一段時間。
* **Segfault**：接觸就爆（高爆發敵人）。
* **core dumped 怪**：
* **OOM**：
* **Grub Guardian**：
* **hacked by enemy**:
---

## Meta 系統：更新即危險

* 每完成一個循環關卡(一圈) → 系統會自動「pacman -Syu」
* 新敵人、新地圖障礙會被「安裝」，遊戲難度逐步上升
* 玩家可以選擇「hold package」（暫停更新），但代價是敵人強化？

---

##  世界觀 / 美術氛圍

* ** pixel 終端風格**：HUD = 終端機/ pacman
* **角色**：Linux distro 擬人化（Arch 醬、Manjaro 醬、Gentoo 醬、Ubuntu 醬…）
* **場景**：不同的 desktop enviorment?
* **死亡畫面**：kernel panic log，附上 stacktrace。

加上 meta 要素，手動插入 arch iso 修復？


## 關卡：
不同的筆電：
Framework
thinkpad

不同的機器
enbedded
mini PC
laptop
gaming PC
Homelab
servers
infra

## 模式

normal mode( rouge-like )

Rice mode( 賽車模式 )

Zen mode（用來測試 build 的模式）

muti player:
