---
title: "nvidia-open 驅動在 Hyprland 下 suspend 後喚醒的雪花現象筆記"
description: "nvidia-open 驅動在 Hyprland 下 suspend 後喚醒會出現臨時的無危害雪花——追查這個現象跟 NVIDIA 驅動 suspend/resume 機制的關係，含查證與推測的明確區分。"
pubDate: 2026-01-21T01:52:37+08:00
category: linux
tags: [hyprland, nvidia, wayland, suspend, 驅動]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1768931557
---

# nvidia-open 驅動在 Hyprland 下 suspend 後喚醒的雪花現象筆記

> 本文擴寫自 2026-01-21 的 Facebook 貼文（原文只有三句話），擴寫時間 2026-11-09。原文是一則觀察筆記，不是已結案的 debug 報告——下面查到的資料是後續調查，結論部分我會明確標註哪些是查證、哪些是推測。

## 現象

一句話版本，也就是原文全文：

> 發現開源 nvidia-open 驅動在 hyprland 的場景下 suspend 後喚醒會出現臨時的無危害雪花，想看看為何會這樣。

拆開來有三個關鍵詞：「開源 nvidia-open 驅動」、「Hyprland（Wayland compositor）」、「臨時的、無危害的雪花」。

臨時跟無危害是這個 bug 最有趣的地方。它不是黑屏（黑屏要切 VT 或重開機才救得回來）、不是凍結（凍結連滑鼠都不動），而是螢幕喚醒的瞬間先噴出滿螢幕的雜訊——像電視沒訊號的雪花，或像 framebuffer 裡殘留的舊像素被隨機重組——然後 compositor 畫出下一幀就恢復正常，之後系統一切功能無恙。也就是說：壞掉的只有「喚醒後第一個被掃出的畫面」。

## 背景：nvidia-open 跟 proprietary 差在哪

[NVIDIA open-gpu-kernel-modules](https://github.com/NVIDIA/open-gpu-kernel-modules) 從 515 系列開始釋出，涵蓋 Turing 之後的 GPU。它跟舊的 proprietary 驅動不是兩套從頭寫的程式，而是共用同一個大核心：兩者都靠 closed-source 的 GSP（GPU System Processor）firmware 做大部分的 GPU 管理，差別在 kernel 端的 glue code——nvidia-open 用 GPL 授權介面直接接進 Linux kernel（KMS、fbdev 都走標準 DRM 子系統路徑），proprietary 版則走自己的 shim。

這個差別在 suspend/resume 場景會被放大：睡眠路徑要保存 GPU 狀態、還回 framebuffer，這條路同時穿過 kernel 模組、nvidia-modeset、GSP firmware 三層，任何一層的時序差異都會反映到畫面上。

## 為什麼 suspend/resume 對 NVIDIA 驅動特別麻煩

根據 [NVIDIA 官方 power management 文件](https://download.nvidia.com/XFree86/Linux-x86_64/435.17/README/powermanagement.html)，suspend 時驅動要保存的 GPU 狀態包含 VRAM 裡的所有 allocation。問題是 VRAM 內容很大，睡眠時往往沒有足夠系統記憶體可以完整複製，所以驅動預設只保存「必要的」部分，其餘靠使用者空間補償。官方文件自己就承認：這樣「可能導致退出睡眠週期時出現 rendering corruption 或應用程式 crash」——「rendering corruption」四個字幾乎就是雪花現象的官方委婉說法。

配套機制是那組 systemd units：`nvidia-suspend.service`、`nvidia-resume.service`、`nvidia-hibernate.service`，透過 `/proc/driver/nvidia/suspend` 介面在睡眠前後通知驅動，搭配 `NVreg_PreserveVideoMemoryAllocations=1`（把 VRAM 內容完整存到 `/var/tmp` 之類的地方）。[Hyprland wiki 的 Nvidia 頁](https://wiki.hypr.land/Nvidia/) 也把「enable 這三個 service」列為 suspend/wakeup 問題的標準解法。

值得注意的歷史：Hyprland wiki 的舊版（0.42/0.47 時期）曾直接寫「suspend 目前在 nvidia-open-dkms 上壞掉，請用 nvidia-dkms」；後來語氣整個反轉，現在的 wiki 引 NVIDIA 的說法「suspend/wakeup 問題應該在 open 驅動上被解決」，甚至建議遇到問題可以從 proprietary 換到 open 試試。也就是說在我發文的那個時間點附近，官方態度正是「open 驅動是 suspend 問題的解法」——而我的雪花就發生在這個「解法」上。挺好笑的。

## 雪花的技術解釋（標註：這段是推測）

最合理的候選解釋是 **garbage framebuffer**：睡眠期間 framebuffer 的內容不被保證保存（跟上面的 VRAM allocation 同一個問題），喚醒後掃描引擎第一次從這塊記憶體抓資料時，裡面是上個 session 殘留的像素、未清零的記憶體，或兩者的混合。只要 compositor 的下一幀正常提交，畫面就乾淨了——這完全符合「臨時、無危害」的觀察。

幾個佐證：

- 同類現象在 open-gpu-kernel-modules 的 issue 回報裡反覆出現，只是嚴重度光譜的另一端。[#1044](https://github.com/NVIDIA/open-gpu-kernel-modules/issues/1044)（RTX 3060）回報 resume 後「corrupt graphics everywhere」，截圖裡 app icon 和桌布整個花掉，跟我的雪花同一家族但更持久。
- 更嚴重的親戚包括 [#1378](https://github.com/NVIDIA/open-gpu-kernel-modules/issues/1378)（Wayland session 下 resume 後 KWin 永久失去 output）、[#1167](https://github.com/NVIDIA/open-gpu-kernel-modules/issues/1167)（resume 後幾分鐘 display 凍結）、[#1329](https://github.com/NVIDIA/open-gpu-kernel-modules/issues/1329)（Turing suspend deadlock，fbsr framebuffer save 被破壞導致 `memmgrRestorePowerMgmtState()` 失敗）。這些 issue 證明 suspend/resume 的顯示狀態恢復路徑整體上是脆弱的。
- #1329 的失敗機制特別有參考價值：suspend 端把 framebuffer 狀態存壞，resume 端 restore 失敗，顯示管線就回不來。我的情況可以理解成同一條「save → restore」路徑的最輕微失敗模式——restore 略過或失敗了一次，但下一幀就自癒。

會是 Wayland/Hyprland 特有的嗎？部分是。Hyprland 直接掃描輸出的畫面來自 compositor 管理的 buffer；如果喚醒後在 compositor 提交新 frame 之前掃描引擎已經開始抓舊 buffer 或未初始化的記憶體，雜訊就會被看到。X11 或另一個 compositor 上不一定能重現同樣的時序。但「nvidia-open + suspend」這半邊幾乎肯定不是 Hyprland 特有——上面那些 issue 有一半是 GNOME/KDE/Wayland 各家 compositor 都中。

## 可以做的排除法

如果之後想認真追，可以按順序試：

1. 確認 `nvidia-suspend.service` / `nvidia-resume.service` 有 enable、`NVreg_PreserveVideoMemoryAllocations=1` 有設（套件預設值各發行版不同，不能假設）。
2. 抓喚醒瞬間的 `journalctl -b -1 -u nvidia-suspend -u systemd-suspend`，看有沒有 NVRM 錯誤。
3. 對照 proprietary 驅動是否重現（Hyprland wiki 也是這樣建議的除錯步驟）。
4. 如果只有喚醒第一幀有雜訊、之後一切正常，那大概率就是 garbage framebuffer 的呈現問題，等上游修顯示恢復路徑就好，不值得再挖。

## 結論

查證到的事實：nvidia-open 的 suspend/resume 顯示問題在 upstream issue tracker 上大量存在，官方文件承認睡眠週期可能造成 rendering corruption，Hyprland wiki 建議的標準解法是 systemd sleep services 加 PreserveVideoMemoryAllocations。

推測的部分：我的雪花最可能是喚醒後第一幀掃到未被清掉的 framebuffer 內容，屬於這條脆弱恢復路徑上最輕微的失敗模式。原稿只是觀察筆記，我沒有實際做對照實驗驗證這個假設，所以停留在假設。如果你也看到喚醒雪花而且它會自己消失——恭喜，你的 GPU 大概率沒事，只是驅動忘了先擦黑板。
