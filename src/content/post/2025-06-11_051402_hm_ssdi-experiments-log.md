---
title: "SSDI Experiments Log"
description: "% fastfetch"
pubDate: 2025-06-11 05:14:02 +0800
tags: ["btrfs", "sudo", "ssd", "cpu", "mount", "linux", "pacman", "bash", "zfs", "ext4"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1749590042
category: linux
---

[TOC]

## Overall Commands


```
% fastfetch               
                  .=.                     g36maid@g36archPC
                  '='                     -----------------
                  ___                     OS: Arch Linux x86_64
       .**.   .*MWWWWWM*.   .**.          Kernel: Linux 6.14.6-zen1-1-zen
     .MWv"' *MWW'"""""'WWM* '"vWM.        Uptime: 1 day, 1 hour, 47 mins
   .MW"´  .WW:´         `:WW.  `"WM.      Packages: 1174 (pacman)
 .MW"     MW/   .*MWM*.   \WM     "MW.    Shell: zsh 5.9
 MW:     .WW    MWWWWWM    WW.     :WM    Display ( SA272U E): 2560x1440 @ 100 Hz in 27" [External]
 WW*     'WM    WWWWWWW    MW'     *MW    Display (VG27A): 2560x1440 @ 144 Hz in 27" [External]
  "WM.    WW\   "*WWW*"   /WW    .MW"     WM: Hyprland 0.49.0 (Wayland)
    ':W*. 'WWM.         .MWW' .*W:'       Cursor: Adwaita
  .=. `"WW `*WWWv.   .vWWW*´ WW"´ .=.     Terminal: kitty 0.42.0
  '='        `"*WW   WW*"´        '='     Terminal Font: FiraCodeNF-Reg (10pt)
                WW   WW                   CPU: AMD Ryzen 7 7800X3D (16) @ 4.37 GHz
                WW   WW                   GPU 1: NVIDIA GeForce RTX 3070 Ti [Discrete]
        oM.    ,WW   WW.    .Mo           GPU 2: AMD Raphael [Integrated]
        `*WM*=*WW'   'WW*=*MW*´           Memory: 18.24 GiB / 30.56 GiB (60%)
           `"°"´       `"°"´              Swap: 4.00 GiB / 4.00 GiB (100%)
                                          Disk (/): 384.93 GiB / 475.94 GiB (81%) - btrfs
                                          Local IP (eno1): 192.168.0.61/24
                                          Locale: en_US.UTF-8
```

### BTRFS
```bash
lsblk -f
btrfs filesystem usage /mnt/
btrfs filesystem du /mnt/
btrfs filesystem df /mnt/
btrfs device stats /mnt/
btrfs filesystem show -d
````

### ZFS

```bash
lsblk -f
zfs list
zpool status
zpool list
zpool iostat
zpool get all
zfs get all
zfs get available,used,compressratio
```

---

## Performance Tests

```bash
sudo rsync -avh --progress --stats ~/.local/share/Steam/steamapps/common/ /mnt/storage/
```
about 200GB of games data
---

## BTRFS RAID5 Setup

### Safe RAID5

```bash
sudo mkfs.btrfs -f -d raid5 -m raid1c3 /dev/nvme1n1 /dev/nvme2n1 /dev/sda
```



#### 掛載

```bash
sudo mount -o noatime,compress=zstd /dev/nvme1n1 /mnt  
```

---

### Unsafe RAID5


```bash
sudo mkfs.btrfs -f -d raid5 -m raid5 /dev/nvme1n1 /dev/nvme2n1 /dev/sda
```

---


### 套件來源與安裝

參考：[Arch Wiki - archzfs](https://wiki.archlinux.org/title/Unofficial_user_repositories#archzfs)


## 實驗項目

### BTRFS

* [x] Power outage 測試（拔電/強制重開機）
* [x] Drive failure 測試（模擬磁碟損壞）
* [x] Drive failure during file transfer
* [x] Data corruption during file transfer（bitrot 模擬）
* [x] `dd` 誤操作測試（覆寫原有資料區塊）
* [x] Write hole issue 檢驗
* [ ] A second drive failure during a replacement 
    * Can't test because there is only one sata drive and others is NVME SSDs

### ZFS（後續補充）


### BTRFS 實驗(unsafe)

## 實驗紀錄
### mkfs.btrfs
```
% sudo mkfs.btrfs -f -d raid5 -m raid5 /dev/nvme1n1 /dev/nvme2n1 /dev/sda
btrfs-progs v6.14
See https://btrfs.readthedocs.io for more information.

WARNING: RAID5/6 support has known problems is strongly discouraged
	to be used besides testing or evaluation.

Performing full device TRIM /dev/nvme1n1 (931.51GiB) ...
Performing full device TRIM /dev/nvme2n1 (931.51GiB) ...
Performing full device TRIM /dev/sda (931.51GiB) ...
NOTE: several default settings have changed in version 5.15, please make sure
      this does not affect your deployments:
      - DUP for metadata (-m dup)
      - enabled no-holes (-O no-holes)
      - enabled free-space-tree (-R free-space-tree)

Label:              (null)
UUID:               042ff1af-35d1-4c95-b329-e3e2d06ca6a7
Node size:          16384
Sector size:        4096	(CPU page size: 4096)
Filesystem size:    2.73TiB
Block group profiles:
  Data:             RAID5             2.00GiB
  Metadata:         RAID5           682.62MiB
  System:           RAID5            16.00MiB
SSD detected:       yes
Zoned device:       no
Features:           extref, raid56, skinny-metadata, no-holes, free-space-tree
Checksum:           crc32c
Number of devices:  3
Devices:
   ID        SIZE  PATH        
    1   931.51GiB  /dev/nvme1n1
    2   931.51GiB  /dev/nvme2n1
    3   931.51GiB  /dev/sda    
```
lsblk
```
~ took 2s
% sudo mount -o noatime,compress=zstd /dev/nvme1n1 /mnt                  

~
% lsblk -f
NAME        FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sda         btrfs              042ff1af-35d1-4c95-b329-e3e2d06ca6a7                
zram0       swap   1     zram0 f92e40f8-6479-4d46-84b5-8eef43c4db90                [SWAP]
nvme0n1                                                                            
├─nvme0n1p1 vfat   FAT32       450C-FCF3                             376.6M    63% /boot
└─nvme0n1p2 btrfs              96449fcb-3f76-43e9-836f-9fddea812e53   97.7G    79% /home
                                                                                   /var/log
                                                                                   /var/cache/pacman/pkg
                                                                                   /
nvme2n1     btrfs              042ff1af-35d1-4c95-b329-e3e2d06ca6a7                
nvme1n1     btrfs              042ff1af-35d1-4c95-b329-e3e2d06ca6a7    1.8T     0% /mnt
```
usage
```
% sudo btrfs filesystem usage /mnt/     
Overall:
    Device size:		  2.73TiB
    Device allocated:		  4.02GiB
    Device unallocated:		  2.72TiB
    Device missing:		    0.00B
    Device slack:		    0.00B
    Used:			216.00KiB
    Free (estimated):		  1.82TiB	(min: 1.82TiB)
    Free (statfs, df):		  1.82TiB
    Data ratio:			     1.50
    Metadata ratio:		     1.50
    Global reserve:		  5.50MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:2.00GiB, Used:0.00B (0.00%)
   /dev/nvme1n1	  1.00GiB
   /dev/nvme2n1	  1.00GiB
   /dev/sda	  1.00GiB

Metadata,RAID5: Size:682.62MiB, Used:128.00KiB (0.02%)
   /dev/nvme1n1	341.31MiB
   /dev/nvme2n1	341.31MiB
   /dev/sda	341.31MiB

System,RAID5: Size:16.00MiB, Used:16.00KiB (0.10%)
   /dev/nvme1n1	  8.00MiB
   /dev/nvme2n1	  8.00MiB
   /dev/sda	  8.00MiB

Unallocated:
   /dev/nvme1n1	930.17GiB
   /dev/nvme2n1	930.17GiB
   /dev/sda	930.17GiB
```

### basic test
```
sudo rsync -avh --progress --stats ~/.local/share/Steam/steamapps/common/ /mnt/storage/
sending incremental file list
Number of files: 124,122 (reg: 109,452, dir: 7,726, link: 6,944)
Number of created files: 124,121 (reg: 109,452, dir: 7,725, link: 6,944)
Number of deleted files: 0
Number of regular files transferred: 109,452
Total file size: 248.10G bytes
Total transferred file size: 248.10G bytes
Literal data: 248.10G bytes
Matched data: 0 bytes
File list size: 3.47M
File list generation time: 0.001 seconds
File list transfer time: 0.000 seconds
Total bytes sent: 248.17G
Total bytes received: 2.14M

sent 248.17G bytes  received 2.14M bytes  815.01M bytes/sec
total size is 248.10G  speedup is 1.00
```
took 5m4s

post test
```
sudo btrfs filesystem usage /mnt/                                                      
[sudo] password for g36maid: 
Overall:
    Device size:		  2.73TiB
    Device allocated:		331.02GiB
    Device unallocated:		  2.41TiB
    Device missing:		    0.00B
    Device slack:		    0.00B
    Used:			318.63GiB
    Free (estimated):		  1.61TiB	(min: 1.61TiB)
    Free (statfs, df):		  1.61TiB
    Data ratio:			     1.50
    Metadata ratio:		     1.50
    Global reserve:		239.61MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:218.00GiB, Used:212.07GiB (97.28%)
   /dev/nvme1n1	109.00GiB
   /dev/nvme2n1	109.00GiB
   /dev/sda	109.00GiB

Metadata,RAID5: Size:2.67GiB, Used:357.66MiB (13.10%)
   /dev/nvme1n1	  1.33GiB
   /dev/nvme2n1	  1.33GiB
   /dev/sda	  1.33GiB

System,RAID5: Size:16.00MiB, Used:48.00KiB (0.29%)
   /dev/nvme1n1	  8.00MiB
   /dev/nvme2n1	  8.00MiB
   /dev/sda	  8.00MiB

Unallocated:
   /dev/nvme1n1	821.17GiB
   /dev/nvme2n1	821.17GiB
   /dev/sda 821.17GiB
```
```
1 % sudo btrfs device stats /mnt
[/dev/nvme1n1].write_io_errs    0
[/dev/nvme1n1].read_io_errs     0
[/dev/nvme1n1].flush_io_errs    0
[/dev/nvme1n1].corruption_errs  0
[/dev/nvme1n1].generation_errs  0
[/dev/nvme2n1].write_io_errs    0
[/dev/nvme2n1].read_io_errs     0
[/dev/nvme2n1].flush_io_errs    0
[/dev/nvme2n1].corruption_errs  0
[/dev/nvme2n1].generation_errs  0
[/dev/sda].write_io_errs    0
[/dev/sda].read_io_errs     0
[/dev/sda].flush_io_errs    0
[/dev/sda].corruption_errs  0
[/dev/sda].generation_errs  0
```

### delete the data
```
rm -rf /mnt/storage/
```
```
% lsblk -f
NAME        FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sda         btrfs              042ff1af-35d1-4c95-b329-e3e2d06ca6a7                
zram0       swap   1     zram0 f92e40f8-6479-4d46-84b5-8eef43c4db90                [SWAP]
nvme0n1                                                                            
├─nvme0n1p1 vfat   FAT32       450C-FCF3                             376.6M    63% /boot
└─nvme0n1p2 btrfs              96449fcb-3f76-43e9-836f-9fddea812e53   91.7G    81% /home
                                                                                   /var/log
                                                                                   /var/cache/pacman/pkg
                                                                                   /
nvme2n1     btrfs              042ff1af-35d1-4c95-b329-e3e2d06ca6a7                
nvme1n1     btrfs              042ff1af-35d1-4c95-b329-e3e2d06ca6a7    1.8T     0% /mnt
```
```
sudo btrfs filesystem usage /mnt/
Overall:
    Device size:		  2.73TiB
    Device allocated:		331.02GiB
    Device unallocated:		  2.41TiB
    Device missing:		    0.00B
    Device slack:		    0.00B
    Used:			312.00KiB
    Free (estimated):		  1.82TiB	(min: 1.82TiB)
    Free (statfs, df):		  1.82TiB
    Data ratio:			     1.50
    Metadata ratio:		     1.50
    Global reserve:		239.61MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:218.00GiB, Used:0.00B (0.00%)
   /dev/nvme1n1	109.00GiB
   /dev/nvme2n1	109.00GiB
   /dev/sda	109.00GiB

Metadata,RAID5: Size:2.67GiB, Used:160.00KiB (0.01%)
   /dev/nvme1n1	  1.33GiB
   /dev/nvme2n1	  1.33GiB
   /dev/sda	  1.33GiB

System,RAID5: Size:16.00MiB, Used:48.00KiB (0.29%)
   /dev/nvme1n1	  8.00MiB
   /dev/nvme2n1	  8.00MiB
   /dev/sda	  8.00MiB

Unallocated:
   /dev/nvme1n1	821.17GiB
   /dev/nvme2n1	821.17GiB
   /dev/sda	821.17GiB
```
### Btrfs - Power outage

```
rsync
// 斷電
btrfs filesystem show -d
% sudo btrfs filesystem show -d
[sudo] password for g36maid: 
Label: none  uuid: 96449fcb-3f76-43e9-836f-9fddea812e53
	Total devices 1 FS bytes used 381.58GiB
	devid    1 size 475.94GiB used 386.02GiB path /dev/nvme0n1p2

Label: none  uuid: 042ff1af-35d1-4c95-b329-e3e2d06ca6a7
	Total devices 3 FS bytes used 144.00KiB
	devid    1 size 931.51GiB used 110.34GiB path /dev/nvme2n1
	devid    2 size 931.51GiB used 110.34GiB path /dev/nvme1n1
	devid    3 size 931.51GiB used 110.34GiB path /dev/sda
    
    
% sudo sudo btrfs filesystem df /mnt/storage
Data, RAID5: total=2.00GiB, used=0.00B
System, RAID5: total=16.00MiB, used=16.00KiB
Metadata, RAID5: total=1.67GiB, used=128.00KiB
GlobalReserve, single: total=5.50MiB, used=0.00B

sudo btrfs device stats /mnt/     
[/dev/nvme2n1].write_io_errs    0
[/dev/nvme2n1].read_io_errs     0
[/dev/nvme2n1].flush_io_errs    0
[/dev/nvme2n1].corruption_errs  0
[/dev/nvme2n1].generation_errs  0
[/dev/nvme1n1].write_io_errs    0
[/dev/nvme1n1].read_io_errs     0
[/dev/nvme1n1].flush_io_errs    0
[/dev/nvme1n1].corruption_errs  0
[/dev/nvme1n1].generation_errs  0
[/dev/sda].write_io_errs    0
[/dev/sda].read_io_errs     0
[/dev/sda].flush_io_errs    0
[/dev/sda].corruption_errs  0
[/dev/sda].generation_errs  0
```

沒有任何問題

### Btrfs - Drive failure

```
btrfs filesystem show -d

ls -gG /dev/disk/by-id
mount -o noatime,compress=zstd,degraded


sudo umount /mnt/storage

sudo wipefs -a /dev/sda

sudo mount -o noatime,compress=zstd,degraded /dev/nvme1n1 /mnt


btrfs replace start -f 1 /dev/disk/by-id/ /mnt/storage

btrfs replace status -1 /pub
iostat -dh /dev/disk/by-id

sudo mount -o noatime,compress=zstd /dev/nvme1n1 /mnt

```

```
sudo btrfs filesystem show -d
[sudo] password for g36maid: 
Label: none  uuid: 96449fcb-3f76-43e9-836f-9fddea812e53
	Total devices 1 FS bytes used 381.59GiB
	devid    1 size 475.94GiB used 386.02GiB path /dev/nvme0n1p2

Label: none  uuid: 042ff1af-35d1-4c95-b329-e3e2d06ca6a7
	Total devices 3 FS bytes used 212.42GiB
	devid    1 size 931.51GiB used 109.84GiB path /dev/nvme2n1
	devid    2 size 931.51GiB used 109.84GiB path /dev/nvme1n1
	devid    3 size 931.51GiB used 109.84GiB path /dev/sda
```
```
lrwxrwxrwx 1  9 May 20 18:22 ata-CT1000MX500SSD1_2302E69CE85A -> ../../sda
lrwxrwxrwx 1 13 May 20 18:22 nvme-CT1000P2SSD8_2224E63BD62A -> ../../nvme1n1
lrwxrwxrwx 1 13 May 20 18:22 nvme-CT1000P2SSD8_2224E63BD62A_1 -> ../../nvme1n1
lrwxrwxrwx 1 13 May 20 18:22 nvme-eui.e8238fa6bf530001001b444a49831c51 -> ../../nvme2n1
lrwxrwxrwx 1 13 May 20 18:22 nvme-nvme.144d-5332474d4e4341474233353234374a-53616d73756e6720535344203935302050524f203531324742-00000001 -> ../../nvme0n1
lrwxrwxrwx 1 15 May 20 18:22 nvme-nvme.144d-5332474d4e4341474233353234374a-53616d73756e6720535344203935302050524f203531324742-00000001-part1 -> ../../nvme0n1p1
lrwxrwxrwx 1 15 May 20 18:22 nvme-nvme.144d-5332474d4e4341474233353234374a-53616d73756e6720535344203935302050524f203531324742-00000001-part2 -> ../../nvme0n1p2
lrwxrwxrwx 1 13 May 20 18:22 nvme-nvme.c0a9-323232344536334244363241-435431303030503253534438-00000001 -> ../../nvme1n1
lrwxrwxrwx 1 13 May 20 18:22 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J -> ../../nvme0n1
lrwxrwxrwx 1 13 May 20 18:22 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J_1 -> ../../nvme0n1
lrwxrwxrwx 1 15 May 20 18:22 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J_1-part1 -> ../../nvme0n1p1
lrwxrwxrwx 1 15 May 20 18:22 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J_1-part2 -> ../../nvme0n1p2
lrwxrwxrwx 1 15 May 20 18:22 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J-part1 -> ../../nvme0n1p1
lrwxrwxrwx 1 15 May 20 18:22 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J-part2 -> ../../nvme0n1p2
lrwxrwxrwx 1 13 May 20 18:22 nvme-WD_BLACK_SN750_SE_1TB_21321D446703 -> ../../nvme2n1
lrwxrwxrwx 1 13 May 20 18:22 nvme-WD_BLACK_SN750_SE_1TB_21321D446703_1 -> ../../nvme2n1
lrwxrwxrwx 1  9 May 20 18:22 wwn-0x500a0751e69ce85a -> ../../sda
```
```
sudo btrfs filesystem show -d
warning, device 3 is missing
Label: none  uuid: 96449fcb-3f76-43e9-836f-9fddea812e53
	Total devices 1 FS bytes used 381.59GiB
	devid    1 size 475.94GiB used 386.02GiB path /dev/nvme0n1p2

Label: none  uuid: 042ff1af-35d1-4c95-b329-e3e2d06ca6a7
	Total devices 3 FS bytes used 212.42GiB
	devid    1 size 931.51GiB used 109.84GiB path /dev/nvme2n1
	devid    2 size 931.51GiB used 109.84GiB path /dev/nvme1n1
	*** Some devices missing
```
```
% lsblk -f
NAME        FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sda                                                                                
zram0       swap   1     zram0 308c9952-b1f3-462a-b262-7e4a661e99f5                [SWAP]
nvme0n1                                                                            
├─nvme0n1p1 vfat   FAT32       450C-FCF3                             376.6M    63% /boot
└─nvme0n1p2 btrfs              96449fcb-3f76-43e9-836f-9fddea812e53   91.7G    81% /home
                                                                                   /var/log
                                                                                   /var/cache/pacman/pkg
                                                                                   /
nvme1n1     btrfs              042ff1af-35d1-4c95-b329-e3e2d06ca6a7                
nvme2n1     btrfs              042ff1af-35d1-4c95-b329-e3e2d06ca6a7    
```

```
Overall:
    Device size:		  2.73TiB
    Device allocated:		329.52GiB
    Device unallocated:		  2.41TiB
    Device missing:		931.51GiB
    Device slack:		    0.00B
    Used:			318.63GiB
    Free (estimated):		  1.61TiB	(min: 1.61TiB)
    Free (statfs, df):		827.60GiB
    Data ratio:			     1.50
    Metadata ratio:		     1.50
    Global reserve:		258.16MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:218.00GiB, Used:212.07GiB (97.28%)
   /dev/nvme2n1	109.00GiB
   /dev/nvme1n1	109.00GiB
   missing	109.00GiB

Metadata,RAID5: Size:1.67GiB, Used:359.84MiB (21.09%)
   /dev/nvme2n1	853.31MiB
   /dev/nvme1n1	853.31MiB
   missing	853.31MiB

System,RAID5: Size:16.00MiB, Used:48.00KiB (0.29%)
   /dev/nvme2n1	  8.00MiB
   /dev/nvme1n1	  8.00MiB
   missing	  8.00MiB

Unallocated:
   /dev/nvme2n1	821.67GiB
   /dev/nvme1n1	821.67GiB
   missing	821.67GiB
```

### btrfs replace disk
```
sudo btrfs replace start 3 /dev/disk/by-id/ata-CT1000MX500SSD1_2302E69CE85A /mnt
Performing full device TRIM /dev/sda (931.51GiB) ...
```
```
% iostat -dh /dev/disk/by-id/ata-CT1000MX500SSD1_2302E69CE85A
Linux 6.14.6-zen1-1-zen (g36archPC) 	05/20/2025 	_x86_64_	(16 CPU)

      tps    kB_read/s    kB_wrtn/s    kB_dscd/s    kB_read    kB_wrtn    kB_dscd Device
  1701.79         4.9M        97.3M       570.2M       8.0G     159.0G     931.5G sda
```
![圖片](https://hackmd.io/_uploads/HkQUJJ9bxx.png)
```dmesg
[ 1086.966898] BTRFS info (device nvme2n1): last unmount of filesystem 042ff1af-35d1-4c95-b329-e3e2d06ca6a7
[ 1165.340165] BTRFS info (device nvme2n1): first mount of filesystem 042ff1af-35d1-4c95-b329-e3e2d06ca6a7
[ 1165.340182] BTRFS info (device nvme2n1): using crc32c (crc32c-x86) checksum algorithm
[ 1165.340187] BTRFS info (device nvme2n1): using free-space-tree
[ 1165.340510] BTRFS warning (device nvme2n1): devid 3 uuid 4fed4bc3-df35-49a5-bd61-ac5fede6a5c7 is missing
[ 1165.341122] BTRFS warning (device nvme2n1): devid 3 uuid 4fed4bc3-df35-49a5-bd61-ac5fede6a5c7 is missing
[ 1411.525475] BTRFS info (device nvme2n1): dev_replace from <missing disk> (devid 3) to /dev/sda started
[ 2102.191058] BTRFS info (device nvme2n1): dev_replace from <missing disk> (devid 3) to /dev/sda finished
```
#### post replace
```
sudo btrfs filesystem show -d
[sudo] password for g36maid: 
Label: none  uuid: 96449fcb-3f76-43e9-836f-9fddea812e53
	Total devices 1 FS bytes used 381.59GiB
	devid    1 size 475.94GiB used 386.02GiB path /dev/nvme0n1p2

Label: none  uuid: 042ff1af-35d1-4c95-b329-e3e2d06ca6a7
	Total devices 3 FS bytes used 212.42GiB
	devid    1 size 931.51GiB used 109.87GiB path /dev/nvme2n1
	devid    2 size 931.51GiB used 109.87GiB path /dev/nvme1n1
	devid    3 size 931.51GiB used 109.83GiB path /dev/sda
```
```
sudo btrfs filesystem usage /mnt
Overall:
    Device size:		  2.73TiB
    Device allocated:		329.56GiB
    Device unallocated:		  2.41TiB
    Device missing:		    0.00B
    Device slack:		    0.00B
    Used:			318.63GiB
    Free (estimated):		  1.61TiB	(min: 1.21TiB)
    Free (statfs, df):		  1.61TiB
    Data ratio:			     1.50
    Metadata ratio:		     1.50
    Global reserve:		258.17MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:218.00GiB, Used:212.07GiB (97.28%)
   /dev/nvme2n1	109.00GiB
   /dev/nvme1n1	109.00GiB
   /dev/sda	109.00GiB

Metadata,RAID5: Size:1.67GiB, Used:359.86MiB (21.09%)
   /dev/nvme2n1	853.31MiB
   /dev/nvme1n1	853.31MiB
   /dev/sda	853.31MiB

System,RAID5: Size:32.00MiB, Used:48.00KiB (0.15%)
   /dev/nvme2n1	 32.00MiB
   /dev/nvme1n1	 32.00MiB

Unallocated:
   /dev/nvme2n1	821.65GiB
   /dev/nvme1n1	821.65GiB
   /dev/sda	821.68GiB
```
```
sudo btrfs device stats /mnt 
[/dev/nvme2n1].write_io_errs    0
[/dev/nvme2n1].read_io_errs     0
[/dev/nvme2n1].flush_io_errs    0
[/dev/nvme2n1].corruption_errs  0
[/dev/nvme2n1].generation_errs  0
[/dev/nvme1n1].write_io_errs    0
[/dev/nvme1n1].read_io_errs     0
[/dev/nvme1n1].flush_io_errs    0
[/dev/nvme1n1].corruption_errs  0
[/dev/nvme1n1].generation_errs  0
[/dev/sda].write_io_errs    0
[/dev/sda].read_io_errs     0
[/dev/sda].flush_io_errs    0
[/dev/sda].corruption_errs  0
[/dev/sda].generation_errs  0
```

```
btrfs scrub status -d /mnt
UUID:             042ff1af-35d1-4c95-b329-e3e2d06ca6a7

Scrub device /dev/nvme2n1 (id 1) status
Scrub started:    Tue May 20 19:26:39 2025
Status:           running
Duration:         0:00:10
Time left:        3:55:49
ETA:              Tue May 20 23:22:39 2025
Total to scrub:   109.86GiB
Bytes scrubbed:   79.45MiB  (0.07%)
Rate:             7.95MiB/s
Error summary:    no errors found

Scrub device /dev/nvme1n1 (id 2) status
Scrub started:    Tue May 20 19:26:39 2025
Status:           running
Duration:         0:00:10
Time left:        3:55:41
ETA:              Tue May 20 23:22:31 2025
Total to scrub:   109.86GiB
Bytes scrubbed:   79.50MiB  (0.07%)
Rate:             7.95MiB/s
Error summary:    no errors found

Scrub device /dev/sda (id 3) status
Scrub started:    Tue May 20 19:26:39 2025
Status:           running
Duration:         0:00:10
Time left:        1:11:54
ETA:              Tue May 20 20:38:44 2025
Total to scrub:   109.83GiB
Bytes scrubbed:   260.10MiB  (0.23%)
Rate:             26.01MiB/s
Error summary:    no errors found
```

```
[ 3882.333747] BTRFS info (device nvme2n1): scrub: started on devid 3
[ 3882.385971] BTRFS info (device nvme2n1): scrub: started on devid 2
[ 6427.953727] BTRFS info (device nvme2n1): scrub: finished on devid 3 with status: 0
[ 7614.510052] BTRFS info (device nvme2n1): scrub: finished on devid 2 with status: 0
[ 7624.843913] BTRFS info (device nvme2n1): scrub: finished on devid 1 with status: 0
```
```
% sudo btrfs device stats /mnt     
[sudo] password for g36maid: 
Sorry, try again.
[sudo] password for g36maid: 
[/dev/nvme2n1].write_io_errs    0
[/dev/nvme2n1].read_io_errs     0
[/dev/nvme2n1].flush_io_errs    0
[/dev/nvme2n1].corruption_errs  0
[/dev/nvme2n1].generation_errs  0
[/dev/nvme1n1].write_io_errs    0
[/dev/nvme1n1].read_io_errs     0
[/dev/nvme1n1].flush_io_errs    0
[/dev/nvme1n1].corruption_errs  0
[/dev/nvme1n1].generation_errs  0
[/dev/sda].write_io_errs    0
[/dev/sda].read_io_errs     0
[/dev/sda].flush_io_errs    0
[/dev/sda].corruption_errs  0
[/dev/sda].generation_errs  0

~ took 8s
% sudo btrfs filesystem usage /mnt 
Overall:
    Device size:		  2.73TiB
    Device allocated:		329.55GiB
    Device unallocated:		  2.41TiB
    Device missing:		    0.00B
    Device slack:		    0.00B
    Used:			318.63GiB
    Free (estimated):		  1.61TiB	(min: 1.61TiB)
    Free (statfs, df):		  1.61TiB
    Data ratio:			     1.50
    Metadata ratio:		     1.50
    Global reserve:		258.19MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:218.00GiB, Used:212.07GiB (97.28%)
   /dev/nvme2n1	109.00GiB
   /dev/nvme1n1	109.00GiB
   /dev/sda	109.00GiB

Metadata,RAID5: Size:1.67GiB, Used:359.89MiB (21.09%)
   /dev/nvme2n1	853.31MiB
   /dev/nvme1n1	853.31MiB
   /dev/sda	853.31MiB

System,RAID5: Size:32.00MiB, Used:48.00KiB (0.15%)
   /dev/nvme2n1	 16.00MiB
   /dev/nvme1n1	 16.00MiB
   /dev/sda	 16.00MiB

Unallocated:
   /dev/nvme2n1	821.66GiB
   /dev/nvme1n1	821.66GiB
   /dev/sda	821.66GiB
   ```
### write hole issue 

conbine the 
Btrfs - Power outage
Btrfs - Drive failure
together

seems fine


### Btrfs - Drive failure during file transfer

It momentarily halted the file transfer for about a "few" second, then resumed the transfer without the client being able to notice anything other than the momentary drop in the file transfer speed.

dmesg 
```
[95573.271464] ata4.00: exception Emask 0x50 SAct 0x3f10004 SErr 0x4e0802 action 0x6 frozen
[95573.271469] ata4.00: irq_stat 0x08000000, interface fatal error
[95573.271471] ata4: SError: { RecovComm HostInt PHYInt CommWake 10B8B Handshk }
[95573.271474] ata4.00: failed command: WRITE FPDMA QUEUED
[95573.271475] ata4.00: cmd 61/80:10:80:54:bf/00:00:01:00:00/40 tag 2 ncq dma 65536 out
                        res 40/00:01:00:00:00/00:00:00:00:00/00 Emask 0x50 (ATA bus error)
[95573.271479] ata4.00: status: { DRDY }
[95573.271480] ata4.00: failed command: WRITE FPDMA QUEUED
[95573.271481] ata4.00: cmd 61/80:80:80:84:c4/00:00:01:00:00/40 tag 16 ncq dma 65536 out
                        res 40/00:00:00:00:00/00:00:00:00:00/00 Emask 0x50 (ATA bus error)
[95573.271485] ata4.00: status: { DRDY }
[95573.271486] ata4.00: failed command: WRITE FPDMA QUEUED
[95573.271487] ata4.00: cmd 61/80:a0:00:bf:c8/00:00:01:00:00/40 tag 20 ncq dma 65536 out
                        res 40/00:00:00:00:00/00:00:00:00:00/00 Emask 0x50 (ATA bus error)
[95573.271490] ata4.00: status: { DRDY }
[95573.271491] ata4.00: failed command: WRITE FPDMA QUEUED
[95573.271492] ata4.00: cmd 61/80:a8:80:02:cd/00:00:01:00:00/40 tag 21 ncq dma 65536 out
                        res 40/00:00:00:00:00/00:00:00:00:00/00 Emask 0x50 (ATA bus error)
[95573.271495] ata4.00: status: { DRDY }
[95573.271496] ata4.00: failed command: WRITE FPDMA QUEUED
[95573.271497] ata4.00: cmd 61/80:b0:00:85:c4/00:00:01:00:00/40 tag 22 ncq dma 65536 out
                        res 40/00:00:00:00:00/00:00:00:00:00/00 Emask 0x50 (ATA bus error)
[95573.271500] ata4.00: status: { DRDY }
[95573.271501] ata4.00: failed command: WRITE FPDMA QUEUED
[95573.271502] ata4.00: cmd 61/80:b8:00:55:bf/00:00:01:00:00/40 tag 23 ncq dma 65536 out
                        res 40/00:00:00:00:00/00:00:00:00:00/00 Emask 0x50 (ATA bus error)
[95573.271504] ata4.00: status: { DRDY }
[95573.271506] ata4.00: failed command: WRITE FPDMA QUEUED
[95573.271507] ata4.00: cmd 61/80:c0:80:bf:c8/00:00:01:00:00/40 tag 24 ncq dma 65536 out
                        res 40/00:00:00:00:00/00:00:00:00:00/00 Emask 0x50 (ATA bus error)
[95573.271509] ata4.00: status: { DRDY }
[95573.271511] ata4.00: failed command: WRITE FPDMA QUEUED
[95573.271511] ata4.00: cmd 61/80:c8:00:03:cd/00:00:01:00:00/40 tag 25 ncq dma 65536 out
                        res 40/00:00:00:00:00/00:00:00:00:00/00 Emask 0x50 (ATA bus error)
[95573.271514] ata4.00: status: { DRDY }
[95573.271521] ata4: hard resetting link
[95573.581566] ata4: SATA link down (SStatus 0 SControl 300)
[95578.720513] ata4: hard resetting link
[95579.029633] ata4: SATA link down (SStatus 0 SControl 300)
[95579.029638] ata4: limiting SATA link speed to <unknown>
[95584.352575] ata4: hard resetting link
[95584.661711] ata4: SATA link down (SStatus 0 SControl 3F0)
[95584.661717] ata4.00: disable device
[95584.661725] ahci 0000:0b:00.0: port does not support device sleep
[95584.661743] sd 3:0:0:0: [sda] tag#2 FAILED Result: hostbyte=DID_OK driverbyte=DRIVER_OK cmd_age=11s
[95584.661747] sd 3:0:0:0: [sda] tag#2 Sense Key : Not Ready [current] 
[95584.661749] sd 3:0:0:0: [sda] tag#2 Add. Sense: Logical unit not ready, hard reset required
[95584.661752] sd 3:0:0:0: [sda] tag#2 CDB: Write(10) 2a 00 01 bf 54 80 00 00 80 00
[95584.661754] I/O error, dev sda, sector 29316224 op 0x1:(WRITE) flags 0x0 phys_seg 5 prio class 2
[95584.661767] sd 3:0:0:0: [sda] tag#16 FAILED Result: hostbyte=DID_OK driverbyte=DRIVER_OK cmd_age=11s
[95584.661770] sd 3:0:0:0: [sda] tag#16 Sense Key : Not Ready [current] 
[95584.661771] sd 3:0:0:0: [sda] tag#16 Add. Sense: Logical unit not ready, hard reset required
[95584.661773] sd 3:0:0:0: [sda] tag#16 CDB: Write(10) 2a 00 01 c4 84 80 00 00 80 00
[95584.661775] I/O error, dev sda, sector 29656192 op 0x1:(WRITE) flags 0x0 phys_seg 16 prio class 2
[95584.661782] sd 3:0:0:0: [sda] tag#20 FAILED Result: hostbyte=DID_OK driverbyte=DRIVER_OK cmd_age=11s
[95584.661784] sd 3:0:0:0: [sda] tag#20 Sense Key : Not Ready [current] 
[95584.661786] sd 3:0:0:0: [sda] tag#20 Add. Sense: Logical unit not ready, hard reset required
[95584.661787] sd 3:0:0:0: [sda] tag#20 CDB: Write(10) 2a 00 01 c8 bf 00 00 00 80 00
[95584.661789] I/O error, dev sda, sector 29933312 op 0x1:(WRITE) flags 0x0 phys_seg 8 prio class 2
[95584.661795] sd 3:0:0:0: [sda] tag#21 FAILED Result: hostbyte=DID_OK driverbyte=DRIVER_OK cmd_age=11s
[95584.661797] sd 3:0:0:0: [sda] tag#21 Sense Key : Not Ready [current] 
[95584.661799] sd 3:0:0:0: [sda] tag#21 Add. Sense: Logical unit not ready, hard reset required
[95584.661801] sd 3:0:0:0: [sda] tag#21 CDB: Write(10) 2a 00 01 cd 02 80 00 00 80 00
[95584.661801] sd 3:0:0:0: rejecting I/O to offline device
[95584.661802] I/O error, dev sda, sector 30212736 op 0x1:(WRITE) flags 0x0 phys_seg 16 prio class 2
[95584.661804] I/O error, dev sda, sector 29656448 op 0x1:(WRITE) flags 0x0 phys_seg 5 prio class 2
[95584.661809] sd 3:0:0:0: [sda] tag#22 FAILED Result: hostbyte=DID_OK driverbyte=DRIVER_OK cmd_age=11s
[95584.661811] sd 3:0:0:0: [sda] tag#22 Sense Key : Not Ready [current] 
[95584.661813] sd 3:0:0:0: [sda] tag#22 Add. Sense: Logical unit not ready, hard reset required
[95584.661815] sd 3:0:0:0: [sda] tag#22 CDB: Write(10) 2a 00 01 c4 85 00 00 00 80 00
[95584.661816] I/O error, dev sda, sector 29656320 op 0x1:(WRITE) flags 0x0 phys_seg 5 prio class 2
[95584.661821] I/O error, dev sda, sector 29316480 op 0x1:(WRITE) flags 0x0 phys_seg 5 prio class 2
[95584.661825] sd 3:0:0:0: [sda] tag#23 FAILED Result: hostbyte=DID_OK driverbyte=DRIVER_OK cmd_age=11s
[95584.661827] sd 3:0:0:0: [sda] tag#23 Sense Key : Not Ready [current] 
[95584.661830] sd 3:0:0:0: [sda] tag#23 Add. Sense: Logical unit not ready, hard reset required
[95584.661832] sd 3:0:0:0: [sda] tag#23 CDB: Write(10) 2a 00 01 bf 55 00 00 00 80 00
[95584.661834] I/O error, dev sda, sector 29316352 op 0x1:(WRITE) flags 0x0 phys_seg 16 prio class 2
[95584.661840] I/O error, dev sda, sector 29933568 op 0x1:(WRITE) flags 0x0 phys_seg 8 prio class 2
[95584.661842] sd 3:0:0:0: [sda] tag#24 FAILED Result: hostbyte=DID_OK driverbyte=DRIVER_OK cmd_age=11s
[95584.661845] sd 3:0:0:0: [sda] tag#24 Sense Key : Not Ready [current] 
[95584.661847] sd 3:0:0:0: [sda] tag#24 Add. Sense: Logical unit not ready, hard reset required
[95584.661847] I/O error, dev sda, sector 30212992 op 0x1:(WRITE) flags 0x0 phys_seg 5 prio class 2
[95584.661849] sd 3:0:0:0: [sda] tag#24 CDB: Write(10) 2a 00 01 c8 bf 80 00 00 80 00
[95584.661857] sd 3:0:0:0: [sda] tag#25 FAILED Result: hostbyte=DID_OK driverbyte=DRIVER_OK cmd_age=11s
[95584.661860] sd 3:0:0:0: [sda] tag#25 Sense Key : Not Ready [current] 
[95584.661863] sd 3:0:0:0: [sda] tag#25 Add. Sense: Logical unit not ready, hard reset required
[95584.661865] sd 3:0:0:0: [sda] tag#25 CDB: Write(10) 2a 00 01 cd 03 00 00 00 80 00
[95584.661874] ata4: EH complete
[95584.661887] ata4.00: detaching (SCSI 3:0:0:0)
[95584.677618] sd 3:0:0:0: [sda] Synchronizing SCSI cache
[95584.677636] sd 3:0:0:0: [sda] Synchronize Cache(10) failed: Result: hostbyte=DID_BAD_TARGET driverbyte=DRIVER_OK
```
we have some btrfs error inside kworkers (loops like :)

```
sda: rw=1, sector=159471360, nr_sectors = 128 limit=0
[95721.567311] kworker/u64:30: attempt to access beyond end of device
               sda: rw=1, sector=156268544, nr_sectors = 56 limit=0
[95721.567311] kworker/u64:7: attempt to access beyond end of device
               sda: rw=1, sector=159471488, nr_sectors = 128 limit=0
[95721.567377] kworker/u64:2: attempt to access beyond end of device
               sda: rw=1, sector=156268416, nr_sectors = 128 limit=0
[95721.568513] kworker/u64:23: attempt to access beyond end of device
               sda: rw=0, sector=231665920, nr_sectors = 128 limit=0
[95721.568543] kworker/u64:1: attempt to access beyond end of device
               sda: rw=0, sector=231664640, nr_sectors = 128 limit=0
[95721.568589] kworker/u64:24: attempt to access beyond end of device
               sda: rw=1, sector=156268600, nr_sectors = 72 limit=0
[95722.202102] BTRFS error (device nvme2n1): bdev /dev/sda errs: wr 14, rd 2, flush 5, corrupt 0, gen 0
[95722.204499] BTRFS warning (device nvme2n1): lost super block write due to IO error on /dev/sda (-5)
[95722.204503] BTRFS error (device nvme2n1): bdev /dev/sda errs: wr 15, rd 2, flush 5, corrupt 0, gen 0
[95722.204507] BTRFS warning (device nvme2n1): lost super block write due to IO error on /dev/sda (-5)
[95722.204509] BTRFS error (device nvme2n1): bdev /dev/sda errs: wr 16, rd 2, flush 5, corrupt 0, gen 0
[95722.204512] BTRFS warning (device nvme2n1): lost super block write due to IO error on /dev/sda (-5)
[95722.204513] BTRFS error (device nvme2n1): bdev /dev/sda errs: wr 17, rd 2, flush 5, corrupt 0, gen 0
[95722.204543] BTRFS error (device nvme2n1): error writing primary super block to device 3
[95726.568109] bio_check_eod: 33517 callbacks suppressed
[95726.568112] kworker/u64:6: attempt to access beyond end of device
               sda: rw=1, sector=156597680, nr_sectors = 40 limit=0
[95726.568149] kworker/u64:4: attempt to access beyond end of device
               sda: rw=0, sector=156598400, nr_sectors = 128 limit=0
[95726.568177] kworker/u64:7: attempt to access beyond end of device
               sda: rw=0, sector=156598528, nr_sectors = 128 limit=0
[95726.568274] kworker/u64:21: attempt to access beyond end of device
               sda: rw=0, sector=231664640, nr_sectors = 128 limit=0
[95726.568364] kworker/u64:10: attempt to access beyond end of device
               sda: rw=1, sector=156598144, nr_sectors = 128 limit=0
[95726.568554] kworker/u64:30: attempt to access beyond end of device
```

after rsync

```
常轨脱离Creative/savedata/saveg.dat
         39.03K 100%  624.84kB/s    0:00:00 (xfr#109450, to-chk=2/124122)
常轨脱离Creative/savedata/steam_autocloud.vdf
             52 100%    0.83kB/s    0:00:00 (xfr#109451, to-chk=1/124122)
常轨脱离Creative/savedata/system.dat
          5.73K 100%   91.80kB/s    0:00:00 (xfr#109452, to-chk=0/124122)

Number of files: 124,122 (reg: 109,452, dir: 7,726, link: 6,944)
Number of created files: 124,122 (reg: 109,452, dir: 7,726, link: 6,944)
Number of deleted files: 0
Number of regular files transferred: 109,452
Total file size: 248.10G bytes
Total transferred file size: 248.10G bytes
Literal data: 248.10G bytes
Matched data: 0 bytes
File list size: 3.47M
File list generation time: 0.001 seconds
File list transfer time: 0.000 seconds
Total bytes sent: 248.17G
Total bytes received: 2.14M

sent 248.17G bytes  received 2.14M bytes  884.74M bytes/sec
total size is 248.10G  speedup is 1.00
```

```
# btrfs filesystem show /mnt
Label: none  uuid: 042ff1af-35d1-4c95-b329-e3e2d06ca6a7
	Total devices 3 FS bytes used 207.86GiB
	devid    1 size 931.51GiB used 107.35GiB path /dev/nvme2n1
	devid    2 size 931.51GiB used 107.35GiB path /dev/nvme1n1
	devid    3 size 0 used 0 path /dev/sda MISSING
```
```
Overall:
    Device size:		  2.73TiB
    Device allocated:		322.05GiB
    Device unallocated:		  2.41TiB
    Device missing:		931.51GiB
    Device slack:		    0.00B
    Used:			311.79GiB
    Free (estimated):		  1.62TiB	(min: 1.62TiB)
    Free (statfs, df):		  1.62TiB
    Data ratio:			     1.50
    Metadata ratio:		     1.50
    Global reserve:		234.36MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:214.00GiB, Used:207.55GiB (96.98%)
   /dev/nvme2n1	107.00GiB
   /dev/nvme1n1	107.00GiB
   /dev/sda	107.00GiB

Metadata,RAID5: Size:682.62MiB, Used:322.14MiB (47.19%)
   /dev/nvme2n1	341.31MiB
   /dev/nvme1n1	341.31MiB
   /dev/sda	341.31MiB

System,RAID5: Size:32.00MiB, Used:48.00KiB (0.15%)
   /dev/nvme2n1	 16.00MiB
   /dev/nvme1n1	 16.00MiB
   /dev/sda	 16.00MiB

Unallocated:
   /dev/nvme2n1	824.16GiB
   /dev/nvme1n1	824.16GiB
   /dev/sda	824.16GiB
```

reboot and reconnect:

```
sudo btrfs filesystem show /mnt/                     
Label: none  uuid: 042ff1af-35d1-4c95-b329-e3e2d06ca6a7
	Total devices 3 FS bytes used 207.86GiB
	devid    1 size 931.51GiB used 107.35GiB path /dev/nvme1n1
	devid    2 size 931.51GiB used 107.35GiB path /dev/nvme2n1
	devid    3 size 931.51GiB used 107.35GiB path /dev/sda

% sudo btrfs device stats /mnt    
[/dev/nvme1n1].write_io_errs    0
[/dev/nvme1n1].read_io_errs     0
[/dev/nvme1n1].flush_io_errs    0
[/dev/nvme1n1].corruption_errs  0
[/dev/nvme1n1].generation_errs  0
[/dev/nvme2n1].write_io_errs    0
[/dev/nvme2n1].read_io_errs     0
[/dev/nvme2n1].flush_io_errs    0
[/dev/nvme2n1].corruption_errs  0
[/dev/nvme2n1].generation_errs  0
[/dev/sda].write_io_errs    27
[/dev/sda].read_io_errs     3
[/dev/sda].flush_io_errs    8
[/dev/sda].corruption_errs  0
[/dev/sda].generation_errs  0
```

start scurb

```
sudo btrfs scrub status -d /mnt
UUID:             042ff1af-35d1-4c95-b329-e3e2d06ca6a7

Scrub device /dev/nvme1n1 (id 1) status
Scrub started:    Wed May 21 21:07:14 2025
Status:           running
Duration:         0:00:10
Time left:        3:56:08
ETA:              Thu May 22 01:03:34 2025
Total to scrub:   107.35GiB
Bytes scrubbed:   77.53MiB  (0.07%)
Rate:             7.75MiB/s
Error summary:    no errors found

Scrub device /dev/nvme2n1 (id 2) status
Scrub started:    Wed May 21 21:07:14 2025
Status:           running
Duration:         0:00:10
Time left:        3:55:19
ETA:              Thu May 22 01:02:45 2025
Total to scrub:   107.35GiB
Bytes scrubbed:   77.80MiB  (0.07%)
Rate:             7.78MiB/s
Error summary:    no errors found

Scrub device /dev/sda (id 3) status
Scrub started:    Wed May 21 21:07:14 2025
Status:           running
Duration:         0:00:10
Time left:        1:38:46
ETA:              Wed May 21 22:46:12 2025
Total to scrub:   107.35GiB
Bytes scrubbed:   185.16MiB  (0.17%)
Rate:             18.52MiB/s
Error summary:    super=3 verify=12172 csum=10356
  Corrected:      22528
  Uncorrectable:  0
  Unverified:     0
```

iostat
```
% iostat -dh /dev/disk/by-id/*                               
Linux 6.14.6-zen1-1-zen (g36archPC) 	05/21/2025 	_x86_64_	(16 CPU)

      tps    kB_read/s    kB_wrtn/s    kB_dscd/s    kB_read    kB_wrtn    kB_dscd Device
   166.79        11.0M       585.8k         4.4M       6.2G     331.9M       2.5G nvme0n1
     2.37         4.4k         0.0k         0.0k       2.5M       0.5k       0.0k nvme0n1p1
   164.10        11.0M       585.8k         4.4M       6.2G     331.9M       2.5G nvme0n1p2
  1130.11        74.5M         6.9k         0.0k      42.2G       3.9M       0.0k nvme1n1
  1186.83        74.5M         6.9k         0.0k      42.2G       3.9M       0.0k nvme2n1
  1190.28        69.1M        18.1M         0.0k      39.2G      10.3G       0.0k sda
```


#### dmesg

```
[  126.337606] bridge: filtering via arp/ip/ip6tables is no longer available by default. Update your scripts to load br_netfilter if you need this.
[  129.823179] BTRFS info (device nvme1n1): first mount of filesystem 042ff1af-35d1-4c95-b329-e3e2d06ca6a7
[  129.823197] BTRFS info (device nvme1n1): using crc32c (crc32c-x86) checksum algorithm
[  129.823201] BTRFS info (device nvme1n1): using free-space-tree
[  129.825605] BTRFS error (device nvme1n1): bad tree block start, mirror 1 want 444891136 have 0
[  129.854041] BTRFS info (device nvme1n1): read error corrected: ino 0 off 444891136 (dev /dev/sda sector 415040)
[  129.854070] BTRFS info (device nvme1n1): read error corrected: ino 0 off 444895232 (dev /dev/sda sector 415048)
[  129.854098] BTRFS info (device nvme1n1): read error corrected: ino 0 off 444899328 (dev /dev/sda sector 415056)
[  129.854124] BTRFS info (device nvme1n1): read error corrected: ino 0 off 444903424 (dev /dev/sda sector 415064)
[  129.855181] BTRFS info (device nvme1n1): bdev /dev/sda errs: wr 27, rd 3, flush 8, corrupt 0, gen 0
[  129.863796] BTRFS error (device nvme1n1): bad tree block start, mirror 1 want 446824448 have 0
[  129.891785] BTRFS info (device nvme1n1): read error corrected: ino 0 off 446824448 (dev /dev/sda sector 416896)
[  129.891816] BTRFS info (device nvme1n1): read error corrected: ino 0 off 446828544 (dev /dev/sda sector 416904)
[  129.891842] BTRFS info (device nvme1n1): read error corrected: ino 0 off 446832640 (dev /dev/sda sector 416912)
[  129.891869] BTRFS info (device nvme1n1): read error corrected: ino 0 off 446836736 (dev /dev/sda sector 416920)
[  129.909057] BTRFS error (device nvme1n1): bad tree block start, mirror 1 want 308838400 have 0
[  129.924753] BTRFS info (device nvme1n1): read error corrected: ino 0 off 308838400 (dev /dev/sda sector 282176)
[  129.924785] BTRFS info (device nvme1n1): read error corrected: ino 0 off 308842496 (dev /dev/sda sector 282184)
[  129.924933] BTRFS error (device nvme1n1): bad tree block start, mirror 1 want 307281920 have 0
[  129.950678] BTRFS error (device nvme1n1): parent transid verify failed on logical 297811968 mirror 1 wanted 176 found 46
[  129.966782] BTRFS error (device nvme1n1): bad tree block start, mirror 1 want 351715328 have 0
[  129.983331] BTRFS error (device nvme1n1): bad tree block start, mirror 1 want 433815552 have 0
[  129.999786] BTRFS error (device nvme1n1): bad tree block start, mirror 1 want 355172352 have 0
[  130.015786] BTRFS error (device nvme1n1): parent transid verify failed on logical 355549184 mirror 1 wanted 177 found 46
[  130.031728] BTRFS error (device nvme1n1): bad tree block start, mirror 1 want 433831936 have 0
[  130.047916] BTRFS error (device nvme1n1): bad tree block start, mirror 1 want 433881088 have 0
[  130.065826] BTRFS error (device nvme1n1): bad tree block start, mirror 1 want 444792832 have 0
[  147.653332] BTRFS info (device nvme1n1): last unmount of filesystem 042ff1af-35d1-4c95-b329-e3e2d06ca6a7
[  156.065961] BTRFS info (device nvme1n1): first mount of filesystem 042ff1af-35d1-4c95-b329-e3e2d06ca6a7
[  156.065978] BTRFS info (device nvme1n1): using crc32c (crc32c-x86) checksum algorithm
[  156.065983] BTRFS info (device nvme1n1): using free-space-tree
[  156.069376] BTRFS info (device nvme1n1): bdev /dev/sda errs: wr 27, rd 3, flush 8, corrupt 0, gen 0
[  241.219666] BTRFS info (device nvme1n1): scrub: started on devid 1
[  241.262543] BTRFS info (device nvme1n1): scrub: started on devid 2
[  241.262547] BTRFS info (device nvme1n1): scrub: started on devid 3
[  241.290970] BTRFS error (device nvme1n1): super block at physical 65536 devid 3 has bad generation 171 expect 180
[  241.299209] BTRFS error (device nvme1n1): super block at physical 67108864 devid 3 has bad generation 171 expect 180
[  241.320097] BTRFS error (device nvme1n1): super block at physical 274877906944 devid 3 has bad generation 171 expect 180
[  242.355604] BTRFS error (device nvme1n1): parent transid verify failed on logical 301694976 mirror 1 wanted 176 found 46
[  242.355998] btrfs_repair_io_failure: 42 callbacks suppressed
[  242.355999] BTRFS info (device nvme1n1): read error corrected: ino 0 off 301694976 (dev /dev/sda sector 275136)
[  242.356073] BTRFS info (device nvme1n1): read error corrected: ino 0 off 301699072 (dev /dev/sda sector 275144)
[  242.356098] BTRFS info (device nvme1n1): read error corrected: ino 0 off 301703168 (dev /dev/sda sector 275152)
[  242.356121] BTRFS info (device nvme1n1): read error corrected: ino 0 off 301707264 (dev /dev/sda sector 275160)
[  242.415872] BTRFS error (device nvme1n1): parent transid verify failed on logical 301727744 mirror 1 wanted 176 found 46
[  242.443206] BTRFS info (device nvme1n1): read error corrected: ino 0 off 301727744 (dev /dev/sda sector 275200)
[  242.443234] BTRFS info (device nvme1n1): read error corrected: ino 0 off 301731840 (dev /dev/sda sector 275208)
[  242.443261] BTRFS info (device nvme1n1): read error corrected: ino 0 off 301735936 (dev /dev/sda sector 275216)
[  242.443288] BTRFS info (device nvme1n1): read error corrected: ino 0 off 301740032 (dev /dev/sda sector 275224)
[  242.473974] BTRFS warning (device nvme1n1): tree block 120782848 mirror 1 has bad bytenr, has 0 want 120782848
[  242.473977] BTRFS warning (device nvme1n1): tree block 120799232 mirror 1 has bad bytenr, has 0 want 120799232
[  242.473978] BTRFS warning (device nvme1n1): tree block 120848384 mirror 1 has bad generation, has 101 want 172
[  242.473983] BTRFS warning (device nvme1n1): tree block 120815616 mirror 1 has bad generation, has 47 want 172
[  242.473985] BTRFS warning (device nvme1n1): tree block 120864768 mirror 1 has bad generation, has 101 want 172
[  242.473987] BTRFS warning (device nvme1n1): tree block 120832000 mirror 1 has bad generation, has 47 want 172
[  242.473990] BTRFS warning (device nvme1n1): tree block 120881152 mirror 1 has bad generation, has 101 want 172
[  242.473994] BTRFS warning (device nvme1n1): tree block 120897536 mirror 1 has bad generation, has 101 want 172
```
```
% sudo btrfs scrub status -dR /mnt/
UUID:             042ff1af-35d1-4c95-b329-e3e2d06ca6a7

Scrub device /dev/nvme1n1 (id 1) status
Scrub started:    Wed May 21 21:07:14 2025
Status:           running
Duration:         0:09:01
	data_extents_scrubbed: 202472
	tree_extents_scrubbed: 6861
	data_bytes_scrubbed: 13265252352
	tree_bytes_scrubbed: 112410624
	read_errors: 0
	csum_errors: 0
	verify_errors: 0
	no_csum: 0
	csum_discards: 0
	super_errors: 0
	malloc_errors: 0
	uncorrectable_errors: 0
	unverified_errors: 0
	corrected_errors: 0
	last_physical: 20313473024

Scrub device /dev/nvme2n1 (id 2) status
Scrub started:    Wed May 21 21:07:14 2025
Status:           running
Duration:         0:09:01
	data_extents_scrubbed: 202516
	tree_extents_scrubbed: 6878
	data_bytes_scrubbed: 13267357696
	tree_bytes_scrubbed: 112689152
	read_errors: 0
	csum_errors: 0
	verify_errors: 0
	no_csum: 0
	csum_discards: 0
	super_errors: 0
	malloc_errors: 0
	uncorrectable_errors: 0
	unverified_errors: 0
	corrected_errors: 0
	last_physical: 20296957952

Scrub device /dev/sda (id 3) status
Scrub started:    Wed May 21 21:07:14 2025
Status:           running
Duration:         0:09:01
	data_extents_scrubbed: 349619
	tree_extents_scrubbed: 6878
	data_bytes_scrubbed: 22907531264
	tree_bytes_scrubbed: 112689152
	read_errors: 0
	csum_errors: 3363472
	verify_errors: 12172
	no_csum: 0
	csum_discards: 0
	super_errors: 3
	malloc_errors: 0
	uncorrectable_errors: 0
	unverified_errors: 0
	corrected_errors: 3375644
	last_physical: 34771697664
```

#### finished and it seems faster then expeted

```
~
% sudo btrfs scrub status -d /mnt/
[sudo] password for g36maid: 
UUID:             042ff1af-35d1-4c95-b329-e3e2d06ca6a7

Scrub device /dev/nvme1n1 (id 1) history
Scrub started:    Wed May 21 21:07:14 2025
Status:           finished
Duration:         0:43:52
Total to scrub:   69.29GiB
Rate:             26.96MiB/s
Error summary:    no errors found

Scrub device /dev/nvme2n1 (id 2) history
Scrub started:    Wed May 21 21:07:14 2025
Status:           finished
Duration:         0:43:50
Total to scrub:   69.29GiB
Rate:             26.98MiB/s
Error summary:    no errors found

Scrub device /dev/sda (id 3) history
Scrub started:    Wed May 21 21:07:14 2025
Status:           finished
Duration:         0:34:02
Total to scrub:   69.28GiB
Rate:             34.74MiB/s
Error summary:    super=3 verify=12172 csum=13814411
  Corrected:      13826583
  Uncorrectable:  0
  Unverified:     0
```

#### balance 
```

~
% sudo btrfs balance start /mnt/
[sudo] password for g36maid: 
WARNING:

	Full balance without filters requested. This operation is very
	intense and takes potentially very long. It is recommended to
	use the balance filters to narrow down the scope of balance.
	Use 'btrfs balance start --full-balance' option to skip this
	warning. The operation will start in 10 seconds.
	Use Ctrl-C to stop it.
10 9 8 7 6 5 4 3 2 1
Starting balance without any filters.
Done, had to relocate 109 out of 109 chunks

~ took 9m42s
% 
```
```
[75317.293721] BTRFS info (device nvme1n1): balance: start -d -m -s
[75317.310552] BTRFS info (device nvme1n1): relocating block group 916757020672 flags system|raid5
~~~
[75879.053422] BTRFS info (device nvme1n1): relocating block group 686875607040 flags data|raid5
[75884.383412] BTRFS info (device nvme1n1): found 25 extents, stage: move data extents
[75884.454287] BTRFS info (device nvme1n1): found 25 extents, stage: update data pointers
[75884.514163] BTRFS info (device nvme1n1): relocating block group 38797312 flags metadata|raid5
[75887.154731] BTRFS info (device nvme1n1): found 21078 extents, stage: move data extents
[75887.829586] BTRFS info (device nvme1n1): balance: ended with status: 0
```


### Btrfs - Data corruption during file transfer

same rsync command:
then:
```
% dd if=/dev/urandom of=/dev/disk/by-id/ata-CT1000MX500SSD1_2302E69CE85A seek=100000 count=1000 bs=1k 
```
nothing happend 
it seems automatically fixed it,
```
~
% sudo btrfs device stats /mnt                                                                             
[/dev/nvme1n1].write_io_errs    0
[/dev/nvme1n1].read_io_errs     0
[/dev/nvme1n1].flush_io_errs    0
[/dev/nvme1n1].corruption_errs  0
[/dev/nvme1n1].generation_errs  0
[/dev/nvme2n1].write_io_errs    0
[/dev/nvme2n1].read_io_errs     0
[/dev/nvme2n1].flush_io_errs    0
[/dev/nvme2n1].corruption_errs  0
[/dev/nvme2n1].generation_errs  0
[/dev/sda].write_io_errs    0
[/dev/sda].read_io_errs     0
[/dev/sda].flush_io_errs    0
[/dev/sda].corruption_errs  0
[/dev/sda].generation_errs  0
```

### Btrfs - The dd mistake
`sudo dd if=/dev/urandom of=/dev/sda bs=1k`
also seems nothing happend
```
% sudo btrfs filesystem usage /mnt/                                                                        
Overall:
    Device size:		  2.73TiB
    Device allocated:		322.55GiB
    Device unallocated:		  2.41TiB
    Device missing:		    0.00B
    Device slack:		    0.00B
    Used:			314.33GiB
    Free (estimated):		  1.61TiB	(min: 1.61TiB)
    Free (statfs, df):		  1.61TiB
    Data ratio:			     1.50
    Metadata ratio:		     1.50
    Global reserve:		246.34MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:214.00GiB, Used:209.21GiB (97.76%)
   /dev/nvme1n1	107.00GiB
   /dev/nvme2n1	107.00GiB
   /dev/sda	107.00GiB

Metadata,RAID5: Size:1.00GiB, Used:355.59MiB (34.73%)
   /dev/nvme1n1	512.00MiB
   /dev/nvme2n1	512.00MiB
   /dev/sda	512.00MiB

System,RAID5: Size:32.00MiB, Used:48.00KiB (0.15%)
   /dev/nvme1n1	 16.00MiB
   /dev/nvme2n1	 16.00MiB
   /dev/sda	 16.00MiB

Unallocated:
   /dev/nvme1n1	824.00GiB
   /dev/nvme2n1	824.00GiB
   /dev/sda	824.00GiB

~
% sudo btrfs device stats /mnt     
[/dev/nvme1n1].write_io_errs    0
[/dev/nvme1n1].read_io_errs     0
[/dev/nvme1n1].flush_io_errs    0
[/dev/nvme1n1].corruption_errs  0
[/dev/nvme1n1].generation_errs  0
[/dev/nvme2n1].write_io_errs    0
[/dev/nvme2n1].read_io_errs     0
[/dev/nvme2n1].flush_io_errs    0
[/dev/nvme2n1].corruption_errs  0
[/dev/nvme2n1].generation_errs  0
[/dev/sda].write_io_errs    0
[/dev/sda].read_io_errs     0
[/dev/sda].flush_io_errs    0
[/dev/sda].corruption_errs  0
[/dev/sda].generation_errs  0

~
% 

```

Btrfs - The "write hole" issue

cant repoduce the write hole porblem , try any effort

so it seems actually fix the write hole problems on RAID5 (RAID6 is not)


## 2025-05-24

add new disk
```
lrwxrwxrwx 1  9 May 24 16:09 ata-CT1000MX500SSD1_2302E69CE85A -> ../../sda
lrwxrwxrwx 1  9 May 24 16:09 ata-ST1000LM048-2E7172_WKP88RND -> ../../sdb
lrwxrwxrwx 1 13 May 24 16:09 nvme-CT1000P2SSD8_2224E63BD62A -> ../../nvme2n1
lrwxrwxrwx 1 13 May 24 16:09 nvme-CT1000P2SSD8_2224E63BD62A_1 -> ../../nvme2n1
lrwxrwxrwx 1 13 May 24 16:09 nvme-eui.e8238fa6bf530001001b444a49831c51 -> ../../nvme1n1
lrwxrwxrwx 1 13 May 24 16:09 nvme-nvme.144d-5332474d4e4341474233353234374a-53616d73756e6720535344203935302050524f203531324742-00000001 -> ../../nvme0n1
lrwxrwxrwx 1 15 May 24 16:09 nvme-nvme.144d-5332474d4e4341474233353234374a-53616d73756e6720535344203935302050524f203531324742-00000001-part1 -> ../../nvme0n1p1
lrwxrwxrwx 1 15 May 24 16:09 nvme-nvme.144d-5332474d4e4341474233353234374a-53616d73756e6720535344203935302050524f203531324742-00000001-part2 -> ../../nvme0n1p2
lrwxrwxrwx 1 13 May 24 16:09 nvme-nvme.c0a9-323232344536334244363241-435431303030503253534438-00000001 -> ../../nvme2n1
lrwxrwxrwx 1 13 May 24 16:09 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J -> ../../nvme0n1
lrwxrwxrwx 1 13 May 24 16:09 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J_1 -> ../../nvme0n1
lrwxrwxrwx 1 15 May 24 16:09 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J_1-part1 -> ../../nvme0n1p1
lrwxrwxrwx 1 15 May 24 16:09 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J_1-part2 -> ../../nvme0n1p2
lrwxrwxrwx 1 15 May 24 16:09 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J-part1 -> ../../nvme0n1p1
lrwxrwxrwx 1 15 May 24 16:09 nvme-Samsung_SSD_950_PRO_512GB_S2GMNCAGB35247J-part2 -> ../../nvme0n1p2
lrwxrwxrwx 1 13 May 24 16:09 nvme-WD_BLACK_SN750_SE_1TB_21321D446703 -> ../../nvme1n1
lrwxrwxrwx 1 13 May 24 16:09 nvme-WD_BLACK_SN750_SE_1TB_21321D446703_1 -> ../../nvme1n1
lrwxrwxrwx 1  9 May 24 16:09 wwn-0x5000c500cf77e970 -> ../../sdb
lrwxrwxrwx 1  9 May 24 16:09 wwn-0x500a0751e69ce85a -> ../../sda
```

btrfs device add /dev/sdb /mnt/storage

```
Overall:
    Device size:		  3.64TiB
    Device allocated:		359.06GiB
    Device unallocated:		  3.29TiB
    Device missing:		    0.00B
    Device slack:		    0.00B
    Used:			351.00GiB
    Free (estimated):		  2.20TiB	(min: 1.65TiB)
    Free (statfs, df):		  2.38TiB
    Data ratio:			     1.50
    Metadata ratio:		     2.00
    Global reserve:		298.91MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:238.00GiB, Used:233.46GiB (98.09%)
   /dev/nvme1n1	119.00GiB
   /dev/nvme2n1	119.00GiB
   /dev/sda	119.00GiB

Metadata,RAID1: Size:1.00GiB, Used:415.73MiB (40.60%)
   /dev/nvme1n1	  1.00GiB
   /dev/nvme2n1	  1.00GiB

System,RAID1: Size:32.00MiB, Used:48.00KiB (0.15%)
   /dev/nvme1n1	 32.00MiB
   /dev/sda	 32.00MiB

Unallocated:
   /dev/nvme1n1	811.48GiB
   /dev/nvme2n1	811.51GiB
   /dev/sda	812.48GiB
   /dev/sdb	931.51GiB
```
rebalence

error happends

the dev/sda is missing

reboot

the dev/sdb is missing
```
% sudo btrfs filesystem usage /mnt                              
Overall:
    Device size:		  3.64TiB
    Device allocated:		363.06GiB
    Device unallocated:		  3.28TiB
    Device missing:		931.51GiB
    Device slack:		    0.00B
    Used:			350.52GiB
    Free (estimated):		  2.20TiB	(min: 1.65TiB)
    Free (statfs, df):		  1.59TiB
    Data ratio:			     1.50
    Metadata ratio:		     2.00
    Global reserve:		298.78MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:241.00GiB, Used:233.46GiB (96.87%)
   /dev/nvme1n1	120.00GiB
   /dev/nvme2n1	120.00GiB
   /dev/sda	120.00GiB
   missing	  1.00GiB

Metadata,RAID1: Size:1.00GiB, Used:415.61MiB (40.59%)
   /dev/nvme1n1	  1.00GiB
   missing	  1.00GiB

System,RAID1: Size:32.00MiB, Used:48.00KiB (0.15%)
   /dev/nvme2n1	 32.00MiB
   missing	 32.00MiB

Unallocated:
   /dev/nvme1n1	810.51GiB
   /dev/nvme2n1	811.48GiB
   /dev/sda	811.51GiB
   missing	929.48GiB
   ```
   
   ```
   sudo btrfs device remove missing /mnt 

~ took 6s
% sudo btrfs filesystem usage /mnt     
Overall:
    Device size:		  2.73TiB
    Device allocated:		359.06GiB
    Device unallocated:		  2.38TiB
    Device missing:		    0.00B
    Device slack:		    0.00B
    Used:			351.00GiB
    Free (estimated):		  1.59TiB	(min: 1.19TiB)
    Free (statfs, df):		  1.59TiB
    Data ratio:			     1.50
    Metadata ratio:		     2.00
    Global reserve:		298.78MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:238.00GiB, Used:233.46GiB (98.09%)
   /dev/nvme1n1	119.00GiB
   /dev/nvme2n1	119.00GiB
   /dev/sda	119.00GiB

Metadata,RAID1: Size:1.00GiB, Used:415.61MiB (40.59%)
   /dev/nvme2n1	  1.00GiB
   /dev/sda	  1.00GiB

System,RAID1: Size:32.00MiB, Used:48.00KiB (0.15%)
   /dev/nvme2n1	 32.00MiB
   /dev/sda	 32.00MiB

Unallocated:
   /dev/nvme1n1	812.51GiB
   /dev/nvme2n1	811.48GiB
   /dev/sda	811.48GiB

~
% sudo btrfs balance start /mnt                   
   ```
   
   
重新拔差又回來了
```
% sudo btrfs filesystem usage /mnt   
Overall:
    Device size:		  3.64TiB
    Device allocated:		359.06GiB
    Device unallocated:		  3.29TiB
    Device missing:		    0.00B
    Device slack:		    0.00B
    Used:			351.00GiB
    Free (estimated):		  2.20TiB	(min: 1.65TiB)
    Free (statfs, df):		  2.38TiB
    Data ratio:			     1.50
    Metadata ratio:		     2.00
    Global reserve:		296.33MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:238.00GiB, Used:233.46GiB (98.09%)
   /dev/nvme2n1	119.00GiB
   /dev/nvme1n1	119.00GiB
   /dev/sdb	119.00GiB

Metadata,RAID1: Size:1.00GiB, Used:413.16MiB (40.35%)
   /dev/nvme2n1	  1.00GiB
   /dev/nvme1n1	  1.00GiB

System,RAID1: Size:32.00MiB, Used:48.00KiB (0.15%)
   /dev/nvme2n1	 32.00MiB
   /dev/sdb	 32.00MiB

Unallocated:
   /dev/nvme2n1	811.48GiB
   /dev/nvme1n1	811.51GiB
   /dev/sdb	812.48GiB
   /dev/sda	931.51GiB

~
% sudo btrfs balance status /mnt  
No balance found on '/mnt'

~
% sudo btrfs balance start /mnt 
WARNING:

	Full balance without filters requested. This operation is very
	intense and takes potentially very long. It is recommended to
	use the balance filters to narrow down the scope of balance.
	Use 'btrfs balance start --full-balance' option to skip this
	warning. The operation will start in 10 seconds.
	Use Ctrl-C to stop it.
10 9 8 7 6 5 4 3 2 1
Starting balance without any filters.
```
```
[  648.829810] BTRFS info (device nvme2n1): balance: start -d -m -s
[  648.829915] BTRFS info (device nvme2n1): relocating block group 967639564288 flags data|raid5
[  672.117958] BTRFS info (device nvme2n1): found 54100 extents, stage: move data extents
[  673.087878] BTRFS info (device nvme2n1): found 54100 extents, stage: update data pointers
[  673.728983] BTRFS info (device nvme2n1): relocating block group 965492080640 flags data|raid5
[  691.359739] BTRFS info (device nvme2n1): found 2084 extents, stage: move data extents
[  691.565324] BTRFS info (device nvme2n1): found 2084 extents, stage: update data pointers
[  691.790167] BTRFS info (device nvme2n1): relocating block group 963344596992 flags data|raid5
[  700.718623] BTRFS info (device nvme2n1): found 16 extents, stage: move data extents
[  701.034935] BTRFS info (device nvme2n1): found 16 extents, stage: update data pointers
[  701.162494] BTRFS info (device nvme2n1): relocating block group 961197113344 flags data|raid5
[  710.511705] BTRFS info (device nvme2n1): found 16 extents, stage: move data extents
[  711.077087] BTRFS info (device nvme2n1): found 16 extents, stage: update data pointers
[  711.204960] BTRFS info (device nvme2n1): relocating block group 959049629696 flags data|raid5
[  721.100058] BTRFS info (device nvme2n1): found 16 extents, stage: move data extents
[  721.455327] BTRFS info (device nvme2n1): found 16 extents, stage: update data pointers
[  722.101960] BTRFS info (device nvme2n1): relocating block group 956902146048 flags data|raid5
[  732.271240] BTRFS info (device nvme2n1): found 20 extents, stage: move data extents
[  732.658565] BTRFS info (device nvme2n1): found 20 extents, stage: update data pointers
[  732.841569] BTRFS info (device nvme2n1): relocating block group 954754662400 flags data|raid5
[  742.589223] BTRFS info (device nvme2n1): found 19 extents, stage: move data extents
[  743.052409] BTRFS info (device nvme2n1): found 19 extents, stage: update data pointers
[  743.179302] BTRFS info (device nvme2n1): relocating block group 952607178752 flags data|raid5
[  753.553699] BTRFS info (device nvme2n1): found 16 extents, stage: move data extents
[  753.713396] BTRFS info (device nvme2n1): found 16 extents, stage: update data pointers
[  753.851719] BTRFS info (device nvme2n1): relocating block group 950459695104 flags data|raid5
[  764.188849] BTRFS info (device nvme2n1): found 28 extents, stage: move data extents
[  764.399437] BTRFS info (device nvme2n1): found 28 extents, stage: update data pointers
[  764.547073] BTRFS info (device nvme2n1): relocating block group 948312211456 flags data|raid5
[  775.044513] BTRFS info (device nvme2n1): found 27 extents, stage: move data extents
[  775.413945] BTRFS info (device nvme2n1): found 27 extents, stage: update data pointers
[  775.541879] BTRFS info (device nvme2n1): relocating block group 946164727808 flags data|raid5

```
```
% sudo btrfs balance start /mnt 
WARNING:

	Full balance without filters requested. This operation is very
	intense and takes potentially very long. It is recommended to
	use the balance filters to narrow down the scope of balance.
	Use 'btrfs balance start --full-balance' option to skip this
	warning. The operation will start in 10 seconds.
	Use Ctrl-C to stop it.
10 9 8 7 6 5 4 3 2 1
Starting balance without any filters.
Done, had to relocate 121 out of 121 chunks

~ took 39m39s
```

```
% sudo btrfs filesystem usage /mnt
Overall:
    Device size:		  3.64TiB
    Device allocated:		322.06GiB
    Device unallocated:		  3.32TiB
    Device missing:		    0.00B
    Device slack:		    0.00B
    Used:			312.12GiB
    Free (estimated):		  2.50TiB	(min: 1.67TiB)
    Free (statfs, df):		  2.50TiB
    Data ratio:			     1.33
    Metadata ratio:		     2.00
    Global reserve:		310.39MiB	(used: 0.00B)
    Multiple profiles:		       no

Data,RAID5: Size:240.00GiB, Used:233.46GiB (97.28%)
   /dev/nvme2n1	 80.00GiB
   /dev/nvme1n1	 80.00GiB
   /dev/sdb	 80.00GiB
   /dev/sda	 80.00GiB

Metadata,RAID1: Size:1.00GiB, Used:426.69MiB (41.67%)
   /dev/sdb	  1.00GiB
   /dev/sda	  1.00GiB

System,RAID1: Size:32.00MiB, Used:48.00KiB (0.15%)
   /dev/sdb	 32.00MiB
   /dev/sda	 32.00MiB

Unallocated:
   /dev/nvme2n1	851.51GiB
   /dev/nvme1n1	851.51GiB
   /dev/sdb	850.48GiB
   /dev/sda	850.48GiB

~ took 7s
% 
```

## 2025-05-25
這顆硬碟速度大不如前，因為之前是三顆 SSD 全閃 Raid 
現在加了一顆二手HDD ，瓶頸都在HDD 這邊

start scrub
```
% sudo btrfs scrub status -d /mnt/games
UUID:             0e0524c4-7ae5-4c3b-9728-07c4b5e104dc

Scrub device /dev/nvme1n1 (id 1) history
Scrub started:    Sun May 25 17:48:22 2025
Status:           aborted
Duration:         0:00:00
Total to scrub:   0.00B
Rate:             0.00B/s
Error summary:    no errors found

Scrub device /dev/nvme2n1 (id 2) history
Scrub started:    Sun May 25 17:48:22 2025
Status:           aborted
Duration:         0:00:00
Total to scrub:   128.00KiB
Rate:             128.00KiB/s
Error summary:    no errors found

Scrub device /dev/sdb (id 3) history
Scrub started:    Sun May 25 17:48:22 2025
Status:           aborted
Duration:         0:00:00
Total to scrub:   128.00KiB
Rate:             128.00KiB/s
Error summary:    no errors found

Scrub device /dev/sda (id 4) history
Scrub started:    Sun May 25 17:48:22 2025
Status:           finished
Duration:         0:20:40
Total to scrub:   48.56GiB
Rate:             40.10MiB/s
Error summary:    read=12768640 super=3
  Corrected:      12730616
  Uncorrectable:  38024
  Unverified:     0
 
% sudo btrfs scrub status -d -R /mnt/games
UUID:             0e0524c4-7ae5-4c3b-9728-07c4b5e104dc

Scrub device /dev/nvme1n1 (id 1) history
Scrub started:    Sun May 25 17:48:22 2025
Status:           aborted
Duration:         0:00:00
	data_extents_scrubbed: 0
	tree_extents_scrubbed: 0
	data_bytes_scrubbed: 0
	tree_bytes_scrubbed: 0
	read_errors: 0
	csum_errors: 0
	verify_errors: 0
	no_csum: 0
	csum_discards: 0
	super_errors: 0
	malloc_errors: 0
	uncorrectable_errors: 0
	unverified_errors: 0
	corrected_errors: 0
	last_physical: 1114112

Scrub device /dev/nvme2n1 (id 2) history
Scrub started:    Sun May 25 17:48:22 2025
Status:           aborted
Duration:         0:00:00
	data_extents_scrubbed: 2
	tree_extents_scrubbed: 0
	data_bytes_scrubbed: 131072
	tree_bytes_scrubbed: 0
	read_errors: 0
	csum_errors: 0
	verify_errors: 0
	no_csum: 0
	csum_discards: 0
	super_errors: 0
	malloc_errors: 0
	uncorrectable_errors: 0
	unverified_errors: 0
	corrected_errors: 0
	last_physical: 1179648

Scrub device /dev/sdb (id 3) history
Scrub started:    Sun May 25 17:48:22 2025
Status:           aborted
Duration:         0:00:00
	data_extents_scrubbed: 2
	tree_extents_scrubbed: 0
	data_bytes_scrubbed: 131072
	tree_bytes_scrubbed: 0
	read_errors: 0
	csum_errors: 0
	verify_errors: 0
	no_csum: 0
	csum_discards: 0
	super_errors: 0
	malloc_errors: 0
	uncorrectable_errors: 0
	unverified_errors: 0
	corrected_errors: 0
	last_physical: 34734080

Scrub device /dev/sda (id 4) history
Scrub started:    Sun May 25 17:48:22 2025
Status:           finished
Duration:         0:20:40
	data_extents_scrubbed: 868129
	tree_extents_scrubbed: 23303
	data_bytes_scrubbed: 51762806784
	tree_bytes_scrubbed: 381796352
	read_errors: 12768640
	csum_errors: 0
	verify_errors: 0
	no_csum: 0
	csum_discards: 0
	super_errors: 3
	malloc_errors: 0
	uncorrectable_errors: 38024
	unverified_errors: 0
	corrected_errors: 12730616
	last_physical: 87098589184
```

```
% sudo btrfs device stats -T /mnt/games
Id Path         Write errors Read errors Flush errors Corruption errors Generation errors
-- ------------ ------------ ----------- ------------ ----------------- -----------------
 1 /dev/nvme1n1            0           0            0                 0                 0
 2 /dev/nvme2n1            0           0            0                 0                 0
 3     /dev/sdb       274063           0           31                 0                 0
 4     /dev/sda      6108593      542466          143                 0                 0
```
幹我想說不對勁，又他嗎離線了

```
1 % sudo btrfs filesystem show  /mnt/  
Label: none  uuid: 0e0524c4-7ae5-4c3b-9728-07c4b5e104dc
	Total devices 4 FS bytes used 193.20GiB
	devid    1 size 931.51GiB used 73.03GiB path /dev/nvme1n1
	devid    2 size 931.51GiB used 73.03GiB path /dev/nvme2n1
	devid    3 size 931.51GiB used 74.03GiB path /dev/sda
	devid    4 size 0 used 0 path  MISSING
```

正式死亡

### md的bitmap benchmark vs raid and btrfs raid

#### BTRFS
rsync
```
Number of files: 55,703 (reg: 54,706, dir: 996, link: 1)
Number of created files: 55,702 (reg: 54,706, dir: 995, link: 1)
Number of deleted files: 0
Number of regular files transferred: 54,706
Total file size: 147.60G bytes
Total transferred file size: 147.60G bytes
Literal data: 147.60G bytes
Matched data: 0 bytes
File list size: 1.11M
File list generation time: 0.001 seconds
File list transfer time: 0.000 seconds
Total bytes sent: 147.64G
Total bytes received: 1.05M

sent 147.64G bytes  received 1.05M bytes  779.10M bytes/sec
total size is 147.60G  speedup is 1.00

~ took 3m9s
```
fio
rand wirte
```
 fio --name=randwrite_test \
    --directory=/mnt/storage \
    --rw=randwrite \
    --bs=4k \
    --size=512M \
    --numjobs=4 \
    --runtime=60 \
    --time_based \
    --group_reporting \
    --direct=1

randwrite_test: (g=0): rw=randwrite, bs=(R) 4096B-4096B, (W) 4096B-4096B, (T) 4096B-4096B, ioengine=psync, iodepth=1
...
fio-3.39
Starting 4 processes
randwrite_test: Laying out IO file (1 file / 512MiB)
randwrite_test: Laying out IO file (1 file / 512MiB)
randwrite_test: Laying out IO file (1 file / 512MiB)
randwrite_test: Laying out IO file (1 file / 512MiB)
Jobs: 4 (f=4): [w(4)][100.0%][w=11.0MiB/s][w=2810 IOPS][eta 00m:00s]
randwrite_test: (groupid=0, jobs=4): err= 0: pid=6783: Sun May 25 19:44:18 2025
  write: IOPS=3913, BW=15.3MiB/s (16.0MB/s)(918MiB/60018msec); 0 zone resets
    clat (usec): min=28, max=576245, avg=1021.48, stdev=4226.92
     lat (usec): min=28, max=576245, avg=1021.54, stdev=4226.92
    clat percentiles (usec):
     |  1.00th=[    45],  5.00th=[   265], 10.00th=[   416], 20.00th=[   562],
     | 30.00th=[   668], 40.00th=[   750], 50.00th=[   832], 60.00th=[   906],
     | 70.00th=[   988], 80.00th=[  1090], 90.00th=[  1205], 95.00th=[  1352],
     | 99.00th=[  3752], 99.50th=[ 20579], 99.90th=[ 23987], 99.95th=[ 30802],
     | 99.99th=[242222]
   bw (  KiB/s): min=  976, max=28288, per=100.00%, avg=15660.40, stdev=1437.73, samples=480
   iops        : min=  244, max= 7072, avg=3915.10, stdev=359.43, samples=480
  lat (usec)   : 50=1.66%, 100=1.26%, 250=1.62%, 500=10.92%, 750=24.28%
  lat (usec)   : 1000=31.50%
  lat (msec)   : 2=27.47%, 4=0.32%, 10=0.32%, 20=0.03%, 50=0.58%
  lat (msec)   : 100=0.01%, 250=0.01%, 500=0.01%, 750=0.01%
  cpu          : usr=0.01%, sys=1.32%, ctx=297279, majf=0, minf=46
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued rwts: total=0,234910,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
  WRITE: bw=15.3MiB/s (16.0MB/s), 15.3MiB/s-15.3MiB/s (16.0MB/s-16.0MB/s), io=918MiB (962MB), run=60018-60018msec

~ took 1m0s
```
sequential write
```
fio --name=seq_write_test \
    --directory=/mnt/storage \
    --rw=write \
    --bs=4k \
    --size=512M \
    --numjobs=4 \
    --runtime=60 \
    --time_based \
    --group_reporting \
    --direct=1

seq_write_test: (g=0): rw=write, bs=(R) 4096B-4096B, (W) 4096B-4096B, (T) 4096B-4096B, ioengine=psync, iodepth=1
...
fio-3.39
Starting 4 processes
seq_write_test: Laying out IO file (1 file / 512MiB)
seq_write_test: Laying out IO file (1 file / 512MiB)
seq_write_test: Laying out IO file (1 file / 512MiB)
seq_write_test: Laying out IO file (1 file / 512MiB)
Jobs: 4 (f=4): [W(4)][100.0%][w=107MiB/s][w=27.5k IOPS][eta 00m:00s]
seq_write_test: (groupid=0, jobs=4): err= 0: pid=7127: Sun May 25 19:48:23 2025
  write: IOPS=34.4k, BW=134MiB/s (141MB/s)(8057MiB/60002msec); 0 zone resets
    clat (usec): min=21, max=409983, avg=116.08, stdev=1294.68
     lat (usec): min=21, max=409983, avg=116.13, stdev=1294.68
    clat percentiles (usec):
     |  1.00th=[   27],  5.00th=[   30], 10.00th=[   34], 20.00th=[   41],
     | 30.00th=[   45], 40.00th=[   53], 50.00th=[   63], 60.00th=[   73],
     | 70.00th=[   80], 80.00th=[   87], 90.00th=[  192], 95.00th=[  388],
     | 99.00th=[  545], 99.50th=[  783], 99.90th=[ 4359], 99.95th=[ 4948],
     | 99.99th=[21103]
   bw (  KiB/s): min=14528, max=226176, per=100.00%, avg=137601.76, stdev=8842.31, samples=477
   iops        : min= 3632, max=56544, avg=34400.44, stdev=2210.58, samples=477
  lat (usec)   : 50=37.64%, 100=48.20%, 250=5.24%, 500=7.70%, 750=0.70%
  lat (usec)   : 1000=0.06%
  lat (msec)   : 2=0.12%, 4=0.20%, 10=0.11%, 20=0.01%, 50=0.01%
  lat (msec)   : 100=0.01%, 250=0.01%, 500=0.01%
  cpu          : usr=0.10%, sys=8.08%, ctx=2096628, majf=0, minf=42
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued rwts: total=0,2062604,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
  WRITE: bw=134MiB/s (141MB/s), 134MiB/s-134MiB/s (141MB/s-141MB/s), io=8057MiB (8448MB), run=60002-60002msec
```

mix（70% read / 30% write）
```
1 % fio --name=rw_mix_test \
    --directory=/mnt/storage \
    --rw=randrw \
    --rwmixread=70 \
    --bs=4k \
    --size=512M \
    --numjobs=4 \
    --runtime=60 \
    --time_based \
    --group_reporting \
    --direct=1

rw_mix_test: (g=0): rw=randrw, bs=(R) 4096B-4096B, (W) 4096B-4096B, (T) 4096B-4096B, ioengine=psync, iodepth=1
...
fio-3.39
Starting 4 processes
rw_mix_test: Laying out IO file (1 file / 512MiB)
rw_mix_test: Laying out IO file (1 file / 512MiB)
rw_mix_test: Laying out IO file (1 file / 512MiB)
rw_mix_test: Laying out IO file (1 file / 512MiB)
Jobs: 4 (f=4): [m(4)][100.0%][r=53.6MiB/s,w=23.4MiB/s][r=13.7k,w=5983 IOPS][eta 00m:00s]
rw_mix_test: (groupid=0, jobs=4): err= 0: pid=7384: Sun May 25 19:50:59 2025
  read: IOPS=25.6k, BW=99.8MiB/s (105MB/s)(5989MiB/60001msec)
    clat (usec): min=34, max=104148, avg=112.65, stdev=470.14
     lat (usec): min=34, max=104148, avg=112.67, stdev=470.14
    clat percentiles (usec):
     |  1.00th=[   63],  5.00th=[   65], 10.00th=[   65], 20.00th=[   67],
     | 30.00th=[   71], 40.00th=[   75], 50.00th=[   84], 60.00th=[   89],
     | 70.00th=[  104], 80.00th=[  121], 90.00th=[  165], 95.00th=[  219],
     | 99.00th=[  441], 99.50th=[  586], 99.90th=[ 2212], 99.95th=[ 4686],
     | 99.99th=[19530]
   bw (  KiB/s): min=43784, max=118312, per=100.00%, avg=102215.20, stdev=2913.70, samples=480
   iops        : min=10946, max=29578, avg=25553.80, stdev=728.43, samples=480
  write: IOPS=11.0k, BW=42.9MiB/s (45.0MB/s)(2577MiB/60001msec); 0 zone resets
    clat (usec): min=22, max=103838, avg=101.14, stdev=653.34
     lat (usec): min=22, max=103838, avg=101.18, stdev=653.34
    clat percentiles (usec):
     |  1.00th=[   26],  5.00th=[   27], 10.00th=[   28], 20.00th=[   32],
     | 30.00th=[   41], 40.00th=[   43], 50.00th=[   46], 60.00th=[   51],
     | 70.00th=[   60], 80.00th=[   74], 90.00th=[  139], 95.00th=[  416],
     | 99.00th=[  578], 99.50th=[  734], 99.90th=[ 5145], 99.95th=[ 8455],
     | 99.99th=[10552]
   bw (  KiB/s): min=19344, max=51376, per=100.00%, avg=43977.07, stdev=1270.00, samples=480
   iops        : min= 4836, max=12844, avg=10994.27, stdev=317.50, samples=480
  lat (usec)   : 50=17.53%, 100=54.61%, 250=22.56%, 500=4.18%, 750=0.80%
  lat (usec)   : 1000=0.10%
  lat (msec)   : 2=0.06%, 4=0.07%, 10=0.09%, 20=0.01%, 50=0.01%
  lat (msec)   : 100=0.01%, 250=0.01%
  cpu          : usr=0.12%, sys=6.97%, ctx=2208862, majf=0, minf=50
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued rwts: total=1533228,659656,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
   READ: bw=99.8MiB/s (105MB/s), 99.8MiB/s-99.8MiB/s (105MB/s-105MB/s), io=5989MiB (6280MB), run=60001-60001msec
  WRITE: bw=42.9MiB/s (45.0MB/s), 42.9MiB/s-42.9MiB/s (45.0MB/s-45.0MB/s), io=2577MiB (2702MB), run=60001-60001msec
```

### MD

```
% lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE  MOUNTPOINTS
sda           8:0    0 931.5G  0 disk  
└─md0         9:0    0   1.8T  0 raid5 
zram0       253:0    0     4G  0 disk  [SWAP]
nvme0n1     259:0    0 476.9G  0 disk  
├─nvme0n1p1 259:1    0     1G  0 part  /boot
└─nvme0n1p2 259:2    0 475.9G  0 part  /home
                                       /var/log
                                       /var/cache/pacman/pkg
                                       /
nvme2n1     259:3    0 931.5G  0 disk  
└─md0         9:0    0   1.8T  0 raid5 
nvme1n1     259:4    0 931.5G  0 disk  
└─md0         9:0    0   1.8T  0 raid5 

~
% watch cat /proc/mdstat

~ took 1h21m
% sudo mkfs.ext4 /dev/md0 
[sudo] password for g36maid: 
mke2fs 1.47.2 (1-Jan-2025)
Creating filesystem with 488315136 4k blocks and 122085376 inodes
Filesystem UUID: 15fdca4c-3548-40b1-9f81-0d5d5d2a4c93
Superblock backups stored on blocks: 
	32768, 98304, 163840, 229376, 294912, 819200, 884736, 1605632, 2654208, 
	4096000, 7962624, 11239424, 20480000, 23887872, 71663616, 78675968, 
	102400000, 214990848

Allocating group tables: done                            
Writing inode tables: done                            
Creating journal (262144 blocks): done
Writing superblocks and filesystem accounting information: done       

```

```
% lsblk -f
NAME        FSTYPE            FSVER LABEL       UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sda         linux_raid_member 1.2   g36archPC:0 d618cef6-d329-362c-6eab-ec58e31b487f                
└─md0       ext4              1.0               15fdca4c-3548-40b1-9f81-0d5d5d2a4c93    1.7T     0% /mnt/storage
zram0       swap              1     zram0       4bbb10c8-d136-4f63-bfc8-ce7a495b5850                [SWAP]
nvme0n1                                                                                             
├─nvme0n1p1 vfat              FAT32             450C-FCF3                             379.3M    63% /boot
└─nvme0n1p2 btrfs                               96449fcb-3f76-43e9-836f-9fddea812e53   68.6G    85% /home
                                                                                                    /var/log
                                                                                                    /var/cache/pacman/pkg
                                                                                                    /
nvme2n1     linux_raid_member 1.2   g36archPC:0 d618cef6-d329-362c-6eab-ec58e31b487f                
└─md0       ext4              1.0               15fdca4c-3548-40b1-9f81-0d5d5d2a4c93    1.7T     0% /mnt/storage
nvme1n1     linux_raid_member 1.2   g36archPC:0 d618cef6-d329-362c-6eab-ec58e31b487f                
└─md0       ext4              1.0               15fdca4c-3548-40b1-9f81-0d5d5d2a4c93    1.7T     0% /mnt/storage

```
rsync
```
Number of files: 55,703 (reg: 54,706, dir: 996, link: 1)
Number of created files: 55,702 (reg: 54,706, dir: 995, link: 1)
Number of deleted files: 0
Number of regular files transferred: 54,706
Total file size: 147.60G bytes
Total transferred file size: 147.60G bytes
Literal data: 147.60G bytes
Matched data: 0 bytes
File list size: 1.11M
File list generation time: 0.001 seconds
File list transfer time: 0.000 seconds
Total bytes sent: 147.64G
Total bytes received: 1.05M

sent 147.64G bytes  received 1.05M bytes  729.09M bytes/sec
total size is 147.60G  speedup is 1.00

~ took 3m21s

```
fio
rand wirte
```
%  fio --name=randwrite_test \
    --directory=/mnt/storage \
    --rw=randwrite \
    --bs=4k \
    --size=512M \
    --numjobs=4 \
    --runtime=60 \
    --time_based \
    --group_reporting \
    --direct=1
randwrite_test: (g=0): rw=randwrite, bs=(R) 4096B-4096B, (W) 4096B-4096B, (T) 4096B-4096B, ioengine=psync, iodepth=1
...
fio-3.39
Starting 4 processes
randwrite_test: Laying out IO file (1 file / 512MiB)
randwrite_test: Laying out IO file (1 file / 512MiB)
randwrite_test: Laying out IO file (1 file / 512MiB)
randwrite_test: Laying out IO file (1 file / 512MiB)
Jobs: 4 (f=4): [w(4)][100.0%][w=125MiB/s][w=32.1k IOPS][eta 00m:00s]
randwrite_test: (groupid=0, jobs=4): err= 0: pid=39273: Sun May 25 21:25:24 2025
  write: IOPS=30.6k, BW=119MiB/s (125MB/s)(7169MiB/60001msec); 0 zone resets
    clat (usec): min=15, max=27249, avg=130.50, stdev=234.13
     lat (usec): min=15, max=27249, avg=130.54, stdev=234.13
    clat percentiles (usec):
     |  1.00th=[   33],  5.00th=[   92], 10.00th=[   95], 20.00th=[  100],
     | 30.00th=[  104], 40.00th=[  108], 50.00th=[  113], 60.00th=[  118],
     | 70.00th=[  123], 80.00th=[  133], 90.00th=[  149], 95.00th=[  176],
     | 99.00th=[  898], 99.50th=[ 1090], 99.90th=[ 1336], 99.95th=[ 2606],
     | 99.99th=[10552]
   bw (  KiB/s): min=34776, max=129736, per=100.00%, avg=122417.41, stdev=2750.34, samples=476
   iops        : min= 8694, max=32434, avg=30604.35, stdev=687.59, samples=476
  lat (usec)   : 20=0.22%, 50=2.12%, 100=18.00%, 250=77.89%, 500=0.58%
  lat (usec)   : 750=0.07%, 1000=0.37%
  lat (msec)   : 2=0.68%, 4=0.03%, 10=0.02%, 20=0.01%, 50=0.01%
  cpu          : usr=0.15%, sys=5.42%, ctx=1836739, majf=0, minf=41
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued rwts: total=0,1835331,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
  WRITE: bw=119MiB/s (125MB/s), 119MiB/s-119MiB/s (125MB/s-125MB/s), io=7169MiB (7518MB), run=60001-60001msec

Disk stats (read/write):
    md0: ios=0/1839839, sectors=0/15355192, merge=0/0, ticks=0/284846, in_queue=284846, util=99.91%, aggrios=595438/1227514, aggsectors=4779514/10153296, aggrmerge=2000/41660, aggrticks=51336/28159, aggrin_queue=79535, aggrutil=89.65%
  nvme2n1: ios=596093/1228690, sectors=4784272/10148800, merge=1941/39922, ticks=38565/15075, in_queue=53663, util=56.22%
  nvme1n1: ios=594980/1228969, sectors=4775440/10157152, merge=1950/40687, ticks=46327/15255, in_queue=61596, util=62.25%
  sda: ios=595243/1224883, sectors=4778832/10153936, merge=2111/44371, ticks=69118/54149, in_queue=123347, util=89.65%

~ took 1m0s
```

sequential write
```
% fio --name=seq_write_test \
    --directory=/mnt/storage \
    --rw=write \
    --bs=4k \
    --size=512M \
    --numjobs=4 \
    --runtime=60 \
    --time_based \
    --group_reporting \
    --direct=1

seq_write_test: (g=0): rw=write, bs=(R) 4096B-4096B, (W) 4096B-4096B, (T) 4096B-4096B, ioengine=psync, iodepth=1
...
fio-3.39
Starting 4 processes
seq_write_test: Laying out IO file (1 file / 512MiB)
seq_write_test: Laying out IO file (1 file / 512MiB)
seq_write_test: Laying out IO file (1 file / 512MiB)
seq_write_test: Laying out IO file (1 file / 512MiB)
Jobs: 4 (f=4): [W(4)][100.0%][w=185MiB/s][w=47.2k IOPS][eta 00m:00s]
seq_write_test: (groupid=0, jobs=4): err= 0: pid=39540: Sun May 25 21:28:34 2025
  write: IOPS=46.4k, BW=181MiB/s (190MB/s)(10.6GiB/60001msec); 0 zone resets
    clat (usec): min=12, max=25782, avg=85.98, stdev=184.84
     lat (usec): min=12, max=25782, avg=86.01, stdev=184.84
    clat percentiles (usec):
     |  1.00th=[   18],  5.00th=[   20], 10.00th=[   23], 20.00th=[   33],
     | 30.00th=[   38], 40.00th=[   50], 50.00th=[   64], 60.00th=[   96],
     | 70.00th=[  109], 80.00th=[  119], 90.00th=[  143], 95.00th=[  180],
     | 99.00th=[  273], 99.50th=[  865], 99.90th=[ 1156], 99.95th=[ 1352],
     | 99.99th=[ 3884]
   bw (  KiB/s): min=137848, max=220232, per=100.00%, avg=185713.28, stdev=3993.38, samples=476
   iops        : min=34462, max=55058, avg=46428.32, stdev=998.35, samples=476
  lat (usec)   : 20=5.53%, 50=34.85%, 100=22.52%, 250=35.67%, 500=0.80%
  lat (usec)   : 750=0.06%, 1000=0.19%
  lat (msec)   : 2=0.34%, 4=0.02%, 10=0.01%, 20=0.01%, 50=0.01%
  cpu          : usr=0.35%, sys=6.85%, ctx=2786340, majf=0, minf=39
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued rwts: total=0,2784631,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
  WRITE: bw=181MiB/s (190MB/s), 181MiB/s-181MiB/s (190MB/s-190MB/s), io=10.6GiB (11.4GB), run=60001-60001msec

Disk stats (read/write):
    md0: ios=0/2784731, sectors=0/22914328, merge=0/0, ticks=0/321784, in_queue=321784, util=100.00%, aggrios=464512/1859282, aggsectors=3731008/15205272, aggrmerge=1864/41388, aggrticks=39551/38509, aggrin_queue=78109, aggrutil=89.26%
  nvme2n1: ios=464881/1859994, sectors=3733480/15199296, merge=1804/39930, ticks=39785/19349, in_queue=59159, util=60.17%
  nvme1n1: ios=464040/1860251, sectors=3725632/15209464, merge=1664/40944, ticks=24487/19649, in_queue=44156, util=44.97%
  sda: ios=464615/1857603, sectors=3733912/15207056, merge=2124/43291, ticks=54383/76531, in_queue=131014, util=89.26%

~ took 1m0s
```
mix（70% read / 30% write）
```
fio --name=rw_mix_test \
    --directory=/mnt/storage \
    --rw=randrw \
    --rwmixread=70 \
    --bs=4k \
    --size=512M \
    --numjobs=4 \
    --runtime=60 \
    --time_based \
    --group_reporting \
    --direct=1
rw_mix_test: (g=0): rw=randrw, bs=(R) 4096B-4096B, (W) 4096B-4096B, (T) 4096B-4096B, ioengine=psync, iodepth=1
...
fio-3.39
Starting 4 processes
rw_mix_test: Laying out IO file (1 file / 512MiB)
rw_mix_test: Laying out IO file (1 file / 512MiB)
rw_mix_test: Laying out IO file (1 file / 512MiB)
rw_mix_test: Laying out IO file (1 file / 512MiB)
Jobs: 4 (f=4): [m(4)][100.0%][r=117MiB/s,w=50.4MiB/s][r=29.9k,w=12.9k IOPS][eta 00m:00s]
rw_mix_test: (groupid=0, jobs=4): err= 0: pid=40297: Sun May 25 21:30:09 2025
  read: IOPS=29.9k, BW=117MiB/s (122MB/s)(7007MiB/60001msec)
    clat (usec): min=54, max=25812, avg=82.30, stdev=103.27
     lat (usec): min=54, max=25812, avg=82.32, stdev=103.27
    clat percentiles (usec):
     |  1.00th=[   60],  5.00th=[   61], 10.00th=[   61], 20.00th=[   63],
     | 30.00th=[   68], 40.00th=[   71], 50.00th=[   81], 60.00th=[   82],
     | 70.00th=[   84], 80.00th=[   88], 90.00th=[  101], 95.00th=[  119],
     | 99.00th=[  157], 99.50th=[  196], 99.90th=[ 1090], 99.95th=[ 1139],
     | 99.99th=[ 1909]
   bw (  KiB/s): min=108296, max=125104, per=100.00%, avg=119632.34, stdev=790.36, samples=476
   iops        : min=27074, max=31276, avg=29908.08, stdev=197.59, samples=476
  write: IOPS=12.9k, BW=50.2MiB/s (52.6MB/s)(3012MiB/60001msec); 0 zone resets
    clat (usec): min=15, max=25887, avg=119.00, stdev=224.67
     lat (usec): min=15, max=25887, avg=119.05, stdev=224.67
    clat percentiles (usec):
     |  1.00th=[   32],  5.00th=[   92], 10.00th=[   94], 20.00th=[   98],
     | 30.00th=[  101], 40.00th=[  104], 50.00th=[  108], 60.00th=[  112],
     | 70.00th=[  116], 80.00th=[  121], 90.00th=[  133], 95.00th=[  147],
     | 99.00th=[  243], 99.50th=[  996], 99.90th=[ 1319], 99.95th=[ 1909],
     | 99.99th=[15401]
   bw (  KiB/s): min=47072, max=54736, per=100.00%, avg=51423.19, stdev=392.41, samples=476
   iops        : min=11768, max=13684, avg=12855.80, stdev=98.10, samples=476
  lat (usec)   : 20=0.12%, 50=0.64%, 100=70.07%, 250=28.65%, 500=0.13%
  lat (usec)   : 750=0.02%, 1000=0.10%
  lat (msec)   : 2=0.26%, 4=0.01%, 10=0.01%, 20=0.01%, 50=0.01%
  cpu          : usr=0.44%, sys=5.23%, ctx=2566050, majf=0, minf=57
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued rwts: total=1793880,771159,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
   READ: bw=117MiB/s (122MB/s), 117MiB/s-117MiB/s (122MB/s-122MB/s), io=7007MiB (7348MB), run=60001-60001msec
  WRITE: bw=50.2MiB/s (52.6MB/s), 50.2MiB/s-50.2MiB/s (52.6MB/s-52.6MB/s), io=3012MiB (3159MB), run=60001-60001msec

Disk stats (read/write):
    md0: ios=1793433/771339, sectors=14347464/6758232, merge=0/0, ticks=140086/97911, in_queue=237997, util=99.86%, aggrios=848012/517459, aggsectors=6796512/4420517, aggrmerge=1552/35116, aggrticks=67054/12383, aggrin_queue=79469, aggrutil=87.23%
  nvme2n1: ios=848168/519986, sectors=6797752/4421200, merge=1551/32675, ticks=52419/6257, in_queue=58698, util=64.16%
  nvme1n1: ios=847899/517693, sectors=6795600/4419552, merge=1551/34762, ticks=64707/6109, in_queue=70829, util=71.49%
  sda: ios=847969/514699, sectors=6796184/4420800, merge=1554/37912, ticks=84036/24784, in_queue=108882, util=87.23%
```

MD + write-indent bitmap

% sudo mdadm --create --verbose /dev/md0 --level=5 --raid-devices=3 /dev/nvme1n1 /dev/nvme2n1 /dev/sda
To optimalize recovery speed, it is recommended to enable write-indent bitmap, do you want to enable it now? [y/N]? y
mdadm: layout defaults to left-symmetric
mdadm: layout defaults to left-symmetric
mdadm: chunk size defaults to 512K
mdadm: size set to 976630272K
mdadm: Defaulting to version 1.2 metadata
mdadm: array /dev/md0 started.

rsync
```
Number of files: 55,703 (reg: 54,706, dir: 996, link: 1)
Number of created files: 55,702 (reg: 54,706, dir: 995, link: 1)
Number of deleted files: 0
Number of regular files transferred: 54,706
Total file size: 147.60G bytes
Total transferred file size: 147.60G bytes
Literal data: 147.60G bytes
Matched data: 0 bytes
File list size: 1.11M
File list generation time: 0.001 seconds
File list transfer time: 0.000 seconds
Total bytes sent: 147.64G
Total bytes received: 1.05M

sent 147.64G bytes  received 1.05M bytes  643.31M bytes/sec
total size is 147.60G  speedup is 1.00

~ took 3m49s
```

fio
rand wirte
```
% fio --name=randwrite_test \
    --directory=/mnt/storage \
    --rw=randwrite \
    --bs=4k \
    --size=512M \
    --numjobs=4 \
    --runtime=60 \
    --time_based \
    --group_reporting \
    --direct=1
randwrite_test: (g=0): rw=randwrite, bs=(R) 4096B-4096B, (W) 4096B-4096B, (T) 4096B-4096B, ioengine=psync, iodepth=1
...
fio-3.39
Starting 4 processes
randwrite_test: Laying out IO file (1 file / 512MiB)
randwrite_test: Laying out IO file (1 file / 512MiB)
randwrite_test: Laying out IO file (1 file / 512MiB)
randwrite_test: Laying out IO file (1 file / 512MiB)
Jobs: 4 (f=4): [w(4)][100.0%][w=106MiB/s][w=27.2k IOPS][eta 00m:00s]
randwrite_test: (groupid=0, jobs=4): err= 0: pid=94107: Sun May 25 23:16:47 2025
  write: IOPS=26.1k, BW=102MiB/s (107MB/s)(6122MiB/60001msec); 0 zone resets
    clat (usec): min=14, max=305058, avg=152.82, stdev=1003.98
     lat (usec): min=14, max=305058, avg=152.86, stdev=1003.98
    clat percentiles (usec):
     |  1.00th=[   34],  5.00th=[   93], 10.00th=[   97], 20.00th=[  103],
     | 30.00th=[  109], 40.00th=[  115], 50.00th=[  121], 60.00th=[  129],
     | 70.00th=[  139], 80.00th=[  153], 90.00th=[  178], 95.00th=[  200],
     | 99.00th=[  281], 99.50th=[ 1778], 99.90th=[ 4621], 99.95th=[ 5014],
     | 99.99th=[12911]
   bw (  KiB/s): min=44736, max=113920, per=100.00%, avg=104486.99, stdev=2966.67, samples=476
   iops        : min=11184, max=28480, avg=26121.75, stdev=741.67, samples=476
  lat (usec)   : 20=0.18%, 50=2.09%, 100=13.31%, 250=82.86%, 500=0.89%
  lat (usec)   : 750=0.04%, 1000=0.02%
  lat (msec)   : 2=0.17%, 4=0.27%, 10=0.16%, 20=0.01%, 50=0.01%
  lat (msec)   : 100=0.01%, 250=0.01%, 500=0.01%
  cpu          : usr=0.18%, sys=5.18%, ctx=1568671, majf=0, minf=49
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued rwts: total=0,1567317,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
  WRITE: bw=102MiB/s (107MB/s), 102MiB/s-102MiB/s (107MB/s-107MB/s), io=6122MiB (6420MB), run=60001-60001msec

Disk stats (read/write):
    md0: ios=0/1572057, sectors=0/12951816, merge=0/0, ticks=0/366135, in_queue=366135, util=99.77%, aggrios=508390/1047770, aggsectors=4083066/8589074, aggrmerge=1992/25886, aggrticks=51376/26817, aggrin_queue=78376, aggrutil=92.69%
  nvme2n1: ios=508382/1049033, sectors=4081184/8590560, merge=1766/24810, ticks=32539/12213, in_queue=44830, util=49.85%
  nvme1n1: ios=508934/1047962, sectors=4085944/8586176, merge=1809/25333, ticks=39507/12448, in_queue=52002, util=54.60%
  sda: ios=507856/1046317, sectors=4082072/8590488, merge=2403/27517, ticks=82084/55791, in_queue=138297, util=92.69%
```
sequential write

```
 % fio --name=seq_write_test \
    --directory=/mnt/storage \
    --rw=write \
    --bs=4k \
    --size=512M \
    --numjobs=4 \
    --runtime=60 \
    --time_based \
    --group_reporting \
    --direct=1

seq_write_test: (g=0): rw=write, bs=(R) 4096B-4096B, (W) 4096B-4096B, (T) 4096B-4096B, ioengine=psync, iodepth=1
...
fio-3.39
Starting 4 processes
seq_write_test: Laying out IO file (1 file / 512MiB)
seq_write_test: Laying out IO file (1 file / 512MiB)
seq_write_test: Laying out IO file (1 file / 512MiB)
seq_write_test: Laying out IO file (1 file / 512MiB)
Jobs: 4 (f=4): [W(4)][100.0%][w=153MiB/s][w=39.2k IOPS][eta 00m:00s]
seq_write_test: (groupid=0, jobs=4): err= 0: pid=95278: Sun May 25 23:18:54 2025
  write: IOPS=37.6k, BW=147MiB/s (154MB/s)(8813MiB/60010msec); 0 zone resets
    clat (usec): min=13, max=123973, avg=106.18, stdev=775.07
     lat (usec): min=13, max=123973, avg=106.21, stdev=775.07
    clat percentiles (usec):
     |  1.00th=[   18],  5.00th=[   21], 10.00th=[   24], 20.00th=[   34],
     | 30.00th=[   40], 40.00th=[   57], 50.00th=[   92], 60.00th=[  101],
     | 70.00th=[  116], 80.00th=[  135], 90.00th=[  176], 95.00th=[  194],
     | 99.00th=[  273], 99.50th=[  469], 99.90th=[ 4080], 99.95th=[ 4883],
     | 99.99th=[22938]
   bw (  KiB/s): min=109800, max=178992, per=100.00%, avg=150526.59, stdev=4193.61, samples=476
   iops        : min=27450, max=44748, avg=37631.65, stdev=1048.40, samples=476
  lat (usec)   : 20=4.32%, 50=32.12%, 100=22.70%, 250=39.38%, 500=1.11%
  lat (usec)   : 750=0.09%, 1000=0.01%
  lat (msec)   : 2=0.04%, 4=0.13%, 10=0.08%, 20=0.01%, 50=0.01%
  lat (msec)   : 100=0.01%, 250=0.01%
  cpu          : usr=0.26%, sys=5.76%, ctx=2257418, majf=0, minf=37
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued rwts: total=0,2256147,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
  WRITE: bw=147MiB/s (154MB/s), 147MiB/s-147MiB/s (154MB/s-154MB/s), io=8813MiB (9241MB), run=60010-60010msec

Disk stats (read/write):
    md0: ios=0/2253241, sectors=0/18401200, merge=0/0, ticks=0/228859, in_queue=228859, util=99.79%, aggrios=376187/1505534, aggsectors=3017549/12232204, aggrmerge=1006/23536, aggrticks=38588/37788, aggrin_queue=76733, aggrutil=90.96%
  nvme2n1: ios=376514/1505439, sectors=3019048/12227772, merge=867/23078, ticks=29851/15786, in_queue=45839, util=48.70%
  nvme1n1: ios=375668/1506349, sectors=3013528/12235700, merge=1023/23159, ticks=23579/15866, in_queue=39564, util=40.07%
  sda: ios=376381/1504816, sectors=3020072/12233140, merge=1128/24372, ticks=62336/81713, in_queue=144798, util=90.96%
```
mix（70% read / 30% write）
```
% fio --name=rw_mix_test \
    --directory=/mnt/storage \
    --rw=randrw \
    --rwmixread=70 \
    --bs=4k \
    --size=512M \
    --numjobs=4 \
    --runtime=60 \
    --time_based \
    --group_reporting \
    --direct=1
rw_mix_test: (g=0): rw=randrw, bs=(R) 4096B-4096B, (W) 4096B-4096B, (T) 4096B-4096B, ioengine=psync, iodepth=1
...
fio-3.39
Starting 4 processes
rw_mix_test: Laying out IO file (1 file / 512MiB)
rw_mix_test: Laying out IO file (1 file / 512MiB)
rw_mix_test: Laying out IO file (1 file / 512MiB)
rw_mix_test: Laying out IO file (1 file / 512MiB)
Jobs: 4 (f=4): [m(4)][100.0%][r=113MiB/s,w=48.8MiB/s][r=29.0k,w=12.5k IOPS][eta 00m:00s]
rw_mix_test: (groupid=0, jobs=4): err= 0: pid=95933: Sun May 25 23:20:32 2025
  read: IOPS=27.3k, BW=107MiB/s (112MB/s)(6394MiB/60001msec)
    clat (usec): min=54, max=27779, avg=90.41, stdev=127.70
     lat (usec): min=54, max=27779, avg=90.44, stdev=127.70
    clat percentiles (usec):
     |  1.00th=[   60],  5.00th=[   61], 10.00th=[   62], 20.00th=[   64],
     | 30.00th=[   69], 40.00th=[   73], 50.00th=[   82], 60.00th=[   84],
     | 70.00th=[   94], 80.00th=[  105], 90.00th=[  124], 95.00th=[  147],
     | 99.00th=[  196], 99.50th=[  225], 99.90th=[ 1106], 99.95th=[ 1188],
     | 99.99th=[ 3982]
   bw (  KiB/s): min=92544, max=117672, per=99.99%, avg=109108.10, stdev=1229.86, samples=476
   iops        : min=23136, max=29418, avg=27277.03, stdev=307.46, samples=476
  write: IOPS=11.7k, BW=45.8MiB/s (48.0MB/s)(2749MiB/60001msec); 0 zone resets
    clat (usec): min=16, max=70488, avg=129.71, stdev=323.20
     lat (usec): min=16, max=70489, avg=129.78, stdev=323.20
    clat percentiles (usec):
     |  1.00th=[   34],  5.00th=[   94], 10.00th=[   97], 20.00th=[  102],
     | 30.00th=[  106], 40.00th=[  112], 50.00th=[  117], 60.00th=[  121],
     | 70.00th=[  126], 80.00th=[  135], 90.00th=[  153], 95.00th=[  174],
     | 99.00th=[  251], 99.50th=[  971], 99.90th=[ 1336], 99.95th=[ 2573],
     | 99.99th=[17171]
   bw (  KiB/s): min=40296, max=51520, per=100.00%, avg=46924.37, stdev=538.18, samples=476
   iops        : min=10074, max=12880, avg=11731.09, stdev=134.55, samples=476
  lat (usec)   : 20=0.04%, 50=0.71%, 100=57.47%, 250=41.22%, 500=0.19%
  lat (usec)   : 750=0.02%, 1000=0.08%
  lat (msec)   : 2=0.24%, 4=0.02%, 10=0.01%, 20=0.01%, 50=0.01%
  lat (msec)   : 100=0.01%
  cpu          : usr=0.44%, sys=5.66%, ctx=2344235, majf=0, minf=47
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued rwts: total=1636842,703813,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
   READ: bw=107MiB/s (112MB/s), 107MiB/s-107MiB/s (112MB/s-112MB/s), io=6394MiB (6705MB), run=60001-60001msec
  WRITE: bw=45.8MiB/s (48.0MB/s), 45.8MiB/s-45.8MiB/s (48.0MB/s-48.0MB/s), io=2749MiB (2883MB), run=60001-60001msec

Disk stats (read/write):
    md0: ios=1634517/703093, sectors=13076136/5991944, merge=0/0, ticks=139908/93670, in_queue=233578, util=100.00%, aggrios=773586/470698, aggsectors=6196277/3946135, aggrmerge=948/22583, aggrticks=66972/10492, aggrin_queue=77526, aggrutil=88.51%
  nvme2n1: ios=773248/471695, sectors=6193296/3947773, merge=914/21791, ticks=50574/5388, in_queue=56000, util=61.70%
  nvme1n1: ios=775056/470368, sectors=6207824/3941309, merge=922/22310, ticks=58930/5377, in_queue=64331, util=68.00%
  sda: ios=772455/470031, sectors=6187712/3949325, merge=1009/23649, ticks=91414/20713, in_queue=112247, util=88.51%
```
