---
title: "System Software"
description: "Macro Instructions: A macro is a single identifier representing a sequence of instructions or code fragments. During macro expansion, the…"
pubDate: 2024-12-16 06:33:02 +0800
tags: ["debug", "memory", "kernel", "final"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1734301982
category: programming
---

## 2022 Final Exam

### **Solutions**

#### 1. **What are macro instructions and expanding a macro? Is macro different from a subroutine?**  
- **Macro Instructions**: A macro is a single identifier representing a sequence of instructions or code fragments. During macro expansion, the macro's definition is substituted at each call.  
- **Difference**:  
   - **Macros**: Expanded inline during preprocessing (before compilation), reducing function call overhead but increasing code size.  
   - **Subroutines**: Function calls processed at runtime, saving space but adding execution overhead due to stack management.

---

#### 2. **Difficulty for a macro definition containing labels? Any solution?**  
- **Difficulty**: If a macro uses labels, the same macro expansion in multiple places will cause duplicate labels, leading to conflicts during assembly.  
- **Solution**: Use **unique label generation** by appending counters or prefixes to labels within macros.

Example:
```assembly
macro test_macro
label1:
    mov eax, 1
    jmp label1
endm
```
Expanded with unique labels:
```assembly
test_macro_1_label1:
    mov eax, 1
    jmp test_macro_1_label1
```

---

#### 3. **What is conditional macro expansion and its usage?**  
- **Conditional Macro Expansion**: Expanding macros based on conditions, similar to conditional compilation.  
- **Usage**:  
   - To include/exclude code based on flags or platform.  
   - Example:
     ```assembly
     ifdef DEBUG
         mov eax, 0 ; Debug mode instruction
     else
         mov eax, 1 ; Production mode instruction
     endif
     ```

---

#### 4. **Comparison between positional and keyword parameters in macros.**  
- **Positional Parameters**: Parameters passed in order.  
   Example:  
   ```assembly
   macro add a, b
       mov eax, a
       add eax, b
   endm
   add 5, 6
   ```
- **Keyword Parameters**: Parameters passed using keys for clarity and flexibility.  
   Example:  
   ```assembly
   macro add a=:5, b=:6
       mov eax, a
       add eax, b
   endm
   add b=10
   ```

---

#### 5. **Difficulties for designing a general-purpose macro processor**  
- Resolving recursive macro definitions.  
- Handling labels and ensuring uniqueness.  
- Supporting conditionals and loops within macros.  
- Managing nested macro expansions.

---

#### 6. **Two-pass macro processor and its limitation**  
- **Two-Pass Macro Processor**:  
   - **Pass 1**: Processes macro definitions.  
   - **Pass 2**: Expands macro invocations.  
- **Limitation**: It cannot process macros containing nested macro definitions because the macro body is processed **only in the first pass**.

---

#### 7. **Difference between system calls and library calls**  
- **System Calls**: Direct requests to the kernel.  
   - Example: `read()`, `write()`  
- **Library Calls**: Functions provided by libraries that may internally use system calls.  
   - Example: `printf()` calls `write()` internally.

---

#### 8. **What happens when a system call discovers an error? How to know the reason?**  
- System call sets `errno` to indicate the error.  
- Use `perror()` or `strerror()` to display the error.  

Example:
```c
if (open("file.txt", O_RDONLY) < 0) {
    perror("Error opening file");
}
```

---

#### 9. **Program to explore the number of file descriptors in PCB**  
**Code:**
```c
#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>

int main() {
    int i = 0, count = 0;
    for (i = 0; i < 1024; i++) {
        if (fcntl(i, F_GETFD) != -1) {
            count++;
        }
    }
    printf("Number of open file descriptors: %d\n", count);
    return 0;
}
```

---

#### 10. **What happens after an `exec` call?**  
- The current process image is replaced with a new one.  
- PID remains the same, but all previous memory, data, and instructions are replaced.

---

#### 11. **SIGNAL mechanism**  
- **Related System Calls**: `signal()`, `kill()`, `raise()`, `sigaction()`.  
- **Examples of Usage**:  
   1. Gracefully shutting down a process with `SIGTERM`.  
   2. Handling user interrupts like `SIGINT`.  
- **Why Signals Are Lost**: If a signal is sent while the process is not ready or if signal handling is not properly configured.

---

#### 12. **Difference between `fork()` and `vfork()`**  
- **`fork()`**: Creates a child process with a copy of the parent process.  
- **`vfork()`**: Child process shares memory space with the parent until `exec()` is called.

---

#### 13. **Limitation for two processes using pipes**  
- Pipes are **unidirectional**.  
- Both processes must have a common ancestor.  

---

#### 14. **C Program to fulfill `who|grep bruce|wc > foo`**  
**Code:**
```c
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <fcntl.h>

int main() {
    int fd[2];
    pipe(fd);

    if (fork() == 0) { // Child 1: who | grep bruce
        close(fd[0]);
        dup2(fd[1], STDOUT_FILENO);
        execlp("who", "who", NULL);
    }

    if (fork() == 0) { // Child 2: grep bruce
        close(fd[1]);
        dup2(fd[0], STDIN_FILENO);
        int fd_out = open("foo", O_WRONLY | O_CREAT | O_TRUNC, 0644);
        dup2(fd_out, STDOUT_FILENO);
        execlp("grep", "grep", "bruce", NULL);
    }

    close(fd[0]);
    close(fd[1]);
    wait(NULL);
    wait(NULL);
    return 0;
}
```

---

#### 15. **Design a program for file protection and logging in Unix**  
- **File Protection**: Use `chmod` to set group permissions.  
- **Logging Access**: Use `inotify` to monitor file access.  
- **Architecture**:  
   1. Group-based file permissions.  
   2. `inotify` or `audit` to log access.  
   3. Centralized log storage for monitoring.

---

Let me know if you'd like more detailed explanations or code for any specific problem!
## 2022 final
### **Solutions**

#### 1. **What are macro instructions and expanding a macro? Is macro different from a subroutine?**  
- **Macro Instructions**: A macro is a single identifier representing a sequence of instructions or code fragments. During macro expansion, the macro's definition is substituted at each call.  
- **Difference**:  
   - **Macros**: Expanded inline during preprocessing (before compilation), reducing function call overhead but increasing code size.  
   - **Subroutines**: Function calls processed at runtime, saving space but adding execution overhead due to stack management.

---

#### 2. **Difficulty for a macro definition containing labels? Any solution?**  
- **Difficulty**: If a macro uses labels, the same macro expansion in multiple places will cause duplicate labels, leading to conflicts during assembly.  
- **Solution**: Use **unique label generation** by appending counters or prefixes to labels within macros.

Example:
```assembly
macro test_macro
label1:
    mov eax, 1
    jmp label1
endm
```
Expanded with unique labels:
```assembly
test_macro_1_label1:
    mov eax, 1
    jmp test_macro_1_label1
```

---

#### 3. **What is conditional macro expansion and its usage?**  
- **Conditional Macro Expansion**: Expanding macros based on conditions, similar to conditional compilation.  
- **Usage**:  
   - To include/exclude code based on flags or platform.  
   - Example:
     ```assembly
     ifdef DEBUG
         mov eax, 0 ; Debug mode instruction
     else
         mov eax, 1 ; Production mode instruction
     endif
     ```

---

#### 4. **Comparison between positional and keyword parameters in macros.**  
- **Positional Parameters**: Parameters passed in order.  
   Example:  
   ```assembly
   macro add a, b
       mov eax, a
       add eax, b
   endm
   add 5, 6
   ```
- **Keyword Parameters**: Parameters passed using keys for clarity and flexibility.  
   Example:  
   ```assembly
   macro add a=:5, b=:6
       mov eax, a
       add eax, b
   endm
   add b=10
   ```

---

#### 5. **Difficulties for designing a general-purpose macro processor**  
- Resolving recursive macro definitions.  
- Handling labels and ensuring uniqueness.  
- Supporting conditionals and loops within macros.  
- Managing nested macro expansions.

---

#### 6. **Two-pass macro processor and its limitation**  
- **Two-Pass Macro Processor**:  
   - **Pass 1**: Processes macro definitions.  
   - **Pass 2**: Expands macro invocations.  
- **Limitation**: It cannot process macros containing nested macro definitions because the macro body is processed **only in the first pass**.

---

#### 7. **Difference between system calls and library calls**  
- **System Calls**: Direct requests to the kernel.  
   - Example: `read()`, `write()`  
- **Library Calls**: Functions provided by libraries that may internally use system calls.  
   - Example: `printf()` calls `write()` internally.

---

#### 8. **What happens when a system call discovers an error? How to know the reason?**  
- System call sets `errno` to indicate the error.  
- Use `perror()` or `strerror()` to display the error.  

Example:
```c
if (open("file.txt", O_RDONLY) < 0) {
    perror("Error opening file");
}
```

---

#### 9. **Program to explore the number of file descriptors in PCB**  
**Code:**
```c
#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>

int main() {
    int i = 0, count = 0;
    for (i = 0; i < 1024; i++) {
        if (fcntl(i, F_GETFD) != -1) {
            count++;
        }
    }
    printf("Number of open file descriptors: %d\n", count);
    return 0;
}
```

---

#### 10. **What happens after an `exec` call?**  
- The current process image is replaced with a new one.  
- PID remains the same, but all previous memory, data, and instructions are replaced.

---

#### 11. **SIGNAL mechanism**  
- **Related System Calls**: `signal()`, `kill()`, `raise()`, `sigaction()`.  
- **Examples of Usage**:  
   1. Gracefully shutting down a process with `SIGTERM`.  
   2. Handling user interrupts like `SIGINT`.  
- **Why Signals Are Lost**: If a signal is sent while the process is not ready or if signal handling is not properly configured.

---

#### 12. **Difference between `fork()` and `vfork()`**  
- **`fork()`**: Creates a child process with a copy of the parent process.  
- **`vfork()`**: Child process shares memory space with the parent until `exec()` is called.

---

#### 13. **Limitation for two processes using pipes**  
- Pipes are **unidirectional**.  
- Both processes must have a common ancestor.  

---

#### 14. **C Program to fulfill `who|grep bruce|wc > foo`**  
**Code:**
```c
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <fcntl.h>

int main() {
    int fd[2];
    pipe(fd);

    if (fork() == 0) { // Child 1: who | grep bruce
        close(fd[0]);
        dup2(fd[1], STDOUT_FILENO);
        execlp("who", "who", NULL);
    }

    if (fork() == 0) { // Child 2: grep bruce
        close(fd[1]);
        dup2(fd[0], STDIN_FILENO);
        int fd_out = open("foo", O_WRONLY | O_CREAT | O_TRUNC, 0644);
        dup2(fd_out, STDOUT_FILENO);
        execlp("grep", "grep", "bruce", NULL);
    }

    close(fd[0]);
    close(fd[1]);
    wait(NULL);
    wait(NULL);
    return 0;
}
```

---

#### 15. **Design a program for file protection and logging in Unix**  
- **File Protection**: Use `chmod` to set group permissions.  
- **Logging Access**: Use `inotify` to monitor file access.  
- **Architecture**:  
   1. Group-based file permissions.  
   2. `inotify` or `audit` to log access.  
   3. Centralized log storage for monitoring.
