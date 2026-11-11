---
title: "環境變數只是字串？從 SEED Lab 看 set-uid 程式的信任邊界"
description: "一次環境變數與 set-uid 實驗的完整紀錄：fork/execve 的環境繼承、set-uid root 程式被系統偷偷換掉的環境、LD_PRELOAD 為何失效、system() 的命令注入、capability leaking、setuid() 與 seteuid() 的差別，以及 PATH hijack 為什麼到今天還是真實攻擊面。"
pubDate: 2025-03-09T15:58:02+08:00
category: security
tags: ["security", "linux", "shell", "setuid", "environment-variable", "exploit", "seed-lab"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1741507082
---

> 本文擴寫自 2025-03-09 的課程實驗筆記（HackMD），內容已去識別化，擴寫於 2026-11-11。實驗題型對應 SEED Labs 公開教材的「Environment Variable and Set-UID Program Lab」（教材 CC 授權公開，下方附官方連結）；所有輸出皆節錄自當時的實驗紀錄。

「環境變數只是字串」——我以前真的這樣想。直到這次實驗把同一組字串丟進 set-uid root 程式裡跑，看到 `PATH` 被系統悄悄換掉、`LD_PRELOAD` 直接消失、diff 出來的環境差異長達數十行，才發現這些字串是行程身分與信任邊界的載體：繼承誰的環境、繼承哪些變數、哪些變數在提權時被砍掉，每一條都是攻擊面。這篇照實驗順序整理當時的過程與解釋。

## 1. 環境變數在父子行程之間怎麼傳

第一組實驗在 shell 裡觀察環境的存取與繼承。`printenv` / `env` / `export` / `unset` 是基本盤：`export MY_VAR="Hello SEED Lab"` 之後 `printenv MY_VAR` 看得到，`unset` 之後就空了。比較有趣的是接下來的對照實驗——寫一支 C 程式用 `fork()` 生出子行程，父子各自把環境變數倒進檔案，再 `diff parent_env.txt child_env.txt`：

```diff
16c16
< TMUX_PANE=%3
---
> TMUX_PANE=%2
25d24
< _=./myprintenv
26a26
> _=./myprintenv
```

幾十個變數裡只有兩處不同。`TMUX_PANE` 是 tmux 標記目前分割窗格用的，父子本來就可能落在不同 pane；`_` 則是 bash 記錄「最近執行的指令」的變數，父子各自執行了 `./myprintenv`，順序與時機造成差異。結論很乾淨：`fork()` 出來的子行程原封不動繼承整份環境，差異只來自兩邊後續自己的動作。

## 2. `execve()` 的第三個參數就是信任邊界

下一題換 `execve()`。它的簽名是 `execve(path, argv, envp)`——第三個參數 `envp` 就是新行程的整份環境。實驗做了兩個版本：

- `envp` 傳 `NULL`：`/usr/bin/env` 列出來的環境是空的，什麼都沒有。
- `envp` 傳全域變數 `environ`：子行程拿到父行程的完整環境，跟 `fork()` 後再 exec 一樣。

同一題再用 `system("/usr/bin/env")` 跑一次，環境也完整繼承——因為 `system()` 內部就是 `execl("/bin/sh", "sh", "-c", command, NULL)`，shell 再去跑指令，環境一路繼承下去。差別在哪？`execve()` 讓你自己決定要給子行程哪些變數；`system()` 把「呼叫 shell」這件事藏起來，連同 shell 的語法一起繼承。這個差別在後面第 5 節會變成真正的漏洞。

## 3. set-uid root 程式的環境被換了一批

重頭戲：把一支只會印出自己環境的程式編譯後變成 set-uid root（`sudo chown root foo` + `sudo chmod 4755 foo`），先在普通環境跑一次存成 `normal_env.txt`，再設了 `PATH=/tmp`、`LD_LIBRARY_PATH=/tmp` 和自訂變數之後以 set-uid 身分跑一次存成 `suid_env.txt`，diff 結果節錄：

```diff
< PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin:.:.
< LD_LIBRARY_PATH=/tmp
< PWD=/home/<labuser>/lab/task5
< SSH_CONNECTION=<client-ip> 56996 <server-ip> 22
< DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
< _=./foo
--
> PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin
> MAIL=/var/mail/root
> LOGNAME=root
> USER=root
> HOME=/root
> SUDO_COMMAND=./foo
> SUDO_USER=seed
> SUDO_UID=1000
> SUDO_GID=1000
```

被刪掉的包括我剛 export 的 `LD_LIBRARY_PATH`、被塞了 `.:.` 的 `PATH`、`PWD`、整組 `SSH_*` 與 `XDG_*`、`DBUS_SESSION_BUS_ADDRESS`；新增的是 root 身分組（`USER`/`HOME`/`MAIL`）與 `SUDO_*` 追蹤組（記錄是誰用 sudo 執行的）。注意這裡是透過 sudo 觸發，所以 PATH 由 sudoers 的 `secure_path` 重設。

每一刀都有理由：`PATH` 重設是擋經典的 PATH hijack——把惡意程式放進搜尋路徑前面，特權程式去 `system("ls")` 時就會執行到假的 `ls`（這類「搜尋路徑不可控」在 CWE-427 有正式分類）。`LD_LIBRARY_PATH` 與 `LD_PRELOAD` 同理，一旦能指定動態連結器的搜尋路徑，等於能替換特權程式載入的任何 libc 函式。`DBUS_SESSION_BUS_ADDRESS` 指向user session 的 IPC bus，若被指到攻擊者控制的 socket，特權程式跟「系統服務」講的話就全被中間人聽走。`IFS` 之類會影響 shell 解析的變數也不見了——bash 自己會在啟動時清掉這些。

## 4. `LD_PRELOAD` 為什麼對 set-uid 失效

第 3 節的現象值得單獨做一組對照實驗：用 `LD_PRELOAD` 載入一支自製的 `mylib.c`，把 libc 的 `sleep()` 換成只印 `I am not sleeping!` 的版本，然後在四種情境下跑同一支會 `sleep(1)` 的程式：

1. 普通程式＋普通身分：hook 生效，不睡。
2. 普通程式＋root：hook 依然生效——`LD_PRELOAD` 運作與否看的是程序有沒有特權，不是誰載入它。
3. set-uid root：`LD_PRELOAD` 被忽略，sleep 正常睡滿 1 秒。
4. set-uid 程式的擁有者是另一個普通帳號：同樣不繼承 `LD_PRELOAD`。

再進一步用 `env` 確認：普通程序看得到 `LD_PRELOAD` 有被繼承，set-uid 程序的環境裡根本沒有這個變數。原因在動態連結器 `ld.so` 的規則：當 effective UID 與 real UID 不一致（亦即可安全忽略環境的可信程式碼之外另有來源），`LD_PRELOAD`、`LD_LIBRARY_PATH` 這些「user-controlled」的變數會被整個無視——不是 libc 清的，是連結器在載入階段就不看。這是系統把信任判斷直接做在載入時間的例子，防的正是「普通身分養環境、特權身分收割」的攻擊。

## 5. `system()` vs `execve()`：注入的差別

`system()` 會走 shell，這在特權程式裡是致命的。實驗程式 `catall.c` 拿外部輸入的檔名去串指令呼叫 `system()`——檔名裡塞個分號：

```text
/tmp/somefile; rm -rf /important_directory
```

`system()` 把整串丟給 `/bin/sh`，shell 老老實實先 `cat` 再 `rm`，而且都是以 root 身分。改成 `execve("/bin/cat", v, NULL)` 之後，同一串輸入只是被當成一個「檔名」傳給 cat，`cat: /tmp/somefile; rm -rf /important_directory: No such file or directory`，注入完全不成立。`execve()` 不經過 shell，metacharacter 沒有被解讀的機會。這也正好呼應第 2 節：`system()` 舒服的地方（幫你把字串變指令）正是它危險的地方。

## 6. dash 的自保與 capability leaking

兩個進階題。第一個：set-uid root 程式裡呼叫 `system("whoami")`，在 Ubuntu 上輸出卻不是 root——因為 `/bin/sh` 是 dash 的符號連結，dash 偵測到自己在 set-uid 程序裡執行時會立即把 effective UID 降回 real UID。把 `/bin/sh` 換成 zsh（zsh 沒有這個防護）之後，`whoami` 就回 root 了。教訓是雙向的：靠 shell 的防護不是特權程式自己的安全設計；反過來，老系統上 `sh` 指到沒有防護的 shell 時，`system()` 型的 set-uid 程式就是現成的提權入口。

第二個更陰：`cap_leak.c` 先以 root 身分 `open("/etc/zzz", O_RDWR | O_APPEND)` 打開檔案，再 `setuid(getuid())` 降權，最後 exec 一個 shell。一般身分已沒有任何 root 權限了，但那個 file descriptor 還開著——已經取得的存取權不會因為降權自動收回，這就是 capability leaking。對這個 fd 後續的 `write()` 用的還是當初 root 身分打開的權限。正確的修法是在降權前把該關的關掉，並用 `prctl(PR_SET_NO_NEW_PRIVS, 1)`（prctl(2)）阻止之後再取得新特權；setuid(2) 的 man page 對此有明確警告。

## 7. `setuid()` vs `seteuid()`：降權還能回來嗎

同一支 `uid_demo.c` 兩個版本，各自編成 set-uid root 後執行，觀察三個 UID（real / effective / saved）的變化：

| 操作 | `seteuid()` | `setuid()` |
|---|---|---|
| 初始 | (0, 0, 0) | (0, 0, 0) |
| 降到 1000 後 | (0, 1000, 0) | (1000, 1000, 1000) |
| 試圖回到 0 | 成功，(0, 0, 0) | 失敗，Operation not permitted |

`seteuid()` 只動 effective UID，saved UID 仍是 root，所以隨時可以升回去——適合「需要時短暫提權」的設計。`setuid()` 在 root 程序裡會把三個 UID 全部改掉，root 資格永久放手。寫特權程式時這是關鍵抉擇：想暫時放權就用 `seteuid()`，想徹底放棄才用 `setuid()`；而「徹底放棄」也別忘了第 6 節的 fd 與 capability 清理。

## 8. UID 0 的政治學與檔案權限

最後一組問題型實驗。UID 為 0 的帳號不必叫 root，權限上就是 superuser——核心判斷的是 UID 數值，不是帳號名稱。實驗建一個 UID 0 的帳號去讀只有 root 讀得到的檔案，毫無障礙。這也是為什麼 `/etc/passwd` 裡多一個 UID 0 帳號是入侵指標：改名只是增加 audit 時的混淆，核心給的權力一樣大。`/etc/passwd` 出現重複條目時，多數工具（如 `getpwnam`）取第一筆，後面的條目視程式而定可能被忽略、也可能造成解析不一致——本身就是一種攻擊面。

檔案權限的部分查了儲存位置與 Samba 的行為：permission 存在 inode 的 metadata 裡，不存於目錄項；透過 Samba 存取時，Windows 端的 ACL 與 Linux 權限之間靠 `smb.conf` 的 `create mask`、`force user` 等參數轉換對映，設定不當會出現「新建檔案權限不對」或「別人建的檔我改不了」這類常見症狀。

## 踩雷

- 第一次做 set-uid 對照實驗時，`diff` 出來的 PATH 看起來「沒被換」，研究一陣子才發現我是用 sudo 觸發的：PATH 是被 sudoers 的 `secure_path` 重設的，那是 sudo 的保護而非 set-uid 機制本身。兩層防護疊在一起時要先分清是誰在動手。
- `LD_PRELOAD` 實驗一開始預期 set-uid root 程式會「吃到」hook，結果什麼都沒發生，一度以為是自己 libtool 路徑寫錯；後來直接 `env` 印出 set-uid 程序的環境才確認變數根本沒被繼承。先驗證前提，再懷疑程式。
- `/bin/sh` 換 zsh 那題，忘了 Ubuntu 預設的 `/bin/sh` 是 dash、不是 bash，兩者的 set-uid 防護行為完全不同，文件裡「shell 會降權」的描述要對到正確的 shell 才成立。

## 心得

做完這一輪，我對「環境變數只是字串」的感想變成：字串之所以危險，是因為有很多程式會相信它們。`PATH` 被相信所以能 hijack，`LD_PRELOAD` 被連結器相信所以必須在特權情境下隱藏，`DBUS_SESSION_BUS_ADDRESS` 被相信所以可能變成中間人管道。set-uid 機制本身沒有漏洞，漏洞都出現在「特權程式相信了不該相信的輸入」——不管是環境變數、檔名裡的分號，還是降權後沒關掉的 fd。

這也是為什麼 PATH hijack 在 2026 年仍然是真實世界的問題：CI runner 的 `PATH` 被塞入假的 `docker`、開發者 shell 裡 `PATH` 前面掛著 `.:.`、容器 image 裡 PATH 順序被 base image 偷改——形態一直在變，本質都是「搜尋路徑不可控」這個老問題（CWE-427）。系統已經替我們擋掉大半（secure_path、連結器忽略危險變數、dash 降權），但系統擋的是「它知道的危險變數」；只要特權程式還在讀外部可控的字串並拿來做決定，這類實驗就值得每一代學生重做一次。

## 延伸閱讀

- [SEED Labs — Environment Variable and Set-UID Program Lab（Ubuntu 20.04 版）](https://seedsecuritylabs.org/Labs_20.04/Software/Environment_Variable_and_SetUID/)：本篇實驗題型的公開教材原典，SEED Labs 全套 40+ 實驗以 CC 授權公開。
- [getenv(3)](https://man7.org/linux/man-pages/man3/getenv.3.html)、[execve(2)](https://man7.org/linux/man-pages/man2/execve.2.html)、[setuid(2)](https://man7.org/linux/man-pages/man2/setuid.2.html)、[seteuid(2)](https://man7.org/linux/man-pages/man2/seteuid.2.html)、[system(3)](https://man7.org/linux/man-pages/man3/system.3.html)：本文所有 syscall 行為的一手定義，setuid(2) 中的 capability/credential 注意事項值得精讀。
- [CWE-427: Uncontrolled Search Path Element](https://cwe.mitre.org/data/definitions/427.html)：PATH hijack 類問題的正式分類頁，附真實 CVE 案例。
- 站內相關：[ssh 進去顏色全跑掉？先看 $TERM](/blog/ssh-term-environment/)——同樣是「環境變數在行程之間怎麼傳」的日常事故版。
