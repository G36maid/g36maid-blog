---
title: "用了整整一個月的 oh-my-opencode：subagent 分工的爽，與 token 帳單的痛"
description: "把探索外包給便宜的 subagent、先用 rg 畫好靶心，再讓最貴最強的主模型 one shot——oh-my-opencode 用一個月的心得：設定好了超爽，設定不好就是 token burner。"
pubDate: 2026-02-03T13:11:13+08:00
category: ai
tags: ["opencode", "agent", "程式", "github"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1770095473
media:
  - 122146515200958395.jpg
---

> 本文擴寫自 2026-02-03 的 Facebook 貼文（原稿為隨手記＋一張迷因截圖）。擴寫於 2026-10-23，脈絡以當時（2026 年 1 月前後）的版本為準；oh-my-opencode 迭代很快，現在的細節可能又不一樣了。

用了整整一個月的 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)（以下簡稱 OmO），我的開發流程發生了以下變化：設定良好的 AGENTS.md、用小 agent 處理所有探索、先畫靶心、再讓最貴最強的主模型直接 one shot。設定好了真的超爽；當然，代價就是帳單。

![OH MY OPENCODE — I spent around $24,000 in tokens for this：社群流傳的迷因截圖，左側為標語，右側是 orchestrator 同時派出大量 explore 背景任務的終端機畫面](/media/2026-02/122146515200958395.jpg)

*圖說：社群流傳的「OH MY OPENCODE — I spent around $24,000 in tokens for this」迷因。這不是空穴來風——作者自己在 [README](https://github.com/code-yeongyu/oh-my-opencode) 的 Author's Note 寫著「I burned through $24K in LLM tokens on personal projects」。這個插件從誕生第一天就沒在假裝自己省 token。*

## omO 是什麼

[OpenCode](https://opencode.ai/) 是開源的終端機 coding agent，而 OmO 是它的社群 plugin（npm 就叫 `oh-my-opencode`），定位大概是「oh-my-zsh for OpenCode」：作者把自己的工作流——多模型分工、LSP、hooks、skills——全部打包成預設值。裝好之後，內建一整隊具名 agent：Sisyphus 當主指揮、Prometheus 負責規劃、Oracle 當除錯顧問、Librarian 查文檔、Explore 快速翻 codebase，還有看截圖的 multimodal-looker。三個內建 MCP 也直接送：[Exa](https://exa.ai)（web search）、[Context7](https://context7.com)（官方文檔）、[Grep.app](https://grep.app)（GitHub code search）。什麼都不用背，一句 `ultrawork` 全部啟動。

聽起來像行話轟炸，但實際用起來，真正改變我流程的是下面這套分工。

## 1. 先用 /init 把 AGENTS.md 打底

```
opencode
> /init
```

[OpenCode 的 /init](https://opencode.ai/docs/rules/) 會掃過整個 repo 生成 `AGENTS.md`，這一步自動生成的部分只求「有」，**手動修改才是重點**：把建置指令、測試怎麼跑、目錄慣例、絕對不要碰的東西寫清楚。原因很單純——OmO 的每個 subagent 出場都會讀這份文件，它是整個 agent 團隊的共識檔。寫得糊，就是全隊一起糊。

## 2. 探索全部外包給小 agent，MCP 全開

第一個小 agent 專門處理「找東西」：所有 MCP 都開給它——Exa 查網路、Context7 拉官方文檔、Grep.app 翻別人的 GitHub 最佳實踐。給我文檔和別人怎麼用的範例，而不是讓主模型自己一頁一頁翻網頁。這一步省的不是錢，是主模型的 context：探索性雜訊全部留在小 agent 裡，主模型只收到整理過的結論。

## 3. 另一個小 agent 用 rg 畫靶心

第二個小 agent 用 `rg` 分析當前的程式碼與文件，把任務縮到最小目標——具體到檔案、函數、預期行為。這一步是我覺得整個流程裡 CP 值最高的：規格畫得越小，主模型 one-shot 的命中率就越高。與其叫它「加一個功能」，不如讓便宜模型先把「改哪幾個檔、現有介面長怎樣、測試在哪」摸清楚，再交棒。

## 4. 主 agent 直接 one shot

然後才是主角上場：最貴最強的主 agent，配合 LSP tools、AGENTS.md、skills，直接 one shot 並把測試跑完。靶心已經畫好、文檔已經備齊、context 乾淨——那種「一次命中然後測試全綠」的感覺，真的超爽。

要讓這套分工成立，關鍵設定是把 subagent 的 provider 調好。模型組合一直在改版，但方向不變：探索型 agent 給免費或極便宜的模型，顧問型才給貴的。在 `oh-my-opencode.jsonc` 裡可以逐一 override：

```jsonc
{
  "agents": {
    "explore": { "model": "opencode/grok-code" },        // 當時免費，翻 codebase 用
    "librarian": { "model": "anthropic/claude-haiku-4-5" }, // 便宜快速，查文檔用
    "oracle": { "model": "openai/gpt-5.2" }               // 貴但值得，只在諮詢時上
  }
}
```

設定細節見[官方 configuration 文件](https://github.com/code-yeongyu/oh-my-opencode/blob/dev/docs/reference/configuration.md)；[agents 文件](https://opencode.ai/docs/agents/)則說明 OpenCode 原生 agent 的行為差異。

## 代價：它真的是 token burner

前面全是好話，這裡是帳單。如果沒有把 subagent 的 provider 設成免費或便宜的模型，OmO 就真的是 token burner——迷因裡那個 $24,000 就是作者的親身經歷。社群實測也一致：光是啟動，OmO 就比 vanilla OpenCode 多吃 15,000–25,000 token（都還沒開始做事）；有人 benchmark 過，最終 pass rate 和 vanilla OpenCode 差不多（69% vs 73%），但 request 數是三倍。詳細數據可以看[這篇第三方實測](https://www.glukhov.org/ai-devtools/opencode/oh-my-opencode-experience/)。

我的結論：這個工具的商業模式是「用 token 換你的專注力」。值不值，取決於你把便宜模型用在刀柄上、貴模型用在刀鋒上。

## 一個月後的誠實評價

優點：分工清楚、探索不污染主 context、one-shot 命中率的爽感是別的工具給不了的；免費的 explore agent 更是甜頭。

缺點也很誠實地列：設定成本不低（agent 名字和預設模型一直在改，每隔幾週就要重新對一遍）；迭代快代表行為會變——我後來就踩到 sisyphus-junior 不太 respect config 的坑，那是另一篇的事了；再加上啟動 overhead 本身就重，小 repo、小改動用它反而是殺雞用牛刀。

一個月用下來我的建議是：大重構、跨檔案的新功能，值得讓整個 team 上場；改個 typo、調個樣式，就別 `ultrawork` 了，你的錢包會感謝你。

## 延伸閱讀

- [oh-my-opencode GitHub repo](https://github.com/code-yeongyu/oh-my-opencode)（現已更名為 oh-my-openagent，舊 npm 套件名 `oh-my-opencode` 仍保留為相容層）
- [r/ClaudeCode 上的使用心得討論串](https://www.reddit.com/r/ClaudeCode/comments/1pp2tyw/ohmyopencode_has_been_a_gamechanger/)
- [OpenCode AGENTS.md 與 /init 說明](https://opencode.ai/docs/rules/)
- [Context7](https://context7.com)｜[Grep.app](https://grep.app)｜[Exa](https://exa.ai)
