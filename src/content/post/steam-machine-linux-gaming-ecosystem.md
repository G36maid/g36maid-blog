---
title: "Steam Machine 發表：十年之後 Valve 再賭一次 Linux 客廳"
description: "Valve 十年後再推 Steam Machine，對 Linux 遊戲生態的意義與一年後的現實。"
pubDate: 2025-11-13T02:49:16+08:00
category: news-comment
tags: ["steam", "linux", "遊戲", "steamos", "proton"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1762973356
---
Steam 推出了新的一系列硬體！🎮 具備 Steam Deck 優點的新手把（Steam Controller）、🖥️ 跑 SteamOS 的新桌上型主機（Steam Machine）、🕶️ 還有新的 VR 設備（Steam Frame）！LTT 已經有影片了！

最重要的是：因為這些新硬體大量搭載 SteamOS，希望未來能有更多遊戲廠商願意加入 Linux support!

先講結論：這次是十年之後 Valve 二度進攻客廳，但這次的劇本跟 2015 年完全不一樣——不再是找一堆 OEM 各自生產規格凌亂的機器，而是 Valve 自己出一台單一規格的迷你 PC，直接把自己最成功的硬體經驗（Steam Deck）搬進客廳。

## 這次發表了什麼

2025 年 11 月 12 日 Valve 一次公布三樣硬體（官方頁面在 [Steam Hardware](https://store.steampowered.com/sale/hardware)，[Steam Machine 的商店頁](https://store.steampowered.com/app/4165910/Steam_Machine) 也已經上線）：

- **Steam Machine**：跑 SteamOS 的桌上型主機，外型是約 15 公分見方的小方塊，重量 2.6 公斤。核心是半訂製 AMD APU——CPU 為 Zen 4 六核十二緒、最高 4.8 GHz（30W TDP），GPU 為 RDNA 3 28 CU、8GB GDDR6 獨立 VRAM（110W TDP）。Valve 宣稱效能約為 Steam Deck 的六倍以上，搭配 FSR 可以拚 4K/60。記憶體 16GB DDR5，儲存分 512GB 與 2TB 兩種，還有 microSD 擴充。完整規格與配置可以看 [PC Gamer 的整理](https://www.pcgamer.com/hardware/gaming-pcs/steam-machine-specs-availability/) 跟 [Ars Technica 的報導](https://arstechnica.com/gaming/2025/11/steam-deck-minus-the-screen-valve-announces-new-steam-machine-controller-hardware/)。
- **Steam Controller（第二代）**：把 Steam Deck 的操作邏輯（觸控板、握把感應）抽成獨立手把，可以直接配 Steam Machine 或當 PC 手把用。
- **Steam Frame**：新的獨立式 VR 頭顯，能無線串流 PC 遊戲，也能自己跑獨立 VR 內容。

發表當下，三樣東西的發售時間都只說「2026 年初」，價格完全沒公布，只模糊表示會「更接近現在 PC 市場的行情」（見 [Eurogamer 的訪談](https://www.eurogamer.net/steam-machines-price-will-be-more-in-line-with-current-pc-market-valve-says)）。也就是說發表時什麼都不能買，只能先登記興趣。

## 跟 2015 年那次有什麼不同

2015 年的第一代 Steam Machines 是典型「生態未成熟就急著出硬體」的教科書案例：Valve 只訂了最低規格，機器交給 Alienware 這些夥伴廠商自己做，結果價格、規格、定位都很混亂，加上當時 Windows 遊戲在 Linux 上跑起來一堆問題，整條產品線很快消失。這次不一樣的地方在於：

1. **Valve 自己做整台機器**，單一規格、單一通路，不再外包給夥伴。
2. **Proton 已經成熟**。過去十年 [Valve 在 Proton 上累積的相容層工作](https://github.com/ValveSoftware/Proton)（基於 Wine 加上 DXVK 等元件，把 DirectX 呼叫轉成 Vulkan）已經讓整個 Steam 遊戲庫大部分能在 Linux 上直接跑，Steam Deck 就是最好的驗證。
3. **SteamOS 本身是 Arch Linux 為基礎**（[SteamOS repo](https://github.com/ValveSoftware/SteamOS)），跟桌面 Linux 的距離比十年前近得多。

以一個日常用 Arch+Hyprland 的人來說，我真正在乎的事情很單純：Valve 把自己的第一方硬體全部壓在 SteamOS 上，這對 Linux 桌面遊戲生態意味著什麼：當 Steam Machine、Steam Deck、Steam Frame 三條產品線都在 Linux 上跑，遊戲開發者就沒有理由繼續把 Linux 支援當成邊緣問題。原稿說「希望未來能有更多遊戲廠商願意加入 Linux support」，這個期待這次終於有點分量了：Valve 這回是真的出錢出硬體去賭這個生態。

## 先不要高興得太早

幾個現實問題：效能宣稱（4K/60）是靠 FSR 撐起來的，原生解析度下這顆 GPU 也就是中階水準；價格未定，如果真的「接近 PC 市場行情」，那可能會落在跟 PS5、Xbox 系列直接對打的尷尬區間；另外 Valve 過去的硬體紀錄也不是每項都成功，Index 之外的 VR 生態、以及上一次的 Steam Machines 本身，都是前車之鑑。等實際開賣、價格公布之後再來判斷這台機器到底站在什麼位置比較妥當。

---

2026-11 update：一年過去了，回頭看這篇還寫得蠻準的。實際時程是：Steam Controller 先在 2026 年 5 月開賣（美金 99 元，開賣約 30 分鐘就賣光，[Wikipedia 的整理](https://en.wikipedia.org/wiki/Steam_Controller_(2nd_generation))）；2026 年 2 月 Valve 因為記憶體供應短缺宣布延後發售並重新檢視定價；6 月 22 日公布售價並開放登記，[The Verge 的報導](https://www.theverge.com/news/837022/valve-steam-machine-price-release-date) 寫得很清楚——512GB 版美金 1,049 元、2TB 版 1,349 元，6 月 29 日開賣。這個價格跟 PS5（599 美金）、Xbox Series X（649 美金）比起來相當難看，而效能大概只有 PS5 的水準（[Polygon 的評測綜整](https://www.polygon.com/steam-machine-review-roundup-worth-price/)、[Engadget 的評測](https://www.engadget.com/2210832/valve-steam-machine-review/)都點出這一點，Engadget 給了 6.5/10）。Steam Frame 更晚，9 月才開賣，256GB 版美金 1,059 元。

評價方面一致性很高：硬體設計、SteamOS 的客廳體驗受到肯定，但 8GB VRAM 加上這個價位，讓 AAA 大作跑得勉強，幾乎所有評測都說「不值這個價」。最大的原因是時機——AI 資料中心把 RAM 價格拉爆，Valve 自己都說原本目標價位接近 Steam Deck（推測原本抓 800 美金上下），是記憶體成本硬把價格拉過一千美金。所以「2025 年 11 月發表時的期待」跟「2026 年中實際開賣的現實」落差主要是外部經濟因素，不是產品方向錯了。Linux 桌面遊戲生態這邊倒是穩定前進：Steam Machine 開賣讓 SteamOS 在一般 PC（不只是 Deck）上有了存在的理由，Proton 也持續更新，我當初說「Valve 願意出錢出硬體去賭這個生態」這件事本身是成立的，只是這一代機器的性價比真的不吸引人，我自己短期內不會買，繼續用桌面 Linux 玩遊戲就好。
