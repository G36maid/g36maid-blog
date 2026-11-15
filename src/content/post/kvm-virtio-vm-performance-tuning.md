---
title: "KVM/QEMU VM 效能調校作業記錄"
description: "把一台純 TCG 模擬、IDE 碟加 e1000 網卡的緩慢 QEMU VM，用 -enable-kvm、-cpu host 與 virtio 半虛擬化裝置調校到接近原生速度的過程記錄，附完整前後對照腳本與 benchmark 數字。"
pubDate: 2025-11-12 19:29:32 +0800
category: linux
tags: ["kvm", "qemu", "virtio", "linux", "performance"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1762946972
---

# KVM/QEMU VM 效能調校作業記錄

> 本文擴寫於 2026-11，原文是 2025-11 的一份課程作業記錄，已去識別化。

前一陣子在自架的 PVE homelab 環境裡接手一台慢到令人懷疑人生的 QEMU VM：開機要等上快一分鐘，shell 裡打字都感覺得到延遲。這篇文章記錄當時把它調校到接近原生速度的完整過程——改動只有幾個 flag，但 CPU 基準快了 8.4 倍。

## 環境

Host 是 Proxmox VE。測試用的 VM 跑在 PVE 的 VM 裡面，也就是巢狀虛擬化；嵌套 KVM 的概念在[先前 OPNsense nested virt 那篇](/blog/bsd-nas-opnsense-nested-virt/)有提過。動手前先確認外層有把 nested 開起來：

```bash
cat /sys/module/kvm_intel/parameters/nested   # 預期輸出 Y
```

若不是 `Y`，設定 `options kvm_intel nested=Y` 後重新載入模組。Host 給這層測試 VM 的是 8 核、4 GB 記憶體。Guest 是 Debian 11，跑自己編譯的 Linux kernel，直接用 QEMU 的 `-kernel`/`-append` 從 host 目錄帶 bzImage 開機，不經過 bootloader。

## 1. 原始腳本：慢在哪

```bash
#!/usr/bin/env bash

KERNEL=${KERNEL:-./linux/arch/x86_64/boot/bzImage}
MEM=${MEM:-2048}
SMP=${SMP:-4}
DISK=${DISK:-./debian.raw}
APPEND=${APPEND:-"console=ttyS0 root=/dev/sda1 rw"}

qemu-system-x86_64 \
        -m $MEM -smp $SMP \
        -kernel "$KERNEL" \
        -append "$APPEND" \
        -drive file="$DISK",format=raw,if=ide \
        -netdev user,id=net0 -device e1000,netdev=net0 \
        -nographic
```

這支腳本有三個慢點：

1. 沒有 `-enable-kvm`，整台 VM 走純軟體模擬。
2. 磁碟用 `if=ide`、網卡用 `e1000`，兩者都是 QEMU 全模擬的真實硬體。
3. 沒指定 CPU 模型，QEMU 預設的 `qemu64` 只暴露最小指令集。

## 2. 逐項修改

### 2.1 `-enable-kvm`：從二進位轉譯到硬體虛擬化

沒有 KVM 時，QEMU 用內建的 TCG（Tiny Code Generator）把 guest 指令動態翻譯成 host 指令，整顆 CPU 都靠軟體做出來，每條指令都要付出轉譯成本。加上 `-enable-kvm` 之後，guest 程式碼改由 Linux kernel 的 KVM 子系統直接在 Intel VT-x 的 VMX 模式下原生執行，只有特權操作、I/O 等事件才 VM exit 回到 host 處理。這一項是後面 CPU 基準快 8.4 倍的主要來源。

### 2.2 `-cpu host`

`-cpu host` 把 host CPU 的完整指令集（AES-NI、AVX 等）原樣帶給 guest。`qemu64` 為了相容性只給基本功能，編譯 kernel 或跑密碼學運算時會少掉大量硬體加速，改用 host 模型之後這些都直接可用。

### 2.3 virtio：半虛擬化裝置

IDE 和 e1000 之所以慢，是因為 QEMU 得模擬真實硬體的行為：guest 驅動每摸一次裝置暫存器就 VM exit 一次，由 host 端的 QEMU 代替硬體回應，I/O 密集時 trap 次數非常可觀。virtio 是專為 VM 設計的半虛擬化標準（OASIS 有正式的 spec），把裝置介面簡化成 guest 與 host 共享的 ring buffer 加上少數 trap：guest 驅動直接把請求寫進 ring，host 端再消化。QEMU 官方文件也建議儲存裝置優先選 virtio-blk/virtio-scsi。這次對應的改動是磁碟 `if=virtio`、網卡 `-device virtio-net`，兩邊都換成半虛擬化介面。

### 2.4 資源對齊

為了讓數字只反映虛擬化方式的差異，兩台 VM 在 benchmark 時都用 `-m 2048 -smp 4`（2G 記憶體、4 核）。資源相同的情況下，才比得出 KVM 與 virtio 各自的貢獻。

## 3. 最終腳本

```bash
#!/usr/bin/env bash

KERNEL=${KERNEL:-./linux/arch/x86_64/boot/bzImage}
MEM=${MEM:-2048}
SMP=${SMP:-4}
DISK=${DISK:-./debian.raw}
APPEND=${APPEND:-"console=ttyS0 root=/dev/vda1 rw"}

qemu-system-x86_64 \
    -enable-kvm \
    -cpu host \
    -m $MEM -smp $SMP \
    -kernel "$KERNEL" \
    -append "$APPEND" \
    -drive file="$DISK",format=raw,if=virtio \
    -netdev user,id=net0 -device virtio-net,netdev=net0 \
    -nographic
```

注意第 6 行：磁碟從 IDE 換成 virtio 之後，裝置名從 `/dev/sda1` 變成 `/dev/vda1`，kernel command line 一定要跟著改，否則開機時直接找不到 root filesystem。shebang 也順手改成 `#!/usr/bin/env bash`，在不同發行版上都能跑。

## 4. Benchmark 方法與數字

測試項目：

- **CPU**：`sysbench cpu --threads=4 run`，取 events per second。
- **磁碟**：`dd` 對 1 GB 檔案做寫入與讀取，guest 端加了 `oflag=direct` / `iflag=direct`。
- **網路**：host 與 guest 之間跑 `iperf3`（QEMU user-mode 網路），各量 10 秒。

| 資源 | 慢 VM | 快 VM | 提升 |
| --- | --- | --- | --- |
| CPU（sysbench events/sec） | 656.34 | 5525.21 | ~8.4x |
| 磁碟寫入（dd） | 400 MB/s | 1.1 GB/s | ~2.75x |
| 磁碟讀取（dd） | 688 MB/s | 4.6 GB/s | ~6.7x |
| 網路頻寬（iperf3） | 641 Mbit/s | 1.60 Gbit/s | ~2.5x |

dd 的數字要多一層保留：guest 端雖然加了 `oflag=direct` / `iflag=direct`，但 `-drive` 沒有指定 `cache=none`（`cache.direct=on`），QEMU 後端仍可能經過 host page cache；要更嚴謹可以再加 `conv=fdatasync` 確認資料真的落盤。4.6 GB/s 的讀取速度已經高於一般實驗室磁碟的裸速，6.7x 的讀取加速裡有多少是快取效應，得打個問號。相對之下，sysbench 和 iperf3 的數字可信度高一些：CPU 基準不受磁碟快取影響，iperf3 量的是連續流量而非單次 I/O。

## 5. 踩雷與注意事項

- **自編 kernel 要把 virtio 驅動編進去**：`CONFIG_VIRTIO`、`CONFIG_VIRTIO_BLK`、`CONFIG_VIRTIO_NET` 缺任何一個，`root=/dev/vda1` 都掛不起來，開機直接 panic。
- **nested 沒開時 `-enable-kvm` 會失敗**：在 PVE 的 VM 裡再開 KVM，外層必須有 `/dev/kvm` 可用，開跑前先確認 `nested=Y`。
- **iperf3 卡在 1.6 Gbit/s 上下**：這接近 user-mode slirp 在 host 端的處理上限，瓶頸在封包路徑本身， virtio-net 還沒發揮滿。想再上去得換 `-netdev tap,vhost=on`，讓大部分封包處理留在 kernel 的 vhost-net 裡。
- **兩台 VM 的 RAM 和核數要相同**：資源不對齊的 benchmark 沒有比較價值，這點在跑分前就該鎖死。
