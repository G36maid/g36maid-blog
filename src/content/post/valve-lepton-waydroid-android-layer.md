---
title: "Valve Lepton：從 SteamDB 空條目到 Steam Frame 的 Android 相容層"
description: "Valve 基於 Waydroid 的 Android 相容層：容器跑完整 Android framework，非 Proton 式 Win32 轉譯，讓 Steam Frame 跑 Quest 系 APK。"
pubDate: 2025-12-03T03:07:14+08:00
category: linux
tags: ["linux", "valve", "steamos", "waydroid", "android"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1764702434
slug: valve-lepton-waydroid-android-layer
---

> 擴寫自 2025-12-03 的 FB 貼文，擴寫於 2026-11。原稿只有一句話：「Lepton is the official name for Valve's Android-on-Linux compatibility layer, based on Waydroid.」以下是把這則新聞轉述放回完整脈絡的調查筆記。

![Lepton Dev 的青蛙 logo](/media/2025-12/122135584358958395.jpg)

2025 年 12 月初，SteamDB 出現一個新 app 條目：名稱叫 Lepton，logo 是一隻被行星環圈起來的青蛙，商店頁面是空的。GamingOnLinux 從條目描述挖出關鍵句——Lepton 是 Valve 的 Android-on-Linux 相容層的正式名稱，基於 Waydroid，也就是本篇原稿的全部內容。當時沒有官方公告，只有 SteamDB 的 metadata、一張青蛙圖，以及兩週前 Steamworks SDK 剛加入 Android 與 Linux Arm 支援的事實。問題是：Valve 已經有 Proton 了，為什麼還要做 Android 的？

## Lepton 與 Waydroid 是什麼

先講基礎的 Waydroid。Android 本身就跑在 Linux 核心上，要在 Linux 桌面跑 Android 不需要模擬一台手機——Waydroid 直接共用主機 kernel，把完整的 Android 系統（基於 LineageOS 的 image）塞進 LXC 容器，靠 namespace 隔離。它需要 kernel 的 binder IPC 模組（主流 kernel 已內建 `rust_binder`），圖形走 Wayland：容器直接掛載主機的 Wayland socket 與 GPU 裝置，效能接近原生，跟 ChromeOS 早期跑 Android app 的方式同出一轍。

Lepton 是 Valve 在這套東西上做的擴充，2026 年 9 月開源的程式碼說明了組成：Android root filesystem 借用 Waydroid、Anbox、Halium、Hybris 的 patch 與元件，底層是 AOSP，映像源自 LineageOS。跟一般 Waydroid 安裝相比，Lepton 有幾個很「遊戲主機」取向的取捨：

- 以非 root 身分執行，容器內所有 process 跑在同一個非特權帳號之下，app 之間不做強制隔離——安全模型改成「一個遊戲一個容器」
- 刻意關掉遊戲用不到的 Android 服務，官方文件明說「not designed for general Android use」
- 直接掛載主機的圖形驅動程式（Mesa、Zink）、Steam/Steamworks 函式庫和 Vulkan layers（包括 foveated rendering、renderpass optimizer 這類 VR 專用工具）
- 快取部分狀態加速 Android userspace 開機；內建 `strace`、`gdb`、RenderDoc、Perfetto 等除錯工具整合，因為目標客群是來移植遊戲的開發者

Steam 客戶端會自己抓 Lepton 來啟動遊戲，玩家不需要碰它。授權拆成兩塊：compat tool 是 MIT，容器裡的 Android root filesystem 因為混了上游元件走 GPL-3.0。

## Valve 為什麼做 Android 相容層

答案在 2025 年 11 月 12 日發表的 Steam Frame——搭 Snapdragon 8 Gen 3 的 Arm64 一體式 VR 頭戴裝置，跑 Arch Linux 基底的 SteamOS。這個組合立刻製造兩層缺口：Steam 目錄幾乎都是 x86 Windows 程式，獨立 VR 內容又幾乎都是 Android——Quest 頭戴裝置的作業系統就是 Android，VR 開發者手上的現成品就是 APK。

Valve 的應對是把三層轉譯疊在一起，各管一段：

| 相容層 | 轉譯方向 | 角色 |
| --- | --- | --- |
| Proton | Windows → Linux | 既有 Windows 遊戲（搭配 FEX 處理 x86 → ARM64 指令） |
| FEX | x86 → ARM64 | 讓兩個年代的 Steam 目錄跑在手機等級 SoC 上 |
| Lepton | Android → Linux | 讓開發者直接上架 APK，原生 Arm code 跑在 Arm 晶片上 |

Lepton 這條路的賣點是「不用重寫」。Valve 工程師 Jeremy Selan 接受 The Verge 專訪時講得很直接：VR 開發者本來就在替手機 VR 頭戴裝置做 APK，現在可以直接把那個版本帶上 Steam，「it'll just work on this device」。Arm 的 Android code 跑在 Arm 晶片上不需要指令轉譯，是原生執行。

Steam 那邊的配套也整組到位：開發者可以建立 Android depot（APK 加選用的 OBB 資料）、把 Android 標記為支援的作業系統、把 APK 設成啟動執行檔，Steam Cloud 會同步 Android 外部資料目錄裡的存檔。至於 Android app 會不會蔓延到非遊戲領域？Valve 的 Lawrence Yang 對 The Verge 說「We've never disinvited people from doing that」，但同一口氣接上「We are a games company and we are focused on games」——沒有禁止，但不鼓勵。

## 與 Proton 的對照

Lepton 常被叫成「Android 版的 Proton」，這個類比在產品策略上成立——兩者都是 Valve 為了擴大 SteamOS 能跑的目錄而蓋的轉譯層——但架構上是兩種完全不同的路數。

Proton 是 Wine 系的轉譯層：把 Win32 的 syscall 與 API 呼叫即時轉譯成 Linux 對應物，DirectX 透過 DXVK/vkd3d 轉成 Vulkan。遊戲自始至終以為自己在跑 Windows，後面沒有真的 Windows。Lepton 則相反：容器裡跑的是貨真價實的 Android framework——真 AOSP userspace、真 ART、真 binder——app 不需要任何轉譯就跑在「本來就是 Android」的環境裡。如果說 Proton 是把 Windows 的語言翻成 Linux，Lepton 比較像把 Linux 主機讓出一個房間給 Android 住。

差異帶來不同的成本結構。Proton 的難處在 API 表面的廣度：Win32 API 無窮無盡，anti-cheat 這種碰 kernel 的東西至今是硬骨頭。Lepton 的難處在環境的完整性：Android framework 是整組的，要嘛給 app 一個像樣的 Android，要嘛就得承擔砍掉服務之後的相容性後果——Lepton 選了後者，砍到只剩啟動遊戲所需的最小集合，連 Google Play 服務與裝置認證（attestation）都沒有，一般手機 app 在上面跑不起來。

ARM 轉譯問題的面向也不一樣。Lepton 在 Steam Frame 上其實不做指令轉譯：Arm64 的 APK 跑在 Arm64 晶片上，是原生執行。但想在 x86 的 Steam Deck 上跑 ARM-only 的 Android app 就是另一回事——Waydroid 社群的慣常解法是掛 libhoudini 或 libNDK 這類 binary translator，Lepton 沒有內建。反過來，x86 指令在 Arm 裝置上跑，靠的是 FEX。所以「Lepton = Android 版 Proton」漏掉了一半：Steam Frame 上真正的指令轉譯苦工是 FEX，Lepton 只提供 Android 環境本身。

## 2026-11 update

原稿那句話之後的一年，Lepton 從 SteamDB 上的一個空條目變成整個 Steam Frame 軟體棧的正式成員：

- **2026 年 3 月**：Valve 在 GDC 2026 正式公布 Lepton，同時公布 Steam Frame Verified 認證要求。Steamworks 文件正式把「Android via Lepton」列為 Steam Frame 三種執行模型之一。
- **2026 年 8 月初**：Lepton 與 FEX 以真實 Steam app 條目上線，成為公開可安裝的套件（免費 Linux 工具，約 1.07 GiB），Steam 開始允許開發者上架 Android depot。
- **2026 年 9 月 17 日**：Valve 無預警把 Lepton 開源，放上 gitlab.steamos.cloud，repo 一開始就標了 3.0.0 版本號，授權拆成 MIT（compat tool）與 GPL-3.0（Android image）。開頭那張青蛙 logo 圖，就是 Steam 條目「Lepton Development」的官方圖。
- **實機狀況**：Steam Frame 於 2026 年 9 月下旬出貨（US$1,059 起）。VR.org 統計 Steam metadata：130 款拿到 Great on Frame 認證的遊戲裡，67 款指向 `proton-stable`，52 款指向 `lepton-stable`——認證清單四成是 Android build。Pavlov Shack、Table Space、Action Hero 則成了 Steam 上第一批沒有任何 Windows/Mac/Linux build、只有 Android APK 的遊戲頁面。
- **Steam Machine**：新的 Steam Machine（x86 桌面主機）2026 年 6 月 29 日上市，跑 SteamOS 3.x，但截至目前 Valve 沒有宣布 Steam Deck 或 Steam Machine 上的 Android 支援，Lepton 公開的 binary 也只針對 ARM64。想在 x86 機器上跑 Android，Waydroid 仍是現實裡的答案。
- **社群外溢**：Steam Frame 出貨五天內，社群專案就把它的 SteamOS 映像移植到 Snapdragon 掌機上，其中有些甚至讓 Lepton 跑起 Google Play 商店——Valve 從來沒打算做這件事，但開源之後攔不住。

回頭看那則只有一句話的貼文，它踩在兩條線的交點上：Valve 從 Steam Deck 時代就驗證過「相容層換目錄」的策略（Proton 把 Windows 目錄搬上 Linux），Steam Frame 把同一套推到 Arm 與 Android。Proton 之後有 FEX，FEX 之後有 Lepton，命名一路沿用粒子物理（質子、輕子）。至於「手機遊戲大舉登上 Linux 桌面」的想像，目前仍限縮在「遊戲、限 Steam 上架的 APK」——Lepton 砍掉太多東西，撐不起通用的 Android 環境，那件事 Waydroid 本尊做得還是比較好。

## References

- [gHacks: Valve is developing an Android compatibility layer for Linux, it's called Lepton（2025-12-03，原稿當時的報導）](https://www.ghacks.net/2025/12/03/valve-is-developing-an-android-compatibility-layer-for-linux-its-called-lepton/)
- [Waydroid 官方網站](https://waydro.id/)
- [Waydroid GitHub repo](https://github.com/waydroid/waydroid)
- [Arch Wiki: Waydroid（binder kernel module 需求與運作細節）](https://wiki.archlinux.org/title/Waydroid)
- [The Verge: Valve is welcoming Android games into Steam（Jeremy Selan、Lawrence Yang 專訪）](https://www.theverge.com/news/818672/valve-android-apps-steam-frame)
- [Steamworks 官方文件: What games can run standalone on Steam Frame](https://partner.steamgames.com/doc/steamhardware/steamframe/compatibility)
- [Valve Lepton GitLab repo（開源原始碼）](https://gitlab.steamos.cloud/frame-public/lepton/)
- [GamingOnLinux: Valve's version of Android on Linux based on Waydroid is now called Lepton（2025-12，GOL 的 SteamDB 條目發現文）](https://www.gamingonlinux.com/2025/12/valves-version-of-android-on-linux-based-on-waydroid-is-now-called-lepton/)
- [The Verge: Valve has open-sourced Lepton, its tool to bring Android games to Steam（2026-09-17）](https://www.theverge.com/tech/997315/valve-has-open-sourced-lepton-its-tool-to-bring-android-games-to-steam)
- [Ars Technica: Not just Proton — Getting to know Valve's new SteamOS compatibility layers](https://arstechnica.com/gaming/2026/09/not-just-proton-getting-to-know-valves-new-steamos-compatibility-layers/)
- [VR.org: 52 of the Steam Frame's 130 Certified Games Run Through Valve's Android Layer](https://vr.org/articles/steam-frame-lepton-android-runtime-52-of-130-certified-2026)
- [hwbusters: Valve Ships Lepton and FEX on Steam（2026-08 上線時間點）](https://hwbusters.com/news/valve-ships-lepton-and-fex-on-steam-steam-frames-software-stack-goes-public/)
- [Wikipedia: Steam Machine（2026-06-29 上市）](https://en.wikipedia.org/wiki/Steam_Machine)
