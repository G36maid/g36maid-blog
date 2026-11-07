---
title: "原本包好的 FreeBSD Ptrace 現在又亂掉了——大爆炸重構的一年半後考據"
description: "FreeBSD PT_ATTACH 翻轉透明 attach 預設語義，讓 valgrind/vgdb/gdb 一路掛掉：從 bug 287050 到 fix 的 fix，談數千行級重構為什麼該分階段合入、留 chicken bit、先平行後翻轉。"
pubDate: 2026-05-28T17:39:29+08:00
category: linux
tags: [freebsd, ptrace, 重構, kernel, debugger, 上游追蹤]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1779961169
---
> 本文改寫自 2026-05-28 的 Facebook 貼文，於 2026-11-07 擴寫；當時的抱怨，現在補上考據與重構方法論的反思。

為什麼一個從 Version 6 AT&T UNIX 就存在的系統呼叫，光是改「attach 時要不要吵醒睡著的執行緒」，就能讓 valgrind、vgdb、gdb 整條偵錯鏈一起掛掉？去年五月底我在 FB 上只留了三行抱怨：「原本包好的 FreeBSD Ptrace 現在又亂掉了／早知道慢慢重構就好，步邁太大了／又是數千行的程式碼」。一年半後回頭考據，發現這句抱怨意外地命中了一個重構方法論的經典難題。

![原本包好的 FreeBSD Ptrace 現在又亂掉了 早知道慢慢重構就好，步邁太大了 又是數千行的程式碼](/media/2026-05/122163564062958395.jpg)

## ptrace(2) 難改在哪

先立術語：tracer 是偵錯端，tracee 是被偵測程式；兩者靠一連串 stop 點同步——訊號 stop、系統呼叫進出（PL_FLAG_SCE/SCX）、fork/exec 事件，每次 stop 之後由 tracer 用 PT_CONTINUE、PT_GETREGS 這類請求接管。FreeBSD 的實作集中在 `sys/kern/sys_process.c` 的 `kern_ptrace()`，但 attach 的第一個 stop 走的是 `kern_sig.c` 的訊號路徑（SIGSTOP 加 `P2_PTRACE_FSTP` 旗標、`sig_handle_first_stop()`），再跟 `p_xthread`、`P_STOPPED_TRACE` 這些行程狀態交纏。換句話說，改 attach 就是在動訊號子系統與 scheduler 的交界。更麻煩的是 ABI 面：gdb、lldb、valgrind、truss 全部踩同一組 `PT_*` 常數與同一套隱含語義，介面一動，整個 debugger 生態一起還債——這也是為什麼我當時自己包的 wrapper 會直接被沖壞（另一個 FreeBSD 下游打包的例子見[替 Zed 做非官方 port](/blog/zed-freebsd-port/)的教訓）。

## 我追到的時間線

先誠實聲明：以下多為二手資料整理——commit message、bugzilla 與 review 系統原文——我沒有逐行讀完整個 patch series，也沒在自己機器上重現 287050，行為細節以下列原文為準，寫錯請指正。

- **2025 年 4 月**，Konstantin Belousov（kib）重做 PT_ATTACH 的第一個 stop：commit `ecc662c749b1`「PT_ATTACH: do not interrupt interruptible sleeps」把「透明 attach」變成預設——attach 不再打斷 tracee 的可中斷睡眠。接著 `4048ccc6ae37` 把 first-stop 邏輯抽成 `sig_handle_first_stop()`，`a6b7d5cddacd` 加了 chicken bit（`debug.ptrace_attach_transparent`）保住舊行為。
- **2025 年 5 月 24 日**，Paul Floyd 回報 [bug 287050](https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=287050)：valgrind/vgdb 無法再中斷被偵測程式。vgdb 的慣用流程是 PT_ATTACH → GETREGS/SETREGS → PT_CONTINUE 去呼叫 valgrind 內部的 gdbserver 函式；透明 attach 之後 PT_CONTINUE 只解除了 stop 狀態，睡在 `nanslp` 的目標繼續睡，gdb 端永遠等不到提示符。kib 在 bugzilla 裡原話承認進退兩難：「I am not sure how to handle it. I tend to think that PT_ATTACH should grow an option to request the transient behavior, and by default keep interrupting the interruptible sleeps.」
- **2025 年 5 月 29 日**，修法落地：[D50556](https://reviews.freebsd.org/D50556)（`99976934274d`）「PT_CONTINUE: undo transparent attach consequences」，+22 行，事後幫 PT_CONTINUE 拆乾淨透明 attach 留下的後果。
- **2026 年 5 月**——也就是我發那篇抱怨文的前後——這個修法本身又被抓出問題：[D56928](https://reviews.freebsd.org/D56928)（`cb31a266167c`）「ptrace: clear TDP_USERWR after transparent attach only on attach」，由 Alex S 回報，修的是 `99976934274d` 的行為，cperciva 再把它 cherry-pick 進 15.1。「fix 的 fix」隔了一年還在補。
- 同時這個介面還在持續動刀：2026 年 1 月 pdrfork(2)/pdwait(2)（D54592）與 process descriptor 的 ptrace 模式、7 月的 PT_GET_CHILDREN（D58315）、PT_SET_SC_RET、以及把 `sys_ptrace()`/`freebsd32_ptrace()` 拆開（D58586）。
- 安全面也補了兩刀：2026-05-20 的 FreeBSD-SA-26:21（CVE-2026-45253，PT_SC_REMOTE 缺驗證可本地提權，由清大團隊用 GLM-5.1 找到）、2026-06-30 的 SA-26:45（CVE-2026-49426，audit 記錯 PT_SC_REMOTE 的結果）。同一個月內介面既在翻語義又在出資安公告，下游想追只能全部重測。

## 大爆炸還是漸進？

持平地說，kib 的節奏已經算漸進：小步 commit、留 chicken bit、下游回報兩天內給 workaround、一週內出修法。真正的問題是**翻轉預設值**——「不吵醒可中斷睡眠」這個新語義一次對所有 tracer 生效，等於把整個下游的假設一次歸零。kib 自己在 bugzilla 說的方向（把 transient 行為做成 opt-in，讓 truss 這類偏好軟 attach 的工具自己選，預設維持打斷）才是穩的次序：平行旗標 → 生態遷移 → 翻預設 → 移除旗標，每步之間留穩定期。

第二個教訓是狀態機的隱含不變量沒被測試釘住。TDB_USERWR「什麼時候該清」在透明 attach 之後變成 depends-on-history 的行為，287050 的重現還是靠 Paul Floyd 手工剝出兩支小程式，而不是現有 regression test 直接紅燈。數千行級的重構，review 瓶頸又特別明顯：這一區的 review 幾乎都壓在 markj 一個人身上，而 git bisect 遇到「行為變了但語義沒壞」的 commit 只會啞掉。

所以「早知道慢慢重構就好」這句話，一年半後我會修得更精確：慢不是重點，**可回退與可選擇**才是。數千行一次進主線，對維護者是賭博——賭的是所有下游的隱含假設都跟你新寫的測試一致。這把賭局，FreeBSD 這局輸掉的僅是一個 regression 加兩張資安公告，但同樣的賭注押在自己的 wrapper 上，就是當時那三行抱怨的全部。

## References

- [PT_CONTINUE: undo transparent attach consequences（commit 99976934274d）](https://cgit.freebsd.org/src/commit/?id=99976934274de6fa19f049a0b6eac10856710f96)
- [Bug 287050：PT_CONTINUE 改動讓 valgrind/vgdb 無法中斷被偵測程式](https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=287050)
- [D50556：PT_CONTINUE: undo transparent attach consequences](https://reviews.freebsd.org/D50556)
- [D56928：ptrace: clear TDP_USERWR after transparent attach only on attach](https://reviews.freebsd.org/D56928)
- [PT_ATTACH: do not interrupt interruptible sleeps（commit ecc662c749b1）](https://lists.freebsd.org/archives/dev-commits-src-all/2025-April/053846.html)
- [kern_sig.c: extract the first stop handling into a helper（commit 4048ccc6ae37）](https://lists.freebsd.org/archives/dev-commits-src-all/2025-April/053845.html)
- [chicken bit for old way of SIGSTOP handling on PT_ATTACH（commit a6b7d5cddacd）](https://cgit.freebsd.org/src/commit/?id=a6b7d5cddacd4aa14ee058195eedfe207a69029e)
- [FreeBSD-SA-26:21.ptrace（CVE-2026-45253）](https://www.freebsd.org/security/advisories/FreeBSD-SA-26%3A21.ptrace.asc)
- [FreeBSD-SA-26:45.audit（CVE-2026-49426）](https://www.freebsd.org/security/advisories/FreeBSD-SA-26:45.audit.asc)
- [D58315：ptrace(2): add PT_GET_CHILDREN](https://reviews.freebsd.org/D58315)
- [ptrace: split sys_ptrace()/freebsd32_ptrace()（D58586）](https://cgit.freebsd.org/src/commit/?id=9cea869940f197d558f640b6851d44a213be9e8a)
- [ptrace(2) man page（FreeBSD 15）](https://man.freebsd.org/cgi/man.cgi?query=ptrace)
