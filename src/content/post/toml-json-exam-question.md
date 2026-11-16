---
title: "助教出題事件簿：TOML <-> JSON 互轉，以及 Tom 的語言一點也不 obvious、一點也不 minimal"
description: "去年當助教出過一題 TOML <-> JSON 互轉，批改到一半變成對 TOML 的吐槽文：greentext 迷因起手（>be TOML / not obvious / not minimal）、[[array of tables]] 與 dotted key 的語意陷阱、日期時間四件套、issue #409 的決策矛盾史、250+ 小節的「minimal」規格，以及 round-trip 為何注定 lossy。"
pubDate: 2025-11-05T16:59:54+08:00
category: programming
tags: [toml, json, config, rust, python, shitpost]
draft: false
source: facebook
sourceType: "相片"
sourceTimestamp: 1762333194
---

> 本文由我 2025-11-05 的 Facebook 貼文（附一張 Tom Preston-Werner 抱頭的照片迷因）於 2026-11-16 擴寫而成，調查與連結均已補齊。

去年當助教的時候，我出過一題程式設計作業：給一份 TOML 設定檔，寫程式把它轉成 JSON，再轉回來。題目本身很單純——就是練樹的走訪、字串處理和資料表示的對應。但批改的時候我一直在想一件事，想著想著就變成這篇文：

>be TOML
>Tom's Obvious, Minimal Language
>not obvious
>not minimal

這不是反串。出完這題、看完學生的答案之後，我對這兩句的體會比以前深了很多。

## TOML 是什麼：一句官方自我介紹

先把背景補齊。TOML 是 Tom Preston-Werner（GitHub 共同創辦人）在 2013 年設定的設定檔格式，官網開頭的自我介紹就寫著 [TOML v1.0.0 規格](https://toml.io/en/v1.0.0)的第一行：

> TOML aims to be a minimal configuration file format that's easy to read due to obvious semantics.

「因為語意 obvious 所以 easy to read」——這就是整個格式賣點的核心。名字本身就是縮寫式廣告：**T**om's **O**bvious, **M**inimal **L**anguage。

它也確實成功了。Rust 的 [Cargo](https://doc.rust-lang.org/cargo/) 用 `Cargo.toml`，Python 的 [PEP 518](https://peps.python.org/pep-0518/) 把 `pyproject.toml` 定成官方專案設定檔（理由欄直接寫「human-usable unlike JSON、not overly complex unlike YAML」），Hugo 的[站點設定](https://gohugo.io/getting-started/configuration/)也吃 `config.toml`。從 [CHANGELOG](https://github.com/toml-lang/toml/blob/main/CHANGELOG.md) 看，它從 2013 年 3 月的 v0.1.0（changelog 裡還留著一句「From Twitter rage to reality; TOML is now a thing.」）一路演到 2021 年 1 月的 v1.0.0，花了整整八年才穩定下來。八年——一個主打「minimal」的格式。

## 題目設計：為什麼 TOML <-> JSON 是個好考題

回到那題作業。TOML <-> JSON 互轉之所以是個好題目，是因為它逼學生直視「資料模型」和「語法」的差別：

- **TOML → JSON** 基本上是單向的：TOML 的資料模型（鍵值對的巢狀雜湊表）是 JSON 物件樹的子集，轉過去沒什麼懸念。
- **JSON → TOML** 就好玩了：JSON 的結構不一定能對應回 TOML 的語法。JSON 根節點可以是陣列，TOML 不行（TOML 根層只能是鍵值對和 table）；JSON 的 key 可以是空字串或包含怪字元，TOML 的 bare key 有字元限制，得用 quoted key 繞；JSON 數字的精度、巢狀深度，都會在「轉回去」的時候製造麻煩。

換句話說，這題真正的考點不是 parsing，而是**表示能力（representable range）不對稱**。TOML 官方宣稱「designed to map unambiguously to a hash table」，但 hash table 和 TOML 語法之間有著一整層語法糖的距離——學生如果只寫了 TOML → JSON 方向就交卷，是寫不出這層距離的。

而出題當下我沒想那麼多，只是覺得「TOML 是現代最流行的設定檔格式，學生該會」。直到改作業的時候我才發現，我等於讓全班一起見證了 TOML 的文法長什麼樣。

## not obvious：那些「看不出來」的語法

先講 obvious 這一半。以下這些語法，我認為都不符合「看一眼就懂」的標準：

**`[[array of tables]]` 雙中括號。** 單中括號 `[table]` 是開一個 table，雙中括號 `[[table]]` 是往一個 table 陣列裡 push 一個新元素。第一眼看起來只像「中括號寫兩次」，語意卻完全不同。連 [TOML 官方 issue #689](https://github.com/toml-lang/toml/issues/689) 裡都有人直接吐槽：「Will it be obvious for those who don't bother to even read the spec?」答案就寫在下一行——「Certainly more obvious than local time, arrays of tables, or dot notation for supertable generation.」連社群自己都承認這些語法對沒讀 spec 的人不 obvious。

**dotted key 與 `[table]` 的交互作用。** `[a.b]` 底下的 key 屬於哪一層？dotted key `a.b = 1` 跟 `[a]` 底下寫 `b = 1` 是不是同一件事？答案是：大部分情況是，但 once you define `[a.b]`，你就**不能**再用 `[a]` 重新定義整個 table，這時 dotted key `a.c = 2` 反而是加在 `a` 底下——語意變成「append 到已存在的 table」。三種寫法、兩種語意、一個「定義過就不能再碰」的規則，這就是所謂的 obvious。

**多行字串的 `"""` 與 `'''`。** 基本字串、多行基本字串、literal 字串、多行 literal 字串——四種字串語法，差異在跳脫規則和換行處理（行尾反斜線會吃掉緊跟的換行）。學生第一次寫多行字串幾乎都會踩到「行尾 `\` 靜默吃換行」這個行為，而且解法是去讀 spec 第幾節，不是「看一眼就懂」。

**日期時間四件套。** offset date-time、local date-time、local date、local time——四種型別，TOML 1.0.0 才新增的 [PR #894](https://github.com/toml-lang/toml/pull/894) 又讓秒數變成可選，所以 `14:15` 是 local time、`2010-02-03 14:15` 是 local date-time。沒有時區的時間是個什麼東西？設定檔裡寫一個「當地時間」要怎麼在不同機器上有一致的語意？這是 TOML 被吐槽 not minimal 最經典的例子——連 [issue #689](https://github.com/toml-lang/toml/issues/689) 裡討論到 range type 要不要加進去時，反方論點直接是「local time, arrays of tables, or dot notation 都已經夠不明顯了，還想加 range？」。

**[Issue #409](https://github.com/toml-lang/toml/issues/409) 的自打臉史。** 早期 TOML 決定不支援十六進位和八進位整數，理由是「implementation simplicity」——太難寫 parser。後來 datetime 進來了（datetime 的 parser 難度明顯高於 hex），issue #409 就有人問：這兩個決策矛盾吧？「Parsing hex values is not complex. It's a problem with 'Coding 101 homework' levels of difficulty.」這個 issue 後來的結局是 hex/octal 進來了，但論證過程本身就說明了：所謂「minimal」的界線，是按「作者覺得需不需要」滑動的，不是按語法複雜度算的。

## not minimal：八年的穩定期和一個複雜度曲線

「minimal」的問題是，它不是一個可以驗證的屬性。你問十個人「minimal 的設定檔格式長怎樣」會得到十個答案，但 TOML 的實際複雜度是可以量的：**v1.0.0 規格全文（[toml.io/en/v1.0.0](https://toml.io/en/v1.0.0)）超過 250 個小節**，從 basic string 的跳脫規則一路列到 array of tables 的定義限制。一個「minimal」的格式需要 250+ 個小節的 spec 才能定義完，這句話本身就很好笑。

對照組是 JSON：[RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) 全文十幾頁，文法用一段 ABNF 就寫完了。JSON 不 obvious 的地方只有一個——不能寫註解、人類直接編輯很痛苦——但它的文法是**真的** minimal。TOML 的「minimal」更接近「比 YAML 少」，而不是「比 JSON 少」。2013 年它誕生時的假想敵是 YAML，打贏 YAML 很容易，因為 YAML 的 complex 標籤、anchor、多文件這些東西是設定檔格式裡的怪獸等級；但打贏 YAML 不等於自己就是 minimal，這個推論是個邏輯上的偷渡。

我出題的時候另一個體會是：**TOML 的語法糖讓 round-trip 變成 lossy。** [dev.to 那篇〈TOML: the annoying parts〉](https://dev.to/dmbaturin/toml-the-annoying-parts-5h5c)寫得比我完整：「None of existing libraries can parse a TOML file and print it back as it came.」註解、行號、table 是 normal 還是 inline、dotted key 展開與否——這些「語法層」的資訊在 parse 成資料結構的瞬間就沒了。我的考題要求「轉過去再轉回來」，但轉回來的 TOML 跟原檔几乎一定長得不一樣：原本的 `[a]` + `b = 1` 會被 printer 重新排版成別的形狀。這對設定檔格式來說是個現實問題——你改了一個 key，diff 卻顯示整個檔案都被重排了。學生的作業裡最常見的扣分點就是這裡：他們以為 round-trip 等於 identity，但其實等於 semantic equality。

## 那為什麼大家還在用它

吐槽歸吐槽，得承認 TOML 在它真正的主戰場上還是贏家。原因很實際：

1. **比 YAML 安全。** YAML 的 `no` 被解析成 `false`（在 YAML 1.1）、挪威縮寫變 boolean、縮排錯誤靜默改變結構——這些 footgun 是設定檔格式的死罪。TOML 沒有這些，它的型別系統是「看起來怎樣就是怎樣」，`"no"` 就是字串。
2. **比 JSON 人性。** JSON 不能寫註解、key 要加雙引號、尾逗號不能有——對「人類手編的設定檔」來說全是折磨。TOML 針對這三點都是改善的。
3. **格式夠穩。** 2021 年之後 spec 沒再動過，工具鏈飽和（每個語言都有多套 parser）。

所以真實的評價應該是：TOML 是「YAML 和 JSON 之間務實的甜點」，但它的自我行銷——**obvious、minimal**——是行銷詞，不是工程描述。這兩個詞成立的前提是「跟 YAML 比」；如果跟 JSON 比，它既不 obvious 也不 minimal，只是多了註解和少了引號。

## 結尾：回到那張迷因

我當時貼的原圖，是 Tom Preston-Werner 抱著頭的照片，配了那段 greentext：

![Tom Preston-Werner 抱頭迷因](/media/2025-11/122130651746958395.jpg)

現在回頭看，那個迷因的笑點不只是反串——而是**連設計者自己都知道**這個格式長歪了。[CHANGELOG](https://github.com/toml-lang/toml/blob/main/CHANGELOG.md) 裡那句「From Twitter rage to reality」、issue #689 裡維護者對 local time 和 array of tables 的辯護、issue #409 裡前後矛盾的決策史——這些都是這個格式的設計過程留下的傷口。它確實是 2013 年那個時間點上，比 YAML 和 INI 都好的選擇，但「比競品好」和「obvious/minimal」是兩件事。

那題考卷我最後給分的方式也滿誠實的：TOML → JSON 那半寫對就給基本分，JSON → TOML 那半要能講出「哪些 JSON 結構無法無損對應回 TOML」才給高分。事後想想，這題真正的標準答案其實就是那張迷因：

>be TOML
>Tom's Obvious, Minimal Language
>not obvious
>not minimal

---

**References**

- [TOML v1.0.0 規格](https://toml.io/en/v1.0.0) — 官方 spec，obvious/minimal 的原文出處
- [toml-lang/toml CHANGELOG](https://github.com/toml-lang/toml/blob/main/CHANGELOG.md) — 版本史，v0.1.0 的「Twitter rage」、v1.0.0（2021-01-11）
- [toml-lang/toml issue #689](https://github.com/toml-lang/toml/issues/689) — array of tables / local time 的「不 obvious」討論
- [toml-lang/toml issue #409](https://github.com/toml-lang/toml/issues/409) — hex/octal 的決策矛盾
- [toml-lang/toml PR #894](https://github.com/toml-lang/toml/pull/894) — 秒數變可選
- [PEP 518](https://peps.python.org/pep-0518/) — pyproject.toml 採用 TOML 的理由與格式比較表
- [Cargo 文件](https://doc.rust-lang.org/cargo/)、[Hugo 設定文件](https://gohugo.io/getting-started/configuration/) — TOML 的主流採用者
- [TOML: the annoying parts（dev.to）](https://dev.to/dmbaturin/toml-the-annoying-parts-5h5c) — round-trip lossy、paste-ability 等痛點
- [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259) — JSON 規格，對照組
