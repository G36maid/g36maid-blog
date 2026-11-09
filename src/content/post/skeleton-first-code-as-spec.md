---
title: "先寫空函數，別急著寫 Spec：LLM 時代的 code-as-spec"
description: "已存在的程式碼風格比規格文件更能左右 LLM 的產出——所以先手寫空函數與空資料結構，可能比寫一份 spec 更穩定。從 type-driven development、compiler-driven development 講到 spec 漂移問題，附 Rust todo!() 實作流程與這條路的限制。"
pubDate: 2026-02-05T00:52:52+08:00
category: programming
tags: [llm, type-driven-development, rust, spec, 程式, 程式設計]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1770223972
---

本文擴寫自 2026-02-05 的 Facebook 貼文（原文只有兩句話，擴寫於 2026-11-09）：

> 我感覺，已存在程式的風格跟架構比起文件更能影響 LLM coding 的風格與結果。因此先手寫一些空函數或是空資料結構可能比使用 Spec 計畫更穩定。

## 一個違反直覺的觀察

去年開始把 LLM 當成日常的程式助手之後，我很快注意到一件事：我花心思寫的規格文件，對產出的影響遠小於 repo 裡既有的程式碼。規格上明明寫了要分層、要用某種錯誤處理慣例，agent 交回來的東西卻更像是「這個專案裡其他程式碼長什麼樣，它就長什麼樣」。文件說的是「應該如何」，既有程式碼展示的是「這裡的人都這樣做」——LLM 明顯跟著後者走。

想通這點之後，結論有點反直覺：**與其寫 spec，不如先手寫一堆空函數和空資料結構。** 這篇文章整理我後來思考與實驗的結果，以及這條路在什麼時候好用、什麼時候會翻車。

## 為什麼 type signature 比文件有用

LLM 靠的是上下文中的模式模仿，不是「讀懂」一份長文件再忠實執行。一份兩千字的 spec，每個句子都是軟約束——模型可能採納、可能忽略、也可能用自己的理解重新詮釋。但一個 type signature 是硬約束：函數叫什麼名字、吃哪些參數、回傳什麼型別、資料結構有哪些欄位，這些在補肉的時候幾乎不會被違反，因為它們就長在要填的洞旁邊，而不是幾百行之外的另一個檔案裡。

換句話說，空骨架是「單位字元數下資訊密度最高」的規格。`fn parse(input: &str) -> Result<Config, ParseError>` 一行字，同時約束了命名、輸入輸出、錯誤模型三件事，還順便把「這個專案用 Rust 慣例的 Result」塞進了上下文。同樣的資訊寫成自然語言，至少要一段話，而且約束力還更弱。

## 這條路一點都不新

「型別即規格」在 LLM 出現之前就有完整譜系，只是換了個應用場景：

- **Type-driven development**：Mark Seemann 的 *Types + Properties = Software* 系列主張用強型別系統搭配 property-based testing 來「指定」軟體行為，先設計型別、再填實作；Scott Wlaschin 的 *Designing with Types* 系列更是把「make illegal states unrepresentable」（讓非法狀態無法被表示）變成口號——資料結構本身就把業務規則編碼進去了。
- **Design by contract**：Bertrand Meyer 在 Eiffel 上推的方法論，把前置條件、後置條件、不變式寫進程式碼，契約跟著程式走而不是跟著文件走。
- **Compiler-driven development**：Rust 社群的日常。先寫 trait 和 signature，函數體放 `todo!()`（標準庫文件明說這就是「讓程式碼先通過型別檢查」用的），然後讓編譯器逐個指出還沒填的洞，一個一個補。Idris 的 typed holes 走得更遠，洞本身有型別、編譯器還會建議怎麼填。

這些做法的共同點：把「規格」做成程式碼的一部分，讓它無法跟實作分家。LLM 沒有改變這個論證的正確性，只是讓「填洞」這一步便宜到幾乎免費——於是「人負責設計骨架、機器負責填肉」的分工突然變得經濟。

## Spec 文件會漂移，骨架不會

反過來看 spec-driven 這條路。GitHub 的 spec-kit 把流程做成 constitution → specify → plan → tasks → implement，正規化了「先寫 spec 再讓 agent 實作」。這套東西對大型功能、多人協作、需要留下決策紀錄的場景確實有價值。但任何「跟程式碼分離的規格文件」都有一個結構性問題：**它會漂移。**

程式碼改了、文件沒跟著改，於是文件開始說謊——這在需求文件、wiki 設計文件、手寫 OpenAPI 檔身上重演了幾十年，Kent Beck 也公開批評過 SDD 預設了「spec 不需要隨之更新」這個不切實際的假設。散文化的 spec 沒有紅燈：沒有任何 CI 會在文件與程式碼不一致時失敗。而空骨架不會有這個問題，因為骨架本身就是程式碼——它要嘛已經被填掉（成為實作的一部分），要嘛還是 `todo!()` 在那邊礙眼。它跟實作永遠是同一個真相源，由編譯器而非社會慣例保證同步。

我自己的準則因此變成：**spec 可以拿來啟動討論，但最終的規格必須以骨架的形式落進程式碼裡。** spec 寫完就該「降級」成骨架，而不是留著當第二真相源。

## 實際怎麼做

我的流程大概是這樣：

1. 想清楚領域模型之後，手寫核心的 struct/trait/function signature，函數體全部放 `todo!()`：

```rust
trait ConfigSource {
    fn load(&self) -> Result<Config, ConfigError>;
}

struct Config {
    listen_addr: SocketAddr,
    max_connections: u32,
}

impl ConfigSource for FileConfigSource {
    fn load(&self) -> Result<Config, ConfigError> {
        todo!("read TOML, validate fields, build Config")
    }
}
```

2. 確認骨架能編譯（`todo!()` 就是為了這一步存在的），跑一次 `cargo check`。
3. 把 agent 的任務從「實作這個功能」換成「把這個檔案裡所有 `todo!()` 填掉，不得更動任何型別與 signature」。
4. 收到結果後，編譯器、測試和 `git diff` 自己會說話：骨架有沒有被偷改，diff 一目了然。

這樣 agent 拿到的上下文裡，規格不再是「請遵守的指示」，而是「必須成立的現狀」。實際用下來，它偷換設計、自由發揮命名空間的次數明顯變少。

## 這條路的限制

這招不是萬能，幾個我親自踩過或可以預見的坑：

- **骨架先行會鎖死設計。** 一旦骨架寫下去，之後的實作都會沿著它長。如果對領域還沒想透，等於是提早把錯誤的設計澆灌成混凝土。改骨架的成本比重寫 spec 高，因為下游已經有程式碼依賴它。
- **不適合探索期。** 還在「不知道要建什麼」的階段，spike、丟掉重來、甚至讓 agent 自由發揮再從結果裡學，都比先畫骨架有效。骨架先行的前提是你已經熟悉這個 domain，知道正確的邊界畫在哪。
- **爛骨架會誤導 agent，而且誤導得很有效率。** 既有程式碼的風格影響 LLM 產出——這是原稿的第一句話。你親手寫的爛骨架同樣會被忠實模仿。骨架的品質天花板就是產出品質的天花板。
- **不處理行為語意。** 型別約束「資料長怎樣、函數介面長怎樣」，但不約束「算對不對」。填完肉還是要靠測試——這也是 Seemann 主張型別要配 property-based testing 的原因。

## 小結

「先手寫空函數比寫 spec 更穩定」聽起來像偷懶，其實是把規格從會漂移的自然語言，搬到編譯器看得到的地方。LLM 沒有發明 type-driven development，但它把「設計與實作分離」的成本結構翻轉了：設計骨架依然昂貴（要動腦），填肉變得便宜（不用動腦），於是把人力集中在前者變成理性選擇。下次開新專案，也許可以先別開 spec 文件，直接開一個全是 `todo!()` 的檔案。

## 延伸閱讀

- Mark Seemann, [Types + Properties = Software](https://blog.ploeh.dk/2016/02/10/types-properties-software/)
- Scott Wlaschin, [Designing with types: Making illegal states unrepresentable](https://fsharpforfunandprofit.com/posts/designing-with-types-making-illegal-states-unrepresentable/)
- [Rust `todo!()` 官方文件](https://doc.rust-lang.org/std/macro.todo.html)（「讓原型階段的程式碼先通過型別檢查」）
- [github/spec-kit](https://github.com/github/spec-kit)（spec-driven development 的代表工具，作為對照組）
- [Spec-Driven Development Is the Prose-Spec Drift Trap, Reborn](https://dev.to/tmfrisinger/spec-driven-development-is-the-prose-spec-drift-trap-reborn-4p99)（對 spec 漂移問題最系統性的批評）
