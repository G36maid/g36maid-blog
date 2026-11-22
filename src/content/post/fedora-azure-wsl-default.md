---
title: "Fedora 或將緩慢取代 Ubuntu/Debian？把三行貼文的宣稱逐條查證"
description: "逐條查證 2026-05 的三行貼文：Fedora 進 WSL 官方目錄屬實、預設仍是 Ubuntu；Azure 靠 Community Gallery，微軟自家 Azure Linux 才是 Fedora 衍生；Linus 用 Fedora 有影片原話。附 2026-11 update。"
pubDate: 2026-05-05T14:09:33+08:00
category: linux
tags: ["fedora", "ubuntu", "debian", "wsl", "azure", "microsoft", "distrowatch", "linus-torvalds"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1777961373
---

五月初我在臉書上丟了三行字：「Fedora 或將緩慢取代 Ubuntu 或 Debian 的地位」「微軟現在正在大力推進 Fedora 成為 azure/WSL 的預設發行版」「包含 Linus 也是 Fedora 使用者」。三行都是當下刷到新聞的直覺反應，一句查證都沒做。半年後回頭看，這三行各自有幾分真、幾分誇張，值得把證據攤開來對一遍。

先處理最容易被轉傳走樣的那句。微軟確實把 Fedora 拉進了 WSL 的官方行列：2025 年 5 月 6 日，Fedora 42 正式成為官方 WSL 發行版，映像由 Fedora Project 自己用新的 tar-based 架構生產，`wsl --install FedoraLinux-42` 一行就能裝，官方部落格寫得明明白白。但「預設發行版」這五個字是原稿的誇張——截至我寫這篇 update 的此刻，微軟 WSL 發行版 manifest 的 top-level Default 欄位仍然寫著 Ubuntu，裸跑 `wsl --install` 裝到的還是 Ubuntu，微軟自己的安裝文件也還這樣寫。Fedora 拿到的是官方目錄裡的位子，同一份 manifest 裡 Fedora 家族的預設條目已經從 42 推進到 45；Ubuntu 拿到的則是出廠預設。兩件事在轉傳過程中常常被混成一句話。

Azure 這邊更要小心。Fedora 從來沒有成為 Azure 的「預設」，也不在 Azure endorsed platform images 的名單裡——那張名單上是 Canonical、Red Hat 的 RHEL、SUSE、CIQ、Oracle 和 Debian。實際發生的事是：Fedora Project 從 Fedora 40 開始把 Cloud image 直接放進 Azure Community Gallery，可以在 Azure Portal 默默選用；後來 Azure Marketplace 上也出現了官方名義的 Fedora 44 映像。另外還有一層更耐人尋味的事實：微軟自家用來跑 Azure 基礎設施的 Azure Linux（前身 CBL-Mariner）是 Fedora 衍生、RPM 系的發行版。微軟選的技術血統確實偏向 Fedora 家族，但這跟「Fedora 是 Azure 預設」中間隔了一整個行銷部門的距離。

Linus 那句倒是站得住。2025 年 11 月他在 Linus Tech Tips 的影片裡被問到「為什麼是 Fedora」，原話是 Fedora 跟 kernel 開發者很近，而 Ubuntu 多年前想走消費者導向，當年讓他「連升級 kernel 都變困難」，於是他說：「我只想要一個裝好就能用的發行版，上面只編我自己的 kernel。」Fedora Project 的官方帳號後來也大方轉發確認這件事，還補了一句「用最適合你的發行版才真的酷」。再往前算，他 2022 年就在 M2 MacBook Air 上跑 Fedora Asahi、2025 年底換 Threadripper 工作站照樣是 Fedora——說 Linus 是 Fedora 人，證據夠硬。

那「越來越多人推 Fedora 作為日常使用」呢？我認為這半句是真的，而且原因就在對手的動作裡。Ubuntu 22.04 LTS 把 Firefox 改成強制 snap，冷啟動慢到有人量出 12 秒、同一台機器的 deb 版只要 2 秒，Mozilla 的 bugzilla 和 Launchpad 上「Firefox starts very slow」的回報串了幾百則留言，Canonical 自己也連發部落格在修 squashfs 尋找時間、字型掃描這些冷啟動元兇——修到後來接近 deb 了，但那一年大家已經把「Ubuntu 桌面」和「等 Firefox 開起來」綁在一起記憶。Red Hat 那邊，2023 年 6 月停止公開 RHEL 完整源碼、只留 CentOS Stream，Fedora 討論區當時吵成一團，Rocky 和 Alma 忙著找出路；Fedora 本尊因為站在上游，反而沒被這場風波燒到。Debian 穩得可以，但兩年一版的節奏放在桌面上就是保守。Fedora 半年一版，Wayland、PipeWire 這些新東西都是它先押注，Fedora 42 起 KDE Plasma 還升格成官方 edition——在「想要新軟體、又不想每天滾動爆炸」的區間裡，2026 年的推薦名單確實往 Fedora 傾斜。

數據也聞得出風向。DistroWatch 的 page-hit ranking 上，2026 年的 Ubuntu 掉到第九、第十名，Fedora 站在第七、第八名，第一名是 CachyOS——剛好就是我自己的日常系統，這個我必須承認看得有點爽。不過同一時期的 W3Techs 統計裡，Ubuntu 仍佔 Linux 網站伺服器的一成五，伺服器世界的現實還沒動。所以「緩慢取代」目前只發生在話語權和嘗鮮意願上，帳面市佔還沒跟著走。

我的位置倒是從頭到尾沒變：發行版是組合題。Debian 系配 Mint，給不想折騰的人和機器；Fedora 系配 Fedora KDE，給要新版軟體又怕滾動更新的人；Arch 系配 Arch，給想完全掌控每個套件的人——我裝機的心得都寫在[Arch 安裝筆記](/blog/arch-install-notes-2025/)，[Framework 13](/blog/framework-13-arch-linux-install/) 那台也是一路這樣折騰過來的。發行版沒有終點站，挑一個跟自己的耐心等級相容的就好，順便別跟人吵架。

2026-11 update：寫完半年後的進展比當初三行字預期的多。WSL 官方目錄裡，Fedora 的預設條目從 44 推到 45，Arch 也在官方名單裡站穩；微軟在 11 月 17 日讓 Azure Linux 4 正式 GA，並且把 Azure Linux 一起搬上了 WSL——一個 Fedora 衍生、微軟自己維護的發行版，就這樣出現在微軟的開發者工作流裡。原稿那句「微軟大力推進 Fedora」，把主角講對了一半：往 Fedora 家族傾斜是真的，只是執行者叫 Azure Linux，Fedora 本尊拿到的是一張 WSL 官方門票和慢慢往上爬的名次。Ubuntu 預設的位子到今天還沒人搬走。
