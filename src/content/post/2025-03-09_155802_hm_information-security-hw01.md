---
title: "Information Security HW01"
description: "G36maid"
pubDate: 2025-03-09 15:58:02 +0800
tags: ["shell", "sudo", "bash", "tmux", "程式", "exploit", "權限", "security", "linux", "ubuntu"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1741507082
category: linux
---

* G36maid


## 1.1 SEED Lab

### Task 1 
```
[03/09/25]seed@VM:~/lab$ env | grep PWD
PWD=/home/seed/lab
OLDPWD=/home/seed
[03/09/25]seed@VM:~/lab$ export MY_VAR="Hello SEED Lab"
[03/09/25]seed@VM:~/lab$ printenv MY_VAR
Hello SEED Lab
[03/09/25]seed@VM:~/lab$ unset MY_VAR
[03/09/25]seed@VM:~/lab$ printenv MY_VAR
[03/09/25]seed@VM:~/lab$ env
SHELL=/bin/bash
TMUX=/tmp//tmux-1000/default,5141,0
PWD=/home/seed/lab
LOGNAME=seed
XDG_SESSION_TYPE=tty
MOTD_SHOWN=pam
HOME=/home/seed
LANG=en_US.UTF-8
LS_COLORS=rs=0:di=01;34:ln=01;36:mh=00:pi=40;33:so=01;35:do=01;35:bd=40;33;01:cd=40;33;01:or=40;31;01:mi=00:su=37;41:sg=30;43:ca=30;41:tw=30;42:ow=34;42:st=37;44:ex=01;32:*.tar=01;31:*.tgz=01;31:*.arc=01;31:*.arj=01;31:*.taz=01;31:*.lha=01;31:*.lz4=01;31:*.lzh=01;31:*.lzma=01;31:*.tlz=01;31:*.txz=01;31:*.tzo=01;31:*.t7z=01;31:*.zip=01;31:*.z=01;31:*.dz=01;31:*.gz=01;31:*.lrz=01;31:*.lz=01;31:*.lzo=01;31:*.xz=01;31:*.zst=01;31:*.tzst=01;31:*.bz2=01;31:*.bz=01;31:*.tbz=01;31:*.tbz2=01;31:*.tz=01;31:*.deb=01;31:*.rpm=01;31:*.jar=01;31:*.war=01;31:*.ear=01;31:*.sar=01;31:*.rar=01;31:*.alz=01;31:*.ace=01;31:*.zoo=01;31:*.cpio=01;31:*.7z=01;31:*.rz=01;31:*.cab=01;31:*.wim=01;31:*.swm=01;31:*.dwm=01;31:*.esd=01;31:*.jpg=01;35:*.jpeg=01;35:*.mjpg=01;35:*.mjpeg=01;35:*.gif=01;35:*.bmp=01;35:*.pbm=01;35:*.pgm=01;35:*.ppm=01;35:*.tga=01;35:*.xbm=01;35:*.xpm=01;35:*.tif=01;35:*.tiff=01;35:*.png=01;35:*.svg=01;35:*.svgz=01;35:*.mng=01;35:*.pcx=01;35:*.mov=01;35:*.mpg=01;35:*.mpeg=01;35:*.m2v=01;35:*.mkv=01;35:*.webm=01;35:*.ogm=01;35:*.mp4=01;35:*.m4v=01;35:*.mp4v=01;35:*.vob=01;35:*.qt=01;35:*.nuv=01;35:*.wmv=01;35:*.asf=01;35:*.rm=01;35:*.rmvb=01;35:*.flc=01;35:*.avi=01;35:*.fli=01;35:*.flv=01;35:*.gl=01;35:*.dl=01;35:*.xcf=01;35:*.xwd=01;35:*.yuv=01;35:*.cgm=01;35:*.emf=01;35:*.ogv=01;35:*.ogx=01;35:*.aac=00;36:*.au=00;36:*.flac=00;36:*.m4a=00;36:*.mid=00;36:*.midi=00;36:*.mka=00;36:*.mp3=00;36:*.mpc=00;36:*.ogg=00;36:*.ra=00;36:*.wav=00;36:*.oga=00;36:*.opus=00;36:*.spx=00;36:*.xspf=00;36:
SSH_CONNECTION=100.87.205.105 56996 100.82.35.32 22
LESSCLOSE=/usr/bin/lesspipe %s %s
XDG_SESSION_CLASS=user
TERM=screen
LESSOPEN=| /usr/bin/lesspipe %s
USER=seed
TMUX_PANE=%0
SHLVL=2
XDG_SESSION_ID=6
XDG_RUNTIME_DIR=/run/user/1000
SSH_CLIENT=100.87.205.105 56996 22
XDG_DATA_DIRS=/usr/local/share:/usr/share:/var/lib/snapd/desktop
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin:.:.
DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
SSH_TTY=/dev/pts/1
OLDPWD=/home/seed
_= /usr/bin/env
[03/09/25]seed@VM:~/lab$

```
![圖片](https://hackmd.io/_uploads/SknizfijJg.png)

### Task 2

![圖片](https://hackmd.io/_uploads/BkPHrfsi1g.png)

## **📌 `diff` result analysis**
 You execute `diff parent_env.txt child_env.txt` and get the following result:
 ```bash
 16c16
 < TMUX_PANE=%3
 ---
 > TMUX_PANE=%2
 25d24
 < _=./myprintenv
 26a26
 > _=./myprintenv
 ```
 This means that most environment variables are the same between the parent and child processes, but there are two subtle differences.
 
 ---
 
### Difference 1: `TMUX_PANE`
 ```bash
 16c16
 < TMUX_PANE=%3
 ---
 > TMUX_PANE=%2
 ```
 - **`TMUX_PANE`** is an environment variable of the `tmux` terminal multiplexer, which is used to ark the current **pane (split window)**.
 - **Why is it different? **
 Subprocesses inherit the environment variables, but `tmux` may dynamically assign a different `PANE ID` to the new process, so they may be different.
 - **Influence? **
 This variable mainly affects the working environment within `tmux` and has no effect on general program execution.
 
 ---
 
##  Difference 2: `_` variables
 ```bash
 25d24
 < _=./myprintenv
 26a26
 > _=./myprintenv
 ```
 - **`_` environment variable** is used by Bash to record the **most recently executed ommand**, usually `$0` (the currently executed program).
 - **Why does `diff` report changes? **
 - In the parent process, it is set to `./myprintenv`, and then `fork()` creates the child process.
 - In the child process, it is also set to `./myprintenv`, but since `fork()` executes `printenv()` after that, this variable may change slightly depending on how the child process is executed.
 
 - **Influence? **
 This variable affects the command history within the shell, but does not affect the main behavior of the program.
 
 
### Task 3
 
 ![圖片](https://hackmd.io/_uploads/SyD8Uzisye.png)
 
 execve() 的第三個參數是 NULL，表示 不傳遞任何環境變數。
 /usr/bin/env 會列出目前的環境變數，但 由於 NULL 被傳入，環境變數應該是空的。
 
 ![圖片](https://hackmd.io/_uploads/r1258zooyx.png)
environ 是全域變數，包含了當前程序的環境變數。
 這樣 execve() 會 把父行程的環境變數傳給 /usr/bin/env。
 
 
 ![圖片](https://hackmd.io/_uploads/Hy5Swzssyl.png)
 
### Task 4:
 
 
 ![圖片](https://hackmd.io/_uploads/rkkTwzsj1e.png)
 
 system() 會啟動 /bin/sh，並讓 shell 執行 /usr/bin/env。
 system() 的實作使用 execl("/bin/sh", "sh", "-c", command, NULL);，而 execl() 會繼承當前程序的環境變數。
 
### Task 5
 
 ![圖片](https://hackmd.io/_uploads/BJY45fojke.png)
 
 ```bash
 gcc -o foo foo.c
 sudo chown root foo        # 變更擁有者為 root
 sudo chmod 4755 foo        # 設置 Set-UID 權限
 
 
 export PATH="/tmp"
 export LD_LIBRARY_PATH="/tmp"
 export CUSTOM_VAR="HelloSeedLab"
 ./foo
 ```
 
 
 ```bash
 [03/09/25]seed@VM:~/lab/task5$ diff normal_env.txt suid_env.txt
 1,7d0
 < SHELL=/bin/bash
 < TMUX=/tmp//tmux-1000/default,5141,3
 < PWD=/home/seed/lab/task5
 < LOGNAME=seed
 < XDG_SESSION_TYPE=tty
 < MOTD_SHOWN=pam
 < HOME=/home/seed
 10,12d2
 < SSH_CONNECTION=100.87.205.105 56996 100.82.35.32 22
 < LESSCLOSE=/usr/bin/lesspipe %s %s
 < XDG_SESSION_CLASS=user
 14,25c4,13
 < LESSOPEN=| /usr/bin/lesspipe %s
 < USER=seed
 < TMUX_PANE=%13
 < SHLVL=2
 < XDG_SESSION_ID=6
 < XDG_RUNTIME_DIR=/run/user/1000
 < SSH_CLIENT=100.87.205.105 56996 22
 < XDG_DATA_DIRS=/usr/local/share:/usr/share:/var/lib/snapd/desktop
 < PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin:.:.
 < DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
 < SSH_TTY=/dev/pts/1
 < _=./foo
 ---
 > PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin
 > MAIL=/var/mail/root
 > LOGNAME=root
 > USER=root
 > HOME=/root
 > SHELL=/bin/bash
 > SUDO_COMMAND=./foo
 > SUDO_USER=seed
 > SUDO_UID=1000
 > SUDO_GID=1000
 ```
 
 下列變數 在 Set-UID 執行時被刪除：
 
 * PWD=/home/seed/lab/task5
     * Set-UID 程序的 PWD 可能會被保護，防止攻擊者利用變更工作目錄來影響執行結果。
 * SSH_CONNECTION / SSH_CLIENT / SSH_TTY
     * 與遠端連線 (SSH) 相關的變數被刪除，防止 Set-UID 程序依賴用戶的 SSH 環境來執行敏感操作。
 * XDG_* (桌面環境相關變數)
     * XDG_SESSION_TYPE、XDG_SESSION_ID 等 XDG 變數被移除，因為 Set-UID 程序通常不應該與使用者的桌面環境互動。
 * DBUS_SESSION_BUS_ADDRESS
     * D-Bus 是用於 IPC（進程間通訊）的機制，Set-UID 程序運行時不應該輕易與用戶的會話 Bus 交互，以免被劫持。
 * PATH 被重新設置
     
 Set-UID 執行時，出現了以下變數：
 
 * USER=root / LOGNAME=root / HOME=/root
 * Set-UID 讓程序以 root 身份運行，所以這些變數的值被改變。
 * SHELL=/bin/bash
     * 預設為 bash，但與一般環境變數一致。
 * MAIL=/var/mail/root
     * MAIL 變數指向 root 的郵件信箱，顯示當前程序是以 root 身份運行。
 * SUDO_COMMAND=./foo
     * 顯示 sudo 執行的命令（./foo）。
 * SUDO_USER=seed / SUDO_UID=1000 / SUDO_GID=1000
     * 記錄了 原始執行用戶（seed），即使 foo 以 root 運行，系統仍保留這些資訊來追蹤執行來源。
 
### Task 6
 
 
 ![圖片](https://hackmd.io/_uploads/By5C0Gii1x.png)
 
 在 Ubuntu 20.04 中，默認的 /bin/sh 是一個符號鏈接，指向 /bin/dash。dash 具有防範機制，當它在 Set-UID 程式中運行時，它會立即降級權限，防止執行惡意程式。為了避免這個防範機制，我們將 /bin/sh 重新鏈接到 zsh
 
 由於這是 Set-UID 程式，這段程式碼會以 root 權限運行，所以 whoami 應該會顯示為 root
 
### Task 7
 ![圖片](https://hackmd.io/_uploads/SylLl7os1e.png)
 LD_PRELOAD 允許我們覆蓋標準庫中的函數。在這個例子中，我們將 sleep 函數的實現從 libc 替換成了我們自己的版本，這樣即使是調用 sleep(1)，也不會發生真正的睡眠，取而代之的是我們在 mylib.c 中指定的行為。
 
 ![圖片](https://hackmd.io/_uploads/Sy0gzXioJg.png)
 
 LD_PRELOAD 允許我們覆蓋標準庫中的函數。在這個例子中，我們將 sleep 函數的實現從 libc 替換成了我們自己的版本，這樣即使是調用 sleep(1)，也不會發生真正的睡眠，取而代之的是我們在 mylib.c 中指定的行為。
 
 * 1.當我們以普通用戶運行 myprog 時，sleep() 函數會按照正常的行為執行，即程序會暫停 1 秒鐘。
 * 2.myprog 應該會以 root 權限執行，但 sleep() 函數將會按照正常方式運行，即使它是由 root 權限執行。
 * 3.由於 Set-UID 設置，myprog 應該會以 root 權限執行。但是，由於我們通過 LD_PRELOAD 覆蓋了 sleep 函數，應該會看到 I am not sleeping! 的輸出，並且 sleep 不會進行休眠。
 * 4.由於 myprog 是 Set-UID 程式並由 user1 擁有，它將以 user1 權限運行。由於我們在不同的用戶帳戶中設置了 LD_PRELOAD，如果 user2 能夠設置 LD_PRELOAD，則仍然能夠覆蓋 sleep 函數，並顯示 I am not sleeping!。


設計實驗

![圖片](https://hackmd.io/_uploads/rJbWVmsiyl.png)

可以看到 LD_PRELOAD 有被繼承

![圖片](https://hackmd.io/_uploads/Sk32Nmjjkx.png)
普通程式應該會按預期行為執行，並顯示 I am not sleeping!。
Set-UID 不會繼承 LD_PRELOAD

由於 Set-UID 程式通常以特定用戶身份（如 root）運行，它們在某些情況下會限制環境變數的繼承

在某些情況下，系統會限制 Set-UID 程式繼承 LD_PRELOAD用來防止用戶在以 root 權限執行 Set-UID 程式時注入惡意程式
### Task 8

### Step 1: Using `system()` to invoke the command

Let’s break down what happens when the `system()` function is used in the Set-UID program with `catall.c`:

**Code Review:**

The program `catall.c` uses `system(command)` to invoke `/bin/cat` with a file name passed as an argument. The `system()` function internally uses the shell to run the command, and this is where the problem lies.

- **Security Concern with `system()`**: Since `system()` invokes the shell, it can process shell metacharacters such as `;`, `&&`, or `|`, which might allow the attacker to inject additional commands to modify files or execute arbitrary commands. Even though the program is running with root privileges, Bob (the user who is invoking the program) should only be able to read files, not modify them. However, because the shell is invoked, Bob could exploit this behavior.

**Example of an Attack:**

If Bob specifies a file name like:

```
/tmp/somefile; rm -rf /important_directory
```

The `system()` function would translate the command into:

```
/bin/cat /tmp/somefile; rm -rf /important_directory
```

This would cause the shell to first execute `/bin/cat` on the file `/tmp/somefile` and then run `rm -rf /important_directory`, which would delete the important directory. This is a classic example of a **command injection** vulnerability.

**Result in Step 1:**
- **Yes**, Bob can compromise the integrity of the system because of the dangerous nature of the shell invoked by `system()`. The `system()` function, when used in privileged Set-UID programs, can allow Bob to execute arbitrary commands with root privileges, potentially causing harm to the system.

### Step 2: Using `execve()` to invoke the command

In this step, we change the code to use `execve()` instead of `system()`. Here's how `execve()` works:

- **Difference with `system()`**: `execve()` directly invokes a program without invoking the shell. This means it does not process any shell metacharacters. The program passed to `execve()` is executed directly, which prevents the possibility of command injection via shell metacharacters.
  
**Code with `execve()`**:

```c
int main(int argc, char *argv[]) {
    char *v[3];
    char *command;
    if (argc < 2) {
        printf("Please type a file name.\n");
        return 1;
    }
    v[0] = "/bin/cat"; 
    v[1] = argv[1]; 
    v[2] = NULL;
    //command = malloc(strlen(v[0]) + strlen(v[1]) + 2);
    //sprintf(command, "%s %s", v[0], v[1]); // Not needed for execve
    execve(v[0], v, NULL);  // Use execve instead of system()

    return 0;
}
```

**Expected Behavior with `execve()`**:
- When using `execve()`, Bob is only able to execute `/bin/cat` with the file passed as an argument. This time, no shell is involved, so the shell metacharacters cannot be used to inject extra commands.
  
**Attack Attempt in Step 2**:
- If Bob tries to input something like `/tmp/somefile; rm -rf /important_directory`, `execve()` will not interpret the `;` as a command separator. Instead, it will pass the entire string `"/tmp/somefile; rm -rf /important_directory"` as the file name to `cat`, which will result in an error like:

  ```
  cat: /tmp/somefile; rm -rf /important_directory: No such file or directory
  ```

  The `rm -rf` command will **not** be executed because the shell is not invoked.

**Result in Step 2:**
- **No**, Bob cannot compromise the integrity of the system in this case. Since `execve()` does not invoke the shell, shell metacharacters like `;` or `&&` are not processed, and thus Bob cannot inject additional commands to delete or modify files. The only thing Bob can do is attempt to read the file specified, which is the intended behavior.

### Observations and Explanation:

1. **With `system()`**: The program executes the shell, which allows for command injection, making it dangerous in Set-UID programs. Bob can exploit this by injecting additional commands through the file argument, allowing him to execute arbitrary commands (e.g., deleting files).
  
2. **With `execve()`**: The program directly executes the specified program (`/bin/cat`) without invoking the shell. Therefore, shell metacharacters are not interpreted, and Bob cannot inject additional commands. This makes `execve()` much safer than `system()` when dealing with potentially untrusted input in Set-UID programs.

### Conclusion:
- **`system()`** is dangerous in Set-UID programs because it invokes the shell, which allows for command injection.
- **`execve()`** is safer because it does not invoke the shell, and therefore shell metacharacters cannot be exploited. This makes `execve()` a better choice for invoking external programs in privileged programs like Set-UID executables.
### Task 9


![圖片](https://hackmd.io/_uploads/S16O_mjiJx.png)


1. It opens the `/etc/zzz` file with `O_RDWR | O_APPEND`, which requires write access to the file.
2. It then calls `setuid(getuid())`, which downgrades the privileges of the process, effectively making it non-privileged.
3. After downgrading the privileges, it executes `/bin/sh` via `execve()`, which starts a new shell.

#### Potential Issue: Capability Leaking

Even though the program calls `setuid()` to downgrade the privileges, the underlying issue is that when a process is running with root privileges, it might have acquired some **privileged capabilities** (such as the ability to open files for writing, or the ability to manipulate certain resources). If these capabilities are not properly cleared or revoked before the program downgrades the privileges, they may still be available to the process after the call to `setuid()`. As a result, the process could still perform actions that would normally require root access, even though the effective UID is no longer root.

#### How to Exploit Capability Leaking

The process could potentially still have **file descriptor** capabilities that allow it to write to files like `/etc/zzz` after calling `setuid()`. The idea here is that, even though the process's UID is changed, it may still have the necessary capabilities to access the file descriptor `fd` with the permissions it originally had (because `fd` was opened with root privileges before calling `setuid()`).

Here's how we can proceed to investigate and potentially exploit this:

#### Step 1: Compilation and Setup
1. **Compile the Program:**
   Compile `cap_leak.c` using `gcc`:

   ```bash
   gcc -o cap_leak cap_leak.c
   ```

2. **Change Ownership to Root:**
   Change the owner of the program to `root`:

   ```bash
   sudo chown root:root cap_leak
   ```

3. **Make the Program Set-UID:**
   Set the Set-UID bit on the program so that it runs with root privileges:

   ```bash
   sudo chmod u+s cap_leak
   ```

4. **Create the `/etc/zzz` File:**
   Create the file `/etc/zzz` and set its permissions to be root-owned and readable/writable by root only:

   ```bash
   sudo touch /etc/zzz
   sudo chmod 0644 /etc/zzz
   sudo chown root:root /etc/zzz
   ```

#### Step 2: Run the Program as a Normal User
Now, run the program as a normal user (not root). Since it is a Set-UID program, it will execute with root privileges initially, but then it will call `setuid()` to downgrade the privileges. 

```bash
./cap_leak
```

You should see something like:

```
fd is 3
```

This indicates that the file `/etc/zzz` was opened successfully and a file descriptor (`fd`) was created.


#### Conclusion
- **If the attack works**: If you are able to write to `/etc/zzz` as a normal user, this confirms the existence of a capability leak. The root process's capability to write to the file was not properly revoked when the UID was changed, and as a result, the normal user can exploit this to gain unauthorized write access to a protected file.
  
- **If the attack does not work**: If you cannot write to `/etc/zzz`, this suggests that the file descriptor's capabilities were properly revoked, or the system is designed to prevent such capability leaks from occurring.

#### Fix for Capability Leaking
To fix this issue, the program should clean up any acquired capabilities before calling `setuid()`. This can be done by using the `prctl()` system call to explicitly drop capabilities, ensuring that any privileges held by the process are revoked before it downgrades its UID:

```c
#include <sys/prctl.h>

prctl(PR_SET_NO_NEW_PRIVS, 1);
setuid(getuid());
```

This will prevent the process from retaining any privileged capabilities after the UID downgrade.

## 1.2 setuid vs. seteuid

The difference between `setuid()` and `seteuid()` lies in how they modify user IDs for privileged (root) processes. Here's a hands-on lab to demonstrate this:

---

## Lab Setup
**Step 1:** Create a C program (`uid_demo.c`):
```c
#include 
#include 
#include 

void print_ids(const char *tag) {
    printf("[%s] Real UID: %d, Effective UID: %d\n", 
           tag, getuid(), geteuid());
}

int main() {
    print_ids("Start");
    
    // Drop privileges
    if (seteuid(1000) == -1) {  // Replace 1000 with your non-root UID
        perror("seteuid failed");
    }
    print_ids("After seteuid(1000)");
    
    // Attempt to regain root
    if (seteuid(0) == -1) {
        perror("Regaining root via seteuid failed");
    }
    print_ids("After seteuid(0)");

    return 0;
}
```

**Step 2:** Compile and set permissions:
```bash
gcc uid_demo.c -o uid_demo
sudo chown root:root uid_demo
sudo chmod u+s uid_demo
```

**Step 3:** Create a second version using `setuid()`:
```c
// Modify the privilege drop section to:
if (setuid(1000) == -1) {
    perror("setuid failed");
}
```

---

## Key Differences Demonstrated
### Case 1: Using `seteuid()`
1. **Privilege Drop:**  
   Only modifies the effective UID[1][4].  
   ```
   [Start] Real: 0, Effective: 0
   [After seteuid(1000)] Real: 0, Effective: 1000
   ```
   
2. **Privilege Regain:**  
   Succeeds because saved UID remains root[1][6]:  
   ```
   [After seteuid(0)] Real: 0, Effective: 0
   ```

### Case 2: Using `setuid()`
1. **Privilege Drop:**  
   Modifies real, effective, **and** saved UIDs[3][6]:  
   ```
   [Start] Real: 0, Effective: 0
   [After setuid(1000)] Real: 1000, Effective: 1000
   ```
   
2. **Privilege Regain:**  
   Fails permanently[1][5]:  
   ```
   Regaining root via setuid failed: Operation not permitted
   [After setuid(0)] Real: 1000, Effective: 1000
   ```

---

## Visual Comparison
| Operation         | seteuid()                  | setuid()                   |
|-------------------|----------------------------|----------------------------|
| Initial State     | (0, 0, 0)                  | (0, 0, 0)                  |
| After dropping    | (0, 1000, 0)               | (1000, 1000, 1000)         |
| After regain      | (0, 0, 0)                  | (1000, 1000, 1000)         |
| Privilege Persist | Yes (via saved UID)[1][4]  | No[3][6]                   |

---

## Conclusion
`seteuid()` allows temporary privilege drops while maintaining the ability to regain root via the saved UID. `setuid()` permanently relinquishes root privileges by modifying all three UIDs. This lab demonstrates why security-critical programs often use `seteuid()` for controlled privilege management.


## 1.3 Superuser Identity

### Question 1: If there is a user other than root but its ID is also zero, does this user have the same privilege as root?

#### Answer:

Yes, a user with a user ID (UID) of zero (0) is granted the same privileges as the root user in a Unix-like operating system. The UID of zero is specifically reserved for superuser (root) access. If a non-root user is assigned UID 0, they can gain the same system administration privileges as the root user, which includes the ability to read, write, and execute any file on the system, change system configurations, and perform any other privileged operations.

#### Experiment to Support the Answer:

1. **Create a User with UID 0**: We will create a user with UID 0 (excluding the root user).
   
2. **Verify the Privileges**: Log in as the newly created user and attempt to perform a task that requires superuser privileges, such as modifying a file that only root can modify.

Here is how you can perform the experiment:

```bash
# Step 1: Create a user with UID 0
sudo useradd -u 0 nonrootuser

# Step 2: Check the user's UID
id nonrootuser

# Step 3: Create a root-only file and verify it
sudo touch /root/testfile
sudo chmod 600 /root/testfile

# Step 4: Attempt to access the root-only file as the new user
sudo -u nonrootuser cat /root/testfile
```

If the new user with UID 0 can successfully access and modify files that normally require root privileges, then the user indeed has the same privileges as root.

### Question 2: If there are two roots in /etc/passwd with two different settings, which one is effective?

#### Answer:

In Unix-like operating systems, there is only **one** root user, but it is possible to have multiple entries for the same user (root) in `/etc/passwd` with different settings. The entry that is effective is determined by the order in which the entries are processed by the system. 

In most cases, the first `root` entry in `/etc/passwd` is the one that will be used, and the second (or subsequent) root entry will be ignored by the system. However, if the second root entry is properly configured in a different context (e.g., using some other method like `useradd`), it might still work in specific configurations like login shell setups, or if something explicitly references the second root entry.

#### Experiment to Support the Answer:

1. **Add a Second Root Entry**: We will add a second `root` entry to `/etc/passwd` with a different setting.
   
2. **Verify Which Entry is Effective**: Log in using both root entries and check which one is effective.

Here’s how to perform the experiment:

```bash
# Step 1: Backup /etc/passwd before modifying it
sudo cp /etc/passwd /etc/passwd.bak

# Step 2: Add a second root entry to /etc/passwd (with different settings)
echo "root1:x:0:0:root:/root:/bin/bash" | sudo tee -a /etc/passwd

# Step 3: Check if both root entries exist
cat /etc/passwd | grep root

# Step 4: Test logging in as root1 or root, for example using `su` or `sudo`
sudo su - root1
```

If the system allows you to log in as `root1` with a different shell or environment, then it is working, but typically the first entry should still be the one in effect.

### Question 3: In the course site, there is a file called catall.c. Build it and make it a root set-uid program. Please design an attack method which makes use of this program to change the root’s password.

#### Answer:

When a program is made **Set-UID root**, it runs with the permissions of the file's owner (in this case, root), regardless of the user who executes it. This can present a security risk if the program is not properly sanitized or if it allows user input that could be exploited.

In the case of the `catall.c` program, which runs `cat` to display files, an attacker might exploit any vulnerabilities in the program (such as the lack of input sanitization) to execute arbitrary commands with root privileges.

#### Attack Strategy:

1. **Step 1: Analyze the `catall.c` program**: Check for any ways in which user input might be used insecurely. If the `catall.c` program does not sanitize input correctly, it could be vulnerable to command injection.

2. **Step 2: Create a malicious file or environment variable**: If the `catall.c` program allows for user input (e.g., filename), an attacker might be able to exploit this by injecting shell commands or modifying the environment.

3. **Step 3: Exploit the Set-UID program**: If the program runs with root privileges, any successful command injection will also run as root.

#### Example Exploit:

Suppose the program allows the user to input a filename and then runs `cat` on it. An attacker could try to pass a filename with a malicious character sequence that could execute commands.

```bash
# Step 1: Compile catall.c and make it set-uid root
gcc -o catall catall.c
sudo chown root:root catall
sudo chmod u+s catall

# Step 2: Prepare an attack
echo 'cat /etc/shadow' > malicious_file

# Step 3: Run the vulnerable program with the malicious file
./catall malicious_file
```

This would display the contents of `/etc/shadow`, which includes the root password hashes.

4. **Modify Root’s Password**: To change the root password, an attacker could attempt to overwrite the shadow file or execute a shell command that modifies the root password.

```bash
# Step 4: Malicious file that changes root's password
echo 'echo "root:newpassword" > /etc/shadow' > malicious_file

# Step 5: Run the vulnerable program
./catall malicious_file
```

If the program doesn't properly sanitize input and allows for command execution via filename, the attacker can inject a command to change the root password, even though they are not running as root.

---

### Conclusion:
1. A user with UID 0 other than root has the same privileges as root.
2. The first `root` entry in `/etc/passwd` is usually the effective one.
3. A Set-UID root program, if vulnerable, can be exploited by injecting commands, including commands to change the root password.

## 1.4 Linux PAM and Daemon

See the PAM-Daemon-rs dir and README.md

## 1.5 File Permissions

Here are the answers to your questions regarding file permissions in Linux and SAMBA:

1.  Where is the file permission stored?

    File permissions are stored in inodes, which contain metadata about files in Unix-like file systems such as ext*, xiafs, and BSD file systems[6]. Inodes store information about files, including their permissions, ownership, timestamps, and data locations, and provide the data to programs[6].
2.  When using SAMBA, a free software re-implementation of the SMB networking protocol, for file sharing, will permission be delivered? Please describe your observation.

    Samba can be configured to preserve file permissions when files are accessed and modified through the network[8]. However, the exact behavior depends on the configuration of Samba and the underlying file system.

    *   **File permission handling:** By default, when accessing Windows files from WSL, file permissions are either calculated from Windows permissions or read from metadata added by WSL. If the file has no metadata, the effective permissions of the Windows user are translated to read/write/execute bits for user, group, and others. If metadata is present, those values are used instead[2].
    *   **SMB configuration:** To ensure permissions are correctly preserved, settings in the Samba configuration file (`smb.conf`) are crucial. For example, the `nt acl support = no` parameter can prevent Samba from resetting file permissions when a file is saved[4]. Other settings like `create mask` and `directory mask` can be used to set permissions for newly created files and directories[7].
    *   **User and group mapping:** Correctly mapping users and groups between the Linux and Windows systems is also essential. This can be achieved by ensuring that user names are the same on both systems or by using `force user` and `force group` settings in `smb.conf` to enforce specific ownership[3][7].
    *   **Potential issues:** Mismatched configurations or incorrect user mappings can lead to permission issues, such as files being created with incorrect permissions (e.g., 644 instead of 755) or users being unable to modify files created by others[5][7].
