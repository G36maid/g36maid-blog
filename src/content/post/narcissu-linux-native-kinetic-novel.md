---
title: "重溫《Narcissu》：一部 2005 年的視覺小說，在 Linux 上開箱即用 native 執行"
description: "《Narcissu》（水仙）沒有立繪、沒有多重結局，卻是少數在 Linux 上原生執行的視覺小說。從 NScripter、ONScripter 到 Ponscripter 的引擎考據，以及「毫無選項」的 kinetic novel 敘事設計。"
pubDate: 2025-11-23 10:34:14 +0800
category: linux
tags: ["linux", "遊戲", "視覺小說", "narcissu"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1763865254
---

重溫了《Narcissu》（水仙）。這是一部沒有立繪跳動、沒有多重結局的 kinetic novel。

令人驚訝的是，這部 2005 年的作品在 Linux 上居然是開箱即用的 native 執行。

故事發生在安寧病房的「7F」，這裡的規則只有一條：有些事不做會後悔，做了也不會改變結果。主角與瀨津美偷了一輛銀色 Integra，開始了一場沒有目的地的公路旅行。
這部作品最讓人窒息的設計在於「毫無選項」。我們習慣在遊戲裡透過選擇來改變命運，但在絕症面前，你只能看著擋風玻璃外的景色不斷後退。它不販賣奇蹟，只講述如何在不可避免的終結前，維持最後一點生而為人的尊嚴與任性。

![Narcissu 1st & 2nd 在 Linux 上跑起來的標題畫面，2005 年的遊戲不用 Proton 就能直接進主選單。](/media/2025-11/122133893282958395.jpg)

## 開箱實測

先講結論：裝好、點開、能玩，中間沒有任何一步需要查文件。我在 Arch Linux 上從 Steam 安裝 Narcissu 1st & 2nd（Sekai Project 發行的免費版，含一代與 SIDE 2nd），下載完直接啟動就進了上圖這個標題畫面——不是靠 Proton 轉譯，SteamDB 和 ProtonDB 上都標著 native，Linux 玩家的回報清一色是「works out of the box」。整個遊戲 300 MB，最低需求寫的是 Pentium 4 1.2 GHz，2025 年的任何機器跑它都像在跑文字編輯器。

這件事的稀奇之處，玩過 galgame 的都知道。同年紀的視覺小說大多綁著 Windows 專有引擎，在 Linux 上不是靠 Wine 就是靠 Proton 硬撐，字型渲染爛、全螢幕閃爍、存檔路徑飄移都是常態；近年不少新作甚至上了到處要掃描、防作弊一起懲罰 Linux 玩家的 Denuvo。一部二十年前、原本在 NScripter 上跑的免費同人作品，反而是少數三平台一起出 binary 的。

## 為什麼它能 native：引擎考據

答案在引擎的系譜裡。原版《narcissu》由同人社團 stage-nana 製作、片岡とも執筆，2005 年 8 月 2 日發表，用的是 NScripter——高橋直樹寫的那個免費但閉源、只有 Windows 版的腳本引擎。但 NScripter 有一個開源的分身：Ogapee 為了在 Sharp Zaurus PDA 上玩 NScripter 遊戲，用可攜性極佳的 SDL 寫了 ONScripter，一路被社群移植到 Linux、macOS、PSP、Android，幾乎是所有能開機的東西。

英文版走的正是這條路：insani 和 Haeleth 在 2005 年 8 月做的英文化直接用 ONScripter 打包，官方下載頁當時就同時列了 Win32、Mac OS X、x86 Linux 三種 binary。2014 年 Sekai Project 把它帶上 Steam（免費版 2015 年 4 月 24 日上架）時，底層引擎換成了 Ponscripter——ONScripter-En 的分支，支援 Unicode 與比例字型，Sekai Project 為 Steam 整合又 fork 了一次，repo 裡明寫支援「Any modern Linux」。所以你在 Steam 上按下去跑的是 native 的 ONScripter 系引擎，不是模擬層。同一份腳本資產，配上一個被社群移植了二十年的開源引擎，Linux 版就這麼「順便」存在了。對照組是同期的 KiriKiri 系作品，引擎本身沒有官方跨平台版本，翻譯組再熱心也只能給你一個 Windows exe。

順帶一提，這也是為什麼 Fate/stay night、CLANNAD 這些 NScripter/KiriKiri 時代的老作品，至今都有社群用 ONScripter 重製跨平台版的蹤跡——引擎開源與否，直接決定了二十年後你的遊戲還能在多少機器上跑。

## 毫無選項的敘事設計

「kinetic novel」這個詞，源頭是 Visual Arts 的品牌 KineticNovel——Key 用它來發行線性短篇（planetarian 就是代表），後來社群把它泛指成「完全沒有選項的視覺小說」，VNDB 上《narcissu》也確實掛著 Kinetic Novel 與 Single Ending 的標籤。有趣的是這個詞原義只是行銷品牌，日本人自己反而不這樣用；英語圈把「kinetic」（動能）讀成「故事自己往前跑、不需要玩家推力」，算是意外貼切的誤讀。

《narcissu》把這個形式用到了極致。全篇唯一像「選擇」的東西只有快轉和退出。沒有選項在 galgame 裡通常是扣分項——少了一週目二週目的動機——但在這裡它是敘事本身：兩個拒絕死在醫院也拒絕死在家裡的絕症病人，從安寧病房 7F 偷偷開走一輛銀色 Integra，往西邊的公路前進。終點沒有分支、沒有好結局壞結局，只有淡路島。你按下滑鼠推進的每一行文字，都朝同一個方向走，就像擋風玻璃外的景色只能後退不能挽回。它與 Key 社的催淚路線剛好相反：Key 是先給你日常的溫暖再抽走，《narcissu》從第一行就告訴你結果，然後讓你陪兩個人把剩下的日子過完。

## 評價

二十年了，它仍然是我心中「絕望文學」最純粹的樣本：不販賣奇蹟、不給救贖的選項，只問在確定的終結之前，人還能不能維持一點尊嚴與任性。文字由兩位譯者分別翻譯有聲與無聲版本，本身就是對這部作品的罕見禮遇。

缺點也照實講：沒有選項的設計對習慣攻略路線的玩家確實是硬傷，兩三小時的篇幅等於一次性消費；題材全程籠罩在安寧病房與死亡的氛圍裡，不適合想放鬆的時候開。原版畫面只有 800×600 的 4:3，在現在的寬螢幕上就是一個置中窗口。但如果你能接受這些，它是免費的，Steam 上就能直接在 Linux 跑——一部 2005 年的作品在 2025 年的 Linux 桌面上原樣復活，這件事本身已經值得一篇網誌。

## 參考資料

- https://store.steampowered.com/app/264380/Narcissu_1st__2nd/
- https://pcgamingwiki.com/wiki/Narcissu
- https://vndb.org/v10
- http://narcissu.insani.org/down.html
- https://github.com/sekaiproject/ponscripter-fork
- https://sekaiproject.github.io/ponscripter-fork/doc/rn01re01.html
- https://www.protondb.com/app/264380
- https://steamdb.info/app/264380/
- https://en.wikipedia.org/wiki/Narcissu:_Side_2nd
- https://zh.wikipedia.org/wiki/Narcissu
- http://en.wikipedia.org/wiki/Kinetic_novel
- https://vndb.org/g709
- https://store.steampowered.com/app/439510/Narcissu_10th_Anniversary_Anthology_Project_Season_Pass/
- https://thenewleafjournal.com/narcissu-insani-version-vn-review/
