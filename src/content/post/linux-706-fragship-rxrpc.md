---
title: "Linux 7.0.6 只有一個 patch：堵住 Dirty Frag 裡 rxrpc 的 paged frags"
description: "Linux 7.0.6 整個 release 只帶一個 rxrpc patch，用來收完 Dirty Frag（CVE-2026-43284 + CVE-2026-43500）的緩解。本文從 2019 年的 skb_unshare() commit 講起，拆解 paged frags 如何讓原地解密寫到攻擊者只有讀權限的 page cache 頁，並整理受影響版本與模組黑名單等緩解建議。"
pubDate: 2026-05-12T18:03:29+08:00
category: linux
tags: ["linux", "kernel", "security", "rxrpc", "cve"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1778580209
---

> 本文擴寫自 2026-05-12 的臉書貼文（原稿性質：短新聞轉貼），於 2026-11 查證補完。原稿把漏洞稱為「fragship」，查遍 oss-security 與各家通告後確認正式名稱是 Dirty Frag（別名 Copy Fail 2），正文依查證結果修正。

Linux 7.0.6 是個小得奇怪的 stable release：整個 release 只有一個 patch——「rxrpc: Also unshare DATA/RESPONSE packets when paged frags are present」。[Phoronix 的標題講得直白](https://www.phoronix.com/news/Linux-7.0.6-Released)：7.0.6 出來就是為了把 Dirty Frag 的緩解收尾；同一天出的 6.18.29 LTS 也只有同一個 patch。今年四月寫 [Linux 7.0 的 Btrfs 變更](/blog/btrfs-linux7-large-block-dio/)時還覺得這是個平順的大版本，沒想到半年後要用一個只有一行邏輯判斷的 patch 收場。

先交代背景。Dirty Frag 是 Hyunwoo Kim（@v4bel）繼四月 Copy Fail（CVE-2026-31431）之後的下一顆，5 月 7 日因 embargo 提前破功而在 [oss-security 公開](https://www.openwall.com/lists/oss-security/2026/05/07/8)，當時還沒有 patch、也沒有 CVE 編號。它是鏈式漏洞：CVE-2026-43284（xfrm-ESP/IPsec）加 CVE-2026-43500（rxrpc）兩個 page-cache write 原語（技術細節見[攻擊者的 write-up](https://github.com/V4bel/dirtyfrag/blob/master/assets/write-up.md) 與 [Wiz 的分析](https://www.wiz.io/blog/dirty-frag-linux-kernel-local-privilege-escalation-via-esp-and-rxrpc)），Red Hat 把第三個變體 Fragnesia（CVE-2026-46300，ESP-in-TCP）也列進[同一份通告](https://access.redhat.com/security/vulnerabilities/RHSB-2026-003)。三者的共性是同一種 bug class：zero-copy 送出路（`splice_to_socket()` 會自動設 `MSG_SPLICE_PAGES`）把攻擊者只有讀權限的 page cache 頁原樣 pin 進 skb 的 frag，下游做原地解密的程式碼假設那塊記憶體是 kernel 私有，直接往上寫。Dirty Pipe 的遠親，而且同樣不吃 race、確定性觸發。

7.0.6 堵的是 rxrpc 這一半，源碼層面的故事比「一行修復」長得多。2019 年 8 月，David Howells 在 [commit d0d5c0cd1e71](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d0d5c0cd1e711c98703f3544c1e6fc1372898de5) 裡把 rxkad 的驗證路徑從 `skb_cow_data()` 改成 `skb_unshare()`，為的是修軟中斷處理器還握著引用時觸發的 refcount BUG；之後這個 gate 演化成只在 `skb_cloned()` 為真時才把封包複製成線性結構。漏洞就藏在這個縮減裡：skb 可以「不 cloned、但仍帶著外部擁有的 paged frags」——splice() 進 UDP socket 時 `__ip_append_data` 會設 `SKBFL_SHARED_FRAG`，frag 頁就是被 pin 住的 page cache 頁。這種 skb 直接落到原地解密路徑：frag 頁被 `skb_to_sgvec()` 綁進 AEAD/skcipher 的 scatterlist，`rxkad_verify_packet_1` 再用 `pcbc(fcrypt)` 對它做單塊原地解密。解密是寫入操作，寫到的卻是攻擊者只有讀權限的頁。公開 PoC 選的目標是 `/etc/passwd` 第一行：幾次 8-byte store 把 root 的密碼欄位清空，配合 PAM nullok，`su -` 直接拿到 root。整條路用到的 `add_key("rxrpc",…)`、`socket(AF_RXRPC)`、`splice()`、`recvmsg()` 全是無特權 API、不需要 user namespace，[Qualys 特別點出](https://blog.qualys.com/product-tech/vulnmgmt-detection-response/2026/05/09/dirty-frag-using-the-page-caches-as-an-attack-surface)這條 rxrpc 後備路在 ESP 被擋、攻擊路徑通常需要 `CAP_NET_ADMIN` 的系統上照樣通。

先把一件事講清楚：這條路觸發的前提其實相當日常。rxrpc 在 Linux 上就是 [AFS](https://access.redhat.com/security/vulnerabilities/RHSB-2026-003)（Andrew File System）的傳輸層，模組常駐在各發行版的預設核心裡；攻擊者要做的只是在自己有讀權限的檔案上 splice 出一份、再讓 kernel 收到自己的加密封包，其餘的全交給核心「自願」寫壞。這也是這類漏洞最麻煩的地方——它不需要任何邊界失守，只需要一個「kernel 以為只有自己在寫」的假設。

修法本身很克制：[commit aa54b1d27fe0](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=aa54b1d27fe0c2b78e664a34fd0fdf7cd1960d71) 只是把 gate 從 `skb_cloned()` 擴成再加上 `skb_has_frag_list()` 或 `skb_has_shared_frag()` 就走 `skb_copy()` 隔離，Fixes 標籤正是指回 2019 年的 d0d5c0cd1e71（Wiz 估 rxrpc 暴露面自 2023 前後，但以 Fixes 對應的 commit 日期為準，我採 2019 說，Phoronix 亦同），同時保住 NIC page_pool/GRO 這類 kernel 私有 frag 的 zero-copy 快路。郵件列表上還有個插曲：審閱者指出 `SKB_GSO_FRAGLIST` 的 skb 會讓 `skb_copy()` 回 NULL、封包被當 OOM 丟棄，最後在 [v3 調整](https://kernelthread.org/t/af2kdW2F1gJ9U-Gg@v4bel)——gate 放寬的連鎖效應，正是這種網路 patch 難審的原因。至於另一半，ESP 側的修復 [f4c50a4034e6](https://git.kernel.org/pub/scm/linux/kernel/git/netdev/net.git/commit/?id=f4c50a4034e62ab75f1d5cdd191dd5f9c77fdff4) 給 splice 進來的 frag 補上 `SKBFL_SHARED_FRAG` 並在 `esp_input` 檢查，早已先行合併；ESP 的暴露面更長，約自 2017 年起。

受影響範圍因此很廣（Ubuntu、RHEL 8/9/10、AlmaLinux、Fedora、openSUSE 都在受測名單），distro 已陸續出正式修復。實務建議沒什麼懸念：能升就升 7.0.6 或 6.18.29 LTS；暫時升不了的，oss-security 的 workaround 是用 modprobe.d 直接禁 esp4、esp6、rxrpc 三個模組——rxrpc 的主要用戶是 AFS，多數桌面系統本來就沒在用，禁掉無感。另外提醒一句：之前針對 Copy Fail 做的 algif_aead 黑名單擋不住這次，攻擊者自己說了 Dirty Frag 不依賴 algif_aead。

順帶一個命名的小觀察。從 Dirty Pipe、Copy Fail 到 Dirty Frag，這類「page cache 變成攻擊面」的漏洞已經自成譜系，名字越取越像系列作；v4bel 在 repo 裡還自嘲了一句「又要來一個 Dirty 系列嗎」，理由是這次弄髒的是 `struct sk_buff` 的 frag 成員。命名見仁見智，但 bug class 本身是真的在演化：Dirty Pipe 利用 pipe buffer 的 flag 殘留，Copy Fail 打 algif_aead 的 TX scatterlist，Dirty Frag 則把同樣的邏輯搬到更廣的網路收包路徑上。zero-copy 帶來的效能是整個網路堆疊這十年的主旋律，而它每一處「這塊記憶體現在歸我」的假設，都是下一顆漏洞的候選位置。Phoronix 報導裡那句「finish mitigating」讀起來平淡，背後其實是這種假設被全面盤點的過程。

一個用了七年的複製判斷、一個為省一次拷貝的「優化」，換來所有主要發行版的全員 root——這大概就是 zero-copy 時代的代價。
