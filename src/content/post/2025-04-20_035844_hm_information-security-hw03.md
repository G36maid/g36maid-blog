---
title: "Information Security HW03"
description: "Shellcode Development Lab"
pubDate: 2025-04-20 03:58:44 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1745092724
---

## 3.1 SEED Lab (20 pts)
Shellcode Development Lab
https://seedsecuritylabs.org/Labs_20.04/Software/Shellcode/
Please record all your steps with screen captures and answer all
questions.
## 3.2 SEED Lab (30 pts)
Return-to-libc Attack Lab
https://seedsecuritylabs.org/Labs_20.04/Software/Return_to_
Libc/
Please record all your steps with screen captures and answer all
questions.


## 3.3 NX (10 pts)
In this course, I have introduced a defensive mechanism called non-executable
stack. I also told you that the only difference between NX enabled and
NX disabled programs is one bit. Actually, this defensive mechanism is im-
plemented on CPU. Please check that if this defensive approach still works
when NX is disabled in BIOS. Also you need to check if the malicious code
is in heap, will the attack work?

## 3.4 Password Guess (20 pts)
Please read the following code.
```
1 # include <stdio.h>
2 # include <stdlib.h>
3 # include <stdint.h>
4 # include <string.h>
5
6 int main ()
7 {
8 FILE *pFile = fopen( "/dev/random ", "rb" );
9
10 uint32_t guess = 0, secret = 0;
11
12 if( pFile == NULL )
13 {
14 perror( "Error" );
15 return 0;
16 }
17
18 fread( &secret , 4, 1, pFile );
19
20 while( 1 )
21 {
22 printf( "Please enter your guess: " );
23 scanf( "%u", &guess );
24
25 if( guess == secret )
26 {
27 break;
28 }
29
30 printf( "Wrong guess! Please guess again .\n" );
31 }
32
33 printf( " Congratulation ! The secret is uiwebqwhec12 !\n" );
34
35 return 0;
36 }
```
I think you should know the function of this code. Please write a lab
to show how to get the secret from binary only. Note that in your lab, you
need to show at least four ways to get the secret. I give you this code so
that you can build the code yourself. Undoubtedly, read the code directly
is not included.



## 3.5 Defeat DASH Countermeasure (20 pts)
In this class, I have introduced how DASH protect your system from Set-
UID programs. Now we want to beat this countermeasure. The concept is
very simple. We can use setuid to set all process-related user ID’s to the
input uid. The problem is, the root uid is 0 and you all know that strcpy()
stops when encountering zero. How to solve this problem? Please write
down your idea and launch your attack to show it works.
Of course, you can use any approaches. For your convenience, I will
give you one hint.
1 // The functions sprintf () writes a formatted string (
including the terminating null byte ('\0')) to str.
2 int sprintf (char *str , const char *format , ...);
