---
title: "在 Zed 裡用 task::Spawn 呼叫 Lazygit：把 TUI Git 接進編輯器的三步設定"
description: "Zed 當時還沒有原生 git tree view，lazygit 也沒有內建整合。用 tasks.json 定義 task、keymap 綁一組快捷鍵，就能在 Zed 的中央面板直接叫出 lazygit，補上視覺化 Git 操作的一塊。"
pubDate: 2025-10-31T15:30:29+08:00
category: programming
tags: ["zed", "lazygit", "git", "terminal", "editor"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1761895829
---

> 本文擴寫自 2025-10-31 的 Facebook 貼文。2026-11 重寫時對照了 Zed 官方文件現況（zed.dev/docs/tasks）與 Git 面板的發展，逐項確認這套配置仍然有效，詳見〈2026 現況〉一節。

長期以來 Zed 的 Git 整合一直偏陽春：編輯器內建了 gutter blame、git diff 面板，但沒有一個原生的 git tree view 可以讓我瀏覽分支、看 commit graph；而我自己慣用的 lazygit，官方也沒有提供任何編輯器整合，想在 Zed 裡用它就只能另開一個終端機視窗，切來切去相當破壞專注力。

好在 Zed 的 task 機制提供了漂亮的解法。這招出自 Zed blog 的 [Hidden Gems part 1](https://zed.dev/blog/hidden-gems-team-edition-part-1)（原作者是 Reddit 上的 /u/parawaa），把 lazygit 當成一個 task 在 Zed 的中央面板裡 spawn 出來，再綁一組快捷鍵直接呼叫。整個過程不到五分鐘，以下照操作順序記錄。

![在 Zed 裡以 task 啟動 lazygit 的畫面，出自 Zed blog Hidden Gems part 1](/media/2025-10/122129664812958395.jpg)

## task 機制是什麼

Zed 的 [Tasks](https://zed.dev/docs/tasks) 是內建的任務系統：把一段 shell 指令寫進 `tasks.json`，就能透過 `task: spawn` 或 `task::Spawn` action 重複執行。task 會跑在 Zed 整合終端機（真正的 PTY）裡，所以不只是 echo 或 build script，連需要完整終端介面的 TUI 程式都能跑。task 可以放在全域的 `~/.config/zed/tasks.json`（所有專案可用），或專案內的 `.zed/tasks.json`（只有該專案可用）。它還支援 `$ZED_WORKTREE_ROOT` 這類變數，可以用來把 lazygit 指到正確的專案根目錄。

## 1. 安裝 lazygit

先確認系統上有 [lazygit](https://github.com/jesseduffield/lazygit)：

```bash
# macOS（Homebrew 也支援 Linux）
brew install lazygit
# Windows
scoop install lazygit
# 或 winget install JesseDuffield.lazygit
# Arch Linux
sudo pacman -S lazygit
# Fedora / RHEL 系
sudo dnf copr enable dejan/lazygit
sudo dnf install lazygit
# Debian 13 / Ubuntu 25.10 之後
sudo apt install lazygit
# FreeBSD
pkg install lazygit
```

舊版 Debian/Ubuntu 沒有收錄的話，去 GitHub Releases 下載 binary 也行。裝完記得在終端機跑一次 `lazygit --version`，確認 PATH 抓得到。lazygit 本身是 Go 寫的單一 binary，幾乎不依賴任何動態函式庫，這也是它能被收進這麼多套件庫的原因。

## 2. tasks.json 定義 task

打開 `~/.config/zed/tasks.json`（可用 `zed: open tasks` 直接叫出），加入：

```json
[
  {
    "label": "LazyGit",
    "command": "lazygit -p $ZED_WORKTREE_ROOT",
    "shell": {
      "program": "sh"
    },
    "hide": "on_success",
    "reveal_target": "center",
    "show_summary": false,
    "show_command": false,
    "allow_concurrent_runs": true,
    "use_new_terminal": true
  }
]
```

幾個欄位值得說明：`reveal_target: "center"` 讓 task 開在中央編輯區而不是側邊終端面板，lazygit 的多欄介面才放得下；`use_new_terminal` 加上 `allow_concurrent_runs` 代表可以同時開多個 lazygit 實例互相比較；`hide: "on_success"` 則是在正常退出後自動收掉那個分頁。

## 3. keymap 綁定快捷鍵

接著在 `keymap.json` 綁一組鍵，直接 `task::Spawn` 這個 task：

```json
{
  "context": "Workspace",
  "bindings": {
    "cmd-shift-g": [
      "task::Spawn",
      { "task_name": "LazyGit", "reveal_target": "center" }
    ]
  }
}
```

原作把 macOS 預設的 `cmd-shift-g` 覆蓋掉了；Linux/Windows 可以改成 `ctrl-shift-g`，或任何不衝突的組合。

## 實際使用

在 Zed 裡按快捷鍵，lazygit 就會以完整的 TUI 介面出現在中央面板：按空白鍵 stage、`c` commit、`shift+P` push，全部留在編輯器內完成。介面是五個區塊的標準 lazygit 版面：左邊 status、branches、commits，右邊 diff 與 stash，操作邏輯跟在終端機裡完全一樣，肌肉記憶不用重學。如果不想記快捷鍵，也可以用 command palette 跑 `task: spawn`，從 modal 選單裡挑 LazyGit。離開後分頁自動消失，工作區又回到乾淨狀態。

## 踩雷注意

- **task 跑在終端面板**：task 本質是跑在 Zed 的整合終端機裡。`reveal_target: "center"` 只是換個位置顯示；如果拿掉這個欄位，lazygit 會被塞進狹窄的終端面板，版面幾乎不可用。
- **cwd 與 `$ZED_WORKTREE_ROOT`**：task 預設的執行目錄是專案根目錄，但根據 Zed 官方 issue 的回報，若游標停留在全域 `tasks.json` 或不在 worktree 內的 buffer，`ZED_WORKTREE_ROOT` 可能 unset 或指向家目錄。指令明確寫 `lazygit -p $ZED_WORKTREE_ROOT`（或加 `"cwd"` 欄位）比較保險。
- **需要完整 TTY**：lazygit 是 TUI 程式，需要真正的 pseudo-terminal。Zed 的終端是 PTY 所以沒問題，但如果把 task 轉去別的執行環境（例如某些 remote 管線或 CI shell），lazygit 會直接開不起來。
- **Windows 的 shell 欄位**：`"shell": {"program": "sh"}` 在 Windows 上沒有 `sh` 可用，改成省略 shell 或指定 PowerShell。
- **不想覆蓋預設快捷鍵**：`cmd-shift-g`／`ctrl-shift-g` 原本有內建行為，若不想覆蓋，換成 `alt-g` 這類組合即可，task 名稱對得上就行。

## 2026 現況：這招還能用嗎

重寫這篇時我把 [zed.dev/docs/tasks](https://zed.dev/docs/tasks) 的現行文件逐項對了一遍，結論先講：**配置本身完全不用改，原樣照跑。**逐項確認如下——

- 欄位全部健在：`command`、`shell`、`hide`、`show_summary`、`show_command`、`allow_concurrent_runs`、`use_new_terminal`、`cwd`、`reveal`，以及文件裡的完整 task template 範例，跟 2025 年 10 月寫這篇時一致。
- **官方文件現在直接拿 lazygit 當範例**：文件在「Custom keybindings for tasks」一節給的示範就是 `{"label": "start lazygit", "command": "lazygit -p $ZED_WORKTREE_ROOT"}` 配 `task::Spawn` 加 `reveal_target: "center"`——當年的社群招式已經被收編成官方文檔的 canonical example。`$ZED_WORKTREE_ROOT` 也仍是正式支援的變數。
- 一個值得知道的小差異：在現行文件裡，控制「task 開在哪」的主戰場是 **keymap 裡 `task::Spawn` 的參數**（`reveal_target: "center"`）；`tasks.json` 欄位表內建的是 `reveal`/`hide`（控制顯示與收合行為）。實務上兩邊都寫也不會壞——上面第 2、3 步的配置就是這樣，keymap 的 `reveal_target` 會把 lazygit 帶到中央面板。

更大的背景變化是 Zed 原生 Git 本身在 2026 年追上來了：Git Graph（commit graph 視圖，含搜尋、branch/tag 標記、點開看 diff、commit 資訊面板）在 2026 年初陸續登陸 preview 和 stable，之後 Git Panel 又加了 commit history、staged/unstaged changes 專屬 multibuffer 等功能。也就是說，當年「沒有原生 git tree view」這個缺口，官方已經補上了一大塊。

那這招還有存在價值嗎？我現在的用法是兩者並存：Git Graph 看歷史、找 commit、看檔案層級的 diff，快又原生；但 stage、hunk 級操作、rebase、互動式改歷史這類活，lazygit 還是順手得多——而 task 機制正是讓 lazygit 隨叫隨到、又不離開編輯器的那座橋。配置不用動，繼續用。

## 延伸閱讀

- [Zed docs: Tasks](https://zed.dev/docs/tasks)——現行欄位與變數的權威來源，內建 lazygit 範例
- [Zed blog: Hidden Gems part 1](https://zed.dev/blog/hidden-gems-team-edition-part-1)——這招的出處（/u/parawaa）
- [Zed blog: Native Git support](https://zed.dev/blog/git)——原生 Git 整合的設計說明
- 之前手動做 FreeBSD port 的經驗寫在[這篇](/blog/zed-freebsd-port/)，Zed 生態這種「自己動手補」的風格倒是挺一貫的
