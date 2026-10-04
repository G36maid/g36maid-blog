---
title: "Framework 13 with Arch Linux"
description: "https://wiki.archlinux.org/title/Installationguide(%E6%AD%A3%E9%AB%94%E4%B8%AD%E6%96%87)"
pubDate: 2024-10-18 10:59:14 +0800
tags: ["linux", "btrfs", "git", "arch", "zsh", "hyprland", "amd", "wayland", "grub", "vim"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1729220354
category: linux
---

## hardware

https://wiki.archlinux.org/title/Installation_guide_(%E6%AD%A3%E9%AB%94%E4%B8%AD%E6%96%87)
https://wiki.archlinux.org/title/Framework_Laptop_13#Hardware
https://wiki.archlinux.org/title/Framework_Laptop_13_(AMD_Ryzen_7040_Series)

## Spec List

- **Processor:** AMD Ryzen™ 7 7840U (up to 5.1GHz, 8-core/16-thread)
- **Integrated Graphics:** Radeon™ 700M Graphics
- **Operating System:** Arch Linux
- **Storage:** WD_BLACK™ SN850X NVMe™ - M.2 2280, 2TB
- **Memory:** DDR5-5600, 32GB (2 x 16GB)
- **Connectivity:** AMD RZ616 Wi-Fi 6E
- **Weight:** 1.3 kg
- **Dimensions:** 15.85mm x 296.63mm x 228.98mm
- **Display:** 2.8K Display, 13.5", 3:2 aspect ratio, 2880x1920 resolution, >500nit brightness, 120Hz refresh rate, 100% sRGB color gamut, Matte anti-glare surface
- **Ports:** 4x user-selectable Expansion Cards
- **Interfaces:** USB4/DP for upper left and right slots, USB 3.2/DP for lower right slot, USB 3.2 for lower left slot, USB-C power input on all four slots
- **Audio:** Stereo 2W speakers, Dual MEMS microphones with hardware privacy switch, 3.5mm combo headphone jack
- **Battery:** 61Wh (Ryzen™ 7 7840U)
- **Camera:** 1080p 60fps
- **Biometrics:** Fingerprint Reader
- **Power Adapter:** None (bring your own), 60W GaN USB-C
- **Keyboard:** International linux

## filesystem

- btrfs (this time)
- ext4
- xfs
- zfs
https://www.reddit.com/r/archlinux/comments/1ahhom8/btrfs_or_ext4/

## packages

### Pacman:
[gist](https://gist.github.com/G36maid/54d7f0c69377ed64474e97e7f877fa2a)


## Archinstall
```
BTRFS
Grub
hyprland
    dolphin
    hyprland
    openssh
    slurp
    wireless_wools
    xdg-utils
    dunst
    iwd
    poltit-kde-agent
    smartmontools
    wofi
    grim
    kitty
    qt5-wayland
    vim
    wpa_supplicant
    htop
    nano
    qt6-wayland
    wget
    xdg-dexktop-portal-hyprland
AMD/ATI
SDDM
kernal
    linux
    linux-zen
package
    vim git zsh htop tmux fastfetch
libary
    mutilib
```
## frameware 
```
fwupd
framework-system-git
fw-ectool-git
power-profiles-deamon
networkmanager-iwd
```
## btrfs
```
btrfs-grub
timeshift
inotify-tools
timeshift-autosnap
```
## shell
```
zsh 
zsh-zim-git (Zsh Improve)
```
## waybar
```
networ-kmanager-applet
waybar
```
## ZH-TW
```
Firefox zhtw
//gcin
//hime-git(aur) failed form build
wlchewing - [WIP] Wayland Chinese zhuyin input method with libchewing
```

## hyprland
```
hyprpaper
waybar

```
