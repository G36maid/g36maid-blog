---
title: "Btrfs 快照：AI agent 時代的復原點"
description: "agent 大量自主寫檔與跑指令的環境需要廉價、瞬時、全檔案系統層級的 undo；Btrfs CoW 快照（含 snapper 工具鏈）正好補上這個 primitive，本文對比 git/VM snapshot/ZFS 並誠實列出 RAID5/6、加密等限制。"
pubDate: 2026-06-02T19:43:49+08:00
category: linux
tags: ["btrfs", "agent", "snapshot", "filesystem", "rollback"]
draft: false
source: "facebook"
sourceType: "貼文"
sourceTimestamp: 1780400629
---
> 本文擴寫自 2026-06-02 的 Facebook 貼文草稿，原文只有一句：「我認為 Btrfs 在 agent 時代很有價值」。以下是把那句直覺展開成論證的版本（擴寫於 2026-11）。

## 一句話背後的痛點

AI coding agent 的工作模式是：大量自主寫檔、改檔、跑 shell 指令，而且速度遠超過人類 review 的速度。這代表系統需要一種過去不太被強調的 primitive——**廉價、瞬時、涵蓋整個檔案系統層級的 undo**。不是「某個目錄裡某幾個文字檔的 undo」，而是「整台機器剛才那一步之前的樣子」。

2025 年 7 月 Replit 的 agent 在 code freeze 期間刪掉了 SaaStr 創辦人的 live production database，事後自稱「catastrophic failure on my part」[1]；2026 年 4 月 PocketOS 的 Cursor agent 更誇張，九秒內刪掉 production database 連同備份，創辦人事後拿到的最新備份是三個月前的，恢復花了兩天以上[2]。兩個案例的共同點：agent 用合法憑證、做它認為正確的事，而系統裡沒有任何一層能在事後廉價地回到「一分鐘前」。

## 先看現有工具的 checkpoint 縫隙

agent 工具自己也知道這問題，紛紛做了 checkpoint 機制，但它們全都是**應用層、選擇性追蹤**的：

- **Claude Code** 的 checkpointing 只追蹤透過自家 Write/Edit/NotebookEdit 工具做的修改，官方文件明講：Bash 指令造成的檔案變更不在追蹤範圍（除非該檔先前已被編輯工具碰過）、symlink/hardlink 路徑不還原、子代理的編輯不追蹤，官方建議其餘情況「用 git 還原」[3][4]。
- **opencode** 用 shadow git repo（獨立的內部 git object database）在每個 model step 前後拍快照，但官方文件列出一堆縫：必須在 git repo 裡、只涵蓋 session 目錄、單檔 2 MiB 上限、git-ignored 檔案不拍，而且自己承認「snapshots are a convenience, not a transaction or backup」——shell 指令動到的服務、資料庫、repo 外檔案都無法還原[5]。它的 shadow repo 機制甚至出過整個 worktree 被過期 baseline 整批覆寫的 bug[6]。

換句話說，應用層 checkpoint 追蹤的是「agent 說它做了什麼」，不是「檔案系統實際變成什麼」。追蹤範圍之外的寫入——agent 跑 `rm`、`npm install` 亂動全域目錄、改 dotfile、炸掉 build artifact——全都漏掉。要補這個洞，追蹤點必須下沉到檔案系統本身。

## Btrfs 快照正好是那個 primitive

Btrfs 快照的本體是子卷（subvolume）：「快照就是一個帶有初始內容的子卷」，建立時幾乎瞬時，因為它只是**在 metadata 裡複製一份 tree root**，不碰任何資料塊[7]。空間上初始近乎零成本，之後只隨「實際寫入」增長——CoW 讓新舊版本共享未改動的資料塊[7][8]。這組特性恰好對上 agent 時代的需求：

1. **瞬時、廉價**：可以在每個 agent turn 前無痛拍一張，不需要事先規劃「哪些檔案值得追蹤」——整個子卷都在。
2. **read-only 掛載可 diff**：唯讀快照可以直接掛起來比對 agent 到底改了什麼，不用信任 agent 的自我報告。唯讀快照同時是 `btrfs send` 的必要條件，可增量串流到外部備份[9]。
3. **可 rollback**：openSUSE 的 snapper 把這套玩法工程化了——每小時 timeline 快照、zypper/YaST 操作前後的 pre/post 快照對、`snapper undochange` 可以只還原指定檔案、`snapper rollback` 配合 GRUB 甚至能直接從快照開機再整卷回滾[10][11]。
4. **工具鏈成熟**：snapper 之外還有 btrfs-assistant 這類 GUI 把快照建立、清理、還原包起來，發行版（openSUSE、Fedora、CachyOS）多有現成設定文件[12]。

操作主體大概像這樣（具體設定值得另寫一篇）：

```bash
# agent turn 前拍唯讀快照（瞬時）
sudo btrfs subvolume snapshot -r / /snapshots/pre-turn-$(date +%s)
# 看看 agent 到底改了什麼
sudo snapper diff 42..0
# 不對勁就整卷回滾
sudo snapper rollback 42
```

## 跟其他候選方案比

- **git**：只追蹤明確 stage/commit 的文字檔；agent 跑指令產生的 binary artifact、沒進 repo 的設定檔、`node_modules`、資料庫檔案全都不在版控裡，而且 commit 本身要 agent「記得」做。git 是 version control，不是系統層 undo。
- **VM snapshot**：能整機回滾，但要暫停/凍結 I/O、佔整個磁碟映像的空間、回滾是全有或全無，太重，不適合「每個 turn 拍一張」的粒度。
- **tmpfs / overlayfs**：重開機就沒了，不持久；overlay 的 lower/upper 結構也不適合多時間點回溯。
- **ZFS**：快照語義同樣優秀甚至更成熟，技術上完全可行。但在 Linux 生態裡它是 CDDL 授權、與 GPL 不相容的 out-of-tree 模組，發行版整合永遠矮人一截[13]；Btrfs 則是 mainline 核心、根檔案系統開箱即用。單就「Linux 桌機上給 agent 裝保險」這個場景，Btrfs 的整合成本最低。

## 限制

這幾條該寫清楚：

- **快照不是備份**。官方文件明寫：快照與原卷共享資料塊，磁碟壞了、`dd` 手滑了，快照跟著一起死；它不讓你的資料更安全，真正的備份要用 `btrfs send` 送到外部儲存[7]。
- **RAID5/6 至今 unstable**。官方 status table 目前仍標 RAID56 為不建議正式使用，write hole 問題懸而未決[14]。要 redundancy 請用 RAID1/RAID10 系列——好消息是這些是 OK 狀態，而且**子卷與快照本身在 status table 上就是 OK**[14]，本文主張的功能不踩雷區。
- **加密互動不佳**：Btrfs 原生 fscrypt 支援尚在開發中，patch series 明確「encryption enabled 時停用 send」且加密不支援 RAID5/6[15]；走 LUKS 墊在下面則完全可行，只是 send/receive 的是 LUKS 上層的 Btrfs 卷，沒問題。
- **快照不遞迴**：對含子卷的子卷拍快照，內部子卷會變成空目錄[8]——目錄結構要先把要保護的東西放進同一個子卷。
- **回滾不是時光機**：rollback 之後 agent 動過的外部服務（資料庫內容、部署出去的東西）不會跟著回來，這點跟應用層 checkpoint 的侷限一樣，只是範圍大得多[10]。

## 結論

我仍然認為 Btrfs 在 agent 時代很有價值。agent 工具的應用層 checkpoint 追蹤的是 agent 申報過的修改，Btrfs 快照記錄的是檔案系統的實際狀態——不管 agent 跑了什麼指令、碰了哪些它沒申報的檔案，一分鐘前的整個系統狀態就在那裡，diff 得到、回滾得回去。它不取代 git、也不取代備份，只是把 undo 的最低成本邊界從文字檔擴大到整個檔案系統。對不知疲勞、偶爾自信過頭的自主寫檔機器來說，這層便宜保險遲早會變成標配——就像今天沒人會在沒有 git 的 repo 裡寫程式一樣。

（延伸閱讀：關於 agent 自主行為失控的另一個案例，見[我把 OpenAI agent 放進 HF 環境那篇文章](/blog/openai-agent-hf-escape/)。）

## References

1. [AI-powered coding tool wiped out a software company's database — Fortune, 2025-07](https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure/)
2. [Claude-powered AI agent's confession after deleting a firm's entire database — The Guardian, 2026-04](https://www.theguardian.com/technology/2026/apr/29/claude-ai-deletes-firm-database)
3. [Checkpointing — Claude Code Docs](https://code.claude.com/docs/en/checkpointing)（Bash 變更不追蹤、symlink 不還原等限制）
4. [Rewind file changes with checkpointing — Claude Code Agent SDK Docs](https://code.claude.com/docs/en/agent-sdk/file-checkpointing)（只追蹤 Write/Edit/NotebookEdit）
5. [Snapshots — OpenCode Docs](https://opencode.ai/v2/docs/snapshots)（shadow git、2 MiB 上限、ignored 檔案不拍、「not a transaction or backup」）
6. [opencode issue #49732：stale baseline 整批覆寫 worktree](https://github.com/anomalyco/opencode/issues/49732)
7. [Subvolumes — BTRFS documentation](https://btrfs.readthedocs.io/en/latest/Subvolumes.html)（「A snapshot is not a backup」、瞬時建立、唯讀快照與 send）
8. [Creating Btrfs Subvolumes and Snapshots — Oracle Linux Docs](https://docs.oracle.com/en/operating-systems/oracle-linux/8/btrfs/btrfs-CreatingSubvolumes.html)（快照不遞迴、空間特性）
9. [btrfs-send(8) — BTRFS documentation](https://btrfs.readthedocs.io/en/latest/btrfs-send.html)
10. [System recovery and snapshot management with Snapper — openSUSE Leap 15.6 Reference](https://doc.opensuse.org/documentation/leap/reference/html/book-reference/cha-snapper.html)
11. [snapper(8) man page — openSUSE](https://manpages.opensuse.org/Leap-16.0/snapper/snapper.8.en.html)
12. [Btrfs Assistant + Snapper Setup Guide — ParrotOS Docs](https://parrotsec.org/docs/configuration/btrfs-assistant-snapper-setup/)
13. [ZFS Installation — ArchWiki](https://wiki.archlinux.org/title/ZFS_Installation)（CDDL/GPL 不相容、out-of-tree 模組）
14. [Status — BTRFS documentation](https://btrfs.readthedocs.io/en/latest/Status.html)（RAID56 unstable；Subvolumes/snapshots OK）
15. [btrfs: add fscrypt support — LWN.net, 2025](https://lwn.net/Articles/1057566/)（「disable send if we have encryption enabled」、「disable encryption on RAID5/6」）
