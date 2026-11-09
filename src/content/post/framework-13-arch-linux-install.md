---
title: "Framework 13 (AMD 7840U) 上裝 Arch Linux：2024 年 10 月的安裝筆記擴寫"
description: "Framework 13 (Ryzen 7 7840U) + Arch Linux 安裝全記錄：7040 Series 的 Linux 支援狀態、btrfs vs ext4/zfs 的取捨、archinstall 2.8.x 逐項設定、fwupd 韌體更新鏈、Timeshift + timeshift-autosnap + grub-btrfs 快照保險，以及 Wayland 原生注音輸入 wlchewing 的坎坷路。"
pubDate: 2024-10-18 10:59:14 +0800
category: linux
tags: [arch, framework, btrfs, archinstall, hyprland, wayland, linux, grub, zsh, waybar]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1729220354
---

> 這篇由 2024-10-18 的 HackMD 安裝筆記擴寫而成，原稿幾乎只有套件清單；擴寫於 2026-11，版本與連結以 2024 年 10 月當時的狀態為準。

去年 10 月拿到 Framework 13 的 AMD 版（Ryzen 7 7840U），決定直接上 Arch。Framework 2023 年 3 月發表 [7040 Series 主機板](https://frame.work/blog/framework-laptop-13-with-13th-gen-intel-core-and-amd-ryzen-7040-series)時承諾 Fedora/Ubuntu 開箱即用，但我想要滾動更新的版本與自己刻的 Hyprland，所以選了 Arch。當時的 ISO 是 [2024.10.01](https://archlinux.org/releng/releases/2024.10.01/)（kernel 6.10.10），[archinstall](https://github.com/archlinux/archinstall) 則是 2.8.6（2024-08 發佈）——3.0 要到 12 月的 ISO 才進來。

## 硬體與 Linux 支援狀態

7840U（8C/16T、Radeon 700M 內顯）、2TB WD SN850X、32GB DDR5-5600、RZ616 Wi-Fi 6E、2.8K 120Hz 霧面螢幕、61Wh 電池、四個 Expansion Card。[Arch Wiki 的 7040 Series 頁面](https://wiki.archlinux.org/title/Framework_Laptop_13_(AMD_Ryzen_7040_Series))列的硬體幾乎全綠：GPU、Wi-Fi、指紋、webcam 都 Yes。有兩個坑先記著：

- 必裝 `linux-firmware`。它是 `linux` 的 optional dependency，不會跟著 `base` 進來；缺了它 RZ616（MT7922）會出現 `firmware load failed`，Wi-Fi 直接消失——Arch 論壇上不少「Wi-Fi 不見」案例其實就是這個。
- Expansion Card 插槽能力不對等：[上排兩槽才有 USB4](https://knowledgebase.frame.work/expansion-card-functionality-on-framework-laptop-13-amd-ryzen-7040-series-SkrVx7gAh)，下排右 USB 3.2/DP、左只有 USB 3.2。我的底座設備全部插上排。

2.8K 螢幕 256 DPI，Wayland 下直接 2x 縮放剛好（fractional scaling 在 Linux 桌面環境一直很痛，這組解析度是刻意設計成 2 的倍數）。霧面抗反射加上 500nit 亮度，在咖啡廳工作不用跟反光搏鬥；120Hz 對桌面的滑順感是回不去的東西，AMDGPU 對這片 panel 也沒有多餘設定需求。鍵盤選了 International Linux 版配置，Super/Alt 的位置對 Arch 使用者比較合理。

開箱那天要動手的只有組裝——DIY 版自己壓 RAM、插 SSD、貼 QR code 對位，十五分鐘的事，換來的是之後每一顆零件都能單獨下單替換。這種可維修性和 Arch 的滾動哲學其實是同一種價值觀：機器和系統都是長期持有的東西，壞了換零件而不是換整台。

## 檔案系統：這次選 btrfs

清單裡我列了 btrfs/ext4/xfs/zfs 四個候選。ext4 是沒有驚喜的答案，xfs 拿來放 NAS，zfs 對單碟筆電太重（授權與 kernel 更新的麻煩也是因素）。reddit 上那篇 [btrfs or ext4 討論](https://www.reddit.com/r/archlinux/comments/1ahhom8/btrfs_or_ext4/)的結論大概是：btrfs 的 snapshot + CoW 對桌機「隨時可以搞砸再回滾」的價值大於它相對 ext4 的風險，這次我也投 btrfs。快照跟 pacman 綁定之後（後述），升級前自動留還原點，滾動發行版才有保險。

## archinstall 逐項

不丟臉，用 archinstall。重點選項：

```text
filesystem   BTRFS（預設子卷 @ @home @log @pkg @.snapshots）
bootloader   Grub（為了 grub-btrfs 開機進快照）
desktop      hyprland，加 dolphin/openssh/dunst/wofi/grim/slurp/kitty
             polkit-kde-agent、xdg-desktop-portal-hyprland、qt5/qt6-wayland
kernel       linux + linux-zen
音效/網路    SDDM、iwd
額外         vim git zsh htop tmux fastfetch
```

kernel 同時裝 `linux` 跟 `linux-zen`：zen 是 [zen-kernel](https://github.com/zen-kernel/zen-kernel) 的桌面調校版（桌面排程與 preemption 比較積極），日常開 zen，出問題還有一個 stock kernel 能開機——這本身也是一種快照思維。archinstall 2.8.x 對 Btrfs 的掛載選項處理在 [v2.8.0](https://github.com/archinstall/releases) 修過一輪，2.8.6 這條路已經很穩。完整套件清單我丟在 [gist](https://gist.github.com/G36maid/54d7f0c69377ed64474e97e7f877fa2a)。

## 韌體與電源

Framework 是少數把韌體更新推上 [LVFS](https://fwupd.org/) 的筆電廠商，所以 `fwupd` 一定要裝（`fwupdmgr update` 就能刷 BIOS，Wiki 建議至少升到 BIOS 3.05）。EC 層的溫控/風扇走 `framework-system-git` 和 `fw-ectool-git`（[ectool](https://github.com/DHowett/ectool)，舊版對 AMD 主機板不通，新版才修好）。電源管理用 `power-profiles-daemon`——Framework 官方明說不建議 tlp——網路則是 NetworkManager 配 `networkmanager-iwd` 後端，[Wiki 提到](https://wiki.archlinux.org/title/Framework_Laptop_13_(AMD_Ryzen_7040_Series)) MT7922 配 iwd 穩定度與吞吐都比 wpa_supplicant 好。另外沒設 regulatory domain 會被鎖在 Wi-Fi 4 + 2.4GHz，記得設。

## btrfs 快照鏈

```bash
pacman -S timeshift inotify-tools
yay -S timeshift-autosnap grub-btrfs
```

原稿寫的 `btrfs-grub` 是筆誤，套件叫 `grub-btrfs`：它掃描 Timeshift 的快照在 GRUB 生出「開機進快照」選單，`inotify-tools` 供它的 daemon 監看快照目錄自動重產選單。[timeshift-autosnap](https://gitlab.com/gobonja/timeshift-autosnap) 是 AUR 的 pacman hook，每次 `-Syu` 前自動打快照——滾動發行版的最大風險就是更新，這個 hook 直接把風險壓掉。它比 snapper 簡單很多；snapper 彈性較高（snapper+grub-btrfs 的[比較文](https://www.lorenzobettini.it/2023/03/snapper-and-grub-btrfs-in-arch-linux/)），但我的需求只有「升級前留還原點」，timeshift-autosnap 就夠。Btrfs 子卷本身不打快照就是普通目錄，整套的價值在於 CoW 讓快照秒建、不佔雙倍空間，所以「裝 btrfs」跟「裝快照工具」從來是同一個決定的兩半。

裝完的時候 disk usage 大約 12GB，`btrfs filesystem usage` 顯示壓縮後實佔更少——archinstall 的 Btrfs 佈局掛載時帶 compress，對原始碼、node_modules 這類文字檔效果特別好，SN850X 的順序寫入本來就快，等於又賺一點。

## Shell、bar 與中文輸入

Shell 換 zsh 配 [zimfw](https://github.com/zimfw/zimfw)（Zsh IMproved，模組化、懶載入，起 shell 明顯比 oh-my-zsh 快）。狀態列用 [Waybar](https://github.com/Alexays/Waybar) 配 `network-manager-applet`，桌布 `hyprpaper`——Hyprland 當時（0.44 前後）剛擺脫 wlroots 變成[獨立實作](https://hypr.land/news/independentHyprland/)，滾動更新下每個版本都有驚喜，這也是我要快照鏈的原因之一。

中文輸入是整次安裝最坎坷的一段。`firefox-i18n-zh-tw` 之類介面中文化簡單，輸入法才是難題：gcin 直接裝不起來，hime-git 在 AUR 上 build 失敗（gcin/hime 對新版 toolchain 一直有 [build 問題](https://bugs.launchpad.net/bugs/1897750)）。最後用了 [wlchewing](https://github.com/xdavidwu/wlchewing)——xdavidwu 寫的 Wayland 原生注音輸入法，基於 libchewing，走 `input-method-unstable-v2` 加 keyboard grab、候選詞面板用 wlr-layer-shell。原稿標著 WIP 沒錯：當時最新是 0.2.1（2024-02），單一輸入法、沒有 fcitx5 那種框架功能，但在純 Wayland 的 Hyprland 上它是「真的能用」的注音方案。之後 fcitx5 生態成熟後我已換回 fcitx5，這段就當作 Wayland 輸入法過渡期的紀錄。

## 一年後回頭看

這台機器到現在還是我日常工作主力：硬體層面 Arch Wiki 上那些「Yes」是真的，fwupd 更新韌體的體驗也證明買 Framework 是對的；真正麻煩的從來不是驅動，而是 Wayland 中文輸入這種生態縫隙。下次重裝大概會照抄這份 gist，然後把 wlchewing 那行刪掉。
