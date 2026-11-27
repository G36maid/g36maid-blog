---
title: "我的第四/第五個 PR 進了 Zed 主線：一個 macOS posix_spawnp 的平台地雷"
description: "收到 PR 被 merge 通知的那天晚上,我連自己是第四個還是第五個貢獻者都數不清。這篇記錄 Zed #55672 的修復過程:Apple libc 的 posix_spawnp 用 parent 的 cwd 和 PATH 找執行檔,無視 child 的 current_dir 與 envp,Nix/direnv 的 external formatter 因此在 macOS 上整個失效。"
pubDate: 2026-06-22T20:02:14+08:00
updated: 2026-11-27T00:00:00+08:00
category: essay
tags: ["zed", "open-source", "rust", "macos"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1782129734
---

> 本文擴寫自 2026-06-22 的 FB 貼文——內容只有一句「我的第四/第五個 PR 已經合併進 zed主線了 開心」和一張慶祝梗圖。發文當下是收到 merged 通知後第三天,正文保留那時的脈絡與情緒,文末補一段 2026-11 的後續。

![原 FB 貼文附圖（慶祝梗圖）：動漫風藍髮角色握拳、笑得瞇起眼的開心表情](/media/2026-06/122166324722958395.jpg)

收到 Zed 的 merged 通知那晚,我開 FB 打字,第一句就卡住了:這是我第幾個 PR?想了一下,發現自己真的數不清,於是標題就寫成了「第四/第五個」。

## 為什麼連自己都數不清

去年的兩個 PR([FreeBSD 安裝腳本與文件](https://github.com/zed-industries/zed/pull/30981)、[FreeBSD 建置說明](https://github.com/zed-industries/zed/pull/33617))都是 docs 性質;[extensions repo 的 MarkItDown MCP 套件](https://github.com/zed-industries/extensions/pull/3372)合併於 2025-09,但那嚴格說是寫擴充套件,不算動 Zed 本體。這次合進來的 [#55672](https://github.com/zed-industries/zed/pull/55672) 是第一個改到編輯器核心行為的 code PR——把 extensions 算進來是第四個,不算的話好像也不對,前面那兩個文件 PR 的付出明明是真的。數不出一個自己服氣的答案,就用斜線帶過吧。

## 這次修的東西:執行檔查找順序反了

起頭是 issue [#50536](https://github.com/zed-industries/zed/issues/50536):有人在 Zed 設定裡把 external formatter 指成相對路徑(他的案例是 Bazel toolchain 裡的 clang-format),在 Linux 上一切正常,macOS 上直接炸「Failed to format buffer via external command」。

挖下去才發現是 Apple libc 的行為:`posix_spawnp` 定位執行檔的時候,用的是 **parent process** 的 `getcwd()` 和 `getenv("PATH")`,而不是你傳進去的 child `current_dir`(走 `posix_spawn_file_actions_addchdir_np` 設的那個)和 `envp`。child 的工作目錄和環境變數要等執行檔「已經找到了」才生效——查找順序整個是反的。所以兩種設定會壞:formatter 只寫裸名稱(例如 `"black"`)時,它拿 parent 的 PATH 找,direnv 或 Nix 弄出來的 project-specific PATH 完全無效;寫相對路徑(例如 `"./script.sh"`)時,它拿 Zed 本身的 cwd 解析,只有你剛好坐在 project root 開專案才會動。

這個雷不是 Zed 獨有。Rust 自己的 std 也處理過,`rust-lang/rust#48624` 在 macOS 上對 PATH 被改動的情況就繞過 posix_spawn 走 fork+exec。Zed 是 [PR #49090](https://github.com/zed-industries/zed/pull/49090)(2026-02)把 macOS 的 Command 換成自製的 posix_spawnp 實作之後,這個平台行為才整個暴露出來的——那個 PR 的立意是好的(連 pre_exec hook 都能走 posix_spawn),只是撞上 Apple libc 的角落。

修法本身不大,`crates/util/src/command/darwin.rs` 一個檔案,+129/-3:在呼叫 `posix_spawnp` 之前先把程式解析成絕對路徑。裸名稱用 `which::which_in` 對 child 的 PATH 找;相對路徑用 `Path::join(current_dir)` 補成絕對的;解析失敗就 fallback 回原值,讓該報的錯照報,不要悄悄換行為。四個 unit test 把情境釘住:自訂 PATH 找到裸名稱、找不到時照樣報錯、env 完全沒有 PATH key 時不炸、相對路徑對 `current_dir` 解析。Linux 完全不受影響,因為那邊走 `smol::process::Command`,是真的 fork+execve——這條 spawn 路徑的平台差異我會這麼熟,是因為做 [FreeBSD port](/blog/zed-freebsd-port/) 的時候整條挖過一遍。

## Review 的五十六天

5/4 開 PR。5/10 dnlzro 下了一個 CHANGES_REQUESTED,內容只有一件事:缺一個 import,附上 suggestion(`use std::os::unix::ffi::{OsStrExt, OsStringExt};`,for `into_vec()`),然後補一句「他自己的 Mac 上驗證過,issue 裡的情況確實被修掉了」。開源 review 能收到 reviewer 親手 build、親手重現 issue 再回來跟你說「其他都好」,這比 approve 本身珍貴。隔天早上 push 修正,當天 approved。

然後是五個禮拜的排隊。6/19,kubkon(Jakub Konka)approve:「Looks great, thanks! I merged main and fixed a couple of tiny nits.」——maintainer 合併前自己先 merge main,順手把兩個小 nit 修掉,才推進主線。等待五週和最後一哩被人溫柔收尾,就是開源 review queue 的一體兩面。

merge commit `d1f500e` 從此在 Zed 主線裡。之後每個在 macOS 上用 Nix 或 direnv 管 toolchain、把 formatter 指成專案內路徑的人,不會再撞到這面牆。原貼文的結論只有兩個字:開心。不附帶但書的那種。

## 2026-11 update

發文時「後面還有兩個在排隊」不是客套:buffer formatting 的 [#53942](https://github.com/zed-industries/zed/pull/53942) 於 2026-07-01 合併,format on save 只 format 修改行的 [#49964](https://github.com/zed-industries/zed/pull/49964)(+1507/-34,夠大到值得另寫一篇)於 2026-07-08 合併。數數問題自動消滅——把 extensions 算進來,這篇的主角是第四個,現在清楚是第六個了。FreeBSD remote server 的 [#55388](https://github.com/zed-industries/zed/pull/55388) 還開著,繼續等。

## References

- [PR #55672: Fix binary name resolution against custom PATH on macOS](https://github.com/zed-industries/zed/pull/55672)(merge commit `d1f500e`)
- [Issue #50536: regression with use of relative path for external formatter](https://github.com/zed-industries/zed/issues/50536)
- [PR #49090: util: Always use posix_spawn on macOS even with pre_exec hooks](https://github.com/zed-industries/zed/pull/49090)
- [rust-lang/rust#48624: Command: Support posix_spawn() on FreeBSD/OSX/GNU Linux](https://github.com/rust-lang/rust/pull/48624)
- 站內:[用 AUR 思維替 Zed Editor 做非官方 FreeBSD port](/blog/zed-freebsd-port/)、[Zed Remote 為什麼不做成 VS Code Server](/blog/zed-remote-architecture/)
- 圖:原 FB 貼文附圖(慶祝梗圖)
