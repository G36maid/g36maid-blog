---
title: "filesystem final project:"
description: "SSDI Experiments Note"
pubDate: 2025-05-27 13:55:26 +0800
tags: ["btrfs", "zfs", "linux", "bash", "kernel", "bcachefs", "final", "mount", "git", "ext4"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1748325326
category: linux
---

SSDI Experiments Note

參考文章：[Battle testing ZFS, Btrfs and mdadm+dm-integrity](https://unixdigest.com/articles/battle-testing-zfs-btrfs-and-mdadm-dm.html#btrfs-power-outage)

Bcachefs, Btrfs, EXT4, F2FS & XFS File-System Performance On Linux 6.15:
https://www.phoronix.com/review/linux-615-filesystems

Battle testing ZFS, Btrfs and mdadm+dm-integrity:
https://unixdigest.com/articles/battle-testing-zfs-btrfs-and-mdadm-dm.html#btrfs-power-outage

--- 

紀錄一下新聞(2025)：
https://www.phoronix.com/review/linux-615-filesystems 
舊聞（2019）：
https://www.phoronix.com/review/bcachefs-linux-2019
紀錄一下報告
Raid 5 應該已經被修正了
https://www.reddit.com/r/btrfs/comments/1bf35qx/will_the_write_hole_raid_5_6_bug_every_be_fixed/
相關新聞：
https://www.phoronix.com/news/Linux-6.2-Btrfs-EXT4

---- 

btrfs  簡介簡報
https://github.com/adam900710/btrfs_talk/blob/master/raid56.md
btrfs: introduce write-intent bitmaps for RAID56
https://lwn.net/Articles/900054/
btrfs: introduce RAID stripe tree
https://lwn.net/Articles/944631/
btrfs 文件系統原始碼解析，BTRFS 之 RAID
https://blog.csdn.net/qq_41104683/category_12407297.html

## btrfs important changes
### 5x
5.5 - RAID1C34

    RAID1 with 3- and 4- copies (over all devices).
    
5.18 - zoned and DUP metadata

    DUP metadata works with zoned mode.
    
    zoded is used with RST in feature


### 6x

6.2 - raid56 reliability vs performance trade off:

    fix destructive RMW for raid5 data (raid6 still needs work) - do full RMW cycle for writes and verify all checksums before overwrite, this should prevent rewriting potentially corrupted data without notice

    stripes are cached in memory which should reduce the performance impact but still can hurt some workloads

    checksums are verified after repair again

    this is the last option without introducing additional features (write intent bitmap, journal, another tree), the RMW cycle was supposed to be avoided by the original implementation exactly for performance reasons but that caused all the reliability problems


6.7 - raid-stripe-tree

    New tree for logical mapping, allows some RAID modes for zoned mode.

6.13 - raid-stripe-tree feature updates:

        make device replace and scrub work

        implement partial deletion of stripe extents

        new selftests


6.14 - raid stripe tree:

        fix various cases with extent range splitting or deleting

        implement hole punching to extent range

        reduce number of stripe tree lookups during bio submission

        more self-tests


## RST ppt

https://lpc.events/event/16/contributions/1235/attachments/1111/2132/BTRFS%20RAID-DP.pdf

## Synology

https://daltondur.st/syno_btrfs_1/

## 2025-05-25
RAID5:
新的硬碟導致測試過慢，有一些 disk_falure 
但是沒有出現過 csum_error 我認為算正常行為

RAID6
in progress


### why zfs good:

#### ZIL
ZFS Intent Log

記錄兩次完整事務語義提交之間的日誌，用來加速實現 fsync 之類的文件事務語義。

原本 CoW 的文件系統不需要日誌結構來保證文件系統結構的一致性，在 DMU 保證了對象級別事務語義的前提下，每次完整的 transaction group commit 都保證了文件系統一致性，掛載時也直接找到最後一個 transaction group 從它開始掛載即可。 不過在 ZFS 中，做一次完整的 transaction group commit 是個比較耗時的操作， 在寫入文件的數據塊之後，還需要更新整個 object set ，然後更新 meta-object set ，最後更新 uberblock ，爲了滿足事務語義這些操作沒法並行完成，所以整個 pool 提交一次需要等待好幾次磁盤寫操作返回，短則一兩秒，長則幾分鐘， 如果事務中有要刪除快照等非常耗時的操作可能還要等更久，在此期間提交的事務沒法保證一致。

對上層應用程序而言，通常使用 fsync 或者 fdatasync 之類的系統調用，確保文件內容本身的事務一致性。 如果要讓每次 fsync/fdatasync 等待整個 transaction group commit 完成，那會嚴重拖慢很多應用程序，而如果它們不等待直接返回，則在突發斷電時沒有保證一致性。 從而 ZFS 有了 ZIL ，記錄兩次 transaction group 的 commit 之間發生的 fsync ，突然斷電後下次 import zpool 時首先找到最近一次 transaction group ，在它基礎上重放 ZIL 中記錄的寫請求和 fsync 請求，從而滿足 fsync API 要求的事務語義。

顯然對 ZIL 的寫操作需要繞過 DMU 直接寫入數據塊，所以 ZIL 本身是以日誌系統的方式組織的，每次寫 ZIL 都是在已經分配的 ZIL 塊的末尾添加數據，分配新的 ZIL 塊仍然需要經過 DMU 的空間分配。

傳統日誌型文件系統中對 data 開啓日誌支持會造成每次文件系統寫入操作需要寫兩次到設備上， 一次寫入日誌，再一次覆蓋文件系統內容；在 ZIL 實現中則不需要重複寫兩次， DMU 讓 SPA 寫入數據之後 ZIL 可以直接記錄新數據塊的 block pointer ，所以使用 ZIL 不會導致傳統日誌型文件系統中雙倍寫入放大的問題。

### Bcachefs

The COW feature and the bucket allocator enables a RAID implementation which is claimed to not suffer from the write hole nor IO fragmentation.

https://zh.wikipedia.org/zh-tw/Bcachefs#cite_note-%E2%80%9Cb.PoO%E2%80%9D-9

https://bcachefs.org/bcachefs-principles-of-operation.pdf
finally add in linux 6.14

## 2025-05-22

* try raid 6 [doing]
* change kernel to linux to linux-lts [done]
* 去問認識的幫忙Review [waiting]
* Benchmark [doing]
* MATADATA to raid 1c34 [done]
* RST [searching]
* write-intent bitmaps [not found]


## 2025-05-18

> 主要發現：原報告基於 2019 年前後環境（如 `btrfs-progs 5.4`），與現行版本已有重大差異。

1. **原測試時間點過早（`btrfs-progs 5.4`）**

   * 當時不支援 `RAID1C3`, `RAID1C4`，因此無法透過 metadata 多副本方式減輕 RAID5/6 風險。
2. **新功能已加入（但當時尚未實作）**

   * `RAID1C3/1C4`：在 **5.5 版本後** 才加入。
   * `raid-stripe-tree (RST)`：在 **Kernel 6.7 起** 開始實驗性加入，未來可能解決 RAID5 parity 修復問題。
   * 從 `btrfs-progs 5.15` 起的預設變化

```txt
NOTE: several default settings have changed in version 5.15, please make sure
      this does not affect your deployments:
      - DUP for metadata (-m dup)
      - enabled no-holes (-O no-holes)
      - enabled free-space-tree (-R free-space-tree)
```

## 關於 RAID-Stripe-Tree（RST）

* **起始版本**：Linux Kernel 6.7（2024）
* **目前狀態**：`experimental`
* **作用**：重構 RAID5/6 parity metadata 結構，嘗試解決長期的資料損毀問題。
* **需啟用選項**：

  ```bash
  CONFIG_BTRFS_DEBUG=y
  CONFIG_BTRFS_EXPERIMENTAL=y
  ```
* **限制**：
  * 尚未支援所有 RAID profiles
  * Zoned block device 尚不支援
  * On-disk format 仍可能變動（截至 kernel 6.12）

---

##  補充連結

* [Btrfs RAID56 Status](https://btrfs.readthedocs.io/en/latest/Status.html#raid56)
* [Kernel Changelog](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/log/)
* [btrfs-progs Releases](https://github.com/kdave/btrfs-progs/releases)



## 2025-05-14

目前計畫使用實體機進行測試:
資料備份完成後開始進行

SYSTEM:
Samsung SSD 950 PRO 512GB 512.1 GB
DISK:
CT1000MX500SSD1 1000.2 GB
CT1000P2SSD8 1000.2 GB
WD_BLACK SN750 SE 1TB 1000.2 GB


## 2025-05-07

虛擬化測試遇到的問題:

Linux 的話疊加一層 dm-flakey 可以模擬一些不完全關機時的行為。
PVE 用 KVM 可能需要注意一下 SATA / SCSI 模擬下的IO隊列行為可能和物理設備的行為不盡相同。

## 2025-04-30:

## 待做測試:

### ZFS RAID-Z

- ZFS - Power outage  
- ZFS - Drive failure  
- ZFS - Drive failure during file transfer  
- ZFS - Data corruption during file transfer  
- ZFS - The dd mistake  
- ZFS - A second drive failure during a replacement  

### Btrfs RAID-5

- Btrfs - Power outage  
- Btrfs - Drive failure  
- Btrfs - Drive failure during file transfer  
- Btrfs - Data corruption during file transfer  
- Btrfs - The dd mistake  
- Btrfs - The write hole issue  
- Btrfs - A second drive failure during a replacement  

### mdadm+dm-integrity RAID-5

- mdadm - Power outage  
- mdadm - Drive failure  
- mdadm - Drive failure during file transfer  
- mdadm - Data corruption during file transfer  
- mdadm - The dd mistake  
- mdadm - A correct test of mdadm+dm-integrity  


### matrix

| 測試項目 | ZFS RAID-Z | Btrfs RAID-5 | mdadm+dm-integrity RAID-5 |
|----------|------------|--------------|-----------------------------|
| Power outage | 🕒 | 🕒 | 🕒 |
| Drive failure | 🕒 | 🕒 | 🕒 |
| Drive failure during file transfer | 🕒 | 🕒 | 🕒 |
| Data corruption during file transfer | 🕒 | 🕒 | 🕒 |
| The `dd` mistake | 🕒 | 🕒 | 🕒 |
| Write hole issue | N/A | 🕒 | N/A |
| A second drive failure during a replacement | 🕒 | 🕒 | N/A |
| mdadm+dm-integrity 正確測試 | N/A | N/A | 🕒 |


---

## ZFS 測試流程

1. **創建 ZFS RAID-Z Pool**
    ```bash
    zpool create -f -O xattr=sa -O dnodesize=auto -O atime=off -o ashift=12 pool1 raidz \
    ata-ST31000340NS_9QJ0F2YQ ata-ST31000340NS_9QJ0EQ1V ata-ST31000340NS_9QJ089LF
    ```

2. **建立資料集與開啟壓縮**
    ```bash
    zfs create -o compress=lz4 pool1/pub
    zfs list
    ```

3. **透過 rsync 傳輸資料**
    ```bash
    rsync -avh --progress --stats tmp/OW特性 mnt/testbox/pub/tmp/
    ```

4. **檢查 Pool 使用情況**
    ```bash
    zfs list
    ```

---

## Btrfs 測試流程


1. **建立 RAID-5 Volume**
    ```bash
    mkfs.btrfs -f -m raid5 -d raid5 \
    /dev/disk/by-id/*** \
    /dev/disk/by-id/*** \
    /dev/disk/by-id/*** \
    /dev/disk/by-id/*** 
    ```

2. **掛載與啟用壓縮**
    ```bash
    mount -o noatime,compress=lzo /dev/disk/by-id/*** /mnt/
    ```

3. **查看設備使用情況**
    ```bash
    btrfs filesystem show -d
    btrfs device stats /mnt/
    ```

---

## 待補：mdadm+dm-integrity 測試流程

-- 

## tools:
```
ls -gG /dev/disk/by-id/
rsync -a --progress --stats /local/ remote@ip:/path/
dd if=/dev/urandom of=/dev/disk/by-id/disk-id seek=100000 count=1000 bs=1k //Data corruption during file transfer
zpool events -v
dd if=/dev/urandom of=/dev/disk/by-id/ata-ST31000340NS_9QJ0ES1V bs=1k //dd mistake
```


### zfs tool:
```
zfs list 
zpool status -v
zpool replace pool old_device new_device
zpool scrub pool
zpool clear //clear log
```

### btrfs tool
```
mkfs.btrfs -f -m raid5 -d raid5 /dev/disk/by-id/ata-ST31000340NS_9QJ089LF /dev/disk/by-id/ata-ST31000340NS_9QJ0EQ1V /dev/disk/by-id/ata-ST31000340NS_9QJ0F2YQ
mount -o noatime,compress=lzo /dev/disk/by-id/ata-ST31000340NS_9QJ089LF /pub/
btrfs device stats /pub/
btrfs filesystem usage /pub
btrfs filesystem show -d
mount -o noatime,compress=lzo,degraded /dev/disk/by-id/ata-ST31000340NS_9QJ0F2YQ /pub/

btrfs replace start -f 1 /dev/disk/by-id/ata-ST31000340NS_9QJ0DVN2 /pub
btrfs replace status -1 /pub
```

---

## Final Notes


---

## Relevant Reading

- [ZFS Resilver vs Rebuild](https://docs.oracle.com/cd/E19253-01/819-5461/gaymf/index.html)
- [Btrfs RAID5/6 Status Wiki](https://btrfs.readthedocs.io/en/latest/RAID56.html)
