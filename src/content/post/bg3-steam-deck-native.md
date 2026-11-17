---
title: "《柏德之門 3》推出 Steam Deck 原生版:一位工程師的下班時間專案"
description: "拉瑞安在 Hotfix #34 釋出《柏德之門 3》Steam Deck 原生版,終結兩年的 Proton 轉譯。回頭看這款 AAA 遊戲為何遲遲沒有 Linux native 版、Proton 與原生的差異,以及這個由一位工程師下班後自發完成、公司事後背書的移植案對 Linux 遊戲生態的意義。"
pubDate: 2025-09-24 17:13:41 +0800
category: acg
tags: [遊戲, steam, linux, steam-deck, proton, larian, bg3]
draft: false
source: facebook
sourceType: "相片"
sourceTimestamp: 1758705221
---

> 本文擴寫自 2025-09-24 的 Facebook 貼文

《柏德之門 3》是一款非常棒的遊戲,但對電腦配置要求很高,這導致 Steam Deck 這類掌上裝置跑起來非常吃力,就算在 800P 下也很難穩定在 30 幀。不過就在我貼出那則 Facebook 貼文的前一天,拉瑞安(Larian)工作室釋出了遊戲更新,提供了 Steam Deck 的原生版本——之前是透過 Proton 轉譯跑 Windows 版——實在太驚喜了。更讓我意外的是後續外電報導:這個版本是由工作室的一位工程師主導並完成,而且是利用下班後的時間做的,令人敬佩![^1]

## 一款 AAA 遊戲,等了兩年才有 Linux 原生版

先說日期與版本:這次更新是 Hotfix #34,版本號 4.1.1.6946847,拉瑞安官方公告發於 2025 年 9 月 23 日,裡面明確寫著「《柏德之門 3》現在提供 Steam Deck 原生版」。[^2] GamingOnLinux 在同一天下午(UTC 15:52)就發了報導,標題直接叫它「Native Linux version」。[^3]

「稀有」到什麼程度?BoilingSteam 的說法是,這是第一次有 AAA 遊戲工作室因為 Steam Deck 而替自家作品做 Linux 原生用戶端。[^4] 過去幾年 Linux 玩家玩的 3A 大作,幾乎全部是透過 Proton——Valve 基於 Wine 的 Windows 轉譯層——在 SteamOS 上跑的。《柏德之門 3》2023 年 8 月發售當天就在 Steam Deck 上能玩,幾天後還拿到 Steam Deck Verified 認證,[^5] 但那個「Verified」認證的是 Proton 版的體驗,不是原生版。我自己在 Deck 上玩它的印象也和原稿寫的一致:能玩,但 800P 下幀率經常掙扎,第三幕下城區那種人多的場景更是掉到不忍看。

## Proton 轉譯 vs native,差在哪

Proton 的價值在於「一套 Windows 版通吃」:開發商不用碰 Linux,大多數遊戲就能在 Deck 上跑起來。代價是一層額外的轉譯開銷——CPU 要多做事、記憶體要多花一些。拉瑞安官方 FAQ 的講法很直接:「透過 Proton 在 Steam Deck 上執行需要額外的 CPU 運算,原生執行則整體 CPU 用量和記憶體消耗都比較低。」[^6] 反映在體驗上就是官方說的三件事:更穩的幀率、更短的載入時間、更順的遊玩體驗。[^2]

這次的移植還有個Bonus:拉瑞安說這段工程工作改善了遊戲模型串流的機制,好處回饋到所有平台——連主機和 Windows 版玩家都會因此減少第三幕下城區那種幀率尖峰。[^2] 一個原本只服務 Deck 玩家的 side project,最後變成全平台受益的最佳化,這個劇本我覺得比移植本身更有意思。

抗錯性方面也值得記一筆。Proton 是個持續變動的相容層,ProtonDB 上這款遊戲目前金級、社群回報趨向白金,[^7] 但遊戲更新和 Proton 版本之間偶爾會互相追著跑。原生版把這層不確定性拿掉了——遊戲直接跑在 SteamOS 上,不用等 Valve 什麼時候把某個 Proton 修好。當然這裡有個前提:這個 native build 只支援 Steam Deck,拉瑞安官方明講「我們不支援 Linux 平台」,一般 Linux 桌面玩家想玩還是得回頭用 Proton,發布當天甚至一度發生 Linux 桌面抓到空下載的烏龍,要手動強制 Proton 才行(數小時後修好)。[^3] 我認為這是個很誠實的定位:它是「Steam Deck 原生版」,不是「Linux 原生版」,兩者目前就是不同的事。

## 一位工程師的下班時間專案

整件事最打動我的是來龍去脈。執行長 Swen Vincke 在 X 上說:「Steam Deck 原生版是由一位工程師發起的,他真的很想要在 Steam Deck 上有更順的遊戲體驗,所以開始在下班後做。我們試用之後,大家都驚訝於手感這麼好,所以沒花多少力氣就說服我們全力支持把它發佈出去。」[^1] 外電追蹤到,這位工程師的名字並沒有被公開,[^4] 但 Vincke 那句「正是這種對手藝的純粹熱情,讓我一再愛上我的開發者」[^1] 把重點說完了——這不是一個編列預算、排了時程的官方專案,而是一個人下班後自己想做,做出來公司才決定背書發行。

我覺得這個故事有兩層意義。對玩家來說,它證明了 AAA 遊戲在 Deck 上的效能天花板,往往不是硬體不夠,而是轉譯層的開銷把潛能吃掉了;有人願意認真做原生版,掌機體驗的改善空間比想像中大。對業界來說,它示範了一種組織文化的可能:工程師自主的 side project 可以被公司接住、變成正式功能,而不是被流程磨掉——畢竟在整個過程裡,預算和時程都是事後才補上的,先出現的只是一個人下班後想把手上的遊戲跑順。BoilingSteam 對「其他 AAA 廠會不會跟進」的判斷是悲觀的——畢竟到現在為止,誰都能做卻沒人做。[^4] 我同意短期內不會出現跟進潮,但「從零到一」總得有人先跨出去,這一步對 Linux 遊戲生態的意義,比幀率多跳了幾格要大得多。

至於我自己,那則 Facebook 貼文寫下「實在太驚喜了」的當下,其實還不知道背後是這樣一個故事。知道之後再回頭看,驚喜又更上了一層。

![2025-09-24 的 Facebook 貼文截圖](/media/2025-09/122122200464958395.jpg)

## 參考資料

[^1]: Swen Vincke 於 X 的發文(經 PC Gamer 轉述):〈Baldur's Gate 3 now runs natively on Steam Deck thanks to a single Larian engineer who started the project after hours〉,PC Gamer,2025-09-23。https://www.pcgamer.com/games/rpg/baldurs-gate-3-now-runs-natively-on-steam-deck-thanks-to-a-single-larian-engineer-who-started-the-project-after-hours-because-he-really-wanted-a-smoother-version-of-the-game-on-steam-deck
[^2]: 〈Hotfix #34 Now Live!〉,Baldur's Gate 3 官方公告,2025-09-23。https://baldursgate3.game/news/hotfix-34-now-live_144
[^3]: Liam Squires-Hand,〈Baldur's Gate 3 gets a Native Linux version to improve it on Steam Deck〉,GamingOnLinux,2025-09-23。https://www.gamingonlinux.com/2025/09/baldurs-gate-3-gets-a-native-linux-version-to-improve-it-on-steam-deck
[^4]: 〈Larian Releases a Native Linux version of Baldur's Gate 3 for the Steam Deck〉,BoilingSteam,2025-09。https://boilingsteam.com/larian-releases-a-native-linux-version-of-baldurs-gate-3-for-the-steam-deck/
[^5]: Liam Squires-Hand,〈Baldur's Gate 3 is now Steam Deck Verified〉,GamingOnLinux,2023-08-07。https://www.gamingonlinux.com/2023/08/baldurs-gate-3-is-now-steam-deck-verified
[^6]: 〈Steam Deck - Native Version〉,Larian 支援 FAQ。https://larian.com/support/faqs/steam-deck-native-version_121
[^7]: ProtonDB——《Baldur's Gate 3》社群回報摘要(App ID 1086940)。https://www.protondb.com/app/1086940
[^8]: 〈Baldur's Gate 3 has been Steam Deck Verified since 2023〉段,Overclock3D,〈Baldur's Gate 3 now has a native Steam Deck version〉,2025-09-23。https://overclock3d.net/news/software/baldurs-gate-3-now-has-a-native-steam-deck-version/
