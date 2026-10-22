---
title: "使用 cargo-zigbuild 交叉編譯 zed-remote-server：從 Linux 把二進位檔丟到 FreeBSD"
description: "用 cargo-zigbuild（zig cc）從 Arch Linux 交叉編譯 Zed 的 zed-remote-server 到 FreeBSD 15.0：sysroot 準備、libz-sys 非 PIC、-L 被忽略與 uname 覆蓋的完整踩雷記錄。"
pubDate: 2026-04-30T12:38:25+08:00
category: programming
tags: ["編譯", "linux", "freebsd", "rust", "zig", "遠端開發"]
draft: false
source: "facebook"
sourceType: "相片"
sourceTimestamp: 1777523905
media:
  - 122159584838958395.jpg
---

> 本文擴寫自 2026-04-30 的隨筆。

我手上有一台 FreeBSD 15.0 的無頭伺服器，想在上面享受 [Zed](https://zed.dev) 的遠端開發體驗——Zed 的 remote development 是透過 SSH 把 `zed-remote-server` 丟到遠端跑，用起來接近原生。問題是官方只幫 Linux 和 macOS 準備 prebuilt binary；在 FreeBSD 上直接 `cargo build -p remote_server` 又會因為一堆沒寫 `target_os = "freebsd"` 的 cfg gate 直接編不下去。

最後我選了 `cargo-zigbuild`，從 Arch Linux 主機直接交叉編譯出 FreeBSD 的執行檔。完整 workaround 記錄在[這份 gist](https://gist.github.com/G36maid/c2aff8c1561b307f38f9e1b3aff215e1)，這篇整理成能讀的版本。

## cargo-zigbuild 是什麼、為什麼選它

[cargo-zigbuild](https://github.com/rust-cross/cargo-zigbuild)（MIT 授權，作者 messense）是個把 [`zig cc`](https://andrewkelley.me/post/zig-cc-powerful-drop-in-replacement-gcc-clang.html) 當 linker 的 Cargo 子命令。原理很漂亮：zig 把各平台的 libc 標頭和 CRT 直接打包進編譯器，所以「裝好 zig 就等於裝好全套交叉 toolchain」，不用自己去湊 glibc 版本，還能用 `--target aarch64-unknown-linux-gnu.2.17` 這種語法指定最低 glibc 版本。

代價是它的官方支援範圍：README 明說[目前只支援 Linux 和 macOS target](https://github.com/rust-cross/cargo-zigbuild#Caveats)，其他平台「能讓它 work 就歡迎 PR」。FreeBSD 在 zig 那邊其實是 [Tier 2 target](https://ziglang.org/learn/platform-support)（x86_64/aarch64 都有 libc），所以這條路走得通，只是沒人幫你鋪。我用的版本是 cargo-zigbuild 0.22.3（自帶 Zig 0.15.2）、Zed 原始碼 tag `v1.0.0`。

## 1. 裝 toolchain 與 FreeBSD sysroot

```bash
rustup target add x86_64-unknown-freebsd
cargo install --locked cargo-zigbuild
```

zig 自帶的是 FreeBSD 的 libc，但 `libkvm`、`libprocstat`、`libz` 這類系統專屬函式庫不在裡面，所以要從官方 release server 抽一份 sysroot：

```bash
mkdir -p ~/freebsd-sysroot
curl -L -o /tmp/base.txz \
  https://download.freebsd.org/releases/amd64/amd64/15.0-RELEASE/base.txz
tar -xJf /tmp/base.txz -C ~/freebsd-sysroot lib/ usr/
```

## 2. Patch Zed 原始碼

六個檔案、三類修改：`crash-handler`/`minidumper` 不支援 FreeBSD，用 `cfg(not(target_os = "freebsd"))` gate 掉換成 no-op stub；gpui 的 queue module 和 fs crate 的 `kinfo_file`（FreeBSD 的 struct 有 padding，`MaybeUninit::uninit()` 會踩 UB，改成 `zeroed()` + `assume_init_mut()`）補上 FreeBSD；最後是 patch `libz-sys`——它交叉編譯時強制 vendor zlib 從源碼編，產出的 `.o` 帶非 PIC relocation（`R_X86_64_32`），PIE 連結直接炸。有意思的是這不是 zig 的鍋：`zig cc` 本身 `-fPIC` 處理得很正確，是 `libz-sys` 的 build.rs 沒把 flag 傳下去。解法是讓它改連 sysroot 裡現成的 `libz.so`。

## 3. 編譯與部署

```bash
ZLIB_LIB_DIR="$HOME/freebsd-sysroot/usr/lib" \
CFLAGS_x86_64_unknown_freebsd="-fPIC -I$HOME/freebsd-sysroot/usr/include" \
RUSTFLAGS="-L $HOME/freebsd-sysroot/lib \
           -L $HOME/freebsd-sysroot/usr/lib \
           -C link-args=$HOME/freebsd-sysroot/usr/lib/libkvm.so \
           -C link-args=$HOME/freebsd-sysroot/usr/lib/libprocstat.so" \
cargo zigbuild -p remote_server --release --target x86_64-unknown-freebsd
```

那兩個 `-C link-args` 是硬塞完整 `.so` 路徑，因為 `cargo-zigbuild zig cc` 會忽略 `-L` 路徑（裸的 `zig cc` 反而沒問題），`libkvm`/`libprocstat` 直接 undefined symbol。整趟 build 約六分鐘，`llvm-strip` 之後 520MB 縮到 80MB。丟上遠端後還有一關：Zed client 用 `uname -sm` 判斷遠端 OS，`parse_platform()` 只認 `Darwin`/`Linux`，在檢查遠端 binary 存不存在**之前**就 bail。所以要在 FreeBSD 機器上放一個假的 `uname` wrapper 回報 `Linux x86_64`，並記得寫進 `~/.zshenv`——SSH 非互動 session 不讀 `.zshrc`。

## 替代方案的 trade-off

[cross-rs](https://github.com/cross-rs/cross) 其實有 `x86_64-unknown-freebsd` 映像檔（GCC 13.3），但它走 Docker：映像檔肥大，freebsd 鏡像的建置腳本要自己編 clang 和 libc++，而且 `cross test` 對 FreeBSD[不支援](https://mintlify.wiki/cross-rs/cross/supported-targets)。手動組 toolchain 更重。zigbuild 路線輕快又不用 Docker，只是 FreeBSD 屬於「能 work 但沒人保證」。

## 踩雷注意事項

把整趟整理成清單，之後重來的人可以直接對照：

1. **libz-sys 非 PIC**：交叉編譯時它強制 vendor zlib，`.o` 帶 `R_X86_64_32` relocation，PIE 連結炸掉。不是 zig 的鍋——`zig cc` 本身 `-fPIC` 處理正確——是它的 build.rs 沒把 flag 傳下去。解法：patch 成連 sysroot 的 `libz.so`（其他用 `cc` crate 的 `-sys` crate 如 libgit2-sys、ring 反而沒事）。
2. **`-L` 被忽略**：`cargo-zigbuild zig cc` 有自己的 sysroot 處理，`-L` 塞進去 `ld.lld` 還是找不到 `libkvm`/`libprocstat`；裸 `zig cc -target x86_64-freebsd` 卻正常。直接用 `-C link-args=<完整 .so 路徑>` 繞過。
3. **`.zshenv` 不是 `.zshrc`**：SSH 非互動 session 不讀 `.zshrc`，`uname` wrapper 放錯地方就不生效。
4. **`parse_platform()` 先 bail 再檢查**：就算 binary 已經放對路徑，client 還是會先擋掉，所以覆蓋 `uname` 不可省。
5. **遠端更新會自毀**：Zed 若主動更新遠端 binary，會下載 Linux prebuilt 蓋掉你手放的版本。

## 評價

成功，但脆弱。整體而言 zig cc 的交叉編譯體驗確實好——不用 Docker、不用 QEMU、六分鐘出貨——但 FreeBSD 這條路線的痛點全在周邊生態：`libz-sys` 的 build 邏輯、cargo-zigbuild 的 sysroot 處理、Zed client 的 OS 判斷，每一層都要自己動手。版本一升（不管是 Zed、zig 還是 rustup）就要重 patch 一輪；`uname` 覆蓋是駭客行為，只適合自己管理的機器。

真正的修法其實只有約 10 行：`RemoteOs` enum 加 FreeBSD、`parse_platform()` 加一行 mapping、target triple 加上 `x86_64-unknown-freebsd`。隨筆裡提到那個 PR 解決後，預計就能整合進 Zed 的 build pipeline，屆時這份 workaround 就可以功成身退了。在那之前，這套流程至少證明了一件事：**headless 的 FreeBSD 伺服器一樣可以享受接近原生的遠端開發體驗**。

## References

- [cargo-zigbuild](https://github.com/rust-cross/cargo-zigbuild)（[crates.io](https://crates.io/crates/cargo-zigbuild)、MIT）
- [zig cc: A powerful drop-in replacement for GCC/Clang](https://andrewkelley.me/post/zig-cc-powerful-drop-in-replacement-gcc-clang.html) — Andrew Kelley
- [Zig Platform Support](https://ziglang.org/learn/platform-support)（FreeBSD 為 Tier 2）
- [FREEBSD-ZIGBUILD-REPORT.md](https://gist.github.com/G36maid/c2aff8c1561b307f38f9e1b3aff215e1) — 完整 workaround 記錄
- [Zed Discussion #25601: FreeBSD support for remote sessions](https://github.com/zed-industries/zed/discussions/25601)
- [Zed docs: Building Zed for FreeBSD](https://zed.dev/docs/development/freebsd)
- [cross-rs Supported targets](https://mintlify.wiki/cross-rs/cross/supported-targets)
