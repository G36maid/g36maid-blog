---
title: "Debian 投票定了調：生成式 AI 貢獻不禁止也不背書，責任照樣在人"
description: "Debian 一般決議（GR）「LLM usage in Debian」於 2026-08-29 開票，由「負責任地使用生成式 AI」勝出：AI 貢獻可用、揭露不強制、責任完全歸貢獻者。解析條文、對比 Gentoo／NetBSD／Linux Kernel，以及我對 AI 改 IaC 需要 Policy as Code 防線的看法。"
pubDate: 2026-08-29T14:49:00+08:00
category: ai
tags: ["debian", "ai", "open-source"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1787986140
---

> 本文由 2026-08-29 的 Facebook 貼文於 2026-10-24 擴寫而成。

![Debian 投票決議允許專案貢獻使用生成式 AI](/media/2026-08/122174068244958395.jpg)
*圖：原 FB 貼文截圖。*

Debian 的一般決議（General Resolution）「LLM usage in Debian」在 2026 年 8 月 15 日至 28 日投票，8 月 29 日由專案秘書處開票公告：共有 425 張有效選票（法定門檻約 48.5），採 Condorcet 排序法，最終由選項五「Responsible Use of Generative AI」（由 Marc Haber 提出的 Proposal E）單獨構成 Schwartz 集合勝出——以 203:148 擊敗次佳選項、以 281:126 擊敗「以上皆非」。兩個傾向全面封殺的方案（修改社會契約禁 LLM、以及修改行為準則「能不用就不用」）在多數決階段就連「以上皆非」都沒贏過，直接出局。

## 決議核心規範

通過的條文不是新法，而是以憲法 4.1(5) 授權發布的一份專案立場聲明，重點條列：

- **適用範圍**：Debian「不背書也不禁止」在軟體開發、維護、打包與文件中使用生成式 AI。
- **標準一致**：不論工具為何，所有貢獻都適用同樣的品質、正確性、可維護性與法律合規標準；AI 不豁免、也不外加特殊規則。
- **責任歸屬**：貢獻者須在併入前理解、審查、測試並適當修改 AI 產出；盲目照單全收不符合 Debian 的既有開發實務。每筆貢獻的責任都在送出它的那個人身上。
- **揭露原則**：鼓勵揭露 AI 使用情況，但不強制。
- **資安禁令**：機密資訊——含未公開的安全漏洞（embargo）資訊、加密金鑰、憑證、基礎設施細節——未經明確授權不得送進第三方 AI 服務。
- **規模管控**：大量或自動化變更（mass bug filing、大規模改碼）須先透過正式管道討論取得共識，且由一名為其行為負責的人類全程監督。

條文明白將 AI 產出的著作權、作者身分等法律爭議留白，僅要求貢獻者自行評估來源與授權——既有的授權、著作權與 DFSG 相關政策照常適用。

## 逐條對照：生態系沒有收斂

把這份條文放回生態系，會發現各專案的答案截然不同。Gentoo 理事會早在 2024 年 4 月就決議「明文禁止」任何以 NLP 型 AI 工具產製的內容貢獻進 Gentoo（打包 AI 軟體本身不在此限）；NetBSD 也在 2024 年更新提交準則，原則上不收 AI 產出的程式碼。Linux 核心則走中間路線：2024 年初 Torvalds 才在 LKML 退回含 AI slop 的 patch，之後核心文件正式納入 AI Coding Assistants 指引——AI 輔助的 patch 照標準流程走，靠 Signed-off-by／DCO 由人類背書、並曾以 `Assisted-by` trailer 揭露；而據近期的維護者高峰會報導，連這個強制揭露也正被拿掉。GCC 與 Rust 也各自有政策頁，Debian 的選項七提案就引用了它們。

相比之下，Debian 這份勝出文本的特色是「不把 AI 產物當成獨立類別」：不新增 AI 專屬的門檻，也不新增 AI 專屬的豁免。揭露採鼓勵制是最有爭議的一條——落選的選項二要求實質由 AI 產生的貢獻必須揭露（例如 commit trailer），最終以 55 票之差落敗。這代表未來 Debian 檔案庫裡不會有辦法查「哪些程式碼用了 AI」；治理完全依賴現有的審查文化與責任歸屬。

## 治理意涵：責任不可外包

這份決議的治理哲學其實一句話就講完：工具不承擔責任，人才承擔。這和開源世界既有的 DCO／Signed-off-by 慣例一脈相承——你簽名，就背書。AI 沒有改變這件事，只是提高了「不審查就送出」的誘惑與速度。條文把「盲目接受 AI 產出」明文定調為不符合專案實務，等於預告：出了事，不會有「是 AI 寫的」這種藉口。

至於 DFSG 一致性，決議選擇不另立標準：AI 產出的內容和任何內容一樣，都要過既有的授權與自由軟體審查。法律上未定的部分（訓練素材重製、AI 產出可否有著作權）則誠實地留白，沒有假裝一紙決議能解決。

## 個人評論：揭露可以不強制，防線不能靠自覺

我認為 Debian 押注「責任與審查」而非「禁令與標籤」，是務實且正確的選擇——全面封殺只會逼貢獻者隱瞞工具使用，反而失去討論的機會。但我對大規模、自動化流程那條特別有感：條文只要求「事前討論＋有人負責」，這在治理上成立，在工程上卻不夠。以我寫過的 [AI agent 逃逸事故](/blog/openai-agent-hf-escape/)和 AI 改 IaC 的經驗，當變更規模大到人類無法逐行審查時，真正的防線必須是機器對機器的——也就是 Policy as Code：把授權清單、資源白名單、不可變更項目寫成 OPA/conftest 之類的政策檔，放進 CI 自動擋下違規 diff，讓「人類監督」從口號變成強制閘門。Debian 的決議給了 AI 一個負責任的位置，但每個專案還得自己把「負責任」翻譯成自動化防線；這一步，文件寫不出來，得靠 pipeline 寫出來。

## 參考

- [General Resolution: LLM usage in Debian（投票頁）](https://www.debian.org/vote/2026/vote_002)
- [Results 公告（debian-devel-announce）](https://lists.debian.org/debian-devel-announce/2026/08/msg00005.html)
- [Linux Kernel: AI Coding Assistants 文件](https://docs.kernel.org/process/coding-assistants.html)
- [Gentoo Council AI policy](https://wiki.gentoo.org/wiki/Project:Council/AI_policy)
- [GCC AI policy](https://gcc.gnu.org/ai-policy.html)
