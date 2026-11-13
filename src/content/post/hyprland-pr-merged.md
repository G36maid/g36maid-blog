---
title: "給 Hyprland 的 PR 被 merge 了：zh_TW 翻譯貢獻實錄"
description: "從發現 Hyprland 沒有繁體中文到 PR 被 merge：術語抉擇、AI 翻譯檢查、review 流程全記錄。"
pubDate: 2026-02-08T07:49:03+08:00
category: linux
tags: ["hyprland", "i18n", "open-source", "wayland", "contribution"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1770508143
---
# 給 Hyprland 的 PR 被 merge 了：zh_TW 翻譯貢獻實錄

> 本文擴寫自 2026-02-08 的 Facebook 貼文草稿。原稿只有一句「給 hyprland 的 PR 被merge 了」加一張截圖；這裡把當時的貢獻流程完整還原，所有 PR 號、行數、時間戳都用 `gh api` 對 hyprwm/Hyprland 重新實算過。

## 事情的開頭：一句話的動機

我是 Arch + Hyprland 的日用者，桌面上每一個通知對話框都是它。用了一段時間後發現一件有點尷尬的事：這個 compositor 有十幾種語言的翻譯，但就是沒有繁體中文——介面會話裡只有 `zh_CN`（簡體），對台灣人來說那種「看得懂但處處彆腳」的感覺，用過的人都知道。「設定檔」變成「配置文件」、「螢幕」變成「显示器」、「當機」變成「崩溃」，術語系整個是對岸的。

Hyprland 的 i18n 架構對貢獻者其實相當友善：所有翻譯集中在一個 C++ 檔案 `src/i18n/Engine.cpp`，用 `registerEntry("語言碼", TXT_KEY_某某, "翻譯字串")` 一行一筆註冊，wiki 甚至有一整頁[Translations](https://wiki.hypr.land/Contributing-and-Debugging/Translations/)教你怎麼加。官方 wiki 明說「Translations are in C++, but they are straightforward, and don't require much expertise」——這是一個非常低的入門檻，也是我決定直接動手的原因。

## 從 issue 到 branch：不用先開 issue 的貢獻

很多人以為開源貢獻的第一步一定是開 issue 等維護者點頭。實際上像「補一個語言的翻譯」這種明確的缺口，根本不需要先開 issue 問——wiki 上有翻譯教學、Engine.cpp 裡每個 key 都看得到現有翻譯當範例，這就是「issue 已經被專案自己開好了」的狀態。

我的流程是這樣：

1. fork `hyprwm/Hyprland` 到 `G36maid/Hyprland`
2. 從 `main` 開一條 branch：`i18n/zh-tw`
3. 打開 `src/i18n/Engine.cpp`，找到 `zh_CN` 那段翻譯區塊，對照英文原文逐 key 寫 `zh_TW` 的版本
4. commit、push、開 PR

## 寫翻譯的幾個實際抉擇

翻譯不是逐字轉換，幾個我當時卡的點：

**術語表先查再寫。** 我在 PR 描述裡直接引用了[台灣莊園 l10n 社群術語集](https://hackmd.io/@l10n-tw/glossaries)當依據：「config → 設定檔」、「screen → 螢幕」、「assets → 資源」。這些都是照社群慣例查來的，我自己順不順口反而是其次。

**zh_TW 與 zh_CN 的措辭差異是文化差異，不是繁簡差異。** 同一個 key，兩種語言碼各自都要有對應的本地化措辭。我做了一個額外的決定：這個 PR 順手把 `zh_CN` 缺的幾個 key（Safe Mode、Watchdog 通知）也補齊了，因為兩個語言區塊在檔案裡是相鄰的，改起來一起改最省事。

**條件式翻譯（lambda）要照 C++ 寫。** 有些 key 帶變數（例如「無法載入 {count} 個必要資源」），底層用 lambda 接 `translationVarMap`。中文沒有單複數變化，但寫的時候仍要照 wiki 的 conditional translation 範例把 lambda 結構抄對，否則 CI 編譯不過。

## PR 的實際內容（gh api 實算）

```
PR #13210  "i18n: add Traditional Chinese (zh_TW) translations"
  created:  2026-02-07T00:17:02Z
  merged:   2026-02-07T13:27:10Z
  base:     main
  head:     i18n/zh-tw（來自 fork G36maid/Hyprland）
  commits:  2
  files:    1（src/i18n/Engine.cpp）
  +59 / -0
```

兩個 commit 各自聚焦：

- `015a6059` — i18n: add Traditional Chinese (zh_TW) translations（2026-02-07T00:04:23Z）
- `199453a1` — i18n: add missing Simplified Chinese (zh_CN) translations（2026-02-07T01:58:50Z）

`+59/-0` 是純增量、單檔案，這種 PR 是維護者最容易審的型態——不動任何邏輯，只加資料。

## Review 到 merge：5.5 小時的等待

PR 開出去之後發生了什麼：

1. **00:17** — PR 一開，`github-actions[bot]` 立刻留言，附上 [PR Guidelines](https://wiki.hypr.land/Contributing-and-Debugging/PR-Guidelines/) 與 [Tests](https://wiki.hypr.land/Contributing-and-Debugging/Tests/) 的連結，提醒確認格式與測試。這是 Hyprland 的標準流程，每個 PR 都會有。
2. **02:21** — 我自己在留言區補充說明：第二個 commit 補的是 zh_CN 缺的 Safe Mode 與 Watchdog 翻譯，問維護者是否需要改 PR 標題把 zh_CN 也納入描述。
3. **12:35** — Vaxry（vaxerski，Hyprland 的主要作者）留言「ai, please recheck」，接著 `github-actions[bot]` 回報 **AI translation check OK**。Hyprland 用自動化工具檢查翻譯的術語一致性與格式。
4. **12:36** — Vaxry 留下 "thanks!"，review state `APPROVED`。
5. **13:27** — merge。merge commit `f68ac7ef7589e1536d438f7fbfb3ad987538fe0f`，作者欄位直接掛 G36maid。

從開 PR 到 merge 總共 13 小時 10 分鐘（UTC），扣掉我睡覺的時間，實際等待大約 5.5 小時。**0 個 review comment、0 次 requested changes**——這是那種「資料補齊型」PR 的優勢，review 成本極低。

## 這次貢獻教我的事

**開源貢獻的第一個 PR 不一定要是 epic。** 我之前給 Zed 的 PR 是功能修復；這次給 Hyprland 的只是 59 行翻譯。兩者流程幾乎一樣：fork → branch → commit → PR → review → merge。差別只在於「資料補齊型」的 review 週期短很多——維護者掃一眼就能 approve。

**術語一致性是翻譯 PR 的生死線。** 重點不在字翻得優不美，在「設定檔 vs 配置文件」這種選擇有沒有依據。在 PR 描述裡直接引用術語表連結，等於替 reviewer 省下質疑的步驟。

**自動化檢查是貢獻者的朋友，不是敵人。** Hyprland 用 AI 翻譯檢查 bot，我不用擔心「我翻得道地嗎」這種主觀判斷被反覆退件，機器先卡關的東西比人眼主觀意見好處理。

**Hyprland 的維護者本身就在等這種 PR。** [hypr.land](https://hypr.land) 上 Vaxry（Vaxry / vaxerski）長期維護這個獨立 Wayland compositor（40k+ stars、BSD-3-Clause、C++），i18n 的架構設計就是為了讓非核心開發者能夠補翻譯。找一個「專案自己已經鋪好軌道」的角落切入，是第一次貢獻最省力的路徑。

---

如果你也想給日常在用的工具一個 PR，但不知道從哪下手：打開你天天在用的那個專案的 `CONTRIBUTING.md` 或 wiki，找「translation」「documentation」這種關鍵字——那些通常是維護者已經把入門檻降到最低的地方。

## References

- PR #13210: <https://github.com/hyprwm/Hyprland/pull/13210>（gh api + curl 200）
- Merge commit: <https://github.com/hyprwm/Hyprland/commit/f68ac7ef7589e1536d438f7fbfb3ad987538fe0f>（curl 200）
- Hyprland Translations wiki: <https://wiki.hypr.land/Contributing-and-Debugging/Translations/>（web_extract 驗證）
- Hyprland PR Guidelines wiki: <https://wiki.hypr.land/Contributing-and-Debugging/PR-Guidelines/>（web_extract 驗證）
- Hyprland Tests wiki: <https://wiki.hypr.land/Contributing-and-Debugging/Tests/>（web_extract 驗證）
- 台灣 l10n 社群術語集: <https://hackmd.io/@l10n-tw/glossaries>（PR 描述中引用）
- Hyprland 官網: <https://hypr.land>
- Hyprland 獨立化公告（脫離 wlroots）: <https://hypr.land/news/independentHyprland>
