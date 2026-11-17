---
title: "GGJ 前用 Gleam 寫 Pac-Man：MVU 架構、幽靈 AI 與三天上線"
description: "Global Game Jam 2026 開跑前，我用 Gleam 和 Tiramisu 遊戲引擎把經典 Pac-Man 從零做到 GitHub Pages 上線：Elm 式 MVU 怎麼對應遊戲 loop、四隻幽靈各自的 AI 演算法（Blinky 直追、Pinky 埋伏、Inky 包抄、Clyde 膽小）、ghost house 出場時序與 scatter/chase/frightened 模式循環，以及靜態型別在改遊戲邏輯時救了誰。"
pubDate: 2026-01-22 04:38:36 +0800
category: programming
tags: [gleam, tiramisu, pacman, game-jam, mvu, functional-programming, web-game]
draft: false
source: facebook
sourceType: "相片"
sourceTimestamp: 1769027916
---

> 本文擴寫自 2026-01-22 的 Facebook 貼文。原稿只有兩行：一句「正在準備 game jam」，和一個 gleam-pacman 的 repo 連結。這篇把那兩行背後的三天攤開來：為什麼在 Global Game Jam 之前，我選了 Gleam 這個很少有人拿來寫遊戲的語言，把經典 Pac-Man 從零做到部署上線。

離 Global Game Jam 2026 開跑只剩幾天（主題揭曉訂在 1 月 24、25 日，jam 本體 1 月 26 日開始[1]），我決定先寫一款完整的小遊戲熱身。選題想都沒想：Pac-Man。迷宮、豆子、四隻個性不同的幽靈、scatter/chase/frightened 的狀態循環——規則我倒背如流，剩下的考驗全在工程面，正好用來測一個我一直想驗證的組合：Gleam 語言加 Tiramisu 遊戲引擎。

成果在這裡：[G36maid/gleam-pacman](https://github.com/G36maid/gleam-pacman)，線上版部署在 GitHub Pages[2]。從建 repo（1 月 21 日）到推上單一初始 commit，主體是一天之內完成的，兩天後已經能在瀏覽器裡玩。

![用 Gleam + Tiramisu 寫的 Pac-Man，跑在瀏覽器裡](/media/2026-01/122144375366958395.jpg)

## 為什麼拿 Gleam 寫遊戲

Gleam 是跑在 Erlang BEAM 上的靜態型別函數式語言，同時也能編譯成 JavaScript[3]。對網頁遊戲來說後者才是重點：編譯產物直接進瀏覽器，不用碰原生編譯工具鏈。我一直覺得寫前端 UI 很順的 Elm Architecture（Model-View-Update）沒有理由不能搬進遊戲——遊戲 loop 本質上就是「輸入進來、狀態更新、畫面重畫」，跟 MVU 的訊息迴圈是同一個形狀。

Tiramisu 印證了這件事。它是 Gleam 的 3D 遊戲引擎，官方文件開宗明義：everything is a function，沒有場景編輯器、沒有隱藏的可變狀態，你把遊戲描述成一個從 state 到 scene 的純函數[4]。執行週期跟 lustre 的 MVU 完全同構：`init` 跑一次給初始 model，每幀把佇列裡的訊息逐個餵給 `update`，最後 `view(model)` 產生場景樹、diff、渲染[5]。我在 pacman 裡就是這樣接的：鍵盤輸入變成 `Msg`，`update` 裡按訊息更新 `game_state`，`view` 把 model 對應到場景節點。

模組切法也跟著架構走。單一初始 commit 共 2,479 行 Gleam，大致是：`pacman.gleam` 722 行（組裝與主迴圈）、`ghost_ai` 422 行、`game_ui` 255 行、`game_state` 221 行、`maze` 195 行、`movement` 167 行、`collision` 155 行。狀態歸狀態、移動歸移動、碰撞歸碰撞，`gleeunit` 的測試可以直接對這些純函數跑——這在典型遊戲引擎的工作流裡是奢侈的。

依賴面很薄：`gleam.toml` 的 target 是 `javascript`，除了 tiramisu（>= 7.0）和 lustre（>= 5.5.2）之外，就只有 `gleam_stdlib`、`vec` 和 `gleam_time`。渲染底層是 three.js——Tiramisu 用正交攝影機的 2D 視角蓋在 3D 引擎上，另外 import 了 rapier3d 的 compat 版。等於我一行 three.js 都沒寫，卻享受了它的渲染品質。

## MVU 對上遊戲 loop：實際寫起來的樣子

真正動手後，MVU 對遊戲最貼合的一點是**時序可控**。Tiramisu 的 runtime 文件寫得很清楚：一幀內可能排隊多個訊息，`update` 會逐個處理完才呼叫一次 `view`[5]。Pac-Man 的遊戲節奏——移動、吃豆、鬼切換模式、計分——全都可以拆成訊息在佇列裡排隊，一幀內的狀態變化因此是確定性的序列，而不是散落在各物件 callback 裡的競態。

Ghost house 的出場時序是個好例子。經典規則裡幽靈不是同時出籠的，我按原版節奏讓它們依序離場，Clyde 更特別：要等 Pac-Man 吃掉 82 顆豆子才出場。用物件導向寫法，這種「遊戲內事件驅動的角色行為」常會長出一堆 timer 和 flag；在 MVU 裡它就只是一個欄位——`game_state` 記著已吃豆數，`update` 收到吃豆訊息時檢查門檻，到了就 dispatch 出場訊息。分數規則同理：連續吃鬼的 200/400/800/1600[6] 不過是 model 裡的一個計數器。

## 四隻幽靈，四種演算法

Pac-Man 之所以好玩，是因為四隻幽靈的 AI 各不相同。`ghost_ai.gleam` 422 行基本就是把街機原版的行為照著實作一遍：

- **Blinky（紅）**：直接追 Pac-Man 目前的格子，全程施壓。
- **Pinky（粉）**：埋伏型，目標是 Pac-Man 前方 4 格，模擬切你前瞻路線。
- **Inky（青）**：最複雜的一隻，目標點要靠 Blinky 的位置向量推導——先取 Pac-Man 前方兩格，再從 Blinky 對這點連線並加倍延伸，做出包抄。
- **Clyde（橘）**：膽小型，離 Pac-Man 遠的時候用 Blinky 的追擊邏輯，一進入視距就退回自己的巡邏角落。

模式層面，我實作了 scatter/chase/frightened 的循環：一段時間全體散開回各自的角落，接著切換成各自的追擊策略；吃到大力丸進入 frightened，幽靈變藍可被反吃。這些模式判定和目標計算全部是輸入 model、輸出目標格的純函數，單元測試可以直接餵座標驗證，不用開著遊戲手動跑圖。

## 三天的部署與收尾

UI 層的 `game_ui.gleam`（255 行）處理 HUD、開場畫面與結束流程。部署走最省事的路：`gleam.toml` 的 `target = "javascript"` 讓整包編譯成靜態網頁，丟上 GitHub Pages 就收工，線上版在 `G36maid.github.io/gleam-pacman/pacman/`[2]，curl 確認 200。

回頭看，這次練手的結論比我預期的正面。靜態型別在改遊戲邏輯時救了我不少次——迷宮資料結構重排、幽靈目標點改演算法，編譯器把漏改的地方全部點名。MVU 把遊戲狀態收斂到單一 model，除錯時印出 model 就知道整場遊戲的全貌。代價當然有：生態還小，遇到引擎邊界外的需求（音效、特效粒度）能抄的輪子不多，有些 three.js 的能力得自己透過 FFI 橋。

之後就是 GGJ 2026 本隊的事了——那四十八小時是另一個故事（台南 Team B 的全程記錄我寫在[另一篇](/blog/ggj2026-tainan-team-b/)，那篇也會看到 Gleam 出現在計畫 tech stack 裡，最後卻長成 Rust + Vue 的樣子；會不會又是一場計畫與實作的落差，當時的我並不知道）。至少 Pac-Man 這關證明了一件事：jam 前把工具鏈整套跑通一次，是比任何準備會議都值得的投資。

### 延伸閱讀

- [gleam-pacman（GitHub）](https://github.com/G36maid/gleam-pacman)
- [線上遊玩](https://G36maid.github.io/gleam-pacman/pacman/)

### References

1. [Global Game Jam — What is a game jam?（2026 年 1 月 26 日至 2 月 1 日）](https://globalgamejam.org/what-game-jam)（curl 403，bot wall，內容以搜尋快取為準）
2. [gleam-pacman 線上版（GitHub Pages）](https://G36maid.github.io/gleam-pacman/pacman/)（curl 200）
3. [Gleam 官網](https://gleam.run/)（curl 200）
4. [Tiramisu Quickstart — What is Tiramisu?](https://tiramisu.hexdocs.pm/7.0.0/guide/01-quickstart.html)（curl 200）
5. [Tiramisu Runtime — update/view 的每幀執行順序](https://tiramisu.hexdocs.pm/7.0.0/advanced/runtime.html)（curl 200）
6. [Pac-Man Dossier — Ghost 分數與 AI 行為](https://gameinternals.com/understanding-pac-man-ghost-behavior)（curl 200）
7. [Hex: tiramisu 套件頁](https://hex.pm/packages/tiramisu)（curl 200）
