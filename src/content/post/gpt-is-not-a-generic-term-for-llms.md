---
title: "拜託不要再說「用 GPT 完成了」——為什麼正確的說法是 LLM"
description: "「用 GPT 完成」是把方法名當品牌名、再把品牌名當類別名的雙重錯誤：從 2018 年 GPT-1 論文、GUID Partition Table 的 MBR 梗、genericide 商標通用化（含 USPTO 駁回 OpenAI 的 GPT 商標案），到為什麼該說 LLM，以及 Kizuna AI 梗圖的「以為 AI 醬就是 AI」。"
pubDate: 2025-10-05 01:47:31 +0800
category: ai
tags: [gpt, llm, chatgpt, genericide, trademark, partition-table, mbr, kizuna-ai]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1759600051
---

> 本文擴寫自 2025-10-05 的 FB 貼文。原稿是一段怨念滿點的短文，抱怨大家動不動就說「用 GPT 完成」；配上的是一張 Kizuna AI 流口水的梗圖。擴寫保留原稿語氣，脈絡與查證補於 2026-11-09。

「用 GPT 完成了。」「這是 GPT 生的。」——拜託，不要再這樣說了。好像世界上只有這一家語言模型一樣。為什麼不說 LLM？明明更準、更省事，還不用幫 OpenAI 打免費廣告。我還 MBR 咧。

這篇就來認真吐槽「GPT 當通稱」這件事：它怎麼從一篇論文的標題變成全球通用詞、硬碟分區的 GPT 為什麼輸了、為什麼正確的說法是 LLM——還有那張梗圖到底在梗什麼。

## GPT 本來就只是「一種做法」的名字

![Kizuna AI 流口水梗圖：這就跟以為 AI 醬就是 AI 一樣](/media/2025-10/122124386480958395.jpg)

先講技術史。GPT 是 **Generative Pre-trained Transformer** 的縮寫，2018 年 6 月 OpenAI 的論文〈[Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf)〉把這個詞帶進世界。定位很樸素：一個 1.17 億參數的 Transformer decoder，先在 BooksCorpus 上用「預測下一個詞」做無監督預訓練，再對各 NLP 任務 fine-tuning，12 個 benchmark 拿下 9 個 SOTA——「先無監督預訓練、再監督微調」這條 transfer learning 路線就此立住。

注意兩件事：
- **GPT 是方法名的縮寫，不是產品名。**「Generative Pre-trained Transformer」描述的是一種架構與訓練策略，任何照這個配方做出來的模型都可以叫 GPT。GPT-1 只是第一個照做的。
- **GPT 是 LLM 的子集。** LLM（大型語言模型）泛指一切用大量語料預訓練出來的大型語言模型，架構不限 Transformer decoder、訓練策略不限 generative pre-training。寫成集合關係就是：GPT ⊂ LLM。Claude、Gemini、Llama、Mistral 都是 LLM，沒有一個叫 GPT。

所以當有人說「這是 GPT 生的」，而那個輸出其實來自別家模型時，語義上錯了兩層：把方法名當品牌名用，又把品牌名當類別名用。

## 另一個 GPT 表示抗議

身為一個會碰硬碟的人，我看到 GPT 這三個字母的第一反應從來不是語言模型，而是 **GUID Partition Table**——UEFI 規範裡取代 MBR 的分區表格式。Intel 在 1990 年代末把它定義為 EFI（後來的 UEFI）的一部分：64-bit LBA、不再限 MBR 的四個主分區、表頭有主備兩份與 CRC 校驗，規格明文寫在 [UEFI Specification 2.11 第 5 章](https://uefi.org/specs/UEFI/2.11/05_GUID_Partition_Table_Format.html)。裝系統跑到 `gdisk` 時蹦出來的 GPT，是這個 GPT。

MBR 陣營表示：從 1980 年代 IBM PC 開始，這三個字母我們用了快四十年。是的，我還 MBR 咧。

當然，現實是殘酷的。ChatGPT 的聲量在 2022 年底爆發之後，「GPT = 語言模型」已經徹底碾壓「GPT = 分區表」。搜尋引擎直接告訴你 GPT 是什麼聊天機器人；除非在討論裝機，多數人不會想起 GUID Partition Table。這個時代，GPT 已經失去代表硬碟分區了。兩個無關的縮寫撞在一起，輸贏只看誰的聲量大，技術圈的「先佔」完全沒用——MBR 們只能默默把 `gdisk` 的 man page 留給同溫層。

## 這就是 genericide：品牌名被通用化

把品牌名（或單一廠商的方法名）用成整個品類的名稱，語言學和商標法裡有現成的名字：**genericide**（商標通用化）。經典案例：

- **Aspirin**：原本是拜耳的商標，1921 年 [Bayer Co. v. United Drug Co.](https://web.archive.org/web/20160714062336/http://cyber.law.harvard.edu:80/metaschool/fisher/domain/tmcases/bayer.htm) 判決後在美國淪為通用詞。
- **Zipper、Linoleum、Thermos**：都曾是商標，現在都是品類名。
- **Google 當動詞**：字典謹守「用 Google 搜尋」的定義，才算保住了商標（見 [generic trademark 條目](https://en.wikipedia.org/wiki/Generic_trademark)）。

有趣的是，OpenAI 自己也意識到這個風險——而且輸了。OpenAI 在 2022 年 12 月就「GPT」申請商標，USPTO 審查員先後認定該詞對其商品服務「具有描述性且可能屬於通用詞」，2024 年 2 月發出[最終駁回](https://www.oneilltranlaw.com/post/openai-thwarted-again-in-its-effort-to-register-gpt-as-a-trademark)：相關公眾已把「GPT」理解為某一類 AI 問答軟體的特徵，它描述的是功能而非來源，不能專用。法律層面已經承認大家把 GPT 當通稱用，這個詞連保護都拿不到。你說「用 GPT 完成」而實際用的是 Llama 或 Claude 時，OpenAI 想告都告不成——你的用法跟 USPTO 的裁定站在同一邊。

## 為什麼該說 LLM

那正確的說法是什麼？多數場景下，你想表達的是「大型語言模型」，也就是 **LLM**。這個詞：

1. **涵蓋面正確**：不管用哪一家的模型，LLM 都對。除非特指 ChatGPT 這個產品，或明確在講 GPT 系列模型，否則「用 LLM 完成」比「用 GPT 完成」準確得多。
2. **沒有品牌綁定**：說 LLM，句子不會隨著某家廠商的興衰而過期。十年後回頭看，「我用 GPT 寫了一個腳本」可能像「我把照片 Xerox 一份」一樣帶著時代的印記；「我用 LLM 寫了一個腳本」就沒這問題。
3. **對等關係清楚**：GPT 是 OpenAI 的模型系列（API 的模型 ID 也確實以 `gpt-` 開頭），ChatGPT 是包著這些模型的產品。三者是「方法名 → 廠商系列名 → 產品名」的關係，互相不能替換。

順帶一提，metonymy（換喻）本來就是語言的自然現象——用 nearby 的名稱指涉整體，就像「Kleenex」指面紙。我不是要要求所有人句句精確。問題是 LLM 這個正確的詞明明好用、又短、大家都懂，沒理由退而求其次用一個錯的。語言可以懶，但不要懶到把廣告詞當術語。

## 這就跟以為 AI 醬就是 AI 一樣

原稿配的那張圖是 Kizuna AI（絆愛）——2016 年 11 月在 YouTube 開設 A.I.Channel 出道的虛擬 YouTuber，自稱人工智慧（早期實際上主要由真人聲優配音驅動），大概是第一個讓「AI」這個詞在大眾文化裡綁定到具體角色的存在。

梗圖畫的是她流口水的樣子，對應原稿那句「這就跟以為 AI 醬就是 AI 一樣」：把「某一個最紅的代表」當成整個類別，是人類認知的老毛病。以為 Kizuna AI 就是 AI 的全部，跟以為 ChatGPT 就是 LLM 的全部，犯了同一個錯——**用最顯眼的樣本，取代整個概念空間**。認知上省力，語義上偷工。

所以下次要稱讚（或罵）一段機器產生的文字時，試試說「LLM 生的」吧。你真的用 ChatGPT 就說 ChatGPT；講硬碟分區我們再聊 protective MBR。拜託，別再讓三個字母一人打工三份工作，還只領 OpenAI 一家的錢。

## References

- [Improving Language Understanding by Generative Pre-Training（GPT-1 論文 PDF，OpenAI, 2018）](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf)
- [Generative pre-trained transformer — Wikipedia](https://en.wikipedia.org/wiki/Generative_pre-trained_transformer)
- [UEFI Specification 2.11, Chapter 5: GUID Partition Table (GPT) Disk Layout](https://uefi.org/specs/UEFI/2.11/05_GUID_Partition_Table_Format.html)
- [UEFI/GPT-based hard drive partitions — Microsoft Learn](https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/configure-uefigpt-based-hard-drive-partitions?view=windows-11)
- [Generic trademark — Wikipedia（genericide 與 Bayer/Aspirin 案例）](https://en.wikipedia.org/wiki/Generic_trademark)
- [OpenAI Thwarted Again in Its Effort to Register GPT as a Trademark — O'Neill Tran Law](https://www.oneilltranlaw.com/post/openai-thwarted-again-in-its-effort-to-register-gpt-as-a-trademark)
- [In re OpenAI OpCo, LLC — USPTO TTAB 文件（97733261）](https://ttabvue.uspto.gov/ttabvue/ttabvue-97733261-EXA-14.pdf)
- [Kizuna AI — Wikipedia](https://en.wikipedia.org/wiki/Kizuna_AI)
