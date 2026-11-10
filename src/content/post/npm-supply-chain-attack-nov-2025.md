---
title: "npm 怎麼又被駭了：Shai-Hulud 2.0 供應鏈蠕蟲拆解"
description: "Shai-Hulud 2.0 蠕蟲橫掃 npm：preinstall 執行 Bun payload、TruffleHog 掃憑證、偷來的 token 自動回灌數百套件。拆解時間線、手法與第一波差異，整理 ignore-scripts、trusted publishing 等防線，文末補 2026-11 update。"
pubDate: 2025-11-28 08:25:03 +0800
category: security
tags: ["npm", "supply-chain", "security", "shai-hulud", "open-source"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1764289503
---
*擴寫自 2025-11-28 的 Facebook 貼文「npm 怎麼又被駭了」，正文保留當下觀點，文末補一段 2026-11 update。*

## npm 怎麼又被駭了

十一月二十四號早上看到消息，我只能原句照錄：npm 怎麼又被駭了。這句話 2025 年講太多次了。九月才被 Shai-Hulud 蠕蟲掃過一輪，十一月下旬它帶著更大的規模回來，研究者乾脆照它自己留下的標記命名：Shai-Hulud 2.0，或它 repo description 裡那串「Sha1-Hulud: The Second Coming」。

## 時間線：有耐心的攻擊

時間都用 UTC，細節來自 PostHog 和 Wiz 的報告：

- **11/18**：一個事後被刪除的帳號對 PostHog 的 repo 開 PR，改掉 `pull_request_target` workflow 會執行的腳本，讓它把 CI secrets 送進攻擊者控制的 webhook。bot 的 GitHub PAT 就這樣被偷走，再沿線摸到 npm publish token。
- **11/24 03:16**：最早一批毒版本上線，AsyncAPI 專案三十多個套件；ReversingLabs 認為起點很可能是 @asyncapi/specs。
- **04:11 / 05:09 / 05:50**：PostHog、Postman、Zapier 的套件接連被植入，Zapier 十點半就把自己 47 個版本下架。

PostHog 那篇 post-mortem 最值得看的就是這段：攻擊者 11/18 就拿到憑證，忍到 11/24 才發動。這不是亂槍打鳥，是挑好 patient zero、算好 CI 裡掛了哪些 token 的定點攻擊。

## 手法拆解：每台機器都是下一個發布者

被植入的套件在 package.json 多了一個 preinstall script 執行 setup_bun.js：裝好 Bun runtime，把十 MB 的混淆 payload bun_environment.js 丟進背景執行，輸出全吞掉，npm install 看起來一切正常。接著：

1. 下載 TruffleHog 掃整個家目錄找憑證；環境變數、.npmrc、GitHub CLI 設定照單全收，AWS/Azure/GCP 的 metadata service 和 Secrets Manager 也逐一翻過。
2. 把偷到的東西三層 base64 編碼，推進用受害者自己 GitHub token 開的公開 repo，description 固定是「Sha1-Hulud: The Second Coming.」——這串字同時是 beacon：抓不到 token 的受害者會去 GitHub 搜這串字，撿別人外洩的 token 繼續用。
3. 在機器上註冊一個叫 SHA1HULUD 的 self-hosted GitHub Actions runner，配一個由 Discussions 觸發的 workflow，給攻擊者留下互動式通道。
4. 找到 npm token 就打 registry 的 whoami 驗證，列出該帳號最多一百個套件，每個下載 tarball、塞進兩個惡意檔案、patch 版本號加一、重新打包發布。整條鏈沒有 C2，每個受害者就是下一個發布者。
5. 什麼都偷不到的話，把家目錄 shred 掉。純破壞的 dead man's switch。

用 patch bump 很賤：`^x.y.z` 的專案下次安裝就自動吃進毒版本，版本號完全看不出異狀。

## 規模

各家統計口徑不同：Socket 數到 500+ 套件、700+ 個版本；Datadog 估 796 個不重複套件、合計每週 2,000 萬次下載；Orca Security 給出 425 套件、月下載 1.32 億。Wiz 追蹤到 25,000 個以上的外洩 repo——幾萬台機器的憑證被公開曬在 GitHub 上。Zapier、ENS Domains、PostHog、Postman、AsyncAPI 全部中鏢，甚至燒出 npm 生態：mvnpm 會自動把 npm 套件重打包成 Maven artifact，結果連 Maven Central 上的 posthog-node 4.18.1 都帶著同一份 payload，Maven 團隊在 11/25 把鏡像副本清掉了。

## 和九月那波差在哪

九月第一波用 postinstall、payload 叫 bundle.js、外洩 repo 固定叫 shai-hulud，約 500 個套件中鏢。第二波的升級很清楚：preinstall 讓靜態掃描和建置階段都攔不到；外洩 repo 名改隨機，只能靠 beacon 字串追蹤；加了 wiper 和 runner 持久化；而且這次鎖定的是 Zapier、PostHog 這種 CI 裡掛滿 token 的公司帳號，比九月散戶維護者的油水多得多。

## 為什麼 npm 生態一直在出事

把八月 s1ngularity/Nx、九月 Shai-Hulud、十一月第二波排在一起看，套路完全一致：偷到一個能發布套件的憑證，剩下的 npm 自己會辦好。npm 的信任模型裡有兩個假設早就該崩了：能在 CI 讀到 npm token 的人（或蠕蟲）就等於維護者本人；安裝時執行任意 lifecycle script 是正常行為。系統從來沒驗證過「發布者」和「機器上跑這段程式的東西」之間的距離。

## 我會做的防線

每天 npm install 的人，能做的是把攻擊面一塊塊拆掉：

```bash
# 關掉安裝時腳本：對這類蠕蟲最直接的一刀
npm config set ignore-scripts true --location=global
```

```yaml
# pnpm 10 之後預設不跑安裝腳本，再加發布冷卻期
# pnpm-workspace.yaml
minimumReleaseAge: 4320  # 3 天，讓通報系統有時間抓毒版本
```

```bash
# CI 裡驗簽章與 attestation；鎖版本用 exact，不給 patch bump 見縫插針
npm audit signatures
npm install --save-exact <pkg>@<version>
```

發布端往 trusted publishing 搬——GitHub Actions 用 OIDC 短期憑證，repo 裡根本不放 npm token，PostHog 事後也是這樣改的。另外把每個用 `pull_request_target` 的 workflow 翻出來看一次，那個 trigger 的權限語意連 PostHog 都會踩坑。想在 CI 裡讓 agent 自動審 dependency diff 也行，但憑證要切到最小，跟我在[多 agent 資安分析](/blog/multi-agent-security-analysis/)寫的是同一件事：能力可以給，token 不能整包給。

## 感想

兩個月一波的節奏，靠「這次學到教訓」的記憶撐不住，只能靠機制：ignore-scripts 這種一次性設定、CI 裡不放長期 token、發布走 OIDC。每次事故都有人喊開源信任崩壞，但真正崩的是三個工程假設——lifecycle script 可執行、token 等於身分、新版本等於安全——而每一個都有便宜且已知的修法，缺的只是把修法變成預設值的意志。

## 2026-11 update

一年後回看：GitHub 和 npm 當年 12 月就動手，2025-12-09 撤銷所有 classic tokens、改成 session-based auth，granular tokens 上限 90 天，新套件預設強制 2FA，並大力推 trusted publishing，長期 npm token 漸漸從 CI 裡消失。但蠕蟲沒有絕跡：2025 年 12 月底出現只落在單一套件、更隱蔽的 Shai-Hulud 3.0；2026 年 5 月 TeamPCP 的「Mini Shai-Hulud」同時掃過 npm 和 PyPI 一百七十多個套件，最諷刺的是這些毒版本帶著有效的 SLSA Build Level 3 provenance attestation——簽章證明的是「從哪個 CI 建置」，不是「建置環境乾淨」。之後還有 Red Hat 套件的 Miasma、2026 年 8 月的 keyv/cacheable 事件，用的都是同一套被公開的蠕蟲模板。結論沒變：provenance、簽章、2FA 都是必要而非充分，安裝端不跑腳本加上發布端零長期憑證，仍是我認為唯二真正有效的那兩層。
