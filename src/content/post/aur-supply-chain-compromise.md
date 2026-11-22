---
title: "AUR 400+ 套件供應鏈攻擊：孤兒套件繼承來的信任"
description: "2026 年 6 月，攻擊者冒充受信任維護者接手 AUR 孤兒套件，在 400 多個套件的建置流程植入竊密軟體 deps 與 eBPF rootkit，規模其後上修至 1,500 以上。本文整理時間線與 payload 分析，並從 AUR 的 PKGBUILD 信任模型與孤兒接管機制解釋攻擊面，附自查與防護建議。"
pubDate: 2026-06-13T00:51:46+08:00
category: security
tags: ["aur", "arch", "supply-chain", "security"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1781283106
---

> 本文擴寫自 2026-06-13 的臉書突發貼文（原稿性質：事件轉貼速記），於 2026-11-22 整理成文；「400 多個」是爆發當下的第一波數字，後續清查規模見文末。

2026 年 6 月 11 日，Arch User Repository（AUR）爆發近年最大規模的供應鏈攻擊：攻擊者冒充受信任維護者、大量接手無人維護的孤兒套件，在 400 多個套件的建置流程裡植入竊密軟體與 eBPF rootkit。事件爆發後幾小時內，社群掃出 408 個被動過手腳的套件；隨後的第二波把總數推上 1,500 以上。官方倉庫（core/extra）自始至終沒有被碰到——這場攻擊從頭到尾都發生在 AUR 的信任模型上，而且沒有利用任何漏洞。

時間線大致如下。6 月 11 日，Arch 開發者 Jonathan Grotelüschen（tippfehlr）在 aur-general 郵件列表開出「AUR REPORT THREAD」，請社群回報可疑套件；同一天，資安公司 Sonatype 把這波行動命名為「Atomic Arch」（追蹤編號 Sonatype-2026-003775，CVSS 8.7）。社群成員 André Herbst 直接 clone GitHub 上的 AUR 唯讀鏡像，對所有 ref 跑 `git grep` 搜「atomic-lockfile」，一口氣列出 408 個套件——每個的 PKGBUILD 或 `.install` 腳本都被塞進一行 `npm install atomic-lockfile ...`。6 月 12 日第二波改走 Bun、換成 js-digest / lockfile-js，一天內又多出近九百個。同日 Arch 官方發布新聞稿，證實「大量惡意接管與惡意更新」正在發生；tippfehlr 隨後宣布已知的惡意 commit 全數刪除，受影響套件清單放在官方 HedgeDoc（並明言清單不完整）。6 月 15 日，Arch 直接關閉 AUR 新帳號註冊以利清查。

![IFIN Threat Intel 的「400+ AUR Packages Compromised with Infostealer and Rootkit」頁面截圖](/media/2026-06/122165317046958395.jpg)
*截圖來源：IFIN Threat Intel（原稿附圖）*

惡意本體的分析已經相當完整。被植入的 npm 套件 atomic-lockfile@1.4.2 外表是正常的 TypeScript 工具庫，`package.json` 裡卻埋了一行 `"preinstall": "./src/hooks/deps"`。npm 安裝時會自動執行 lifecycle script，這就是武器化的那一步：不需要任何互動，建置過程本身就把 payload 跑起來了。被打出來的 ELF 名為 deps（SHA-256 前綴 `6144d433`），是 Rust 寫的竊密軟體，目標清單完全是對著開發者機器來的——Chromium/Electron 的 cookie 與 token（Slack、Teams、Discord、GitHub、npm、OpenAI）、SSH 金鑰、Vault token、Docker/Podman 憑證、shell history。資料經 temp.sh 外傳，C2 藏在 Tor onion 位址後面；取得 root 權限時還會載入 eBPF rootkit，用 `hidden_pids`、`hidden_inodes` 等 BPF map 把行程和 socket 藏起來，連 `/proc` 和 netlink socket diag 都看不到。它以 systemd service 做持久化，`Restart=always`。更陰險的是，攻擊者偽造了 git commit metadata，讓變更看起來像老維護者提交的——不驗簽章、光看 commit 歷史會被騙。

要理解這招為什麼有效，得回到 AUR 的設計。官方倉庫的套件由 Arch 打包者維護、經簽章的鏡像散布；AUR 則完全不同，它只是使用者上傳的 PKGBUILD 集合，下載後在自己機器上編譯，Arch 官方不審核、不擔保。這個模型的攻擊面因此非常明確：PKGBUILD 與 `.install` hook 在本地以你的權限執行，安裝階段還常常要 sudo 寫系統目錄；只要能在建置流程裡插入一行任意指令，payload 就直接在你機器上跑起來。

孤兒套件 adopt 機制則是這次的關鍵入口。套件被維護者棄養後標記為 orphan，任何註冊帳號都能申請接管，而且流程極輕：沒有身分審查、沒有等待期，也不會有任何通知告訴既有的使用者「這個套件換人了」。攻擊者不需要社交工程、不需要打漏洞，等於免費繼承了幾年累積下來的套件名聲與使用者基數。另外，payload 沒有直接寫在 PKGBUILD 裡，而是拆到 npm registry——PKGBUILD 本身幾乎沒變，只多了一行 `npm install` 一個「看起來人畜無害」的開發工具。粗看 diff 的人、或只核對下載來源校驗和的自動化流程，第一眼都很難抓到問題。一個跟 Node 毫無關係的套件突然多出 npm 依賴，正是該停下的紅旗。

具體建議（平時就該做，不只事件期間）：用 yay/paru 這類 helper 時開啟 diff 檢視（paru 預設會顯示 diff，yay 可設定 `--editmenu`），更新前把 PKGBUILD 與 `.install` 的變更看過一遍，特別留意新增的 `curl`、`npm`、`bun` 呼叫；npm 這邊能關 lifecycle script 就關（`--ignore-scripts`）；懷疑中標的話，對照官方受影響清單與社群檢查腳本。ioctl.fail 的分析報告附了完整 IOC 與處置步驟：檢查 systemd units 裡帶 `Restart=always` 的不明服務、`/sys/fs/bpf/` 下的 pinned map，並全面輪換 SSH key、GitHub/npm token 與瀏覽器 session。順帶一提，把 Arch 當日常系統的整體取捨，之前寫過一篇安裝筆記可以搭配著看：[/blog/arch-install-notes-2025/](/blog/arch-install-notes-2025/)。

五個多月後回頭看，這個故事沒有停在 6 月。7 月 13 日 AUR 重開註冊（加上拒絕一次性信箱、強制驗證等措施），但 7 月 29 日又冒出以 openconnect-sso 起頭的新一波接管攻擊，這次的 payload 帶 RAT 與 SSH 蠕蟲功能；Arch 先在 7 月 30 日停用套件接管、8 月 1 日連 git 推送也整個關閉，AUR 寫入側凍結十天。8 月 11 日 aurweb 6.5.0 上線後才恢復，最重要的變更是接管孤兒套件改為審核制：要由 Package Maintainer 核准，每個套件同時只能有一個待審申請，14 天無人處理自動退件。新帳號註冊至今仍未恢復。10 月中還出現假冒 yay/paru 的 typosquat（yyay、paur），帳號一天內就被封禁——接管這條路堵住之後，攻擊者轉向賭使用者手滑。審核制補掉了「秒繼承信任」這個最大的洞，但 AUR 的根本性質沒變：PKGBUILD 最終還是在你的機器上、以你的權限執行。最後一道防線，始終是你自己看過的那一眼 diff。
