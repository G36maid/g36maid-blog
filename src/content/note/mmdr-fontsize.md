---
title: "mmdr 的 fontSize 是數字不是字串"
pubDate: 2026-10-04
tags: ["mermaid", "rust"]
---

`mmdr --configFile` 的 themeVariables 裡 `fontSize` 要寫 `15`(f32),寫 `"15px"` 會報 `invalid type: string, expected f32`。其他 Mermaid 官方變數大致相容,`background`、`primaryColor`、`lineColor` 都有效。
