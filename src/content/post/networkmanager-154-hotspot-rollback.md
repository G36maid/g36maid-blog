---
title: "睡前想說更新一下Arch：NetworkManager 1.54 把熱點弄壞了"
description: "睡前滾 Arch 更新，隔天發現 NetworkManager 升到 1.54 之後 Wi-Fi 熱點整個不 work。用降版驗證確認是 1.54 的鍋，對照上游 issue 1798 與 postmarketOS 直接降回 1.52.1 的處置，整理 pacman -U 降版、IgnorePkg 固定版本的實際做法與風險，並補上 2026 年回頭看的修復現況。"
pubDate: 2025-08-04 00:29:24 +0800
category: linux
tags: ["arch", "networkmanager", "wifi", "rollback"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1754238564
---
睡前想說更新一下 Arch，`pacman -Syu` 滾下去就上床睡覺了，隔天醒來要開筆電的 Wi-Fi 熱點給手機用，才發現熱點整個不 work：熱點看起來有起來，手機卻怎麼都連不上，就算勉強連上，轉個頭斷線就給你看。第一反應是「我最近到底動了什麼」，翻了半天設定檔，才想起來前一天晚上滾的那波更新——`pacman.log` 裡 NetworkManager 從 1.52 一口氣跳到 1.54。

1.54 是 2025 年 8 月 1 日剛出的新版，主打 ipv4.forwarding、IPv6 prefix delegation、nmtui 能設 loopback 這些功能，而且 Arch 官方包 8 月 2 日就打出來了，我那晚滾到的時間點剛好就是它進 repo 的第一天。等於我當了第一波的回歸測試者，還是在不知情的狀況下。

怎麼確定是它的鍋

我沒有第一時間去翻 issue tracker，走的是最土的方法：降版驗證。從 [Arch Linux Archive](https://archive.archlinux.org/packages/n/networkmanager/) 抓回 1.52.1 的舊包：

```bash
# 從 archive.archlinux.org 抓回舊版包再安裝
sudo pacman -U https://archive.archlinux.org/packages/n/networkmanager/networkmanager-1.52.1-1-x86_64.pkg.tar.zst
```

重開機後熱點立刻恢復正常，手機一連就上。這基本就是定罪了：設定檔沒動過、硬體沒動過、唯一的變數就是 NetworkManager 1.52 → 1.54。這招對所有 rolling release 的疑難雜症都適用，先二分（甚至直接退最可疑的那個包）再談別的，比對著 log 猜半天快多了。

不只有我中獎

查了之後發現這不是我的卡特別挑：上游 GitLab 有追蹤這件事的 [issue 1798](https://gitlab.freedesktop.org/NetworkManager/NetworkManager/-/issues/1798)，postmarketOS 更直接，把整套包[降回 1.52.1](https://gitlab.postmarketos.org/postmarketOS/pmaports/-/merge_requests/7929)，commit message 寫得很明白：「The 1.54 release broke hotspot」。也就是說這個回歸不只打 Arch，連手機端的發行版都中，範圍比想像中大。

到底壞在哪？老實說我沒有挖到源碼級的答案。可以確定的是熱點走的是 NM 的 AP mode + shared 模式（NM 內部用 dnsmasq 發 IP、透過 wpa_supplicant 開 AP），1.54 在這條路徑上有東西壞了，issue 1798 裡的症狀跟我一樣：AP 開得起來、客戶端連不上或狂掉。但精確到哪個 commit 壞的，我當時只能降版，沒有再往下追。

回滾與固定版本

降版只是一時的，`pacman -Syu` 下次又會把它升回去。要讓系統暫時停在 1.52，把 NetworkManager 加進 `/etc/pacman.conf` 的 `IgnorePkg`：

```ini
# /etc/pacman.conf
IgnorePkg = networkmanager
```

這樣之後的 `pacman -Syu` 會跳過它。順手提醒一下風險：NetworkManager 是網路的核心元件，長期 pin 住意味著安全修補也一起停了——NM 歷史上是有 CVE 的，這種包不適合 pin 超過幾週。這只是等上游修好的止痛藥，不是解法。等新版出來，記得把 IgnorePkg 拿掉再升上去，不然你會忘記它的存在，然後某天看到系統裡躺著一個三個月前的網路管理器。

1.55、1.56 有修好嗎？

NM 沒有 1.55 這個版號（1.54 之後直接跳 1.56），1.56 到了 2026 年 2 月才出，等了快半年。從 1.56 的 release notes 看不出任何一條明確寫著「修 hotspot」，所以我也無法跟你保證哪個 commit 修掉了這件事。實際的做法是：等 1.56 進 repo 之後，把 IgnorePkg 拿掉、升上去、自己開一次熱點測。我升上去測了之後熱點恢復正常，所以這故事有個平凡的好結局；至於到底是哪個 commit 修的，說真的沒有查到明確來源，這段我就不掰了。

順帶一提，2026 年的現在 NM 已經出到 1.58（2026 年 7 月釋出，Wi-Fi 部分加了 6GHz band 支援和 SAE 密碼錯誤時重新提示），這整套 1.54 熱點風波已經是歷史事件了。

2026-11 update

回頭看這篇文章，補個時效：上游後續的 1.54.2/1.54.3 等維護版陸續出了不少修正，1.56（2026-02-12）和 1.58（2026-07-20）也都正常釋出，Arch repo 現在的版本一路升到 1.58.x，熱點功能正常。當初那個 issue 1798 的具體修復 commit 我到今天還是沒有去挖出來，如果你是因為新版又壞了熱點而搜到這篇——先試 `nmcli connection modify <名稱> 802-11-wireless-security.pmf disable`（PMF 相容性問題在熱點上反覆出現，值得先排除），不行再走降版那套流程。降版 + IgnorePkg 這個組合到今天依然是 rolling release 上最務實的應急手段。

感想

滾動發行的日常就是這樣：你要的是最新的軟體，代價是有時候會在別人還沒踩到的時候先踩到雷。這次的雷還算友善——不影響開機、不影響一般上網，只有熱點這個小眾功能陣亡，用降版就能救。但如果是整個網路管理器爛掉那種等級的回歸，睡前手滾 `pacman -Syu` 這個習慣就得重新考慮了。至少這次學到一件事：更新完之後，重開機前先想一下哪些功能明天會用到。

相關閱讀：[Arch 安裝筆記](/blog/arch-install-notes-2025/)、[Framework 13 上裝 Arch](/blog/framework-13-arch-linux-install/)。

參考資料：

- NetworkManager 1.54 release blog（2025-08-01）：<https://networkmanager.dev/blog/networkmanager-1-54/>
- 上游 issue 1798（1.54 hotspot 回歸追蹤）：<https://gitlab.freedesktop.org/NetworkManager/NetworkManager/-/issues/1798>
- postmarketOS 降回 1.52.1 的 MR（MR 7929）：<https://gitlab.postmarketos.org/postmarketOS/pmaports/-/merge_requests/7929>
- Arch Linux Archive（抓舊版包用）：<https://archive.archlinux.org/packages/n/networkmanager/>
- NetworkManager NEWS（1.56/1.58 changelog）：<https://github.com/NetworkManager/NetworkManager/blob/main/NEWS>
- Arch 官方包倉的 packaging git（1.54.0-1 於 2025-08-02 打出）：<https://gitlab.archlinux.org/archlinux/packaging/packages/networkmanager>
