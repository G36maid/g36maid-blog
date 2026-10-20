---
title: "中華電信小烏龜的行動條碼二階段鎖，我寫了個 Tampermonkey 腳本繞掉它"
pubDate: 2025-09-25T01:21:20+08:00
draft: false
description: "中華電信 2025/9 起在小烏龜後台加了行動條碼二階段鎖，驗證判斷卻只做在前端 JS——本文用 Tampermonkey 改寫 API 回應繞過它，只為了看自己家的斷線 log。"
category: essay
tags:
  - chunghwa-telecom
  - tampermonkey
  - network
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1758734480
---

> 擴寫自 2025-09-25 的隨筆

最近我跟室友的 meeting 常常莫名斷線，開視訊開到一半整個房間靜音，超尷尬。想說第一件事就是進小烏龜的管理介面看 log，到底是 DSL/PPPoE 掉線、還是內網 WiFi 的鍋。結果登入工程模式帳號 `cht` 之後，跳出來的不是熟悉的設定頁，而是一個要我「掃描行動條碼」的二階段驗證——用中華電信工程人員的專用程式才能解的那種。我：？？我自己的數據機，為什麼我進不去？

![被行動條碼擋下來的畫面](/media/2025-09/122122303910958395.jpg)

查了一下才發現，中華電信從 2025 年 9 月開始陸續用遠端韌體更新，在數據機的網頁後台加了一道「行動條碼（QR code）」第二關。輸入完帳密後會被導到 `/session2qrcode` 這個頁面，倒數計時幾分鐘，要你用工程人員的 App 掃 QR code 才放行。Mobile01 上也有一串討論在哀號這件事。本來想認命打電話報修，但斷線是隨機的，等工程師來早就看不到了。於是我直接寫一個腳本猴來 bypass 這個智障東西。

## 機制分析

用 DevTools 觀察整個登入流程，可以發現幾件事：

1. 帳號密碼本身的驗證是正常的——`cht` 加上「型號末四碼＋LAN MAC 後四碼」這組管理者帳密（各機型的規則網路上都整理過，例如 Zyxel 500NP 就是 `00np`＋MAC 後四碼）可以通過第一關。
2. 通過之後，後台前端 JS 會去呼叫一個 API，回應裡帶著 `PassWordCode: true` 之類的旗標，代表「這個 session 還沒過 QR code 驗證」。
3. 前端就靠這個旗標決定要不要把你丟到行動條碼頁面。

重點來了：**這個判斷是做在前端的 JS 裡**。F12 把回應裡的 flag 改成 `false`，頁面就乖乖放行，進到完整的管理介面。手動改斷點可以過，但每次操作跳轉又要再來一次，很煩，所以乾脆寫成 Tampermonkey 腳本，把所有 API 回應裡的驗證旗標一律改成 `false`。

## 操作步驟

1. **取得管理者帳密**：看機器底部標籤的型號和 LAN MAC，組出 `cht` 帳號的密碼（例：500NP＋MAC 後四碼 `ABCD` → `00npabcd`）。
2. **安裝 Tampermonkey**，新增下面的腳本，`@match` 依照你的數據機 IP 調整（小烏龜一般是 `192.168.1.1`，全屋通 mesh 機種是 `192.168.0.1`）。
3. **登入**：打開 `https://192.168.1.1/`，輸入 `cht` 帳密，本來會跳出的行動條碼頁面會直接被放行。
4. **看 log**：進系統資訊或狀態頁找系統 log，比對斷線時間點，看是 PPPoE 重撥、PON 訊號異常還是別的。

```javascript
// ==UserScript==
// @name         CHT modem QRcode bypass
// @namespace    local
// @version      1.0
// @description  把小烏龜後台回應中的行動條碼驗證旗標一律改成 false
// @match        http://192.168.1.1/*
// @match        https://192.168.1.1/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  // 命中各種可能的驗證旗標，全部翻成 false
  const FLAG =
    /("(?:PassWordCode|QRCodePass|QrPass|QrcodeCheck|secondAuth)"\s*:\s*)true/gi;
  const patch = (text) =>
    typeof text === "string" ? text.replace(FLAG, '$1false') : text;

  // 攔 fetch()
  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    const res = await origFetch(...args);
    const ct = res.headers.get("content-type") || "";
    if (!/json|text/.test(ct)) return res;
    const body = patch(await res.text());
    return new Response(body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  };

  // 攔 XMLHttpRequest()
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...args) {
    this._url = args[0];
    return origOpen.apply(this, args);
  };
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        const patched = patch(this.responseText);
        if (patched !== this.responseText) {
          Object.defineProperty(this, "responseText", { value: patched });
          Object.defineProperty(this, "response", {
            value: this.responseType === "text" || !this.responseType
              ? patched
              : this.response,
          });
        }
      }
    });
    return origSend.apply(this, args);
  };
})();
```

## 原理

這個繞法之所以可行，是因為韌體的驗證狀態只寫在 API 回應的旗標上，而**要不要強制跳行動條碼頁的邏輯完全由前端 JS 判讀**。後端雖然有記住「這個 session 尚未 QR 驗證」，但只要回應到達瀏覽器時被改寫成 `false`，前端就當你驗證過了。腳本就是在 `document-start` 階段把 `fetch` 和 `XMLHttpRequest` 都包一層，比對回應文本，命中旗標就改寫。

後來也看到社群有人把這件事整理成偵測建議：直接呼叫 `/cgi-bin/UserLoginCheck` 跳過 QR 流程的 session，會缺少正常流程的握手痕跡（Referer 異常、UA 是 `python-requests` 之類、缺 `Sec-Fetch-*` header）。換句話說，中華電信要修其實不難——把驗證狀態綁在 server 端 session 上、用短期一次性 token，前端只負責展示，而不是把放行與否交給前端改得動的旗標。

## 風險與注意事項

先講清楚：**這招只該用在自己家裡、自己有權管理的設備上**。小烏龜是中華電信的財產，也是你家對外的閘道，入侵或竄改別人的數據機是入侵行為，請不要。

另外幾點提醒：

- 不要動 WAN、TR-069 或電信端 VoIP 相關的設定，改壞了可能整條線路要重拉，客服也不一定救得回來。
- 看完 log 就好，設定改動盡量保守；我的目的只是診斷斷線，不是把機器改造成自己的路由器。
- 韌體更新隨時會讓腳本失效，旗標名稱或 API 路徑一換就要重新觀察。
- 每次韌體改版後重新登入前，先確認腳本還有 match 到正確的 IP。

## 個人評價

我能理解中華電信為什麼要上這道鎖——避免使用者亂改設定造成維運負擔。但把「使用者完全進不去自己的數據機」當解法，對想自己診斷網路問題的人來說真的很難受。斷線排查最需要的就是當下的 log，等人來早就事過境遷。鎖只鎖在瀏覽器前端，等於只防君子不防小人，還逼得我這種君子也變成寫腳本的小人。希望中華電信之後能開放某種「本機唯讀模式」，讓住戶至少能看 log、看狀態，而不是一個 QR code 擋所有人。

## References

- [登入中華電信小烏龜時, 需要掃Mobile Barcode? — Mobile01](https://www.mobile01.com/topicdetail.php?f=110&p=4&t=7168802)
- [小烏龜(數據機)QR-code 驗證防範 — P的胡言亂語](https://chunju.pixnet.net/blog/posts/49742972)
- [中華電信光世代小烏龜路由器 Mobile Barcode 行動認證碼上鎖 — 地瓜大的飛翔旅程](https://smlpoints.com/notes-cht-mobile-barcode-router-lock.html)
- [中華電信數據機預設帳號密碼總整理 — Clarence 的科技學習實戰筆記](https://blog.clarence.tw/2025/07/27/%E4%B8%AD%E8%8F%AF%E9%9B%BB%E4%BF%A1%E6%95%B8%E6%93%9A%E6%A9%9F%E9%A0%90%E8%A8%AD%E5%B8%B3%E8%99%9F%E5%AF%86%E7%A2%BC%E7%B8%BD%E6%95%B4%E7%90%86)
- [中華電信路由器-管理者帳號密碼 — GJLMoTea](https://home.gamer.com.tw/artwork.php?sn=4663621)
