---
title: "同行註解：把規則塞進 Agent 視野的 Agentic Coding 黑魔法"
description: "Agent 靠 grep/rg 找程式碼，而搜尋工具回傳的單位是整行——把規則寫成同行註解，就會搭著搜尋結果一起被讀進 context。"
pubDate: 2026-06-20T17:20:25+08:00
category: ai
tags: ["agentic-coding", "ripgrep", "agent"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1781947225
---

> 本文由我 2026-06-20 的 Facebook 貼文於 2026-10-24 擴寫而成，調查與連結均已補齊。

最近我讓 Agent 改專案時最煩的其中一件事：它明明每天都會 grep 整個 codebase，卻對那些「這裡不可以這樣寫」的規則視而不見。我把規則寫在 CLAUDE.md、AGENTS.md，它讀了；但等它真的 grep 到那個函式、準備動手改的瞬間，規則已經被擠出 context 或根本沒被關聯起來，然後照樣犯規。

後來學到一個招數，便宜到不像話：**把規則直接寫在函式宣告或變數的同一行（同行註解）**。原理是 Agent 主要靠 grep/rg 這類工具搜尋專案，而這些工具回傳結果的單位是「整行」——ripgrep 的官方文件[寫得很明白](https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md)：「ripgrep behaves as if reading each file line by line. If a line matches the pattern provided to ripgrep, then that line will be printed.」也就是說，註解只要跟程式碼同一行，就會跟著整行一起被印進 Agent 的 context。規則不再需要 Agent「記得」，它每次碰到那段程式碼都會被強制重讀一次。有人在社群實測這種 function-level 的規則後宣稱違反率幾乎歸零——確切數字我沒辦法親自重現，但我自己用起來，Agent 明確犯規的次數確實顯著變少。

## 優缺點總覽

**優點：**
- 規則跟著搜尋結果走，不需要 Agent 主動去翻文件
- 寫在哪一行，管的就是哪一段程式碼，作用範圍精準
- 對人類讀者也有效——review 時看得到同樣的警告

**缺點：**
- 規則還是得靠「你」親自寫，Agent 不會替你發明規則
- Formatter（prettier、gofmt 之類）有可能把同行註解搬走
- 註解會越積越多，需要克制

## 1. 先理解：grep 回傳的是整行

[ripgrep issue #320](https://github.com/BurntSushi/ripgrep/issues/320) 裡 BurntSushi 本人確認過：即使你想用 `--replace` 只輸出比對到的部分，程式「always returns the whole line where the match was found」。這是設計使然，不是 bug。對人類是貼心功能，對 Agent 就是資訊通道：同一行上放了什麼，Agent 就讀到什麼。

## 2. 行上註解 vs 同行註解

傳統寫法——註解自己佔一行：

```python
# 不可直接操作 raw fd，一律走 handle_* API
def release_handle(h: Handle) -> None:
```

Agent grep `release_handle` 時，回傳的是：

```
$ rg "release_handle" src/
src/ops.py:42:def release_handle(h: Handle) -> None:
```

註解沒有被印出來，規則等於不存在。改成同行註解：

```python
def release_handle(h: Handle) -> None:  # 不可直接操作 raw fd，一律走 handle_* API
```

同一個 grep，回傳變成：

```
src/ops.py:42:def release_handle(h: Handle) -> None:  # 不可直接操作 raw fd，一律走 handle_* API
```

規則搭著整行一起進 context。寫得很長也沒關係，反正 Agent 讀的是文字流，不介意行寬。

## 3. 該寫什麼內容

最值錢的是「負面指令」：告訴 Agent **什麼不能做**。例如「不可重構成 JOIN，backfill log 是非同步的」這種，比正面描述更常救場——Agent 最愛做的蠢事就是把你看得很清楚的取捨當成可最佳化的冗餘。Anthropic 的 [Claude Code 最佳實務](https://code.claude.com/docs/en/best-practices)強調 context 視窗填滿後效能會下降，所以這招的本質就是：只在 Agent 需要的現場，注入最小的一句話。

## 踩雷注意

- **Formatter 會搬註解**：prettier 對超寬行的處理、某些語言的 formatter 自動換行，都可能把註解擠到上一行去。commit 前跑一次 formatter，再 grep 確認規則還在原行上。
- **跟 doc comment 分工**：公開 API 的簽名、參數語意請照慣例寫 doc comment（給人和語言工具看的）；同行註解留給「Agent 行為規則」這種不適合進文件的東西。兩者混用會讓文件工具抓到一堆 `DO NOT` 。
- **註解膨脹**：不是每行都需要。只在你被犯規刺痛過的地方寫，否則 codebase 會變成佈告欄。
- **過時註解比沒有更糟**：規則改了要同步刪，Hacker News 上[這串討論](https://news.ycombinator.com/item?id=44961758)裡就有人吐槽「agent 不會發現文件跟程式碼漂移」。

## 個人評價

老實說這招是黑魔法沒錯——它利用了 grep 回傳整行這個實作細節，而不是任何正式機制。缺點我都遇到了：註解確實變多、我自己的 formatter 偶爾搗亂、而且這終究是 prompt injection 的良性版，寫錯了照樣誤導 Agent。OpenAI 的 [AGENTS.md 指南](https://developers.openai.com/codex/guides/agents-md)也提醒過，規則要精簡、格式檢查交給 CI。但換來的是 Agent 在正確的現場讀到正確的規則，這個 CP 值我買單。順帶一提，我平時用[本地跑的 GLM](/blog/exl3-glm-local-deploy/) 當 Agent，context 更小，這招的邊際效益反而更明顯。

相關閱讀：[Cursor 的 agent 最佳實務](https://cursor.com/blog/agent-best-practices)裡「規則要短、指向 codebase 裡的範例」的原則，跟這招是同一套哲學的兩種粒度。
