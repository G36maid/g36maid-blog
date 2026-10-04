---
title: "Astro 7 部落格管線:Content Collections 到 GitHub Markdown 全對齊"
description: "Astro 7 的 Sätteri 處理器坑、unified processor 設定、以及讓 GitHub 上寫的 markdown 幾乎零修改渲染的完整外掛鏈。"
pubDate: 2026-10-04
updated: 2026-10-04
category: "astro"
tags: ["astro", "markdown", "tutorial"]
series: "astro-blog-building"
---

本篇紀錄這個站採用的 Astro 7 markdown 管線:從官方 blog template 起步,到 GFM、數學式、alerts、emoji、mermaid 全部就位的過程。

## 前置需求

- Node.js ≥ 22.12(Astro 7 的引擎要求)
- pnpm(本文使用 11.x)
- 對 Content Collections 有基本概念([官方文件](https://docs.astro.build/en/guides/content-collections/))

## 1. Astro 7 最大的坑:Sätteri

Astro 7 起預設 Markdown 引擎換成 Rust 寫的 **Sätteri**——它很快,但**不執行 JS remark/rehype 外掛**。要用整條社群外掛鏈,必須明確切回 unified processor:

```ts
// astro.config.mjs
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';

export default defineConfig({
	markdown: {
		processor: unified({
			remarkPlugins: [/* ... */],
			rehypePlugins: [rehypeHeadingIds, /* ... */],
		}),
	},
});
```

> [!WARNING]
> 舊的 `markdown.remarkPlugins` 寫法在 v7 仍可運作但會印 deprecation warning,並且同樣需要 `@astrojs/markdown-remark`。

## 2. 外掛鏈與順序

remark 全部先於 rehype 執行,陣列順序即執行順序:

```ts
remarkPlugins: [
	remarkGfm,                                      // 表格/任務清單/註腳
	remarkEmoji,                                    // :tada: 純文字替換,越早越好
	[remarkMath, { singleDollarTextMath: false }],  // 只認 $$…$$ 與 ```math
	remarkGithubAlerts,                             // > [!NOTE] 等 GitHub alerts
],
rehypePlugins: [
	rehypeHeadingIds,  // 目錄錨點,必須最先
	rehypeKatex,       // 數學節點 → HTML
	rehypeMmdr,        // mermaid → 靜態 SVG(自製,見下一篇)
],
```

### 為什麼關掉單錢號行內公式?

GitHub 的 `$E=mc^2$` 語法很方便,但 `singleDollarTextMath: true` 時,中文文章的「特價$100,現省$20」會被誤判成公式然後被 KaTeX 渲染爆炸。設 `false` 後行內公式要寫 `$$E=mc^2$$`——這是與 GitHub 唯一不相容的點,權衡後值得。

## 3. 程式碼高亮:Expressive Code

```mjs
expressiveCode({
	themes: ['tokyo-night'],
	useDarkModeMediaQuery: false, // 全站暗色主題時關掉
	styleOverrides: { borderRadius: '0' },
})
```

同時要讓 mermaid/math fence 繞過高亮:

```mjs
markdown: {
	syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid', 'math'] },
}
```

## 4. 驗證

build 後檢查輸出:

```bash
$ pnpm build
$ grep -r "markdown-alert" dist/blog/ | head -3   # alerts 有渲染
$ grep -r "katex" dist/blog/ | head -3            # 數學有渲染
$ ls dist/pagefind/                                # 搜尋索引已建立
```

## 常見問題

- **build 時報 `Cannot use remark plugins with satteri`** → 沒裝 `@astrojs/markdown-remark` 或沒設 `processor: unified(...)`
- **`$$` 公式裡的中文渲染成亂碼** → KaTeX 對 CJK 本來就會 fallback,確認有引入 `katex/dist/katex.min.css`

## 參考資料

- [Astro — Markdown & Content guide](https://docs.astro.build/en/guides/markdown-content/)
- [roadmap proposal 0061 — native markdown processor](https://github.com/withastro/roadmap/blob/main/proposals/0061-native-markdown.md)
- [remark-math — singleDollarTextMath](https://github.com/remarkjs/remark-math)
- [Expressive Code](https://expressive-code.com/)
