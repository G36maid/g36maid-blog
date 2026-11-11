---
title: "ncurses 中文教學：從 Hello World 到滑鼠事件，自己寫一個終端機介面"
description: "以 ncurses 6.4 為準的繁體中文 TUI 入門教學：初始化、輸出輸入、屬性、視窗、顏色、鍵盤與滑鼠事件，每個主題都附完整可編譯的 C 範例。"
pubDate: 2023-06-21 00:28:02 +0800
tags: ["c", "ncurses", "tui", "terminal", "linux", "教學"]
category: programming
source: hackmd
sourceType: note
sourceTimestamp: 1687278482
draft: false
---

> 本文擴寫自 2023-06-21 的 HackMD 中文筆記（2026-10-23 潤飾重寫）。當時的版本基準是 [ncurses 6.4](https://www.invisible-island.net/ncurses/announce-6.4.html)（2022-12-31 發布），文中 API 在 6.x 系列都通用。

[ncurses](https://invisible-island.net/ncurses/)（new curses）是一個提供應用程式介面（API）的 C 程式庫，讓程式設計師能用**獨立於終端機**的方式撰寫文字使用者介面（TUI, Text-based User Interface）。你每天都在用的 `vim`、`htop`、`aptitude`，底層都是它。

「獨立於終端機」是 ncurses 最重要的承諾：不管使用者坐在 xterm、GNOME Terminal 還是透過 SSH 連進來的 tmux，程式碼都不用改——ncurses 透過 terminfo 資料庫查詢每種終端機的控制序列，把「畫一個框」「移動游標到 (y, x)」這類高階操作翻譯成該終端機聽得懂的語言。

這是一篇 ncurses 的繁體中文教學，從安裝一路講到滑鼠事件，每個章節都附可以直接編譯的完整範例。原文是我 2023 年寫的學習筆記，結構主要參考 Pradeep Padala 的 [NCURSES Programming HOWTO](https://tldp.org/HOWTO/NCURSES-Programming-HOWTO/index.html)，錯漏之處已於擴寫時修正。

## 1. 安裝

Debian/Ubuntu 系：

```sh
sudo apt-get install libncurses5-dev libncursesw5-dev
```

在較新的 Debian/Ubuntu（bullseye 之後），這兩個套件名其實只是轉接包，實際裝 `libncurses-dev` 一個就夠；`ncursesw`（wide character）版本才是處理 UTF-8 中文需要的。Arch Linux 則是 `sudo pacman -S ncurses`，macOS 用 Homebrew `brew install ncurses`。

Arch 系：

```sh
sudo pacman -S ncurses
```

## 2. Hello World！

Hello World 必須是第一步。要使用 ncurses 函式庫，程式中必須 `#include <ncurses.h>`，而且編譯時要像 `math.h` 需要 `-lm` 一樣，加上 `-lncurses`：

```c
gcc hello.c -lncurses
```

```c
// N02.c
#include <ncurses.h>

int main()
{
	initscr();  /* 啟動 curses 模式 */
	printw("Hello World !!!"); /* 在虛擬螢幕上列印 */
	refresh(); /* 把內容更新到真正的螢幕上 */
	getch();   /* 等待使用者輸入 */
	endwin();  /* 結束 curses 模式 */

	return 0;
}
```

![ncurses Hello World 執行畫面](/media/2023-06/HkkjHiy_3.png)

### 2.1 逐行解析

**`initscr()`**：初始化終端機、清成空白畫面，並配置 ncurses 內部的緩衝區。它是進入 curses 模式的必要條件，所有其他 ncurses 函式都必須在它之後呼叫。

**`printw()`**：幾乎跟 `printf()` 一樣，差別在它把資料印在目前游標座標 (y, x) 上。此時座標是 (0, 0)，所以文字出現在左上角。

**`refresh()`**：這是新手最需要理解的一行。前面 `printw()` 做的所有事情都**不會**真的出現在螢幕上，而是寫進一個叫 `stdscr` 的虛擬螢幕緩衝區；只有呼叫 `refresh()` 時，ncurses 才計算虛擬螢幕與真實螢幕的差異，把需要的部分送出去。這也意味著你可以進行多次操作後再一起 `refresh()`，效能比每改一格就更新好得多。

初學者最常犯的錯誤就是 `printw()` 之後忘了 `refresh()`，然後納悶螢幕為什麼沒動。

**`endwin()`**：還原終端機狀態、釋放 ncurses 配置的記憶體，並退出 curses 模式。忘記呼叫它，你的 shell 提示字元就會變成一片狼藉。

## 3. 初始化

真正的互動程式在 `initscr()` 之後通常還要設定幾個行為開關。

### 3.1 raw() 與 cbreak()

終端機預設會緩衝使用者輸入的字元，直到遇到 Enter 才整行送給程式；但我們希望使用者一按鍵程式就收到。這兩個函式都用來停用行緩衝，差別在**訊號處理**：

- `cbreak()`：關閉行緩衝，但保留訊號——按 Ctrl+C 仍然會產生 SIGINT 把程式砍掉。
- `raw()`：更激進，連訊號產生也關掉——Ctrl+C、Ctrl+Z 只是一個普通字元，會原封不動送進 `getch()`。

想要自己的程式完全接管按鍵（例如編輯器把 Ctrl+C 當成「複製」）就用 `raw()`；只想讀單鍵、還想保留 Ctrl+C 逃生出口就用 `cbreak()`。

### 3.2 echo() 與 noecho()

控制使用者鍵入的字元是否回顯到終端機。大多數互動程式初始化時呼叫 `noecho()`，因為它們想以受控的方式自己決定在哪裡顯示什麼——例如密碼輸入，你絕對不會希望按下的字元自動印出來。

### 3.3 keypad()

讓 ncurses 能讀取方向鍵、F1~F12 等特殊鍵。這些鍵實際上是多字元的 escape sequence（例如方向鍵上可能是 `\x1b[A`），ncurses 幫你把它翻譯成一個整數 keycode。方向鍵是所有互動介面的基本配備，所以幾乎每支程式都要：

```c
keypad(stdscr, TRUE);
```

### 3.4 halfdelay()

啟用半延遲模式：類似 `cbreak()`，鍵入的字元立即可用，但只等待「X 個十分之一秒」，逾時沒有輸入就回傳 `ERR`。超時值是傳給函式的參數。

這個功能不常用，但寫即時遊戲時非常好用——例如彈幕射擊遊戲的主迴圈，沒有按鍵也要繼續更新畫面，有按鍵才處理輸入：

```c
halfdelay(1);  /* 每 0.1 秒檢查一次輸入 */
if (getch() == ERR) {
    /* 沒有輸入，繼續跑遊戲邏輯 */
}
```

### 3.5 完整初始化範例

```c
// N03.c
#include <ncurses.h>

int main()
{	int ch;

	initscr();			/* Start curses mode		*/
	raw();				/* Line buffering disabled	*/
	keypad(stdscr, TRUE);		/* We get F1, F2 etc..		*/
	noecho();			/* Don't echo() while we do getch */

	printw("Type any character to see it in bold\n");
	ch = getch();			/* If raw() hadn't been called
					 * we have to press enter before it
					 * gets to the program		*/
	if(ch == KEY_F(1))		/* Without keypad enabled this will */
		printw("F1 Key pressed");/* not get to us either		*/
					/* Without noecho() some ugly escape
					 * characters might have been printed
					 * on screen			*/
	else
	{	printw("The pressed key is ");
		attron(A_BOLD);
		printw("%c", ch);
		attroff(A_BOLD);
	}
	refresh();			/* Print it on to the real screen */
	getch();			/* Wait for user input */
	endwin();			/* End curses mode		  */

	return 0;
}
```

![raw/keypad/noecho 初始化範例的執行畫面](/media/2023-06/BJz15oJd3.png)

## 4. 關於 Window 的一句話

深入研究無數的 ncurses 函式之前，先澄清「Window」這個概念（第八章會詳細展開）。

Window 是 curses 系統定義的**假想螢幕**。`initscr()` 會建立一個名為 `stdscr` 的預設視窗，代表你的 80x25（或終端機實際大小）螢幕。如果只是印字串、讀輸入這類簡單任務，用這個預設視窗就夠了；你也可以自己建立視窗，把螢幕切塊管理。

函式命名有一套前綴規則，看一次就懂：

```c
printw(string);             /* Print on stdscr at present cursor position */
mvprintw(y, x, string);     /* Move to (y, x) then print string           */
wprintw(win, string);       /* Print on window win at present cursor      */
                            /* position in the window                     */
mvwprintw(win, y, x, string); /* Move to (y, x) relative to window        */
                              /* coordinates and then print               */
```

拆解：前綴 `mv` = 先移動游標；前綴 `w` = 作用在指定視窗而非 `stdscr`；`mvw` = 兩者皆有。整個 ncurses 的函式家族都遵守這套規則，記住它，等於學會了一半的 API。

## 5. 輸出函式

初始化完成，讓我們跟螢幕的另一邊說話。輸出函式分三類：

1. `addch()` 類：印出帶屬性的**單一字元**
2. `printw()` 類：印出類似 `printf()` 的**格式化輸出**
3. `addstr()` 類：印出**字串**

### 5.1 addch() 函式類

`addch()` 把單一字元放進目前游標位置並使游標前進。如果字元帶有屬性（粗體、反白等），就會以該屬性印出。

把字元與屬性結合有兩種選擇。第一種是直接用位元 OR 運算：

```c
addch(ch | A_BOLD | A_UNDERLINE);
```

第二種是用 `attrset()`、`attron()`、`attroff()` 設定視窗的「目前屬性」，之後印出的字元都帶該屬性，直到關閉為止（第七章詳談）。

此外 ncurses 也為字元圖形提供了特殊字元（ACS 系列），可以畫表格、水平線、垂直線。在 `ncurses.h` 裡搜尋以 `ACS_` 開頭的 macro 就能看到全部，例如 `ACS_VLINE`、`ACS_HLINE`、`ACS_ULCORNER`。

### 5.2 mvaddch()、waddch() 與 mvwaddch()

`mvaddch()` 用於先移動游標再印字元。底下兩段等價：

```c
move(row, col);  /* moves the cursor to rowth row and colth column */
addch(ch);
```

```c
mvaddch(row, col, ch);
```

`waddch()` 則是作用在指定視窗上，照第四章的前綴規則。

### 5.3 printw() 函式類

這一族類似 `printf()`，但多了「在螢幕上任何位置印」的能力：

- **`printw()` / `mvprintw()`**：`mvprintw()` 等價於先 `move()` 再 `printw()`。
- **`wprintw()` / `mvwprintw()`**：同上，但作用在指定視窗。
- **`vwprintw()`**：類似 `vprintf()`，要印可變數量的參數時用。

範例：取得螢幕尺寸、把訊息印在正中央。

```c
// N05.c
#include <ncurses.h>			/* ncurses.h includes stdio.h */
#include <string.h>

int main()
{
	char mesg[] = "Just a string";	/* message to be appeared on the screen */
	int row, col;			/* to store the number of rows and
					 * the number of columns of the screen */
	initscr();			/* start the curses mode */
	getmaxyx(stdscr, row, col);	/* get the number of rows and columns */
	mvprintw(row / 2, (col - strlen(mesg)) / 2, "%s", mesg);
					/* print the message at the center of the screen */
	mvprintw(row - 2, 0, "This screen has %d rows and %d columns\n", row, col);
	printw("Try resizing your window (if possible) and then run this program again");
	refresh();
	getch();
	endwin();

	return 0;
}
```

`getmaxyx()` 是一個 macro（所以不用傳指標），把終端機的列數、欄數塞進 `row`、`col`。

### 5.4 addstr() 函式類

`addstr()` 把字串放進給定視窗，效果相當於對字串中每個字元呼叫一次 `addch()`。同族還有 `mvaddstr()`、`waddstr()`、`mvwaddstr()`，以及多接收一個整數參數 `n` 的 `addnstr()`——最多放 n 個字元，n 為負數時放整個字串（避免緩衝區爆掉時很好用）。

### 5.5 請注意：是 (y, x)，不是 (x, y)

所有這些函式的座標參數都是**先 y（列）後 x（欄）**。初學者最常犯的錯誤就是按 (x, y) 的順序傳，結果畫面跑到天邊去。如果你對 (y, x) 坐標操作太頻繁，考慮把螢幕切成多個視窗分別管理，每個視窗內部的座標系會好算很多。

## 6. 輸入函式

只出不進很無聊。輸入函式同樣分三類：

1. `getch()` 類：取得一個字元
2. `scanw()` 類：取得格式化輸入
3. `getstr()` 類：取得字串

### 6.1 getch() 函式類

從終端機讀取單一字元。有幾個微妙之處：如果沒有呼叫 `cbreak()`，ncurses 不會連續讀你輸入的字元，而是等你按了 Enter 或送出 EOF 才開始讀。為了讓程式立即收到每個按鍵，必須 `cbreak()`。另一個常搭配的是 `noecho()`，使用者鍵入的字元不會直接顯示在螢幕上。

`cbreak()` + `noecho()` 這個組合最典型的應用就是密碼輸入：自己收到字元後只印 `*`。

### 6.2 scanw() 函式類

類似 `scanf()`，多了從螢幕任意位置取得輸入的能力。內部做法是先呼叫 `wgetstr()` 把整行讀進來，再用 `sscanf()` 掃描。同族有 `mvscanw()`、`wscanw()`、`mvwscanw()` 和處理可變參數的 `vwscanw()`。

### 6.3 getstr() 函式類

從終端機取得字串。本質上等同於連續呼叫 `getch()` 直到收到換行、回車或 EOF，結果放入 `str` 指向的使用者自備緩衝區。

### 6.4 範例

```c
// N06.c
#include <ncurses.h>			/* ncurses.h includes stdio.h */
#include <string.h>

int main()
{
	char mesg[] = "Enter a string: ";
	char str[80];
	int row, col;			/* to store the number of rows and
					 * the number of columns of the screen */
	initscr();			/* start the curses mode */
	getmaxyx(stdscr, row, col);
	mvprintw(row / 2, (col - strlen(mesg)) / 2, "%s", mesg);
	getstr(str);
	mvprintw(LINES - 2, 0, "You Entered: %s", str);
	getch();
	endwin();

	return 0;
}
```

## 7. 屬性

屬性讓你能以簡單易懂的方式強調資訊。以下程式把一個 C 語言檔案當輸入，把 `/* ... */` 註解以粗體顯示——一個迷你的語法高亮 pager。

```c
/* pager functionality by Joseph Spainhour <spainhou@bellsouth.net> */
// N0701.c
#include <ncurses.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
	int ch, prev, row, col;
	prev = EOF;
	FILE *fp;
	int y, x;

	if(argc != 2)
	{
		printf("Usage: %s <a c file name>\n", argv[0]);
		exit(1);
	}
	fp = fopen(argv[1], "r");
	if(fp == NULL)
	{
		perror("Cannot open input file");
		exit(1);
	}
	initscr();				/* Start curses mode */
	getmaxyx(stdscr, row, col);		/* find the boundaries of the screen */
	while((ch = fgetc(fp)) != EOF)		/* read the file till we reach the end */
	{
		getyx(stdscr, y, x);		/* get the current cursor position */
		if(y == (row - 1))		/* are we at the end of the screen */
		{
			printw("<-Press Any Key->");	/* tell the user to press a key */
			getch();
			clear();			/* clear the screen */
			move(0, 0);			/* start at the beginning of the screen */
		}
		if(prev == '/' && ch == '*')	/* If it is / and * then only
						 * switch bold on */
		{
			attron(A_BOLD);		/* cut bold on */
			getyx(stdscr, y, x);	/* get the current cursor position */
			move(y, x - 1);		/* back up one space */
			printw("%c%c", '/', ch);	/* The actual printing is done here */
		}
		else
			printw("%c", ch);
		refresh();
		if(prev == '*' && ch == '/')
			attroff(A_BOLD);	/* Switch it off once we got *
						 * and then / */
		prev = ch;
	}
	endwin();				/* End curses mode */
	fclose(fp);
	return 0;
}
```

看 `while` 迴圈：它讀取檔案中的每個字元並搜尋 `/*` 模式；一發現就用 `attron()` 打開粗體，遇到 `*/` 再用 `attroff()` 關閉。這個程式還介紹了兩個有用的函式：

- **`getyx()`**：把目前游標座標放進 `y`、`x`。它是 macro，所以不用傳指標。
- **`move()`**：把游標移到給定座標。

### 7.1 屬性清單

`<curses.h>` 中定義的視訊屬性：

```text
A_NORMAL        正常顯示（無高亮）
A_STANDOUT      終端的最佳高亮模式
A_UNDERLINE     底線
A_REVERSE       反白
A_BLINK         閃爍
A_DIM           半亮
A_BOLD          超亮或粗體
A_PROTECT       保護模式
A_INVIS         不可見或空白
A_ALTCHARSET    替代字元集
A_CHARTEXT      用於取出字元的位元遮罩
COLOR_PAIR(n)   顏色對編號 n
```

屬性可以用 OR 疊加任意數量。想要「反白加閃爍」：

```c
attron(A_REVERSE | A_BLINK);
```

### 7.2 attron() vs attrset()

`attron()` 只是**打開**傳給它的屬性；`attrset()` 則是**完全覆蓋**視窗目前的屬性、設成新的。`attroff()` 只關閉指定的屬性。這個設計讓屬性管理很靈活：基底屬性用 `attrset()`，暫時的強調用 `attron()`/`attroff()` 成對包起來。

### 7.3 attr_get() 與 attr_ 系列

`attr_get()` 取得視窗目前的屬性與顏色對，在掃描螢幕區域時有用——想對螢幕做複雜更新但不確定每個字元帶什麼屬性時，先用它查、再用 `attrset()`/`attron()` 套出想要的效果。另有 `attr_set()`、`attr_on()` 等一系列接受 `attr_t` 型別的函式，以及對應的 `w` 版本（作用在特定視窗）。

### 7.4 chgat() 函式

`chgat()` 可以**不移動游標**地改變一串字元的屬性，從目前游標位置開始算。字元數給 `-1` 表示更新到行尾：

```c
chgat(-1, A_REVERSE, 0, NULL);
```

範例：先把字串印出來，再把第一行整行改成閃爍加青色。

```c
// N0702.c
#include <ncurses.h>

int main(int argc, char *argv[])
{
	initscr();			/* Start curses mode		*/
	start_color();			/* Start color functionality	*/

	init_pair(1, COLOR_CYAN, COLOR_BLACK);
	printw("A Big string which I didn't care to type fully ");
	mvchgat(0, 0, -1, A_BLINK, 1, NULL);
	/*
	 * First two parameters specify the position at which to start
	 * Third parameter number of characters to update. -1 means till
	 * end of line
	 * Fourth parameter is the normal attribute you wanted to give
	 * to the character
	 * Fifth is the color index. It is the index given during init_pair()
	 * use 0 if you didn't want color
	 * Sixth one is always NULL
	 */
	refresh();
	getch();
	endwin();			/* End curses mode		  */
	return 0;
}
```

## 8. 視窗

Window 是 curses 中最重要的概念。目前為止所有函式都隱式作用在 `stdscr` 上；想把螢幕切塊、做出真正的介面設計，就需要自己建視窗。使用視窗的兩大理由：

1. **效率**：`wrefresh()` 只更新某個視窗需要的部分，不必整個螢幕重繪。
2. **設計**：每個區塊（選單、狀態列、內容區）獨立管理自己的座標與內容。

### 8.1 視窗基礎

`newwin()` 建立視窗。它**不會**在螢幕上畫任何東西，只是配置一個 `WINDOW` 結構並填入大小、起始座標等資料，回傳指標可傳給 `wprintw()` 這類函式。用完以 `delwin()` 銷毀、釋放記憶體。

要讓視窗「看起來存在」，用 `box()` 在周圍畫邊框。

### 8.2 會動的視窗

完整範例：一個可以用方向鍵四處移動的視窗，按 F1 離開。

```c
// N0801.c
#include <ncurses.h>

WINDOW *create_newwin(int height, int width, int starty, int startx);
void destroy_win(WINDOW *local_win);

int main(int argc, char *argv[])
{	WINDOW *my_win;
	int startx, starty, width, height;
	int ch;

	initscr();			/* Start curses mode		*/
	cbreak();			/* Line buffering disabled, Pass on
					 * every thing to me		*/
	keypad(stdscr, TRUE);		/* I need that nifty F1		*/

	height = 3;
	width = 10;
	starty = (LINES - height) / 2;	/* Calculating for a center placement */
	startx = (COLS - width) / 2;	/* of the window			*/
	printw("Press F1 to exit");
	refresh();
	my_win = create_newwin(height, width, starty, startx);

	while((ch = getch()) != KEY_F(1))
	{	switch(ch)
		{	case KEY_LEFT:
				destroy_win(my_win);
				my_win = create_newwin(height, width, starty, --startx);
				break;
			case KEY_RIGHT:
				destroy_win(my_win);
				my_win = create_newwin(height, width, starty, ++startx);
				break;
			case KEY_UP:
				destroy_win(my_win);
				my_win = create_newwin(height, width, --starty, startx);
				break;
			case KEY_DOWN:
				destroy_win(my_win);
				my_win = create_newwin(height, width, ++starty, startx);
				break;
		}
	}

	endwin();			/* End curses mode		  */
	return 0;
}

WINDOW *create_newwin(int height, int width, int starty, int startx)
{	WINDOW *local_win;

	local_win = newwin(height, width, starty, startx);
	box(local_win, 0, 0);		/* 0, 0 gives default characters
					 * for the vertical and horizontal
					 * lines				*/
	wrefresh(local_win);		/* Show that box			*/

	return local_win;
}

void destroy_win(WINDOW *local_win)
{
	/* box(local_win, ' ', ' '); : This won't produce the desired
	 * result of erasing the window. It will leave its four corners
	 * and so an ugly remnant of window.
	 */
	wborder(local_win, ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ');
	/* The parameters taken are
	 * 1. win: the window on which to operate
	 * 2. ls: character to be used for the left side of the window
	 * 3. rs: character to be used for the right side of the window
	 * 4. ts: character to be used for the top side of the window
	 * 5. bs: character to be used for the bottom side of the window
	 * 6. tl: character to be used for the top left corner of the window
	 * 7. tr: character to be used for the top right corner of the window
	 * 8. bl: character to be used for the bottom left corner of the window
	 * 9. br: character to be used for the bottom right corner of the window
	 */
	wrefresh(local_win);
	delwin(local_win);
}
```

### 8.3 解釋

程式建立一個矩形視窗，可用方向鍵移動——每次按鍵就銷毀舊視窗、在新座標重建。`create_newwin()` 用 `newwin()` 建視窗並畫框；`destroy_win()` 先用空白字元畫邊框把視窗從螢幕上「擦掉」，再 `delwin()` 釋放記憶體。

`destroy_win()` 裡刻意用 `wborder()` 而不是 `box()`，原因寫在註解裡：`box(win, ' ', ' ')` 只會擦掉四條邊，四個角落會留下醜陋的殘跡。`wborder()` 把 4 個角、4 條線的字元全交給你指定，例如：

```c
wborder(win, '|', '|', '-', '-', '+', '+', '+', '+');
```

會產生：

```text
+------------+
|            |
|            |
|            |
|            |
|            |
|            |
+------------+
```

另外注意 `LINES`、`COLS` 這兩個全域變數在 `initscr()` 之後會被設成螢幕尺寸，可以用來計算置中座標。

### 8.4 更高效的畫框：mvhline() 與 mvvline()

上面的做法每次按鍵都銷毀重建視窗，非常低效。更省事的做法是用 `mvhline()` / `mvvline()` 在指定位置畫指定長度的水平線、垂直線，自己組出一個「框」，移動時只需擦掉舊框、改座標、畫新框：

```c
// N0802.c
#include <ncurses.h>

typedef struct _win_border_struct {
	chtype	ls, rs, ts, bs,
		tl, tr, bl, br;
} WIN_BORDER;

typedef struct _WIN_struct {
	int startx, starty;
	int height, width;
	WIN_BORDER border;
} WIN;

void init_win_params(WIN *p_win);
void print_win_params(WIN *p_win);
void create_box(WIN *win, bool flag);

int main(int argc, char *argv[])
{	WIN win;
	int ch;

	initscr();			/* Start curses mode		*/
	start_color();			/* Start the color functionality */
	cbreak();			/* Line buffering disabled, Pass on
					 * every thing to me		*/
	keypad(stdscr, TRUE);		/* I need that nifty F1		*/
	noecho();
	init_pair(1, COLOR_CYAN, COLOR_BLACK);

	/* Initialize the window parameters */
	init_win_params(&win);
	print_win_params(&win);

	attron(COLOR_PAIR(1));
	printw("Press F1 to exit");
	refresh();
	attroff(COLOR_PAIR(1));

	create_box(&win, TRUE);
	while((ch = getch()) != KEY_F(1))
	{	switch(ch)
		{	case KEY_LEFT:
				create_box(&win, FALSE);
				--win.startx;
				create_box(&win, TRUE);
				break;
			case KEY_RIGHT:
				create_box(&win, FALSE);
				++win.startx;
				create_box(&win, TRUE);
				break;
			case KEY_UP:
				create_box(&win, FALSE);
				--win.starty;
				create_box(&win, TRUE);
				break;
			case KEY_DOWN:
				create_box(&win, FALSE);
				++win.starty;
				create_box(&win, TRUE);
				break;
		}
	}
	endwin();			/* End curses mode		  */
	return 0;
}

void init_win_params(WIN *p_win)
{
	p_win->height = 3;
	p_win->width = 10;
	p_win->starty = (LINES - p_win->height) / 2;
	p_win->startx = (COLS - p_win->width) / 2;

	p_win->border.ls = '|';
	p_win->border.rs = '|';
	p_win->border.ts = '-';
	p_win->border.bs = '-';
	p_win->border.tl = '+';
	p_win->border.tr = '+';
	p_win->border.bl = '+';
	p_win->border.br = '+';
}

void print_win_params(WIN *p_win)
{
#ifdef _DEBUG
	mvprintw(25, 0, "%d %d %d %d", p_win->startx, p_win->starty,
				p_win->width, p_win->height);
	refresh();
#endif
}

void create_box(WIN *p_win, bool flag)
{	int i, j;
	int x, y, w, h;

	x = p_win->startx;
	y = p_win->starty;
	w = p_win->width;
	h = p_win->height;

	if(flag == TRUE)
	{	mvaddch(y, x, p_win->border.tl);
		mvaddch(y, x + w, p_win->border.tr);
		mvaddch(y + h, x, p_win->border.bl);
		mvaddch(y + h, x + w, p_win->border.br);
		mvhline(y, x + 1, p_win->border.ts, w - 1);
		mvhline(y + h, x + 1, p_win->border.bs, w - 1);
		mvvline(y + 1, x, p_win->border.ls, h - 1);
		mvvline(y + 1, x + w, p_win->border.rs, h - 1);
	}
	else
		for(j = y; j <= y + h; ++j)
			for(i = x; i <= x + w; ++i)
				mvaddch(j, i, ' ');

	refresh();
}
```

## 9. 顏色

顏色的使用流程固定是：`start_color()` 開啟色彩功能 → `init_pair(n, 前景, 背景)` 定義顏色對 → 把 `COLOR_PAIR(n)` 當屬性用。開始之前可以先用 `has_colors()` 確認終端機支援色彩，不支援就回傳 `FALSE`。

```c
// N09.c
#include <ncurses.h>

void print_in_middle(WINDOW *win, int starty, int startx, int width, char *string);
int main(int argc, char *argv[])
{	initscr();			/* Start curses mode		*/
	if(has_colors() == FALSE)
	{	endwin();
		printf("Your terminal does not support color\n");
		exit(1);
	}
	start_color();			/* Start color			*/
	init_pair(1, COLOR_RED, COLOR_BLACK);

	attron(COLOR_PAIR(1));
	print_in_middle(stdscr, LINES / 2, 0, 0, "Viola !!! In color ...");
	attroff(COLOR_PAIR(1));
	getch();
	endwin();
}

void print_in_middle(WINDOW *win, int starty, int startx, int width, char *string)
{	int length, x, y;
	float temp;

	if(win == NULL)
		win = stdscr;
	getyx(win, y, x);
	if(startx != 0)
		x = startx;
	if(starty != 0)
		y = starty;
	if(width == 0)
		width = 80;

	length = strlen(string);
	temp = (width - length) / 2;
	x = startx + (int)temp;
	mvwprintw(win, y, x, "%s", string);
	refresh();
}
```

`start_color()` 被呼叫後，curses 會初始化終端機支援的所有顏色，用 `COLOR_*` 常數存取。**顏色總是成對使用**（前景＋背景），你必須用 `init_pair()` 為某個編號定義配對，之後該編號就能當普通屬性透過 `COLOR_PAIR()` 使用。

起初這設計似乎很麻煩，但它其實很優雅：看看 [dialog](https://invisible-island.net/ncurses/)（從 shell 腳本顯示對話框的公用程式）的原始碼——開發者把所有需要的前景/背景組合在開頭一次定義好，之後設定屬性只是引用一個常數，管理起來非常輕鬆。

`curses.h` 中定義的八種顏色：

```text
COLOR_BLACK    0
COLOR_RED      1
COLOR_GREEN    2
COLOR_YELLOW   3
COLOR_BLUE     4
COLOR_MAGENTA  5
COLOR_CYAN     6
COLOR_WHITE    7
```

### 9.1 重新定義顏色

`init_color()` 可以改變原本定義的顏色的 RGB 值。假設想讓紅色淡一點：

```c
init_color(COLOR_RED, 700, 0, 0);
/* param 1       : color name
 * param 2, 3, 4 : rgb content, min = 0, max = 1000 */
```

## 10. 與鍵盤互動

如前面範例所見，取按鍵很容易：`getch()` 回傳一個對應按下按鍵的整數。若是普通字元，整數值就是該字元的編碼；否則回傳一個可以用 `curses.h` 中定義的常數比對的 keycode。例如使用者按 F1，回傳整數 265，可以用 `KEY_F(1)` 這個 macro 檢查：

```c
int ch;
ch = getch();  /* 等待使用者按鍵（除非設定了逾時） */

if(ch == KEY_LEFT)
    printw("Left arrow is pressed\n");
```

用常數比對而不是直接寫數字，讓讀鍵這件事可攜且好管理。

接著寫一個可以用上下鍵導航的選單：

```c
// N10.c
#include <stdio.h>
#include <ncurses.h>

#define WIDTH 30
#define HEIGHT 10

int startx = 0;
int starty = 0;

char *choices[] = {
			"Choice 1",
			"Choice 2",
			"Choice 3",
			"Choice 4",
			"Exit",
		  };
int n_choices = sizeof(choices) / sizeof(char *);
void print_menu(WINDOW *menu_win, int highlight);

int main()
{	WINDOW *menu_win;
	int highlight = 1;
	int choice = 0;
	int c;

	initscr();
	clear();
	noecho();
	cbreak();	/* Line buffering disabled. pass on everything */
	startx = (80 - WIDTH) / 2;
	starty = (24 - HEIGHT) / 2;

	menu_win = newwin(HEIGHT, WIDTH, starty, startx);
	keypad(menu_win, TRUE);
	mvprintw(0, 0, "Use arrow keys to go up and down, Press enter to select a choice");
	refresh();
	print_menu(menu_win, highlight);
	while(1)
	{	c = wgetch(menu_win);
		switch(c)
		{	case KEY_UP:
				if(highlight == 1)
					highlight = n_choices;
				else
					--highlight;
				break;
			case KEY_DOWN:
				if(highlight == n_choices)
					highlight = 1;
				else
					++highlight;
				break;
			case 10:
				choice = highlight;
				break;
			default:
				mvprintw(24, 0, "Character pressed is = %3d Hopefully it can be printed as '%c'", c, c);
				refresh();
				break;
		}
		print_menu(menu_win, highlight);
		if(choice != 0)	/* User did a choice come out of the infinite loop */
			break;
	}
	mvprintw(23, 0, "You chose choice %d with choice string %s\n", choice, choices[choice - 1]);
	clrtoeol();
	refresh();
	endwin();
	return 0;
}


void print_menu(WINDOW *menu_win, int highlight)
{
	int x, y, i;

	x = 2;
	y = 2;
	box(menu_win, 0, 0);
	for(i = 0; i < n_choices; ++i)
	{	if(highlight == i + 1) /* High light the present choice */
		{	wattron(menu_win, A_REVERSE);
			mvwprintw(menu_win, y, x, "%s", choices[i]);
			wattroff(menu_win, A_REVERSE);
		}
		else
			mvwprintw(menu_win, y, x, "%s", choices[i]);
		++y;
	}
	wrefresh(menu_win);
}
```

兩個值得注意的細節：`keypad()` 這次開在 `menu_win` 而不是 `stdscr`——`getch()` 要從哪個視窗讀，keypad 就要開在哪個視窗；選單高亮只是簡單地在印選項前後包 `wattron(A_REVERSE)` / `wattroff(A_REVERSE)`，反白即選取。

## 11. 與滑鼠互動

### 11.1 基本設定

要接收滑鼠事件，先用 `mousemask()` 啟用：

```c
mousemask(mmask_t newmask,   /* The events you want to listen to */
          mmask_t *oldmask)  /* The old events mask              */
```

第一個參數是事件位元遮罩，預設全部關閉；`ALL_MOUSE_EVENTS` 可以一次打開全部。常見的事件遮罩：

| 名稱 | 描述 |
| --- | --- |
| `BUTTON1_PRESSED` / `BUTTON1_RELEASED` | 滑鼠按鈕 1 按下／放開 |
| `BUTTON1_CLICKED` | 滑鼠按鈕 1 單擊 |
| `BUTTON1_DOUBLE_CLICKED` / `BUTTON1_TRIPLE_CLICKED` | 滑鼠按鈕 1 雙擊／三擊 |
| `BUTTON2_*` | 滑鼠按鈕 2 的對應事件（中鍵） |
| `BUTTON3_*` | 滑鼠按鈕 3 的對應事件（右鍵） |
| `BUTTON4_*` / `BUTTON5_*` | 滾輪上／下捲動 |
| `BUTTON_SHIFT` / `BUTTON_CTRL` / `BUTTON_ALT` | 按鈕狀態變化期間按著 Shift／Ctrl／Alt |
| `ALL_MOUSE_EVENTS` | 回報所有按鈕狀態變化 |
| `REPORT_MOUSE_POSITION` | 回報滑鼠移動 |

### 11.2 取得事件

啟用後，每次發生滑鼠事件，`getch()` 類函式就會回傳 `KEY_MOUSE`；接著用 `getmouse()` 把事件取出來：

```c
MEVENT event;
if(getch() == KEY_MOUSE && getmouse(&event) == OK) {
    /* event.x, event.y 是滑鼠在螢幕上的座標
       event.bstate 是按鈕狀態位元遮罩 */
}
```

`getmouse()` 透過指標填回一個 `MEVENT` 結構。最關心的變數是 `bstate`（按鈕狀態）與 `x`、`y`（位置），用位元 AND 檢查發生了什麼：

```c
if(event.bstate & BUTTON1_PRESSED)
    /* 左鍵按下 */
```

### 11.3 把它們放在一起

為第十章的選單加上滑鼠支援：點到哪個選項就選哪個，點 Exit 離開。

```c
// N11.c
#include <ncurses.h>

#define WIDTH 30
#define HEIGHT 10

int startx = 0;
int starty = 0;

char *choices[] = {	"Choice 1",
			"Choice 2",
			"Choice 3",
			"Choice 4",
			"Exit",
		  };

int n_choices = sizeof(choices) / sizeof(char *);

void print_menu(WINDOW *menu_win, int highlight);
void report_choice(int mouse_x, int mouse_y, int *p_choice);

int main()
{	int c, choice = 0;
	WINDOW *menu_win;
	MEVENT event;

	/* Initialize curses */
	initscr();
	clear();
	noecho();
	cbreak();	//Line buffering disabled. pass on everything

	/* Try to put the window in the middle of screen */
	startx = (80 - WIDTH) / 2;
	starty = (24 - HEIGHT) / 2;

	attron(A_REVERSE);
	mvprintw(23, 1, "Click on Exit to quit (Works best in a virtual console)");
	refresh();
	attroff(A_REVERSE);

	/* Print the menu for the first time */
	menu_win = newwin(HEIGHT, WIDTH, starty, startx);
	print_menu(menu_win, 1);
	/* Get all the mouse events */
	mousemask(ALL_MOUSE_EVENTS, NULL);

	while(1)
	{	c = wgetch(menu_win);
		switch(c)
		{	case KEY_MOUSE:
			if(getmouse(&event) == OK)
			{	/* When the user clicks left mouse button */
				if(event.bstate & BUTTON1_PRESSED)
				{	report_choice(event.x + 1, event.y + 1, &choice);
					if(choice == -1) //Exit chosen
						goto end;
					mvprintw(22, 1, "Choice made is : %d String Chosen is \"%10s\"", choice, choices[choice - 1]);
					refresh();
				}
			}
			print_menu(menu_win, choice);
			break;
		}
	}
end:
	endwin();
	return 0;
}


void print_menu(WINDOW *menu_win, int highlight)
{
	int x, y, i;

	x = 2;
	y = 2;
	box(menu_win, 0, 0);
	for(i = 0; i < n_choices; ++i)
	{	if(highlight == i + 1)
		{	wattron(menu_win, A_REVERSE);
			mvwprintw(menu_win, y, x, "%s", choices[i]);
			wattroff(menu_win, A_REVERSE);
		}
		else
			mvwprintw(menu_win, y, x, "%s", choices[i]);
		++y;
	}
	wrefresh(menu_win);
}

/* Report the choice according to mouse position */
void report_choice(int mouse_x, int mouse_y, int *p_choice)
{	int i, j, choice;

	i = startx + 2;
	j = starty + 3;

	for(choice = 0; choice < n_choices; ++choice)
		if(mouse_y == j + choice && mouse_x >= i && mouse_x <= i + strlen(choices[choice]))
		{	if(choice == n_choices - 1)
				*p_choice = -1;
			else
				*p_choice = choice + 1;
			break;
		}
}
```

`report_choice()` 做的事就是把滑鼠座標換算回「第幾個選項」：每個選項印在固定列上，滑鼠的 y 對上哪列、x 是否落在該選項字串的範圍內，就是它了。這種「點擊座標 → 介面元素」的換算正是所有 TUI 滑鼠支援的核心。

注意程式開頭那句 "Works best in a virtual console"：滑鼠事件的細節（尤其是滾輪、拖曳）依終端機類型差異很大，xterm 系與 Linux console 的回報方式不同，實測時別只在一種終端機上測。

## 後記

這份筆記把 ncurses 的主要 API 走完一輪：生命週期（`initscr`/`endwin`）、初始化開關（`raw`/`cbreak`/`noecho`/`keypad`）、三類輸出入函式、屬性、視窗、顏色，最後用鍵盤和滑鼠把它們串成一個能動的選單。掌握「虛擬螢幕 + refresh 差量更新」與「mv/w 前綴命名」這兩個核心觀念，剩下都是查 man page 的事。

寫完這輪之後，最直接的練習是做一個小專案：例如在終端機上畫個貪吃蛇或檔案瀏覽器，把 `halfdelay()` 的遊戲迴圈、視窗切塊和顏色對一次用上。更進階的主題——pads、`curs_set()` 隱藏游標、`getnstr()` 的安全輸入、與 `menu`/`form`/`panel` 三個附屬程式庫——就留給下一次了。

## References

- [NCURSES Programming HOWTO](https://tldp.org/HOWTO/NCURSES-Programming-HOWTO/index.html)，Pradeep Padala——本文結構的主要藍本
- [ncurses 官方網站](https://invisible-island.net/ncurses/)（Thomas Dickey 維護）
- [Announcing ncurses 6.4](https://www.invisible-island.net/ncurses/announce-6.4.html)（2022-12-31）
- [ncurses(3x) man page](https://man7.org/linux/man-pages/man3/ncurses.3x.html)
- [原始 HackMD 筆記](https://hackmd.io/@jbIsegHRTTGhbTgKeAsUxA/B1IO0cyO3)
