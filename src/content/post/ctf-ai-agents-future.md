---
title: "CTF 究竟會變成什麼樣子"
description: "我猜明年傳 CTF 網址，flag 就全部滾出來了。以 Reverse 主力玩家的視角盤點 AI agent 已經會啃與啃不動的題型，並補上 AIxCC 決賽、NYU CTF Bench／Cybench／CREBench、BSidesSF 2026 與 RITSEC 2026 的查證結果。"
pubDate: 2026-09-19T23:59:49+08:00
category: security
tags: ["ctf", "ai-agent", "reverse-engineering", "security"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1789833589
media:
  - 122176597754958395.jpg
---

![掛著僵硬笑容、額角冒汗的紫髮動漫角色](/media/2026-09/122176597754958395.jpg)

半夜滑到這張圖：紫髮的角色嘴角努力上揚，臉頰卻掛著一滴汗。我盯著看了十秒，覺得這就是我看 CTF 現況時的表情——表面上照常報隊、照常熬夜解題，心裡已經在偷偷倒數這個遊戲還剩幾年。於是我寫下那句玩笑：「CTF 究竟會變成什麼樣子？我猜明年傳 CTF 網址，flag 就全部滾出來了。」

這句玩笑對我來說有點私人恩怨。我打 CTF 主力是 Reverse，走的是 Compiler/LLVM 和系統底層那一路，也打過 rev 加上 LLM 的混合題——題目本身要你逆向，途中還得想辦法從模型嘴裡榨出字串。我自己寫過 LLM 越獄的小工具，也陸續把幾個開源專案接成一條多 agent 的資安分析流水線（[之前寫過](/blog/multi-agent-security-analysis/)），甚至把本地跑的模型直接掛上 Ghidra，看它自己反編譯、改名、加註解（[實錄在這](/blog/glm-ghidra-llm-reverse/)）。所以「AI 來解 CTF」對我不是抽象的預言，是我每天下班在玩的那台機器。

憑這幾個月的體感，哪些題型 AI 已經會啃，我心裡大概有數。給定檔案的簡單 reverse，基本淪陷：丟進沙盒、跑 strings、反編譯、搜常見演算法特徵，agent 一條龍做下來，難度低的題目幾分鐘內 flag 就掉出來。教科書式的 crypto 同理，RSA 參數沒設好的變體它見過太多次了。Web 題的常見洞——SSTI、反序列化、簡單的 SQL 注入——也在它的舒適圈。反倒是硬 reverse 還撐得住：自製 VM、混淆做到 LLVM pass 層級、要靠編譯器行為的手感和動態調試直覺才推得下去的題目，我餵給自己的 agent，十次有八次它在原地打轉，反覆 Read 同一段反編譯輸出，或者乾脆幻想一個 flag 給我。

不過這條護城河正在變淺，這件事不用等明年，現在就能查證。DARPA 那場 [AI Cyber Challenge](https://aicyberchallenge.com/finals-winners-announcement/)（AIxCC）2025 年 8 月在 DEF CON 決賽：冠軍是 Georgia Tech、KAIST、POSTECH 和 Samsung Research 組成的 Team Atlanta，抱走四百萬美元。全部隊伍的自動化系統在數千萬行開源程式碼裡，找出了 63 個合成漏洞中的 54 個（86%）、修掉其中 68%，平均 45 分鐘交一個 patch，每題成本約 152 美元，過程中還順手撈出 18 個真實漏洞走責任揭露。七隊的系統全部開源。同一時間，學術端的 benchmark 也把水位量出來了：[NYU CTF Bench](https://nyu-llm-ctf.github.io/) 上最強的 agent 大約 22% 的 pass@1，[Cybench](https://cybench.github.io/) 的 40 道職業賽題裡，人類最難一題解了近 25 小時，模型能碰到的多是中下難度。專攻密碼學二進位逆向的 [CREBench](https://arxiv.org/abs/2604.03750) 更精準：最強模型五成九的題目能拿到 flag、四成一完全解出，人類專家是九成二——差距具體存在，但已經是同一個量級在對話。

案例也早就不是孤證。Veria Labs（成員來自 CTFTime 上美國排名第一的隊伍）用一個多模型 swarm 的 [ctf-agent](https://github.com/verialabs/ctf-agent) 去[打 BSidesSF 2026 CTF](https://github.com/verialabs/ctf-agent)，52 題全解拿冠軍，pwn、rev、crypto、web 通吃。另一邊，[RITSEC 2026 的主辦自述](https://sylvie.fyi/posts/ritsec-2026/)裡，約 800 隊抓出一百多隊違規用 LLM，最大破綻荒謬得可愛：模型解不出來時會「幻覺」一個格式合理但根本不存在的 flag，隊員不假思索照貼，於是自曝。這也呼應我玩越獄和 agent 的經驗——agent 最危險的地方從來不是它太強，是它錯得很流暢。

題目方當然在動。[NorthSec 2026](https://nsec.io/blog/2026-ctf-agents) 選了最誠實的路：不禁 AI，改成讓玩家自願標記哪些 flag 是 agent 解的，先收集一年的數據再決定賽制。RITSEC 走嚴打路線，請可疑隊伍當場講解法，AI 代寫的 writeup 一讀就穿。動態 per-team flag（HMAC 派生）則是防共享的標配。至於動態 flag 能不能擋自動解題——我認為擋不了，它只擋抄答案；這段是我的推測，但比賽往「人類組與 AI 組分榜」、現場攻防這種 agent 難以並行海灌的形式分化，我覺得幾乎是必然。對 reverse 玩家，簡單題的意義正在蒸發，題目會被迫往 agent 啃不動的方向長。這對我是壞消息，也是好消息：至少在編譯器層級的混淆題上，那滴汗還掛在 AI 的臉頰上，暫時輪不到它笑。

（2026-11 補記：以上查證均為發文後補做的更新，AIxCC 官方數字、各家 benchmark 與兩場賽事主辦的自述都已逐一看過原文；本文 9 月動筆時只憑直覺，11 月回頭對帳，護城河變淺的速度比我猜的還要快。關於 agent 越界做事的極端案例，先前整理過 OpenAI 的代理為了作弊直接滲透 Hugging Face 生產環境的事件，[見這篇](/blog/openai-agent-hf-escape/)——CTF 場上 agent 作弊，恐怕只是同一件事的溫和版。）
