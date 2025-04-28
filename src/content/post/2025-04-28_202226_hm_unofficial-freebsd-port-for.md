---
title: "Unofficial FreeBSD port for Zed Editor"
description: "This is an unofficial FreeBSD port for Zed Editor(https://github.com/zed-industries/zed)."
pubDate: 2025-04-28 20:22:26 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1745842946
---

This is an unofficial FreeBSD port for [Zed Editor](https://github.com/zed-industries/zed).

I noticed that there has been great progress around FreeBSD support for Zed recently:

- [Zed running on FreeBSD! (#10247)](https://github.com/zed-industries/zed/discussions/10247)
- [Add initial FreeBSD support (#20480)](https://github.com/zed-industries/zed/pull/20480)
- [FreeBSD support for remote sessions (#25601)](https://github.com/zed-industries/zed/discussions/25601)

As a Arch Linux user, I'm familiar with the AUR (Arch User Repository) ecosystem.
I want to approaching this FreeBSD port effort with a similar mindset.

---

## Goals

- Build and run Zed on FreeBSD 14.2-RELEASE (amd64)
- Package it as a FreeBSD port (`editors/zed-editor` or similar)
- Track upstream changes and maintain patches as needed
- Help with upstream FreeBSD compatibility improvements if appropriate

---

## Roadmap

- [x] Study previous discussions and pull requests
- [ ] Compile Zed natively on FreeBSD
- [ ] Identify and patch platform-specific issues
- [ ] Write initial FreeBSD port Makefile and patches
- [ ] Test installation via ports system
- [ ] Share working port for community feedback

---

## step 


Clone down the Zed [repository](https://github.com/zed-industries/zed).
run `script/linux`


--- 

This will initially be an **unofficial** effort.  
However, if maintainers are interested, I'd be happy to collaborate further to make FreeBSD a supported platform in the future!

Thanks again for this amazing editor.  
I'm excited to help bring it to more users!

---

*Environment:  
FreeBSD 14.2-RELEASE  
Architecture: amd64 (x86_64)*


## issues

```
error: failed to run custom build command for webrtc-sys v0.3.7 (https://github.com/zed-industries/livekit-rust-sdks?rev=80bb8f4c9112789f7c24cc98d8423010977806a6#80bb8f4c)

Caused by:
  process didn't exit successfully: /home/g36maid/Github/freebsd-ports-zed/target/debug/build/webrtc-sys-c5a4caec932604cf/build-script-build (exit status: 101)
  --- stdout
  cargo:rerun-if-env-changed=LK_DEBUG_WEBRTC
  cargo:rerun-if-env-changed=LK_CUSTOM_WEBRTC
  cargo:CXXBRIDGE_PREFIX=webrtc-sys
  cargo:CXXBRIDGE_DIR0=/home/g36maid/Github/freebsd-ports-zed/target/debug/build/webrtc-sys-3145f2d05f3df91b/out/cxxbridge/include
  cargo:CXXBRIDGE_DIR1=/home/g36maid/Github/freebsd-ports-zed/target/debug/build/webrtc-sys-3145f2d05f3df91b/out/cxxbridge/crate

  --- stderr

  CXX include path:
    /home/g36maid/Github/freebsd-ports-zed/target/debug/build/webrtc-sys-3145f2d05f3df91b/out/cxxbridge/include
    /home/g36maid/Github/freebsd-ports-zed/target/debug/build/webrtc-sys-3145f2d05f3df91b/out/cxxbridge/crate

  thread 'main' panicked at /home/g36maid/.cargo/git/checkouts/livekit-rust-sdks-d281d0d44fd23f40/80bb8f4/webrtc-sys/build.rs:89:45:
  called Result::unwrap() on an Err value: "failed to download webrtc: 404 Not Found"
  note: run with RUST_BACKTRACE=1 environment variable to display a backtrace
warning: build failed, waiting for other jobs to finish...
```
