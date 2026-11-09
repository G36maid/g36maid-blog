---
title: "讓 agent 用寫程式的方式呼叫 MCP：讀 Anthropic〈Code execution with MCP〉"
description: "Anthropic 主張把 MCP 工具呈現為檔案系統上的 TypeScript API，讓 agent 寫程式呼叫而非逐個 tool call，宣稱可省 98.7% 工具定義 token。我對照自己讓 agent 寫腳本批次處理文件、pipeline 化工具呼叫的既有習慣，指出做法相似但缺乏結構性，並誠實列出沙盒成本、小模型除錯難、非萬靈丹等 trade-off 與適用邊界。"
pubDate: 2025-11-06T01:23:14+08:00
category: ai
tags: [mcp, agent, llm, ai, code-execution]
draft: false
source: "facebook"
sourceType: "連結分享"
sourceTimestamp: 1762363394
---
> 本文改寫自 2025-11-06 的 Facebook 連結分享，於 2026-11-07 擴寫；當時只留了一句「跟我用法很像」，現在把對照寫清楚。

2025 年 11 月初，Anthropic 工程部落格發了一篇〈Code execution with MCP: Building more efficient agents〉。我當時看完的第一個反應是：「有趣的文章，我發現他跟我原本使用 MCP 的方式很類似，但我沒有這麼結構性。」這句話在 FB 上只留了一句就沒了，剛好藉這次擴寫，把當時沒寫清楚的對照與思考補完。

## 原文在講什麼

文章的核心問題是 token 浪費，具體有兩個層次：

1. **工具定義塞爆 context window**。大多數 MCP 客戶端會把所有 tool 的 schema（名稱、描述、參數）預先載入 context。接幾十個 MCP server、上千個工具時，模型還沒讀到一句話，就得先處理數十萬 token 的工具定義。
2. **中間結果全部過模型一次**。以原文的例子：把 Google Drive 的會議逐字稿附加到 Salesforce 的 lead 上，傳統做法是模型先呼叫 `gdrive.getDocument`，逐字稿整份進 context，再原封不動重寫一次放進 `salesforce.updateRecord` 的參數裡。一份兩小時的逐字稿來回就是約 5 萬 token；更大的文件甚至直接撐爆 context window，而且資料在工具呼叫之間手工搬運時，模型抄錯數字的機率也會上升。

他們的解法：**把 MCP server 呈現為檔案系統上的 TypeScript API，讓 agent 直接寫程式呼叫工具**。每個工具對應一個 `.ts` 檔（`./servers/google-drive/getDocument.ts`），agent 用 `import * as gdrive from './servers/google-drive'` 的方式取用，底層再由一個 `callMCPTool` wrapper 轉回真正的 MCP tool call。同一個 Drive→Salesforce 例子就變成：

```typescript
import * as gdrive from './servers/google-drive';
import * as salesforce from './servers/salesforce';

const transcript = (await gdrive.getDocument({ documentId: 'abc123' })).content;
await salesforce.updateRecord({
  objectType: 'SalesMeeting',
  recordId: '00Q5f000001abcXYZ',
  data: { Notes: transcript },
});
```

逐字稿從頭到尾只在執行環境裡流動，模型只看到最終的「已附加完成」。

## 原文列出的好處

- **Progressive disclosure**：模型本來就很擅長瀏覽檔案系統。工具變成檔案後，agent 先 `ls ./servers/` 看有哪些 server，需要時才打開特定工具檔讀 schema，不必一口氣全部載入。也可以搭配一個 `search_tools` 工具，用 detail level 參數控制只回傳名稱、名稱加描述、還是完整 schema。
- **Context 效率化的工具結果**：抓一份 10,000 列的試算表，可以直接在程式裡 `filter`、只 `console.log` 前 5 列給模型看。原文宣稱整體能把工具定義的 token 從 150,000 降到 2,000，節省 98.7%。
- **控制流變成一般程式碼**：迴圈、條件、錯誤處理都用熟悉的語言特性寫，而不是在 agent 迴圈裡一個一個 tool call 排隊，也省掉每個 if/while 都要等模型推理的延遲（time to first token）。
- **隱私保護**：中間結果預設留在執行環境；更敏感的場景可以由 MCP 客戶端自動 tokenize PII（email、電話、姓名換成 `[EMAIL_1]` 這類代號），真實資料在工具之間流動、從不經過模型。
- **狀態持久化與 skills**：中間結果可以寫檔、之後接著做；agent 寫出來的成功腳本還能存成可重用的 skill，加個 SKILL.md 就變成結構化能力， agent 會隨時間累積自己的工具箱。

## 跟我原本的 MCP 用法對照

當初說「跟我用法很像」，具體像在哪：我的日常也不是逐個 tool call 手工排程，而是把意圖描述給 agent，讓它自己寫腳本去批次處理——比如一次抓幾十份文件轉格式、把多步驟工具呼叫串成一條 pipeline、中間產物丟到暫存目錄讓下一步接手。以這篇的框架來看，我已經無意識地在用「code execution 的好處」：批次處理文件等同於它的 context-efficient tool results，pipeline 化的工具呼叫就是它的 control flow，暫存目錄就是 state persistence。

差別在結構性：Anthropic 把「工具即檔案」變成一個正式的 API 層，工具發現是讀目錄、權限與 PII tokenize 是客戶端層的確定性規則、可重用邏輯沉澱成 skill。我這邊則是每次 ad hoc 寫腳本，呼叫方式散落在各種一次性 code block 裡，沒有一致的工具樹、也沒有把寫過的腳本系統化保存。用原文的話說，他們是把這些已知模式「從軟體工程借過來套到 agent 上」，而我只借了一半。

另一個我蠻有共鳴的點：這模式等於承認 LLM 最強的能力就是寫程式。Cloudflare 在 2025 年 9 月就發表過一模一樣的思路（他們叫 Code Mode），結論也是「LLM 寫程式呼叫 MCP 比直接呼叫 MCP 更擅長」，理由是訓練資料裡有海量的真實 TypeScript，但人工設計的 tool call 範例少得多。我自己的偏好一向是讓 agent 直接操作而非包成黑盒封裝——給它 shell、檔案系統、程式語言，比給它一個又一個預先包好的魔法函式更可靠，這篇等於把我的直覺寫成了正式主張。

## Trade-off 與適用邊界

誠實列一下缺點，這些原文自己也承認部分：

- **沙盒與維運成本**：執行 agent 生成的程式碼需要適當的沙盒、資源限制與監控，這些基礎設施成本是傳統 direct tool call 完全沒有的。對自己本機跑 agent 的個人玩家，沙盒往往是第一道就放棄的門檻。
- **寫錯程式的除錯成本**：code execution 把錯誤從「tool call 參數格式錯」升級成「一段腳本邏輯錯」，模型要自己讀 traceback 修正，小模型在這條路上特別容易翻車。我自己就遇過 Gemini 平台外呼叫 MCP 笨到不行，這種模型更別指望它穩定寫出正確的整合腳本。
- **不是所有任務都划算**：單一、一次性的工具呼叫，直接 tool call 反而簡單；這模式真正的甜點是大量工具、大資料、多步驟串接。
- **效率數字要看情境**：98.7% 那個數字是「上千個工具全量載入」的極端案例算出來的；工具數量少的場景，省幅沒那麼戲劇化，別直接套用。

整體而言，我認為這是 MCP 生態系 2025 年最重要的實踐轉向之一：agent 與工具的介面從「預先宣告的函式清單」變成「可以探索的程式庫」。對工具數量會持續增長的場景，這幾乎是必然的演化方向；剩下的問題只是你的執行環境夠不夠安全、模型夠不夠會寫程式。

## 延伸閱讀

- 原文：[Code execution with MCP: Building more efficient agents](https://www.anthropic.com/engineering/code-execution-with-mcp)（Anthropic Engineering, 2025-11-04）
- [Code Mode: the better way to use MCP](https://blog.cloudflare.com/code-mode/)（Cloudflare Blog, 2025-09-26）
- [Model Context Protocol 規範](https://modelcontextprotocol.io/)
- [Claude Code 沙盒機制](https://www.anthropic.com/engineering/claude-code-sandboxing)
