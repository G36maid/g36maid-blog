---
title: "把計算機圖學期末大抄整理成 WebGL 入門筆記"
description: "把 1.3 萬字計算機圖學期末重點整理重排成 WebGL 入門筆記：管線、座標變換、Phong 光照、shadow mapping，附 2026-11 的 WebGPU 現況。"
pubDate: 2026-06-04 06:59:08 +0800
draft: false
category: programming
tags: ["webgl", "computer-graphics", "glsl", "shader"]
source: "facebook"
sourceType: "facebook"
sourceTimestamp: 1780527548
---

（本文整理自 2026-06 寫的計算機圖學期末重點整理，2026-11-25 擴寫成文；課程細節已去識別化，程式以 WebGL 1 風格為基準。）

期末考前一天，我把整學期的圖學內容壓成雙面 A4、八個格子，公式藍筆、陷阱紅筆。考完之後那份大抄一直躺在資料夾裡，最近翻出來才發現，它根本就是一張 WebGL 入門地圖：從怎麼把三角形畫上螢幕，一路到 shadow mapping 和 normal mapping，章節順序正好就是「資料進 GPU → 變換 → 上色」的管線本身。乾脆整理成文，順手補齊當年囫圇吞棗的觀念。官方規格在 [Khronos 的 WebGL 2.0 spec](https://registry.khronos.org/webgl/specs/latest/2.0/)，API 細節查 [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)，這邊只講我覺得該刻在腦子裡的部分。

## 從 JS 到像素：管線總覽

WebGL 的資料流只有一條主線：CPU 準備頂點資料與矩陣送進 GPU，每個頂點跑一次 vertex shader，組完三角形後 rasterization 切成 fragment，每個 fragment 跑一次 fragment shader，最後寫進 framebuffer。效能直覺也從這裡來：vertex shader 執行次數正比於頂點數，fragment shader 正比於覆蓋像素數——一個全螢幕三角形只有三個頂點，卻會讓 fragment shader 爆量。

兩種 shader 之間靠三種變數溝通：`attribute` 是每個頂點各自的資料，只出現在 vertex shader（position、normal、texCoord）；`uniform` 在一次 draw call 期間固定不變，兩邊都能讀（矩陣、燈光、相機位置）；`varying` 由 vertex shader 寫、fragment shader 讀，rasterizer 自動內插。當年紅筆圈最大的陷阱：vertex position 是 attribute，不要包成 uniform。

## 餵幾何進 GPU：VBO 與 index buffer

送頂點資料的五步是肌肉記憶等級的 boilerplate：

```js
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, stride, offset);
gl.enableVertexAttribArray(loc);
```

`vertexAttribPointer` 的 stride 和 offset 以 byte 計，資料交錯存（position 和 uv 排在一起）才有意義；分開存 stride 填 0 即可。畫 cube 用 `TRIANGLES` 要 36 個頂點，但座標唯一的不過 8 個，用 index buffer 讓重複頂點只存一次：

```js
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
```

代價是 debug 多一層間接，看 indices 要自己在腦中展開。另外 OBJ 的 face index 從 1 開始，直接餵進 drawElements 會得到浮在半空的破圖，載入時記得減一。

## 座標變換：齊次座標與矩陣順序

所有變換建立在齊次座標上：`(x, y, z, w)` 除以 `w` 回到笛卡爾座標，點的 `w = 1`、方向向量的 `w = 0`——那個 0 讓平移矩陣對方向向量自動失效，這是點和向量需要不同表示的數學根據。vertex shader 的核心其實就一行：

```glsl
gl_Position = u_P * u_V * u_M * vec4(a_Position, 1.0);
```

空間接力：local space 經 Model matrix 到 world space，經 View matrix 到 eye space，經 Projection matrix 到 clip space，除以 `w` 得 NDC 的 [-1, 1]，最後 viewport 映射到視窗像素。最容易錯的是矩陣順序：`T * R * S * P` 從右往左執行，先縮放、再旋轉、最後平移；調成 `S * R * T` 東西會飛去完全不同的地方。要繞任意點旋轉，得平移到原點、旋轉、再平移回去，三個矩陣串好。

光照法線還有一個隱藏坑：non-uniform scaling 之下，normal 直接乘 model matrix 會不再垂直表面，必須改乘 `transpose(inverse(modelMatrix))`，也就是 normal matrix。這題當年紅筆寫了三遍。

## Phong 光照與三種 shading

Phong 反射模型把顏色拆成 ambient + diffuse + specular。diffuse 只看光的方向 `dot(L, N)`，specular 多了視線項 `pow(max(dot(R, V), 0), shininess)`，所以高光會隨相機移動，shininess 決定它多銳利。fragment shader 大致長這樣：

```glsl
vec3 L = normalize(u_LightPos - v_WorldPos);
vec3 N = normalize(v_Normal);
vec3 R = reflect(-L, N);
vec3 V = normalize(u_EyePos - v_WorldPos);
vec3 color = u_Ambient
           + u_Kd * max(dot(L, N), 0.0) * u_LightColor
           + u_Ks * pow(max(dot(R, V), 0.0), u_Shininess) * u_LightColor;
```

在哪算光照有三個層級：flat 每個面算一次，快但有 Mach band；Gouraud 在 vertex shader 算完內插顏色，polygon 內部的高光會漏掉；Phong 內插 normal、每 fragment 算，品質最好也最貴。三角形夠細時 Gouraud 和 Phong 的視覺差距會縮小，而 modern pipeline 直接把光照放 fragment shader，等於預設了 Phong。

## FBO、影子與 cubemap

預設渲染目標是 canvas，Framebuffer Object 讓你畫到 offscreen texture，影子靠它：第一 pass 把相機放光源位置，把場景深度畫進 shadow map；第二 pass 正常渲染，把每個 fragment 變換到光源 clip space 去 sample 那張 map，目前深度比存的最近深度遠就是被擋住、在影子裡。實作要加 bias，否則精度誤差會讓表面自體遮蔽出條紋（shadow acne）。Clip space 的 [-1,1] 和貼圖座標的 [0,1] 差一半，sample 前記得 `* 0.5 + 0.5`。

cubemap 用六張圖包住場景，sample 時吃 3D 方向向量、沒有 2D UV；天空盒把它當無限遠的環境，只跟著相機旋轉、不跟著平移。environment reflection 用 `reflect()` 查表，是便宜的反光近似——要反射場景裡的其他物體，得每幀從反射體中心往六個方向各渲染一次（FOV 90°、aspect 1），成本很貴。normal mapping 把法線存進貼圖 RGB，讀出來要 `rgb * 2.0 - 1.0` 重映射，再經 TBN 矩陣轉回物件空間。順帶一提，霧不需要 cubemap，就一條 `mix(fogColor, objColor, fogFactor)`，但 fogColor 得跟背景色一致，不然物體遠去時會看到一圈接縫。

## 踩雷清單

- GLSL 強型別：`float f = 8;` 編譯不過，寫 `8.0` 或 `float(8)`
- swizzle 不能跨 component 家族混用：`v.xy` 可以，`v.xg` 不行
- `gl_FragCoord.xy` 是視窗像素座標，`.z` 才是 [0,1] 深度
- 貼圖 Y 軸和圖檔相反，常靠 `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)` 翻回來
- depth test 要 `gl.enable(gl.DEPTH_TEST)`，clear 時 COLOR 和 DEPTH 兩個 bit 一起清

## 我的評價

這份大抄最大價值是暴露了課程的縮影：觀念密度極高，但整學期寫的 code 都是同一套 boilerplate，章節背得再熟，離「自己生出一個 renderer」還有距離。真正的分水嶺是我後來自己寫小東西時——被矩陣順序、normal matrix、shadow acne 各電過一次，這些知識才從背誦變成肌肉記憶。所以這篇更像一份「當年懂這些坑的話複習會快很多」的筆記，教學順序照管線走，但每個觀念都值得配一個自己的小實驗。缺點也照實說：矩陣細節（projection matrix 的推導）當年為了考試硬背，這篇刻意跳過，因為死背對理解沒幫助。

## 2026-11 update

寫這篇時查了現況：WebGL 2 在 caniuse 的 2026-10 資料約 96% 支援，仍是 web 3D 的最低公分母。WebGPU 已經不算新東西——Chrome 113（2023-05）起內建，Safari 26（2025-09）跟進，Firefox 從 141 起在 Windows 可用、Apple Silicon 的 macOS 從 145/147 起，caniuse 估計約 88% 使用者可用；Firefox 在 Linux、Intel Mac 和 Android 仍不支援，W3C 規格 2026-09 還停在 Candidate Recommendation Draft（狀態見 [caniuse](https://caniuse.com/webgpu) 與 [gpuweb wiki](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)，Khronos 也有 [WebGL working group update](https://www.khronos.org/developers/linkto/webgl-working-group-update-3DWeb2026)）。WebGPU 真正的殺手級差異是 compute shader，WebGL 從頭到尾沒有這種東西；對純渲染來說，這篇的管線觀念在 WebGPU 的 render pipeline 裡依然成立，換的只是 API 皮和 WGSL 語法。

延伸閱讀：之前用純 CSS 不靠任何 3D API 拼出深度感玩地形的[〈Terra〉](/blog/terra-pure-css-terrain/)，跟這篇是同一種「自己把圖學觀念拼出來」的趣味。入門實作推薦 [WebGL Fundamentals](https://webglfundamentals.org/)，章節切法和這篇管線順序幾乎一一對應。
