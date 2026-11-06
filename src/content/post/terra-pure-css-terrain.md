---
title: "每個像素一個 div：拆解 Layoutit Terra 純 CSS 3D 地形產生器"
description: "terra.layoutit.com 不用 canvas 也不用 WebGL，靠 stacked grids 加 CSS 3D transform 把上千個 div 硬堆成一座可互動的像素地形島。本文拆解它的分層渲染原理、效能 trade-off，以及跟 canvas/WebGL 方案的差異。"
pubDate: 2025-11-06 11:41:52 +0800
category: programming
tags: ["css", "css-grid", "css-transforms", "frontend", "web-dev", "terrain", "layoutit", "voxel"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1762400512
---

本文擴寫自 2025-11-06 的 Facebook 貼文（原稿為連結分享草稿，僅數行讚嘆）。

---

# 一個只靠 CSS 蓋出來的 3D 像素地形：拆解 Layoutit Terra

這個用純 CSS 刻的地形圖專案太有趣了！[terra.layoutit.com](https://terra.layoutit.com/) 不知道作者的腦洞是怎麼開的，但成品真的很超酷。滿滿的像素風，瞬間夢回 SimCity 2000 / OpenTTD——而且每一塊地形都是真的 DOM 元素，用 CSS 3D transform 硬幹出整座可以旋轉、可以抬升下挖的島。第一次看到的反應是「這一定是 canvas 吧」，點開原始碼才發現全都是 div，當下真的是被嚇到。

## 這是誰做的

Terra 是 Layoutit 工具系列的最新作品。Layoutit 最早是 2013 年的 Bootstrap 拖拉產生器，後來 2020 年推出開源的 [CSS Grid Generator](https://css-tricks.com/layoutit-grid-learning-css-grid-visually-with-a-generator/)，背後是阿根廷的網頁工作室 Leniolabs（創辦人是 Matias Capeletto，同時也是 Vue core team 成員）。Terra 的 GitHub repo 是 [layoutit/layoutit-terra](https://github.com/layoutit/layoutit-terra)，主要貢獻者掛名 Agustin Capeletto（GitHub 帳號 alowpoly），授權 GPL-2.0-only。2025 年 11 月 4 日上 Hacker News 首頁（Show HN 得 371 分），Reddit r/webdev 那篇「No WebGL, just stacked grids and 3D transforms」也衝到 2100+ upvote。

## 它到底怎麼辦到的

先講清楚「純 CSS」的定義：產生器本身當然是 Nuxt 2 / Vue 的網頁應用，JS 負責地形生成、工具列、相機控制這些 UI 邏輯。但**渲染地形場景這件事完全交給 CSS**——README 明講 terrain scene 不用 WebGL 也不用 canvas renderer（canvas 只拿來做小地圖和 PNG 匯出），按「Download Code」匯出的 HTML/CSS 拿到 CodePen 上、關掉 JS 也照樣動。

核心手法有三層：

**1. 每個 voxel 都是真 DOM。** 場景預設是 32×32 的網格，地形儲存成分層的 voxel 資料（`utils/generateTerrain.js`），形狀分四種：flats（平面）、spikes（尖峰）、wedges（斜楔）、ramps（坡道），再加上 cliffs 和 shoreline。每個 voxel 對應一個 Vue 元件（`components/flat.vue`、`wedge.vue` 等），渲染成一個 `<div>`，用 `grid-area` 擺進 CSS Grid。一整片滿格的島加上側牆面，DOM 元素輕鬆破千，這種「把瀏覽器排版引擎當遊戲渲染器」的規模感就是它最狂的地方。

**2. Stacked grids 當座標系。** 高度分層的每一層是一個自己的 CSS Grid（`.z` 元件，`repeat(cols, 50px)` 的網格），層與層之間用 `transform: translateZ(i * 25px)` 堆疊起來——一層 grid 就是一個高度切片。這正是 CSS Grid 規格裡 grid 可以互相重疊、再靠 transform 推開的玩法，配合「每格 50px、每層 25px」的固定比例，讓高度在視覺上呈現等比階梯。

**3. 3D 變形開場。** 最外層 `.scene` 設 `perspective: 8000px`，底下所有元素 `transform-style: preserve-3d`，相機則是一串 `scale() rotateX() rotate()` 疊出來的 transform（預設 rotateX 約 60°、rotate 45° 的等軸視角）。每個 voxel 的面（頂面、四個側面）也是 div，靠 `visibleTileFaces()` 這個可見面剔除函式只渲染鄰居沒擋住的面，cube 元件才不會爆量。光靠 `perspective` + `preserve-3d` + `translateZ` 這三個屬性，瀏覽器的合成器就把一疊平面 grid 變成了可以轉的立體地形。

## 效能 trade-off：為什麼不用 canvas

HN 上很快就有人問「這不是在殺我的 CPU 嗎」。確實：有留言實測 Safari 上 91% 的 CPU 時間花在 paint，每次轉相機或改地形要 100–200ms 才吐出下一幀。原因不難理解——CSS 3D transform 的幾何運算和繪製主要落在瀏覽器主執行緒的排版/繪製管線（effectively a CPU 'renderer' with GPU painter，一如 HN 留言所說），每個 div 都是排版引擎要算的節點；canvas/WebGL 則是把幾何直接餵 GPU，幾十萬三角形都不痛不癢。所以 Terra 的世界尺寸上限就壓在 32×32、每層只渲染可見面，而且像 Dark Reader 這類擴充套件還會把部分 tile 渲染弄壞——DOM 大軍的宿命。

那為什麼還要硬幹？因為 DOM 帶來 canvas 給不了的東西：每個 voxel 都是可互動的節點，滑鼠 hover / click 就是原生事件（`mouseenter` 直接綁在 wedge 上），不用自己寫 ray-picking 做點擊判定——90 年代寫等距遊戲的人在 HN 上說這種 tile 拾取當年是地獄，這裡瀏覽器免費送你。再加上匯出的成品是自包含的 HTML/CSS，沒有 JS 也能靜態展示，部署成本是零。

## 個人評價

工程視角來說，我認為這是「展示品」與「可用工具」的混合體。作為生產力工具，它其實意外地能用在正經場合：地形可以匯出成 MagicaVoxel `.vox`、heightmap PNG、JSON，等於是一個低多邊形地圖打樣器，對做桌遊地形、遊戲關卡草稿的人有實際價值。作為 CSS 能力邊界的展示品，它則示範了一個重要的觀念：CSS Grid 的 grid 可以堆疊、transform 3D 可以把任何 DOM 變立體——這套 stacked grid + translateZ 的手法本身是可遷移的，就算不做地形，做立體卡片、偽 3D 圖表都用得上。

老實說我不會想用它做真正的互動地圖編輯器——那個 100ms 的延遲在真的要「畫地圖」時會很煩。但作為證明「瀏覽器排版引擎的表達力比多數人想的還寬」的教材，它非常成功。作者的腦洞怎麼開的不重要，重要的是他把這個腦洞執行到了能上 HN 首頁的完成度。

## 延伸閱讀

- [Layoutit Terra 線上版](https://terra.layoutit.com/)（HTTP 200，頁面自稱 "Layoutit Terra - CSS Terrain Generator"，v0.0.1）
- [layoutit/layoutit-terra GitHub repo](https://github.com/layoutit/layoutit-terra)：README 直接說明 "The app does not use WebGL or a canvas renderer for the terrain scene"
- [Show HN: A CSS-Only Terrain Generator 討論串](https://news.ycombinator.com/item?id=45811093)（371 分，2025-11-04）：含 paint 佔 91% CPU 的實測、「(CSS-only Terrain) Generator」的括號辯論
- [r/webdev: A CSS terrain generator. No WebGL, just stacked grids and 3D transforms](https://www.reddit.com/r/webdev/comments/1odav3c/a_css_terrain_generator_no_webgl_just_stacked/)（作者 u/Ekrof 親自解說四種 voxel 形狀）
- [MDN: transform-style](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-style)、[MDN: perspective](https://developer.mozilla.org/en-US/docs/Web/CSS/perspective)、[MDN: CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [CSS-Tricks: Layoutit Grid](https://css-tricks.com/layoutit-grid-learning-css-grid-visually-with-a-generator/)（Matias Capeletto 親自介紹 Layoutit 系列的理念）
