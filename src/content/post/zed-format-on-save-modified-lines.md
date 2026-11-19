---
title: "為 Zed 做 format on save 只 format 修改行：一個兩年沒人做的 feature"
description: "legacy codebase 一存檔整檔重排、diff 爆炸的痛點，自己動手在 Zed 實作 format_on_save modifications 模式的完整過程：save pipeline、git diff、LSP range formatting 三層，還有一個 staged diff 的 bug。"
pubDate: 2026-02-25T00:34:20+08:00
category: programming
tags: ["zed", "editor", "git", "open-source", "rust"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1771950860
---

> 本文擴寫自 2026-02-25 的短貼文（當時 PR 還開著），寫下我自己在 Zed 上實作這個 feature 的完整過程。文末補了 2026-07 的後續。

## 痛點：存一個檔，幾百行 diff

我手上維護著幾個 legacy 專案，程式碼的縮排和格式早就和 formatter 的設定脫節了。以前用 VS Code 的時候，我會把 format on save 關掉，改按手動快捷鍵——但只要哪天手癢把設定打開，或者換了一台機器忘了關，災難就來了：改三行，存檔，`git diff` 跳出一千多行，其中一千行是 formatter 重排整個檔案的雜訊。code review 的時候 reviewer 根本找不到我到底改了什麼，git blame 也整個斷掉。

VS Code 針對這個問題有 `editor.formatOnSaveMode`，可以設成 `modifications`，只 format 有改動的行。這個功能我用了好幾年，已經變成工作流的一部分。但 Zed 一直沒有對應的東西——format on save 要嘛整檔 format，要嘛關掉，沒有中間選項。 issue tracker 上這個 feature request 拿了不少讚，掛了兩年，一直沒有人動。

兩年沒人動，不是因為難到天邊去，而是因為它一次要動三層東西：

1. **Save pipeline**：存檔流程中間要插一個「先算出哪些行改過、再決定 format 範圍」的步驟，動到 editor 核心路徑。
2. **Diff 計算**：哪些行算「修改過」？要拿 git diff 來比對，而 Zed 裡 git diff 相關的基礎建設是為 gutter 顯示設計的，不是為「把 diff 轉成 buffer 範圍」設計的。
3. **LSP range formatting**：真正對部分區間做 format，靠 LSP 的 `textDocument/rangeFormatting`，而且不是每個 language server 都支援，要有 fallback 策略。

三層各自都不算大，但疊起來就是一個要懂 editor 內部架構的中型改動，再加上要設計設定語意——沒 diff 的時候要嘛跳過要嘛整檔 format，兩種期待都有人要，誰都說服不了誰，就一直擺著。這種 issue 最怕的是做到一半發現第二層的基礎建設不夠用，得先去開另一支 PR 補地基，於是範圍越滾越大，最後沒人想接。

## 實作過程

我決定自己跳下去做。最後這個 PR（[#49964](https://github.com/zed-industries/zed/pull/49964)）一共 +1507/-34，合併時疊了十三個 commit，其中五個是主體功能，我照實際的順序講。

### 1. 加上設定選項

第一個 commit 是 `Add Modifications and ModificationsIfAvailable to FormatOnSave`。我把 `format_on_save` 的型別從「要嘛 on 要嘛 off」的結構，擴充成可以接受兩個新模式。命名直接對齊 VS Code 的 `formatOnSaveMode`，之後從 VS Code 匯入設定時可以無痛對應：

- `modifications`：只 format git diff 覆蓋到的行。需要 source control 資訊，拿不到 diff 就整個跳過，什麼都不 format。
- `modifications_if_available`：同樣只 format 修改行，但拿不到 diff（untracked file、repo 外、LSP 不支援 range formatting）時，fallback 回整檔 format。

我自己的 default 是前者——如果這個功能的前提不成立，我寧願它什麼都不做，也不要悄悄動到沒改過的行。

### 2. 算出修改範圍

第二個 commit 是 `editor: Add compute_modified_ranges for git diff based range calculation`。這是整個 feature 的核心：拿 working tree 和 git 的差異，把 diff 的 hunk 換算成 buffer 裡的 row range，再餵給 range formatting。

這一步依賴另一支 dependency PR 先把 range-based 的 whitespace/newline 處理基礎建設補起來，因為 Zed 原本的 diff 顯示是「行級、拿來畫 gutter 標記」的：它只需要知道「這行有改」，不需要知道「這幾行合起來是一個可以送出去 format 的連續範圍」。要把 hunk 換算成範圍，還要處理 hunk 邊界、多個 hunk 合併、format 完之後行數變了怎麼對回去，中間少了一整層。

### 3. 接進 save pipeline

第三個 commit 是 `project: Integrate modifications mode into save pipeline`。存檔時如果模式是 modifications 系列就先算 range、只對這些 range 送 `textDocument/rangeFormatting`，拿不到就用上面的語意決定跳過或 fallback。這一步大部分時間花在釐清存檔路徑上哪些狀態在那個時間點是可信的：diff 要在 format 之前算，format 要在寫入磁碟之前做完，而且 format 完行數可能變，寫入的必須是 format 後的內容。時機插錯一格，要嘛 format 到舊的 diff，要嘛寫出去的檔案沒 format 到。

### 4. VS Code 設定匯入

第四個 commit 是 `settings: VS Code formatOnSaveMode import+tests`。Zed 會匯入 VS Code 的 keybindings 和設定，我把 `formatOnSaveMode` 加進匯入清單，值直接對應，附上測試。

### 5. 踩雷：staged diff 不是 uncommitted diff

第五個 commit 是修正一個我自己的 bug，也是整個 PR 裡我最想記下來的一段。

一開始我算 diff 用的是 unstaged diff（working tree vs index）。測試的時候發現一個奇怪的案例：`git add` 之後又繼續編輯同一個檔案，這時候 working tree 和 index 的差異只剩最後那幾行，於是 format 就只碰到最後幾行——但我真正「這次 session 改過」的東西包含前面已經 staged 的部分，那些行完全漏掉。

修正方式是改拿 working tree vs HEAD 的 uncommitted diff（commit `editor: Use uncommitted diff for format-on-save modifications`），把 staged 和 unstaged 的改動全部算進去。這也和 Zed git gutter 的行為一致：gutter 標示的也是 uncommitted 的改動，format 的範圍和你在 gutter 上看到的會是同一組行。單純換一個 diff 來源就修好了，但要在 review 時說清楚「為什麼 unstaged 是錯的語意」，這個 bug 才有說服力。

### 6. 補 regression tests

最後一個 commit 是 `editor: regression tests with FakeFs git repo helper`，補了四個 git diff matrix 測試：有 diff、沒 diff、untracked file、stage 後繼續編輯。特別是最後那個，正是我踩到的雷，直接寫成測試釘死。

## 怎麼設定

併入之後，在 Zed 的 `settings.json` 裡這樣設：

```json
{
  "languages": {
    "Rust": {
      "format_on_save": "modifications_if_available"
    },
    "TypeScript": {
      "format_on_save": "modifications"
    }
  }
}
```

`format_on_save` 現在接受 `on`、`off`、`modifications`、`modifications_if_available` 四個值。差別只有一個：沒辦法判斷修改範圍的時候（untracked file、不在 git repo、LSP 不支援 range formatting），`modifications` 會跳過不 format，`modifications_if_available` 會退回整檔 format。不確定要選哪個的話，選 `modifications_if_available` 比較接近 VS Code 預設的心情；跟我一樣有整檔重排陰影的，用 `modifications`。

也可以對特定 language server 關掉，或靠 VS Code 匯入直接帶進來：如果你原本在 VS Code 就有設 `editor.formatOnSaveMode`，匯入設定時會自動對應。


補充一個實際用的細節：這個模式和 Zed 的 git gutter 是同一套資料來源，所以 format 的範圍就是你在左側看到有顏色標記的那些行，行為可以直接用眼睛驗證。我自己在幾個 legacy 專案把預設 format on save 換成這個模式之後，存檔造成的 diff 雜訊降到幾乎為零，review 裡終於看得到我改的東西。另外 range formatting 是送給 language server 的，所以 formatter 的行為跟手動 format 整檔時完全一致，不是 Zed 自己土砲的縮排修正，這點在導入的時候可以放心。

## PR review 過程與心得

PR 在 2026-02-24 開出去，[經過三十則 review comments 的迭代](https://github.com/zed-industries/zed/pull/49964)，最後在 2026-07-08 併進主線。

Review 過程幾個印象比較深的點：

- **命名被認真討論**。兩個模式的語意差別（跳過 vs fallback）是 reviewer 最在意的部分，最後留在 `modifications` 和 `modifications_if_available` 這組名字上，對齊 VS Code 讓遷移成本最低。
- **staged diff 那個 bug 是 review 追出來補修的**。修正 uncommitted diff 的 commit 和 regression tests 都是 review 迭代中加進去的。這是我覺得 open source review 最有價值的地方：我自己測試的案例組合不夠，別人會問「那 git add 之後又改怎麼辦」。
- **Fallback 語意要有明確文件**。什麼情況會 fallback、什麼情況會跳過，最後都寫進文件裡，不然使用者會踩到「以為有 format 結果沒有」的隱形行為。Review 裡來回最多的是「這個情境到底算不算『無法判斷』」，每種情況都要講得出理由。

另一個心得是 PR 描述本身很重要。開 PR 的時候我把痛點情境、三層架構、兩個模式的差別整段寫進去，後來 review 的討論幾乎都圍繞在這個框架上進行，沒有出現「你為什麼要這樣做」這種從頭解釋的回合。反過來說，issue 裡十七則留言累積下來的各種使用情境（有人要 fallback、有人堅持不要），也是靠 PR 開頭那段歸納成一個可以討論的設計，這算是把兩年的討論一次收斂的經驗。

寫 open source feature 的心得：這種「高讚但兩年沒人做」的 issue，通常不是難，而是卡在三個模組的交界上，沒有人同時踩過那三個坑。真的跳下去做之後，最花時間的不是核心邏輯（`compute_modified_ranges` 本身兩百行不到），而是理解 Zed 的 save pipeline 和 diff 基礎建設現有的形狀，再把新東西塞進不破壞舊行為的位置。

還有就是，自己的痛點自己解最划算。這個 feature 對別人來說是 nice-to-have，對每天在 legacy codebase 裡掙扎的人（我）是 daily driver。

## 2026-07 update

PR 已於 2026-07-08 併入 Zed 主線，比我貼這篇短文的時候多了好幾個 commit：uncommitted diff 的修正、FakeFs git repo helper 的四個 regression tests，還有依 review 意見把 diff 語意又改了一輪（一度 revert 回 unstaged diff 對齊 VS Code 行為，最後定案在現在的版本）——整個語意的收斂過程都在 PR 記錄裡。也就是說正式發佈的版本裡，staged diff 那個雷已經被測試釘死了。設定方式如上，等下一個 release 就會帶上。

## 相關文章

- [Zed on FreeBSD port 的過程](/blog/zed-freebsd-port/)
- [Zed 的 remote 架構](/blog/zed-remote-architecture/)
- [Zed markitdown extension](/blog/zed-markitdown-extension/)
- [一個 Hyprland PR 的合併紀錄](/blog/hyprland-pr-merged/)

## References

- [PR: Add support for format_on_save only changed lines (zed#49964)](https://github.com/zed-industries/zed/pull/49964)
- [VS Code: editor.formatOnSaveMode](https://code.visualstudio.com/docs/editing/codebasics)
- [Zed: settings reference](https://zed.dev/docs/reference/all-settings)
