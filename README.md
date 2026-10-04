# G36MAID // WIRED ARCHIVE

> *Close the world, Open the nExt.*

**blog.g36maid.dev** — 技術檔案室。設計語言:serial experiments lain 的 CRT 終端 × 虹彩六號的戰術 UI × 少女前線 G36 的黑金女僕美學。

## 技術棧

| 層 | 選擇 |
|---|---|
| 框架 | Astro 7.3.5(官方 blog template 起步,UI 全重寫) |
| 內容 | Content Collections — `post` / `note` 雙集合(Zod schema) |
| Markdown | unified processor + remark-gfm / remark-emoji / remark-math / remark-github-blockquote-alert |
| 程式碼 | Expressive Code(tokyo-night) |
| 數學 | KaTeX(行內 `$$…$$`,CJK 安全) |
| 圖表 | **mmdr**(純 Rust mermaid 渲染器)— build 時產生靜態 SVG,**零瀏覽器依賴** |
| 搜尋 | Pagefind(Ctrl/⌘+K) |
| 部署 | Cloudflare Pages(`cf` CLI) |

## 指令

```bash
pnpm install          # 安裝依賴
pnpm dev              # 開發伺服器(astro dev --background 可背景執行)
pnpm build            # astro build + pagefind 索引
pnpm deploy           # build + cf pages deploy
```

> **依賴**:`mmdr` 需在 PATH(AUR: `paru -S mmdr-bin` / `cargo install mermaid-rs-renderer`)。

## 內容格式

放 `.md` 到 `src/content/post/`(文章)或 `src/content/note/`(短筆記):

```yaml
---
title: "文章標題"
description: "一句話摘要(RSS/列表卡用)"
pubDate: 2026-10-04
category: "astro"        # 分類 = TD- 代碼風 chip
tags: ["astro", "meta"]
series: "astro-blog-building"   # 選填,同系列自動產生上一篇/下一篇
updated: 2026-10-05      # 選填
draft: false
---
```

GitHub markdown 功能全對齊:表格、任務清單、註腳、`:emoji:`、`> [!NOTE]` alerts、`$$…$$` 數學、` ```mermaid ` 圖表。**唯一差異**:行內數學請用雙錢號 `$$…$$(CJK 誤判防護)。

## 部署(Cloudflare)

```bash
cf pages project create blog --production-branch main   # 一次性
pnpm deploy
```

自訂網域 `blog.g36maid.dev`:Dashboard → Workers & Pages → blog → Custom domains。

## 設計系統

Design tokens 在 `src/styles/global.css`:Lain 藍灰深淵底色、`--signal-green`(活著的訊號)、`--accent-gold`(G36 金髮)、`--hazard-yellow`(R6 警戒色,僅 hero/active)。mermaid 配色在 `mermaid-dark.json`。
