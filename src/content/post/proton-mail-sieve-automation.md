---
title: "Proton Mail 免費版也能玩出花樣：自己寫 Sieve 腳本做信件自動分類"
description: "Proton Mail 免費版只有一個自訂篩選器，但 Sieve 腳本不受此限。從編輯器位置、spam-threshold 放行段、domain 分類規則到完整可複製範例與除錯心得，附免費版限制查證（Bridge 付費、1GB 容量、每日 150 封）。"
pubDate: 2025-07-22 10:08:31 +0800
category: linux
tags: ["proton-mail", "sieve", "email", "automation", "filter", "rfc5228", "tool-review"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1753150111
---

# Proton Mail 免費版也能玩出花樣：自己寫 Sieve 腳本做信件自動分類

> 擴寫自 2025 年 7 月的 Facebook 相片貼文，正文以 2026 年 11 月查證的資料補齊細節。

## 免費版的痛：只有一個自訂篩選器

我對隱私導向的信箱服務一直有好感，Proton Mail 是其中最順手的——不用錢、註冊就能用，加密預設打開。但免費方案的限制很實在：容量 500 MB 起、做完新手任務提到 1 GB；資料夾 3 個、標籤 3 個；自訂篩選器只有 **1 個**；每天寄信上限 150 封（每個收件人算一封）。

1 個篩選器是什麼概念？GUI 那種「寄件人包含 OO → 丟進 XX 資料夾」的規則，一封 newsletter 就用掉了，想自動整理信箱的人根本不夠用。

不過 Proton 留了一道後門：篩選器設定裡可以寫 **Sieve 腳本**，不受「1 個 custom filter」的額度限制——一個腳本裡能塞一整串 if/elsif 鏈，等於把幾十條 GUI 規則壓縮成一個檔案。這是免費版上最有誠意的進階功能。

## 編輯器在哪裡

打開 [mail.proton.me](https://mail.proton.me/)，進 **設定 → 所有設定 → Proton Mail → 篩選器 → 新增 Sieve 篩選器**，就會看到一個帶行號和語法上色的程式碼編輯器，長這樣：

![2025 年 7 月的 Proton Mail 網頁版 Sieve 篩選器編輯器畫面：篩選器名稱「my filter」，左側是設定選單，下方有取消與儲存按鈕](/media/2025-07/122095471934958395.jpg)

就是截圖裡這個畫面。取個名字（我當時直接叫 `my filter`），下面貼腳本，按儲存就生效，之後每封進來的信都會跑一次。

Sieve 不是 Proton 發明的，它是 [RFC 5228](https://www.rfc-editor.org/info/rfc5228) 定義的信件過濾語言，2008 年就標準化，Dovecot 這類自架郵件伺服器方案也內建直譯器。它刻意設計得很受限——沒有迴圈、不能呼叫外部程式——寫不出危險的東西，伺服器跑起來很安全。學一次這套語法，在 Proton 和自架 mail server 上都通用。

## 第一段：放行 spam 判定

Proton 生成的腳本範本開頭會有這樣一段：

```sieve
require ["include", "environment", "variables", "relational",
         "comparator-i;ascii-numeric", "spamtest", "fileinto"];

# Generated: Do not run this script on spam messages
if allof (environment :matches "vnd.proton.spam-threshold" "*",
          spamtest :value "ge" :comparator "i;ascii-numeric" "${1}")
{
    return;
}
```

這段的意思是：先問 Proton「你的垃圾信門檻設多少」，再把每封信的 spamtest 分數拿來比，達到門檻的信直接 `return`，後面的分類規則一概不跑。沒有這段，自己的分類規則會連被判成 spam 的信也一起處理，等於幫垃圾信開直通車。

`vnd.proton.spam-threshold` 是 `vnd.proton.` 開頭的 vendor extension。RFC 5228 的擴充機制本來就允許實作方註冊 `vnd.` 前綴的自訂能力，Proton 官方文件也列了自家的擴充（`vnd.proton.eval`、`vnd.proton.expire`），但這個 spam-threshold 環境變數在文件裡沒有獨立說明段落——我是從編輯器自動生成的範本直接抄來用的，[nobodyhome.dev 的筆記](https://nobodyhome.dev/posts/sieve-filters/)也有同一段，抄就對了，不用自己發明。

## 主體：用 domain 把信分進資料夾

放行段之後就是分類本體。當時的思路很直白：社群網站的通知信全部看寄件人 domain，一網打盡：

```sieve
if anyof (address :domain :is :from "facebookmail.com",
          address :domain :is :from "instagram.com",
          address :domain :is :from "threads.net")
{
    fileinto "social";
}
elsif anyof (address :domain :is :from "104.com.tw",
             address :domain :is :from "linkedin.com")
{
    fileinto "jobs";
}
elsif anyof (address :domain :is :from "github.com",
             address :domain :is :from "gitlab.com")
{
    fileinto "dev";
}
```

幾個語法點：

- `anyof` 是「任一條件成立」；全部要成立用 `allof`。
- `address :domain :is :from` 只比對寄件人位址的 domain 部分。Facebook 的通知信寄件人是一大串亂數 `@facebookmail.com`，比對 domain 才是正解。
- `fileinto` 的目標資料夾必須先存在（在「資料夾和標籤」設定裡建好），不存在時行為不如預期，別偷懶。
- `elsif` 依序檢查，命中一組就停，同一封信不會被丟進兩個資料夾。

最快的除錯法是先在 GUI 建一條類似規則、儲存後切回 Sieve 檢視，Proton 會翻譯成腳本給你看，照著改最穩。

## 除錯：語法錯誤會怎樣

實際踩過的狀況：

- **存檔時做基本語法檢查**。括號沒閉、分號漏掉、`require` 少引一個用到的指令，儲存時就會被擋下來，不會讓壞腳本上線。
- **語意錯誤不一定報錯**。像 `fileinto` 指到不存在的資料夾，存檔可以過，但信不會出現在期待的地方，上線後最好寄測試信確認。
- **正規表示式支援有限**。`\d`、`\w` 這種 shorthand 會讓規則**安靜地失效**——不報錯、就是不動，最難抓。老實用 `:is`、`:contains`、`:matches` 加 `*` 萬用字元反而好維護。
- 腳本按進信順序跑，`return` 之後的規則不執行，重要的判斷放前面。

另外，Sieve 的 `vacation`（自動回信）動作在 Proton 只限付費方案，免費版寫了也不會動，這是少數查得到的付費牆。

## 完整可複製的範例

把上面的段落拼起來，就是一個可以直接貼進編輯器的完整腳本：

```sieve
require ["include", "environment", "variables", "relational",
         "comparator-i;ascii-numeric", "spamtest", "fileinto"];

# Generated: Do not run this script on spam messages
if allof (environment :matches "vnd.proton.spam-threshold" "*",
          spamtest :value "ge" :comparator "i;ascii-numeric" "${1}")
{
    return;
}

if anyof (address :domain :is :from "facebookmail.com",
          address :domain :is :from "instagram.com",
          address :domain :is :from "threads.net")
{
    fileinto "social";
}
elsif anyof (address :domain :is :from "linkedin.com")
{
    fileinto "jobs";
}
elsif anyof (address :domain :is :from "github.com",
             address :domain :is :from "gitlab.com")
{
    fileinto "dev";
}
```

用之前記得先把 `social`、`jobs`、`dev` 三個資料夾建好，domain 清單換成你自己的版本。

## 評價與缺點

用下來的整體感想：這是免費信箱服務裡少見「把程式語言交給你」的設計。別家免費版多半只給幾個下拉選單湊規則，Proton 直接給 RFC 標準的腳本環境，一個檔案撐起整個信箱的分類邏輯，對會寫一點程式的人非常划算。

缺點照實寫：

- **Bridge 要付費**。想用 Thunderbird、Outlook 收信得透過 Proton Mail Bridge，官方文件寫明「currently available only with a paid Proton Mail plan」，免費版只能用網頁版和手機 App。這是免費版最大的硬傷——自動化做得再好，收信體驗仍被鎖在瀏覽器裡。
- **容量 1 GB 封頂**，當主要信箱很快滿。
- **每天 150 封寄信上限**（每收件人算一封），也沒有自動轉寄。
- 資料夾 3 個、標籤 3 個對重度分類的人還是緊，Sieve 能把 1 個篩選器的價值榨到極限，但資料夾數量本身繞不過去。
- 沒有自己的 domain（付費功能），位址綁在 `@proton.me`，搬家成本高。

結論：免費版當「自動整理過的隱私備援信箱」剛剛好，Sieve 是它最超值的部分；但要認真當主力信箱，Bridge 和容量這兩關遲早逼人升級 Mail Plus。順帶一提，這種把整理工作交給腳本的思路，跟我在 homelab 上整理照片很像，可以看[用 fclones 做照片去重](/blog/fclones-photo-dedup-homelab/)；更徹底的做法是自架郵件伺服器，[BSD NAS 上的 OPNsense 巢狀虛擬化](/blog/bsd-nas-opnsense-nested-virt/)那篇記錄了部分基礎設施。
