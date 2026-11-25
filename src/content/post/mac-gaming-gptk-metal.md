---
title: "2026 是 Linux 桌面之年，但這時候 Mac 能打遊戲了嗎？"
description: "WWDC 2026 的 Game Porting Toolkit 4 與極客灣近 300 款遊戲實測：Mac 轉譯層五年進化史、D3DMetal 對 Metal 4 與 Proton/DXVK 對 Vulkan 的架構差異、DLSS 借殼 MetalFX，以及 2026-11 的後續追蹤。"
pubDate: 2026-06-27 17:51:47 +0800
draft: false
category: acg
tags: ["遊戲", "linux", "mac", "gptk", "metal", "proton", "gpu", "效能"]
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1782553907
---

> 本文擴寫於 2026-11-25。原稿是 2026-06-27 貼在 Facebook 的短評，當時 WWDC 2026 剛結束，正文保留當時的觀點與語氣，文末另補一段後續追蹤。

Mac 能不能打遊戲，長年是被拿來嘲笑 Apple 的固定梗。2026 年 6 月 WWDC 結束後，極客灣（Geekerwan）丟出一支 25 分鐘的實測影片（[原稿附的連結](https://www.youtube.com/watch?v=M48PVIG7ckg)）：一台最低階的 M4 Mac mini、16GB 統一記憶體，跑了將近 300 款遊戲，結論是「可以玩」。我看完的感想跟原稿寫的一樣——答案確實是肯定的，只是這張門票得另外花功夫裝。

蘋果這幾年其實就做一件事：把轉譯層一格一格補齊。時間線攤開來看很清楚。2023 年 WWDC 推出 Game Porting Toolkit（GPTK）1，本體是打了兩萬多個補丁的 Wine，加上蘋果自己寫的 D3DMetal，把 DX11/12 轉成 Metal，當年 10 月出 [v1.0 正式版](https://applech2.com/archives/20231007-game-porting-toolkit-v1-now-available.html)；2024 年 WWDC 出 GPTK 2（[隔年 1 月才脫離 beta](https://appleinsider.com/articles/25/01/16/game-porting-toolkit-2-exits-beta-to-help-developers-move-to-macos)），重點放在效能與除錯工具；2025 年 WWDC 一次丟出 [Metal 4 和 GPTK 3](https://developer.apple.com/videos/play/wwdc2025/205/)，MetalFX 加入幀生成（Frame Interpolation）與降噪，跟著 macOS Tahoe 26 出貨；2026 年 WWDC 的 [GPTK 4](https://developer.apple.com/wwdc26/guides/games) 則把 AI coding agent 拉進移植流程，評估環境正式支援 Metal 4，DX11 遊戲仍退回 Metal 3。

極客灣的數據比發表會有說服力。單機大作可玩率 68%，大多是中低畫質 2K30 或 1080p60；獨立遊戲 60 款裡 59 款能玩，原生移植率還特別高；二次元手遊 15 款過 13 款，靠 PlayCover 跑 iOS 版接近原生效能；視覺小說 19 款只掛一台（《Fate/stay night》重製版卡在 WebView2）。真正難看的是網遊：反作弊驅動在轉譯環境裡動不了，可玩率只有 46%。這點跟 Linux 上的狀況完全一致——EAC/BattlEye 不點頭，轉譯層做得再好也進不去。中文圈的整理可以看[電腦王阿達這篇](https://www.kocpc.com.tw/archives/647267)。

極客灣在影片裡也把歷史脈絡交代了一遍：五年前 Apple Silicon 轉向時，Mac 同時失去兩條退路——BootCamp 裝 Windows 玩遊戲被徹底排除，32 位元老遊戲支援也被砍掉，才會跌到「笑話」的谷底。蘋果之後的三大策略，一是用 GPTK 讓開發者不改程式碼就能評估移植可行性，二是跟 CodeWeavers 深度合作、親自下場做 D3DMetal，三是不斷堆高晶片性能：既然轉譯有損耗，就把晶片做到無視損耗的程度。

架構上，Mac 這套跟 Proton 走的路並不相同。Proton 的主力是 DXVK 和 vkd3d-proton，把 DirectX 轉成 Vulkan，而 Linux 核心本來就有成熟的開源 Vulkan 驅動，轉譯目標是現成的業界標準。Mac 沒有 Vulkan，[D3DMetal](https://developer.apple.com/games/game-porting-toolkit/) 只能把 DX12 直接翻譯成 Metal，再靠 Apple Silicon 夠強的 CPU 把損耗硬吃下來。極客灣實測 GPTK 4 之後，不少遊戲效能又多擠出約 10%，記憶體佔用也再降了一些，對 16GB 機種不無小補。最有意思的是 CrossOver 的「DLSS 借殼」：GPTK 4 內建 nvngx-on-metalfx 這個 shim，把遊戲呼叫 DLSS 的介面改接到 MetalFX 的超解析與幀生成（[內部拆解見此](https://skyfiresystems.com/velocity/gptk4)）。這招本質上是承認 NVIDIA 的生態自己補不上，乾脆從介面層劫走——工程上很髒，但有效。

原稿的另一個論點——統一記憶體——在實測裡也得到印證。以《黑神話：悟空》為例，同樣 16GB，Windows 內顯筆電的記憶體和 VRAM 得硬切兩份，Mac 的 UMA 卻能依 workload 動態調度，貼著上限跑也還過得去。極客灣 2024 年底就用 3000 塊的 M4 Mac mini 轉譯跑過黑猴，30 多幀勉強能玩；兩年後軟硬體同時進步，這條下限又被往上抬了一截。

所以我的結論跟半年前寫的一樣：Mac 不會取代電競 PC，但「買 Mac 工作、順便玩單機」確實成立了。唯一的硬傷依然是帶反作弊的多人連線網遊，這得等遊戲廠自己表態。至於等等黨——原稿寫完沒幾天 Mac 就大幅度漲價，這筆帳我到現在還記得。

**2026-11 update**：Cyberpunk 2077 十月的 2.5 版加入了 MetalFX 幀生成，但限定 macOS 27，留在 Tahoe 26 的玩家在遊戲內根本看不到選項，[CDPR 論壇](https://forums.cdprojektred.com/index.php?threads/is-metalfx-frame-interpolation-exclusive-to-macos-27-or-will-macos-26-be-supported.11143523/)已有人實測確認。另外，免費開源的 Whisky（底層同樣基於 GPTK 技術）已於 2025 年 4 月[停止開發](https://github.com/Whisky-App/Whisky)並指向 CrossOver 作為後繼，Mac 上的轉譯方案反而更集中了。GPTK 4 的 shim 目前還沒支援 DLSS 4 的 Transformer 模型，升級路徑上留了個缺口，只能等後續版本補。
