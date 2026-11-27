---
title: "用 Linux 偽裝成 Wii U Gamepad：MattKC 的 Vanilla 與任天堂魔改的 Wi-Fi 協定"
description: "Wii U 的 Gamepad 壞了買不到、還鎖區。MattKC 的 Vanilla 專案靠逆向任天堂魔改的 WPS/WPA2，讓 Linux PC 直接扮演 Gamepad——按鍵、觸控、Gyro、麥克風都能用。"
pubDate: 2026-01-01T14:23:17+08:00
category: linux
tags: ["linux", "reverse-engineering", "wiiu", "networking"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1767248597
---


> 本文擴寫自 2026-01-01 的連結分享，原稿只有幾句推坑話，推的是 MattKC 的影片〈So I started cloning the Wii U gamepad...〉（2025-12-26 發布）。以下把當時沒講的協定細節補齊。

Wii U 最大的硬傷是那塊 Gamepad 本身。它從未以單獨配件的形式在店裡販售，日本一度賣過替換品卻鎖區，美版主機不能配日版手把。結果就是這顆隨機附贈的控制器一旦摔壞或遺失，整台主機形同變磚：不少系統功能與遊戲沒有 Gamepad 就拒絕啟動。MattKC（就是那位從零手寫瀏覽器的 YouTuber）花了很大力氣做出「Vanilla」專案，讓你的 Linux PC 直接扮演 Gamepad，按鍵、觸控、Gyro、麥克風全都能用。影片推給對 Network Protocol 和 Embedded Reverse Engineering 有興趣的人，我是一次看完的。

## Gamepad 其實是個偽裝的 Wi-Fi client

講 Vanilla 之前有一個常被忽略的事實要先講：Gamepad 不是藍牙或私有射頻的手把，它其實是一台網路裝置。裡面的 Wi-Fi 晶片是 Broadcom BCM4319（這顆在其他產品上也用過，不算客製），跟主機之間用 5 GHz 802.11n 通訊，主機端則由一顆叫 DRH 的獨立晶片專責處理，跟主機作業系統 IOSu 之間走 USB。

雙方跑的都是標準 802.11，但任天堂動了兩個小手腳。第一，配對用改過的 WPS：在主機上按兩下 SYNC 鍵，會出現一個開放 AP，Gamepad 連上去跑 WPS handshake 換取正式連線的憑證。PIN 碼用 ♠♥♦♣ 四種符號顯示在電視上（♠=0、♥=1、♦=2、♣=3），而 WPS 的 AuthKey 計算被改成吃 `KDF(KDK_ROT)`——KDK_ROT 是把 KDK 往左轉三個位元組。任何照 spec 實作的 WPS 都會在 M2 那步直接失敗。第二，正常連線的 WPA2 被換成任天堂自有 OUI 的 cipher suite，而且 PTK 算完後同樣左轉三個位元組。對 wpa_supplicant 和市面上所有商用路由器來說，這根本不是 WPA2。

關聯之後倒是回到人間：DHCP 拿 IP（主機 192.168.1.10、Gamepad 192.168.1.11），然後就是純資料流——主機把 H.264 影片推過去，Gamepad 以每秒 180 次的頻率回報所有輸入狀態，按鍵、類比搖桿、觸控、加速度計、陀螺儀、電量全在一個封包裡，60 FPS 的遊戲等於每幀三包。

## 為什麼十年來沒有廠商做出副廠 Gamepad

理解到這一層，這個問題就自動解釋完了。仿製一款控制器通常只要抄 HID descriptor，Gamepad 的核心難點卻在 Wi-Fi stack：你必須能自己改 WPS 和 WPA2 的計算，消費性晶片的封閉韌體不給你這個機會。唯一可行路線是全開的軟體 stack——Linux 的 mac80211 加上手工改過的 wpa_supplicant，再配一張支援 5 GHz 802.11n 的網卡。未破解的 Switch 之所以也當不了 Gamepad，就是 stack 封閉無處下手。

這也不是第一次被逆出來。2013 年 30C3 就有〈Reverse engineering the Wii U Gamepad〉議程，之後的 libdrc 專案把 DRC/DRH 的韌體架構、開機流程、配對與加密細節整理成完整文件，還附了改過的 Wireshark（memahaxx/drc-wireshark）可以直接解密封包。MattKC 進度順利，正是因為站在這批十年前的研究上；他做的是把研究級成果變成一般人裝了就能跑的軟體。

## Vanilla 實際上做了什麼

Vanilla（vanilla-wiiu/vanilla）是 CMake + SDL2 + ffmpeg 的 C 專案，作者自己在 README 定調為 alpha。它把網路段接管下來扮演 Gamepad：解碼主機推來的 H.264 並全螢幕播放，把輸入封包送回去，Gyro 和麥克風通道也實作了，所以那些指定要用 Gamepad 的遊戲環節真的跑得起來。鍵盤可以當 fallback，但建議接實體手把；Steam Deck 上可把額外功能 map 到背鍵，官方 Releases 提供各平台現成 binary。

代價是平台限制：魔改 WPA2 的計算必須插在驅動與 userspace 之間，連 Windows 版最初都要靠一台 Linux VM 處理網路段（Hackaday 報導的截圖就是這個架構）。這也是 MattKC 在影片裡自己點出的痛——Vanilla 若只停留在 Linux desktop app 就永遠成不了替代品，所以他後期的移植投入比協定本體還多。

## 我的角度

以做協定逆向的人來看，這案例簡直是教材。它示範了協定混淆最常見也最漂亮的「微擾動」形式：不碰強加密的底層，只在 KDF 輸出上轉三個位元組，整套照 spec 實作的生態就全被擋在門外；而攻方只要對著封包和韌體讀出那三個位元組的差異，鎖就開了。2013 年產出文件、2025 年有人做成成品，這條時間線本身就是 RE 計畫留文件價值的最好示範。

對還在用 Wii U 的人，Vanilla 更接近保存專案：Gamepad 只會越來越少，用軟體替代硬體是唯一規模化的路。現實面也要講：alpha 階段的體驗看網卡臉色，延遲與掉幀仍在，影片裡也沒有掩飾這點。但「主機不再因為一個周邊壞掉而報廢」，這件事的意義遠大於畫質完美。

## References

- MattKC,〈So I started cloning the Wii U gamepad...〉：<https://youtu.be/jlbcKuDEBw8>
- vanilla-wiiu/vanilla：<https://github.com/vanilla-wiiu/vanilla>
- libdrc 文件（Wi-Fi peculiarities / DRC & DRH）：<https://libdrc.org/docs/re/wifi.html>、<https://libdrc.org/docs/re/overview.html>
- 30C3 2013〈Reverse engineering the Wii U Gamepad〉：<https://fahrplan.events.ccc.de/congress/2013/Fahrplan/events/5322.html>
- Hackaday,〈The Issue With Wii U Gamepads And How To Clone Them〉：<https://hackaday.com/2026/01/08/the-issue-with-wii-u-gamepads-and-how-to-clone-them/>
