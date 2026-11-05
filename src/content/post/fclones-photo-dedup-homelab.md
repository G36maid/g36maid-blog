---
title: "Homelab 照片去重工具推薦：fclones vs rmlint vs Czkawka"
description: "照片庫十幾年疊出來的重複檔怎麼清：fclones 的分層雜湊與 pipe 工作流、rmlint 產生腳本讓人審核的安全哲學、Czkawka 的相似圖片搜尋，三工具優缺點、可複製指令與踩雷注意，外加誠實的選擇建議。"
pubDate: 2026-08-19T03:45:41+08:00
category: essay
tags: ["homelab", "rust", "tools", "dedup", "truenas"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1787082341
---

> 本文擴寫自 2026-08-19 的 Facebook 貼文。原稿只有三句：「以前都用 rmlint，今天試了 fclones 直接回不去，速度跟體驗完全不同次元。如果想要多功能/GUI/TUI 的話也大推 Czkawka！🦀」。這裡把它擴寫成完整的工具評比；擴寫時間為 2026 年 11 月，版本資訊以此為準。

## 問題：照片庫裡的重複檔是怎麼長出來的

我的照片庫躺在 homelab 的 TrueNAS 上（Proxmox 跑虛擬機、ZFS pool 放資料），內容物大致三種來源：手機備份、聊天軟體收到的圖、還有長年累積的動漫圖收藏。十幾年疊下來，重複檔的形態很固定：

- **備份工具換過好幾代**，每套的目錄結構不同，同一張照片在不同時期的目錄裡各留一份；
- **截圖重複存**、壓縮版和原圖並存；
- **收藏圖從不同站點抓**，檔名天差地遠但內容一模一樣。

手動清是天真行為，檔案量是以十萬計的。所以這幾年我陸續試了三個去重工具，剛好代表三種不同哲學：fclones（快而單純的 CLI）、rmlint（產生腳本讓人審核）、Czkawka（GUI/TUI 全功能）。

## 三個工具總覽

**fclones**（[pkolaczk/fclones](https://github.com/pkolaczk/fclones)，Rust，MIT，目前最新 [v0.35.0](https://github.com/pkolaczk/fclones/releases)）

- 優點：快得誇張。它不是拿到檔案就笨笨地算 hash，而是分層過濾：先按檔案大小分組、丟掉大小不同的，再比前後綴雜湊，最後才對倖存者算完整 hash；全程並行，還會依裝置是 SSD 還是 HDD 調整存取順序，讀 HDD 時照物理位置排序、Linux 上還友善 page cache（不把你的資料趕出快取）。作者 README 裡的自測 benchmark（146 萬個路徑、316 GB）顯示 fclones 34.6 秒跑完，rmlint 2:28、czkawka 2:09——雖然是作者自己的數字，但和我實際的體感一致。
- 缺點：只有 CLI，沒有互動畫面；功能也單純，就是找重複/unique/replica 數量異常。

**rmlint**（[sahib/rmlint](https://github.com/sahib/rmlint)，C，GPLv3，最新 [2.11.0 Evolving Echidna](https://rmlint.readthedocs.io/)）

- 優點：哲學最謹慎——它自己不動手，而是產出一份 `rmlint.sh`，我看過、改過再執行。功能面也廣：重複目錄合併（`-D`）、treemerge、cache 加速二次掃描。
- 缺點：維護步調慢，2025 年還有人開 issue 問 [Is rmlint still maintained?](https://github.com/sahib/rmlint/issues/670)；速度被 fclones 甩開一個世代。

**Czkawka**（[qarmin/czkawka](https://github.com/qarmin/czkawka)，Rust，MIT；新版 GUI [Krokiet](https://github.com/qarmin/czkawka) 因 Slint 授權為 GPL-3.0-only）

- 優點：功能最全面，除了重複檔還有相似圖片、相似影片、空檔案/空目錄、壞擴展名、EXIF 清除，GUI/Krokiet、CLI、Android（Cedinia）全都有，還有掃描 cache。
- 缺點：專案正在過渡——舊的 GTK4 前端到 [v12.0.2](https://github.com/qarmin/czkawka/releases)（2026-09）為止不再出 binary，全面改推 Krokiet；想用 GUI 得換個心智模型。

## 實際操作

### fclones：先 group、再決定怎麼處理

```bash
# 安裝：snap install fclones / brew install fclones / cargo install fclones

# 第一步永遠是 group，輸出報告，不動檔案系統
fclones group /tank/photos -s 1M --name '*.jpg' '*.png' > dupes.txt

# 兩棵目錄樹之間找重複（樹內部不互比）：拿備份庫比對主庫超好用
fclones group --isolate /tank/photos /mnt/backup-2023

# 看過報告後再套用；預設把冗餘副本換成 hard link
fclones link < dupes.txt
# 或直接刪掉最舊的副本
fclones remove --priority oldest < dupes.txt
```

我最愛 `--isolate`：手機備份 vs 收藏庫互相比對、又不用擔心庫內本來就該存在的重複被誤傷。`remove`/`link` 都可以先存報告再餵進 stdin，等於強制內建了一個審核關卡。

### rmlint：產生腳本、人類簽核

```bash
rmlint /tank/photos          # 預設產出 rmlint.sh
./rmlint.sh -n               # dry run：只印出會做什麼
./rmlint.sh -d -p            # 直接執行；-p 刪除前再驗一次兩檔仍相同
```

`-p`（paranoid）這種「刪之前再 re-check」的設計我很欣賞，掃描和執行之間隔了幾天也不怕檔案中途被改。

### Czkawka CLI 一行搞定，GUI 用滑鼠

```bash
czkawka_cli dup -d /tank/photos -s hash -f results.txt
```

真正的大殺器是相似圖片搜尋（不同解析度、浮水印都抓得到），這是 fclones 和 rmlint 都沒有的。手機備份裡那些「同構圖不同尺寸」的孤兒，靠它清。

## 踩雷注意

- **hard link 只在同一個檔案系統內有效**。我的照片庫和備份是不同 ZFS dataset，跨 dataset 換 link 會失敗，這種場景老實用 `remove`。
- **掃描和動手之間不要隔太久**，也別在掃描後繼續往庫裡寫檔；rmlint 文件裡就明講這是無解的通用問題，靠 `-p` 之類的 recheck 緩解。
- Czkawka GTK 版裝好後不會再更新，新安裝直接上 Krokiet。

## 我的選擇

結論回到原稿那句話：**fclones 速度跟體驗完全不同次元，用過直接回不去。** 日常大規模清重複就是它；要產出可稽核腳本、給不信任黑箱刪檔的場景，rmlint 依然是漂亮的答案；想要多功能/GUI/TUI、特別是相似圖片，就大推 Czkawka。我的 homelab 越來越 Rust 化——連跑在裡面的 [GLM 本地部署](/blog/exl3-glm-local-deploy/)、[mermaid 渲染的 mmdr](/blog/mmdr-mermaid-without-chromium/) 都是 Rust 系工具——照片去重這格也順理成章換成了 🦀。
