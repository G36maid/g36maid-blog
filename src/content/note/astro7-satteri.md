---
title: "Astro 7 的 Sätteri 處理器不跑 JS 外掛"
pubDate: 2026-10-04
tags: ["astro"]
---

升級 Astro 7 後 remark/rehype 外掛全部靜默無效?預設 Markdown 引擎已換成 Rust 的 Sätteri。解法:`markdown.processor: unified(...)` + 安裝 `@astrojs/markdown-remark`。詳見[管線筆記](/blog/astro-7-markdown-pipeline/)。
