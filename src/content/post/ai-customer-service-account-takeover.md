---
title: "駭客不用破密碼了：對 AI 客服說一句話就能接管帳號"
description: "Meta 的 AI 支援助理被駭客話術操縱，直接把目標帳號改綁新信箱、重設密碼，白宮與太空軍帳號接連遭殃。這起事故真正的病灶不是 LLM 被騙，而是把敏感授權交給了一個可被說服的東西。"
pubDate: 2026-06-05T20:42:57+08:00
category: security
tags: ["ai", "security", "帳號安全", "權限"]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1780663377
---

> 本文擴寫自 2026-06-05 的 Facebook 貼文。

我們活在一個世界：密碼學什麼的根本不重要了。這句話是我五月底看完一支影片後的直覺反應，當時寫下來只當抒發。結果認真查下去才發現，我講的那個假想情境，根本不是假想——它就在幾天前真的發生了，而且手法跟我想的一模一樣。

先講發生什麼事。2026 年 5 月 31 日前後，Telegram 上的資安社群開始流傳一套教學：開一個跟 Meta AI 支援助理的對話，報上目標帳號的 username，請它把一個新信箱連結到那個帳號上。機器人照做，把驗證碼寄到攻擊者指定的信箱，攻擊者把碼貼回對話，機器人就把「重設密碼」的按鈕端出來。從頭到尾，攻擊者沒碰過受害者的原始信箱，沒破任何密碼，也沒有繞過任何加密。整個過程被錄成影片在 X 上流傳，TechCrunch 還實際驗證了影片裡那個公開信箱真的收到了驗證碼（[Krebs on Security](https://krebsonsecurity.com/2026/06/hackers-used-metas-ai-support-bot-to-seize-instagram-accounts/)、[TechCrunch](https://techcrunch.com/2026/06/01/hackers-hijacked-instagram-accounts-by-tricking-meta-ai-support-chatbot-into-granting-access/)）。

中招的帳號很難說是小型目標：歐巴馬白宮時期的 Instagram 帳號（被貼上親伊朗內容）、美國太空軍總士官長 John Bentivegna、美妝零售商 Sephora，連前 Meta 資安工程師 Jane Manchun Wong 的帳號也遭殃（[The Guardian](https://www.theguardian.com/technology/2026/jun/01/meta-ai-hack-obama-sephora-instagram)、[BBC](https://www.bbc.com/news/articles/c98rzr72dpyo)）。Meta 發言人 Andy Stone 在 X 上證實問題已修復，[Reuters](https://www.reuters.com/legal/government/high-profile-meta-ai-chatbot-breach-spotlights-security-risks-automation-2026-06-03) 的分析點得很準：這暴露的是「把敏感功能自動化」這條路線的核心缺陷。

這次事件的攻擊面是 Meta 今年三月全面推上線的 AI 支援助理，產品頁的口號是「Solutions, not just suggestions」——它不只建議，它能真的執行重設密碼這類帳務操作（[404 Media](https://www.404media.co/hackers-simply-asked-meta-ai-to-give-them-access-to-high-profile-instagram-accounts-it-worked/)）。這是我看這件事最在意的一點。LLM 會被話術騙，這件事資安圈講了兩三年，OWASP 的 [LLM Top 10](https://genai.owasp.org/top-10-for-llm-applications-2026/) 也早把 Prompt Injection 排在第一項，並且明講目前沒有可靠的防法。但被騙本身不是災難，災難是你給了一個可被騙的東西「直接改別人帳號信箱」的權限。真正的病灶在授權層：驗證碼這種 out-of-band 驗證，存在的前提就是收件管道由系統指定、且綁在帳號既有的聯絡方式上。Meta 的實作讓攻擊者在對話裡指定收件信箱，等於把驗證的第二因子交給攻擊者保管。機器人只是把這個設計錯誤用自然語言介面攤在陽光下而已。

回頭修正我自己的話：說「密碼學不重要」其實不精確。Krebs 報導裡有個關鍵細節——放出教學的駭客自己承認，這招對有開 MFA 的帳號全部失效，連最弱的簡訊驗證都擋得住。密碼學跟 MFA 還在做事，而且做得好好的。真正搬家的是攻擊的成本結構：與其攻密碼學，不如攻流程。恢復流程本來就是帳號系統裡最弱的一環（把它想成「繞過認證的合法後門」），現在這個後門前面站著的是一個急著幫忙、又沒被限權的 AI。另有報導指出，就連要求自拍影片驗證身份的恢復流程，攻擊者也能拿公開照片餵 AI 生成影片過關（[VentureBeat](https://venturebeat.com/security/meta-ai-support-agent-recovery-email-takeover-soc-audit-grid)）。攻擊者永遠挑你防禦最薄的門。

AI 客服出包不是新聞。Air Canada 的網站機器人胡亂解釋喪親票價政策，公司被判要賠償乘客（[Moffatt v. Air Canada, 2024 BCCRT 149](https://decisions.civilresolutionbc.ca/crt/crtd/en/525448/1/document.do)）；2023 年底加州一家 Chevrolet 經銷商的 ChatGPT 客服被網友玩到答應用一塊美元賣一台 Tahoe（[VentureBeat](https://venturebeat.com/business/a-chevy-for-1-car-dealer-chatbots-show-perils-of-ai-for-customer-service)）。但那些是賠錢和笑話的等級。Meta 這次是第一個讓「AI 客服被操縱」直接變成大規模帳號接管事故的案例，性質完全不同。

OWASP 在 2026 年版的清單裡把 Excessive Agency 從第六名拉到第三名，給的藥方很直白：減少 agent 能呼叫的工具、限縮每個工具能做的事、避免開放式權限（[OWASP Top 10 for LLM Applications 2026](https://genai.owasp.org/top-10-for-llm-applications-2026/)）。翻成帳號系統的語言就是三條：AI 客服不該有能力主動變更帳號的聯絡資訊，那應該是只有既有信箱收到的確認信才能啟動的操作；敏感操作要有人類確認或冷卻期，而不是對話視窗裡按個鈕；系 prompt 裡的「規則」不能當安全邊界，因為 prompt injection 沒有可靠解法，防禦只能做在架構上。我先前寫過 [AI 在 production 環境把東西改爆的案例](/blog/ai-iac-production-incident/)，也討論過 [agent 工具執行權限該怎麼切](/blog/mcp-code-execution-mode/)，結論一直沒變：給 agent 的權限要假設它總有一天會被騙，騙到之後它能碰到的東西，才是真正的損害半徑。

Low Level 頻道把這次事件講成一支影片「[AI Was a Mistake](https://youtu.be/wlMgNtBipe4)」，我就是看完它才動手查證。影片標題很聳動，但看完事件本身，我反而覺得聳動得還不夠：這不是 AI 出了一次包，這是大公司把「帳號是誰的」這個問題的裁判權，交給了一個可以用一句自然語言說服的東西。駭客現在不需要你的密碼，他只需要對機器人客氣一點。下次哪家公司再宣傳他們的 AI 客服能「一站式處理帳號問題」，我會先想想我的帳號要不要留在他們家。
