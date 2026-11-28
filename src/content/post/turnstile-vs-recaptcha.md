---
title: "Turnstile 重做了，reCAPTCHA 要你掃 QR 碼：一次查核"
description: "2026-05 看到一篇抱怨 Cloudflare 與 Google CAPTCHA 良心差距的推文，半年後逐條查核：Turnstile 重設計與 WCAG 2.2 AAA 自評、Google Cloud Fraud Defense 真實存在但 QR code 挑戰非全面強制、兩家定價與隱私舊帳。"
pubDate: 2026-05-12T13:39:46+08:00
category: essay
tags: ["cloudflare", "turnstile", "recaptcha", "google", "captcha", "privacy"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1778564386
---

2026 年 5 月，我在推特上看到一篇貼文，大意是這樣：

「Cloudflare 和 Google 是兩家良心程度有著天差地別的公司。例如雙方的 CAPTCHA 產品：Cloudflare 在重做 Turnstile，讓所有狀態保持統一的設計語言和高易用性，按最高標準 WCAG 2.2 AAA 去最佳化；Google 的 reCAPTCHA 在添加不知所謂的 Cloud Fraud Defense，強制所有人必須用手機掃 QRcode。你們已經 Do be Evil 了。」

（原話收錄在 2026-05-12 的 Facebook 貼文，這裡憑原稿還原語氣。）

半年後我把這件事認真查了一遍，結論是：情緒方向對，細節有出入。

先講 Cloudflare 那半句。Turnstile 和 Challenge Pages 的重做是真的，官方部落格把標題下成「網際網路上被看得最多的 UI？」——他們自己統計 Turnstile 加挑戰頁每天被載入 76.7 億次。重做前先做了一輪內部稽核，查出來的東西不太好笑：有的狀態字型只有 10px、灰底灰字對比度「技術上符合 AA」但實際根本看不清楚、錯誤訊息有的長篇大論講 device clock 壞掉，有的只有一句 Timed out。重做後所有狀態共用同一套資訊架構：站名加 favicon、狀態訊息、Troubleshoot 連結各就各位，紅色只留給 icon。WCAG 2.2 AAA 的說法也是官方的，部落格明寫每個狀態都達到 AAA 對比標準。不過這裡有兩個皺褶：一是 Cloudflare 自己的文件就不同步——Turnstile 總覽頁寫「WCAG 2.2 AA compliant」，plans 頁的表格卻寫「WCAG 2.2 AAA compliance: Yes」；二是到目前為止沒有第三方稽核報告，AAA 是自評。爽歸爽，這條我會打折聽。

技術面上 Turnstile 有三種模式：Managed 依風險決定要不要給你一個 checkbox、Non-Interactive 顯示轉圈圈但永遠不用點、Invisible 完全隱形。沒有圖片九宮格，token 五分鐘一次性。免費方案沒有量的上限（每帳號 20 個 widget、每 widget 10 個 hostname），企業版才是找業務談的那種。

再講 Google 那半句。Cloud Fraud Defense 不是謠言，是 2026-04-22 在 Google Cloud Next 正式發表的產品，官方定位是「reCAPTCHA 的下一步演化」：從擋 bot 的單點產品變成從註冊、登入、購物車到付款整條 customer journey 的詐騙防護平台，還主打 agentic web。QR code challenge 也是真的，官方叫它 AI-resistant challenge，設計目標是讓自動化詐騙「經濟上不划算」。

但「強制所有人必須用手機掃 QRcode」這句，查下來是過度推論。官方文件的說法是 policy-based challenge：網站經營者設分數門檻，分數低於門檻的互動才會被丟進挑戰，QR code 是挑戰的一種形式。reCAPTCHA 自己的 FAQ 也說絕大多數 session 是背景評分不打擾人。我當時看到的應該是新版挑戰 UI 的截圖，把它讀成了全面強制——情緒真實，事實膨脹，這裡照實修正。

定價才是真正讓人皺眉的部分。Fraud Defense 的 Essentials 層每月免費 10,000 次 assessment，注意是「每個組織」合計、不分站；Premium 層超過免費額度後，10,001 到 100,000 次收 8 美元月費，超過 100,000 次每 1,000 次收 1 美元；Enterprise 是 12 個月起跳的約量承諾。跟 Turnstile 免費無量上限擺在一起，對小站來說這不是同一個等級的提案。assessment 這個計費單位也對開發者不友善：每個要驗的動作都要在後端打一次 create assessment，量大了帳單就是線性長。

隱私的舊帳也該翻一下。2020 年 The Register 就質疑過 reCAPTCHA：gstatic.com 號稱無 cookie，但研究者發現載入 reCAPTCHA 會被 redirect 到 google.com 並種下 NID cookie，就算瀏覽器擋第三方 cookie 也擋不掉，這件事被叫做 triangle syncing。官方 FAQ 承認的必要 cookie 是 _GRECAPTCHA。法國 CNIL 和奧地利聯邦行政法院先後認定 reCAPTCHA 的資料收集——IP、referrer、滑鼠鍵盤行為、設備資訊加一個唯一識別碼——超出必要範圍。原稿裡寫的「1.3.0 條款」我查不到對應版本，這條照實記為查不到。倒是 2026-04-02 reCAPTCHA 從 data controller 換成 data processor，隱私政策連結從 badge 上撤下，算是對 GDPR 壓力的回應，但 cookie 還在。

Turnstile 這邊也沒乾淨到哪裡去：官方 privacy addendum 列的 signals 包括 IP、TLS fingerprint、User-Agent 和 sitekey，只是承諾不用於廣告、不建跨站 profile。Turnstile 也收集資料，只是這些資料不進廣告機器。兩家真正的差別在這裡：Google 的產品最後會跟廣告生態同床，Cloudflare 的不會。

2026-11 update：查核到現在，Turnstile 重設計維持官方說法（AAA 自評、無第三方稽核，文件 AA/AAA 不同步仍未修）；Fraud Defense 已成為 reCAPTCHA 的統一傘形品牌，現有客戶被自動變成 Fraud Defense 客戶，定價結構沒變；QR code challenge 維持 policy-based、非全面強制。我五月那句「你們已經 Do be Evil 了」，事後看情緒可以留下，證據要先打折。
