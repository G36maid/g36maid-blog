---
title: "Zed 1.0 推坑：我等這天等了一年多"
description: "Zed 正式邁向 1.0：Rust + GPUI 的原生效能實測、內建 git/SSH remote/vim/LSP/debugger/multibuffer、自帶 AI key 的 Agent Panel 設定與一鍵停用 AI，加上授權結構與 FreeBSD 使用者的誠實評價。"
pubDate: 2026-04-29T23:52:52+08:00
category: programming
tags: ["zed", "rust", "vim", "git", "ai", "agent", "editor"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1777477972
---

> 本文擴寫自 2026-04-29 的 Facebook 貼文。

# Zed 1.0 推坑：我等這天等了一年多

2026-04-29 晚上我在滑 GitHub，看到 [zed-industries/zed](https://github.com/zed-industries/zed) 掛出 [v1.0.0 tag](https://github.com/zed-industries/zed/releases/tag/v1.0.0)，JosephTLyons 兩小時前剛標下去，驗證簽章綠綠的掛在 commit `69e64dd` 旁邊。當下反應就是一句話：我愛 Zed ♥️。看著這個專案從 Atom 團隊重來的實驗一路長到正式版，太感動了😭

![Zed v1.0 宣告圖：Zed logo 與 v1.0 字樣](/media/2026-04/122159538116958395.jpg)

## 為什麼它敢叫「快」

Zed 整個用 Rust 重寫，UI 跑在自家的 [GPUI](https://github.com/zed-industries/zed/tree/main/crates/gpui) 上，直接吃 GPU 畫整個編輯器，底下沒有 Electron 也沒有瀏覽器引擎。這不是行銷話術而已：How-To Geek 的 [Zunaid Ali 實測](https://www.howtogeek.com/i-replaced-vs-code-with-this-lighweight-editor-and-im-not-going-back/)，在 Windows 11 筆電上開 Django 源碼，Zed 中位數啟動 452ms、閒置 480MB；VS Code 帶著二十來個擴充套件要 1,369ms 和 2,384MB——而 Zed 那個 480MB 裡已經含 basedpyright 和 Ruff。日常體感就是打字和滾動永遠跟得上手，改一行存檔的節奏不會被編輯器拖住。

![zed-industries/zed 的 v1.0.0 release 頁面截圖，tag 由 JosephTLyons 標記](/media/2026-04/122159538146958395.jpg)

## 一裝起來就有的東西

1. **Git 整合**：stage、commit、diff、branch 都在原生 UI 裡，1.0 這版還加了 `git: view commit` 的 command palette 動作，不用切去終端機查歷史。
2. **SSH remote**：官方[遠端開發](https://zed.dev/docs/remote-development)把整個語言伺服器搬到遠端跑，本機只留 UI。我之前寫過一篇拆解它的[單一 binary 架構](/blog/zed-remote-architecture/)，`zed-remote-server` 用 musl 靜態編譯，丟到老發行版也能跑。
3. **Vim 模式**：內建，`:w`、marks、text object 都有，不用先裝擴充套件才裝 vim plugin。
4. **LSP 與 debugger**：Tree-sitter 語法高亮加上內建語言伺服器，C/C++/Python/TS 這些常見的開箱即用；debugger 也已經收進正式功能。
5. **Multibuffer**：把散在各檔案的多個片段抓成一份 buffer 一起編輯，重構時特別好用。

## AI：帶自己的 key，或者全部關掉

Zed 的 Agent Panel 可以接 [Zed Agent](https://zed.dev/docs/ai/zed-agent)，也可以透過 Agent Settings（`agent: open settings`）加自訂 LLM provider——按[官方文件](https://zed.dev/docs/ai/use-api-access)，OpenAI-compatible 的 endpoint 在 UI 填名稱、API URL、model id 就能用，API key 放在 keychain 或環境變數（官方明說不要寫進 settings.json）。所以手上有哪家模型的 key 就帶哪家的，鑰匙全在自己手裡。更外部的 agent（Claude Agent、Codex、OpenCode 這些）則走 [Agent Client Protocol](https://zed.dev/blog/bring-your-own-agent-to-zed) 掛進來，Zed 只當宿主。

不想被 AI 打擾也是一個設定的事：settings 裡 `"disable_ai": true` 一次關掉 Agent Panel、edit prediction、inline assistant 全部（見 [AI 設定文件](https://zed.dev/docs/ai/configuration)），或者只把 `edit_predictions` 的 provider 設成 `none`。AI 是可選零件，這點我很吃。

## 授權與源碼

Zed 在 2024 年初[全面開源](https://zed.dev/blog/zed-is-now-open-source)：編輯器主體是 [GPL-3.0](https://github.com/zed-industries/zed/blob/main/LICENSE-GPL)，伺服器端元件是 AGPL，GPUI 框架用 Apache-2.0 讓大家可以拿去寫自己的桌面應用——官方在 [software-overview 頁](https://zed.dev/software-overview)把各部分授權列得清楚。想要一個 copyleft 的編輯器而不是又一個挂著 source-available 名號的產品，Zed 是目前最好的選擇之一。

## 用了一年多的評價

好話上面寫完了，該講剩的。擴充套件生態跟 VS Code 完全不在同一個量級，一些冷門語言或工具鏈要自己等社群補；remote 功能雖然好用，但 server binary 版本必須跟本機完全一致，跨機器升級偶爾會卡一下。極端大檔案的表現也不是無敵——[keypress.sh 的實測](https://peeknext.com/benchmarks/benchmarks.md)裡千萬行等級的檔案 Zed 會撐不住，Vim 在那個賽道反而穩。另外官方只出 macOS/Windows/Linux 版，我主力是 FreeBSD，是靠自己做[非官方 port](/blog/zed-freebsd-port/) 才天天用得上——也是因為做了 port 才有機會摸進它的源碼，順手貢獻過 remote 相關的 patch。

但這些都不影響結論：超快、輕量、開源、pure Rust，git/ssh/vim/LSP/debugger/multibuffer 全都原生，AI 要開要關全在我手裡。Zed 從 pre-1.0 的一千多個版本一路週週出貨走到今天，1.0 不是終點，是它終於敢說「大部分開發者裝上去五分鐘就能回家」的那天。你如果一兩年前試過覺得缺東西，這次值得再開一次。
