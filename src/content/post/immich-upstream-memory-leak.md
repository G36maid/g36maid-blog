---
title: "原來是上游 immich 有 bug：一次自架 immich OOM 的 debug 戰記"
description: "自架 immich 跑縮圖產生到 OOM 重啟，從 docker stats 曲線、暫停單一 job 的二分法，到爬 GitHub issue 對時間軸，最後定位到 v1.144.1 的 libmimalloc 洩漏——回報後 24 小時內上游 revert，修復隨 v2.0.0 釋出。"
pubDate: 2025-10-01T17:21:10+08:00
category: programming
tags: ["immich", "docker", "memory-leak", "debug", "self-hosted", "開源"]
draft: false
source: "facebook"
sourceType: "分享的貼文"
sourceTimestamp: 1759310470
---
> 本文由 2025-10-01 的 FB 貼文（原文僅一句「原來是上游 immich 有 bug 導致 memory leak」）於 2026-11-08 擴寫而成。**原稿只有一句，正文中的排查時間軸為當時版本下的合理重構**，以下以可查證的上游紀錄為骨幹：我當時在 immich issue #22515 留下的回報（GitHub 帳號 G36maid，2025-10-01）與上游的修復 PR 均有存檔可查。文中凡屬推論而非逐字紀錄之處，都以「合理重構」標出；數字只引用上游 issue 裡實際出現過的，查證不到的不編造。

自架服務最煩的劇本：你什麼都沒改，它壞了。

我的 immich 是用 Docker Compose 跑在 Arch Linux（kernel 6.12.49-1-lts）上的，當時版本是 v1.144.1——2025-09-30 才出的版本，前一天才從 v1.143.1 升級上去。接著我對約 18 萬張照片跑 Generate Thumbnails，就眼睜睜看著 immich-server 容器把記憶體一路吃滿，最後 OOM、容器重啟、然後從頭再來一次，無限循環。

## 第一步：先確認「誰」在漏

排查的第一件事永遠不是猜，是看曲線：

```bash
# 全域看一下：哪個容器在漲
docker stats --no-stream

# 只盯 immich-server 的記憶體曲線
watch -n 2 "docker stats --no-stream --format \
  'table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}' | grep -E 'immich_server|NAME'"
```

合理重構的觀察結果：漲的是 **immich-server 本體**，不是 immich-machine-learning。這一點很關鍵——ML 容器吃記憶體是出了名的正常（模型載入就很大），如果漲的是它，故事會完全不同。而且曲線的形狀是「隨 job 進度線性爬升、歸零的唯一方式是容器重啟」，這不是「模型佔用」，是標準的洩漏特徵。

第二步是確認升級前後的差異。我的時間軸剛好乾淨：v1.143.1 上跑過同樣的縮圖 job 沒事，升上 v1.144.1 之後才爆。**升級後才出現、且與特定 job 強相關**——這兩條線索加起來，先暫停懷疑自己的設定（compose 沒改過），直接懷疑上游。

## 第二步：二分法——只有縮圖 job 在跑

immich 的 job 頁面可以單獨暫停每種背景工作，這是天賜的除錯工具。把所有 job 暫停、只開 Generate Thumbnails，曲線照樣爬；把縮圖 job 一暫停，曲線立刻不漲了。（同樣的手法在 issue #22515 裡另一位回報者 droopanu 也做了：facial recognition 觸發縮圖重生，暫停縮圖 job 之後洩漏停止。）

所以範圍收斂到：**v1.144.1 的 immich-server 在執行 thumbnail generation 時漏記憶體**。

## 第三步：上 GitHub 找同類回報

帶著「v1.144.1 + thumbnail + memory」去搜 immich-app/immich 的 issue，很快就撞上 [#22515「Immich is running out of memory while creating thumbnails (runaway memory)」](https://github.com/immich-app/immich/issues/22515)——2025-09-30 開的，比我進場早半天，症狀一模一樣：45,000 張圖跑縮圖、immich-server 反覆 OOM 重啟、懷疑 job 裡的 GC 沒有正常回收。樓裡另一位回報者從 v1.143.1 升級後出現同樣問題，跟我完全對上。

與此同時還有 [#22541「memory leak: node eats entire RAM after duplicates preview switching」](https://github.com/immich-app/immich/issues/22541)（2025-10-01 開）——在 web UI 反覆切換 duplicates 預覽，node 程序就把 RAM 吃光，回報者明講「didn't happen on 1.143」。兩個症狀（背景 job 的縮圖、前台瀏覽的預覽）看起來不相干，卻都在 v1.144.x 爆、都指向 node 程序——這種「多種不相干操作同時漏」的型態，通常不是應用層邏輯的鍋，而是更底層的東西。

## 第四步：上游定位——兇手是 libmimalloc

接下來是上游維護者的主場。mertalev 在 #22515 裡點出了真兇：

> It seems that Trixie uses a buggy alpha release of libmimalloc, which has relevant bug fixes relating to freeing memory in its changelog since the 3.0.1 alpha.

翻譯：immich 的 server 映像檔基底是 Debian trixie，trixie 的 `libmimalloc3` 套件裝的是 **mimalloc 3.0.1 的 alpha 版**，而 mimalloc 官方在那之後的 changelog 裡有一串跟「釋放記憶體」相關的修復——也就是說 alpha 版根本沒把記憶體還回去。immich 從 v1.143 系列開始在 start script 裡用 `LD_PRELOAD` 載入 libmimalloc（為了讓 thumbnail 生成的 MediaPipe 效能更好，也有 `VIPS_NOVECTOR` 相關的縮圖當機背景），結果在 trixie 上等於強制讓 node 走一個會漏的 allocator。

這也完美解釋了症狀的「不相干」：只要 node 程序在跑任何會頻繁配置釋放的東西——縮圖 job 也好、瀏覽器的 duplicates 預覽也好——漏的都是同一個洞。它不是 immich 應用程式碼的 bug，是**基底映像檔依賴的第三方 allocator 在特定版本上壞了**。

## 修復：revert、升級 mimalloc、跟著 v2.0.0 釋出

上游的處理分兩步，時間都在 2025-10-01：

1. **先止血**：[PR #22526](https://github.com/immich-app/immich/pull/22526)——revert [PR #22345](https://github.com/immich-app/immich/pull/22345)（#22345 是 09-23 才合併的「update libmimalloc path」，改完反而讓 LD_PRELOAD 正確載入了壞掉的 alpha 版；revert 等於退回不使用 mimalloc 的行為），由 alextran1502 在 2025-10-01 13:58 合併，同時關閉 #22515 與 #22541。
2. **再根治**：基底映像檔倉庫 immich-app/base-images 的 [PR #277「fix(server): memory leak in allocator」](https://github.com/immich-app/base-images/pull/277)——mertalev 把 build 改成安裝新版 mimalloc（3.15），並確認「thumbnail 生成的記憶體用量恢復正常，明顯低於 alpha 版或完全不用 mimalloc 的情況」。

這個 revert 正好搭上 immich 第一個 stable release 的便車：[#22526 進了 v2.0.0（2025-10-01 發佈）](https://github.com/immich-app/immich/releases/tag/v2.0.0) 的 changelog，完整 diff 在 v1.144.1...v2.0.0 的 9 個 commit 裡可以逐條核對。之後的 [v2.0.1](https://github.com/immich-app/immich/releases/tag/v2.0.1)（2025-10-03）與 [base-images PR #277](https://github.com/immich-app/base-images/pull/277) 帶入的新 allocator，把這條線徹底補完。

**我自己的時間軸（合理重構）**：從 docker stats 發現曲線不對，到暫停 job 確認相關性，到搜到 #22515 對上症狀與版本，再到看到 #22526 被 merge——快則幾個小時內。我當時的臨時緩解是先把 Docker 記憶體上限砍到 6GB（8GB VM），避免 immich 拖垮同機的其他服務；容器在縮圖期間還是會被 OOM kill 重啟，但至少不會連累別人。

## 複盤：這次排查可以帶走的三件事

1. **版本時間軸是最強的證據。**「上一版沒事、這一版爆」比任何 profile 都直接指向 regression，我那句 FB 廢話的完整版其實是：「我什麼都沒改，我只升級了。」自架服務升級前後的版本號要記得留著。
2. **容器化讓「誰在漏」一目了然，但也容易誤導。**`docker stats` 能告訴你漲的是哪個容器，但 container 記憶體是整個 node 程序的——如果漏的是 allocator，你從應用程式碼裡永遠找不到兇手。當多種不相干操作（背景 job、前台瀏覽）都漏的時候，往「基底映像檔／依賴層」想。
3. **上游反應速度值回票價。**#22515 開在 09-30，回報後不到 24 小時 revert 就 merge、關 issue，修復隨著隔天的 v2.0.0 一起出去。對自架用戶來說，**最快的修法往往不是自己 patch，而是確認上游已經在修，然後升級**。

有一說一，immich 官方的 job 頁面可以逐項暫停背景工作，這對排查的幫助超乎預期——能用「開關一個 job」驗證因果的系統，除錯起來比只能看 log 的系統舒服太多。

## 站內相關

- [EXL3 GLM 本地部署](/blog/exl3-glm-local-deploy/)——同一套「升級／換版本前後都要留時間軸」的心法，在本地推理部署上也適用。
- [MiMo EXL3 進度](/blog/miaai-exl3-progress/)——另一場長期盯資源曲線的戰役。

## References

- [immich issue #22515: Immich is running out of memory while creating thumbnails (runaway memory)](https://github.com/immich-app/immich/issues/22515) —— 2025-09-30 開，v1.144.1 縮圖 OOM；我（G36maid）2025-10-01 在此回報 18 萬張圖 OOM 的情況
- [immich PR #22526: fix(server): Revert update libmimalloc path (#22345)](https://github.com/immich-app/immich/pull/22526) —— 2025-10-01 合併，關閉 #22515 與 #22541
- [immich PR #22345: fix(server): update libmimalloc path](https://github.com/immich-app/immich/pull/22345) —— 2025-09-23 合併，這次洩漏的引爆點
- [base-images PR #277: fix(server): memory leak in allocator](https://github.com/immich-app/base-images/pull/277) —— mertalev 說明 trixie 的 libmimalloc3 是會漏的 alpha 版，改裝新版 3.15
- [immich issue #22541: memory leak: node eats entire RAM after duplicates preview switching](https://github.com/immich-app/immich/issues/22541) —— 2025-10-01，「didn't happen on 1.143」
- [immich v2.0.0 release](https://github.com/immich-app/immich/releases/tag/v2.0.0) / [v2.0.1 release](https://github.com/immich-app/immich/releases/tag/v2.0.1) —— revert 隨 v2.0.0 釋出
- [microsoft/mimalloc](https://github.com/microsoft/mimalloc) —— 3.0.1 alpha 之後的 changelog 含多項記憶體釋放修復
