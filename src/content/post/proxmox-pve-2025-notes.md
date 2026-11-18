---
title: "2025 PVE 探索筆記：直通、防火牆 VM 與兩個沒解掉的坑"
description: "2025 年初家裡伺服器換成 Proxmox VE 的踩雷實錄：去訂閱彈窗、IOMMU 直通、OPNsense 加 Tailscale、TrueNAS 硬碟直通與 NTFS 遷移，含 MPT BIOS 報錯解法查證與參考連結彙整，約一百六十字。"
pubDate: 2025-02-05 16:27:38 +0800
category: linux
tags: ["proxmox", "pve", "vfio", "opnsense", "truenas", "tailscale", "zfs", "nfs"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1738744058
---

# 2025 PVE 探索筆記：直通、防火牆 VM 與兩個沒解掉的坑

2025 年初，我把家裡那台跑雜七雜八服務的伺服器換成 Proxmox VE（PVE）。當時的盤算是：PVE 當 hypervisor，上面開一台 OPNsense 接管內網防火牆、一台 TrueNAS Core 接硬碟做 ZFS，再靠 Tailscale 從外面把整段內網路由回來。這篇照實際操作的順序整理成踩雷筆記，結尾留著兩個當時沒解掉的問題——後來回頭查論壇，其中一個其實早就有解。

## 1. 去除訂閱彈窗

PVE 沒訂閱照樣能用完整功能，代價只是登入 web UI 時跳一次「No valid subscription」。做法是改 `/usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js`。PVE 6.3 到 7 的寫法：

```bash
sed -Ezi.bak "s/(Ext.Msg.show\(\{\s+title: gettext\('No valid sub)/void\(\{ \/\/\1/g" /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js && systemctl restart pveproxy.service
```

到 PVE 8，判斷式被改寫過，sed 也跟著換：

```bash
sed -i.backup -z "s/res === null || res === undefined || \!res || res\n\t\t\t.data.status.toLowerCase() \!== 'active'/false/g" /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js && systemctl restart pveproxy.service
```

麻煩的地方在於每次升級套件會把這個檔案蓋回來，彈窗就復活，得重跑一次。

## 2. IOMMU 直通

先去 BIOS 開 VT-x 與 VT-d，沒開的話後面全部白搭。Intel CPU：

```bash
sed -i '/^GRUB_CMDLINE_LINUX_DEFAULT/c\GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt pcie_acs_override=downstream"' /etc/default/grub
```

AMD CPU：

```bash
sed -i '/^GRUB_CMDLINE_LINUX_DEFAULT/c\GRUB_CMDLINE_LINUX_DEFAULT="quiet amd_iommu=on iommu=pt pcie_acs_override=downstream"' /etc/default/grub
```

修改 `/etc/modules`：

```bash
echo -e "vfio\nvfio_iommu_type1\nvfio_pci\nvfio_virqfd" | tee -a /etc/modules
```

更新後重開機：

```bash
update-grub
update-initramfs -u -k all
reboot
```

確認 IOMMU 是否開起來：

```bash
dmesg | grep iommu
```

查看 PCI 裝置：

```bash
lspci
```

補一下底層。IOMMU（Intel 叫 VT-d，AMD 叫 AMD-Vi）是替 DMA 加一層位址翻譯與隔離：沒有它，直通給 VM 的實體裝置發 DMA 時可以寫進主機任何一段實體記憶體；有了它，裝置被切進一個個 IOMMU group，VM 只碰得到分給它的那組。`iommu=pt` 則讓沒被直通的裝置走 pass-through 模式，DMA 免繞翻譯表，效能損耗趨近於零。`/etc/modules` 裡那幾個 vfio 模組各司其職：`vfio` 是核心框架，`vfio_iommu_type1` 負責把 IOMMU group 綁到 container，`vfio_pci` 則是把裝置從原驅動手上搶走的 meta-driver。至於 `pcie_acs_override=downstream`，這是拿安全換方便的參數：硬體的 ACS（Access Control Services）本來會擋住同一 PCIe 橋下游裝置互窺 DMA，override 之後核心假裝隔離存在，把本來分不開的裝置硬拆成不同 IOMMU group，代價是 VM 理論上能 DMA 進主機或其他 VM 的記憶體。家裡這台單人用的機器我選擇接受；放對外環境的機器不該這樣開。

## 3. OPNsense VM 與 Tailscale subnet router

OPNsense VM 的細節之前在 [BSD NAS 與巢狀虛擬化](/blog/bsd-nas-opnsense-nested-virt/)那篇寫過，這次直接沿用。Tailscale 裝在 OPNsense 上跑 subnet router，把 192.168.0.0/16 裡的家用網段整段宣告出去，手機在外面就能連回家裡的機器。當時主要照著 YouTube 教學做（連結列在文末），各家路由與防火牆拓撲則另外記在家裡的網路盤點筆記裡。

## 4. TrueNAS Core 與 SATA 直通

NAS 那台 VM 用 TrueNAS Core（FreeBSD 系）而不是 Scale，磁碟用 SATA passthrough 整顆丟進去，讓 ZFS 直接摸到底層硬碟。這步本身沒踩雷，照影片做完 pool 就起來了。搬資料之前我先把那顆服役多年的大碟做了一輪 SMART 健檢（寫在[10TB 硬碟 SMART 健檢記錄](/blog/10tb-hdd-smart-checkup/)那篇），確認沒有壞軌跡象才開始拷。

## 5. NTFS 遷到 ZFS

舊資料躺在一顆 NTFS 碟上。我的做法是開一台 Ubuntu 24.10 VM，把 NTFS 碟掛進這台 VM，用核心的 ntfs3 驅動掛載：

```bash
sudo mkdir -p /mnt/ntfs
sudo mount -t ntfs3 /dev/sdb1 /mnt/ntfs
```

再 rsync 推到 TrueNAS 的 pool：

```bash
rsync -avh --progress --ignore-existing --append-verify --partial /mnt/ntfs/ root@192.168.101.12:/mnt/testpool/family/share/
```

`--partial` 加 `--append-verify` 的意思是傳到一半斷線可以驗證後續傳，幾 TB 的家庭照片搬到凌晨斷網也不會整批重來。

## 6. NFS 沒掛起來

原本的終點是讓 TrueNAS 開 NFS share 給 PVE 直接掛當 storage。同一個 LAN 裡掛得起來，換到 192.168.101.0/24 那個 VLAN 就掛不上。當時在 exports 網段限制、allowlist、防火牆規則幾個方向打轉，沒找到根因，先擱著。

## 未解與後來的答案

兩個 unsolved，記錄如下：

**NFS 無法在 192.168.101.0/24 掛載**：這個到今天也沒有定論。事後猜測的方向是 TrueNAS 的 exports 只允許特定網段、或是 VLAN 間防火牆擋掉 2049 與 rpcbind 相關埠，但當時沒有逐項驗證，只能算嫌疑而非結論。實際繞道就是上面第 5 節的 rsync——資料反正要搬一次，搬完日常讀寫走 SMB，NFS 的需求就淡掉了。

**TrueNAS PCI passthrough 報「Unable to load Avago Technologies MPT BIOS」**：這個後來查到答案了。Proxmox 論壇和 TrueNAS 論壇都有同款案例（LSI 9300 系 HBA，Fault 02h / Firmware Fault Code 2667h）：guest 試圖載入 HBA 的 option ROM（ROM-bar）時失敗。option ROM 只有在需要從那張卡接的磁碟開機時才有用，TrueNAS VM 明顯不需要。解法是 VM 的 PCI device 進階選項把 ROM-Bar 取消，也就是設定檔裡 `hostpci0: ...,rombar=0`；Proxmox 官方文件也註明 ROM-bar 預設開啟、某些裝置必須關掉。2025 年另一位在 TrueNAS 論壇踩到 Fault 2668h 的人則是把卡的 BIOS 整段清掉（`sas3flash -o -e 5`）一勞永逸。按可信度排：官方文件的 rombar 說明是硬證據，兩個論壇的多個回報案例次之。這條解法當時沒查到，繞道的代價是那台 VM 開機要多按一次任意鍵。

## 2026-11 update

寫這篇補記時回頭看，有幾件事變了：

- PVE 9.0 已於 2025-08-05 發布，基底換成 Debian 13 "Trixie"，預設 kernel 6.14.8-2（見官方新聞稿）。8.4 的安全支援到 2026 年 8 月。
- 去訂閱的 sed 又得換新寫法（`checked_command` 的函式改了），社群腳本的 post-install 會自動處理，並且掛 apt hook 在每次升級後重打補丁；另外 PVE 9 的新版手機介面是另一套檔案，舊的 sed 管不到它。
- `vfio_virqfd` 自核心 6.2 起已併入 `vfio` 模組（Jason Gunthorpe 的 commit），PVE 8 之後的官方文件也不再列它。第 2 節那行 `echo -e ...` 在 2026 年照抄會多載一個不存在的模組，留 `vfio`、`vfio_iommu_type1`、`vfio_pci` 三行就夠。
- kernel 6.8 起 `intel_iommu=on` 已是預設值，Intel 平台那個參數可以不寫。

以上更新段落為 2026 年查證補寫；正文其餘部分保留 2025 年 2 月當時的觀點與配置，沒有回頭改。

## 延伸閱讀

當時參考的教學影片（未逐一重新驗證，僅作為當時的操作參考）：

- PVE 換源：<https://youtu.be/DzHRhu3On7o>
- Tailscale 登入：<https://youtu.be/BdQ-Gz6bs3g>
- Tailscale + OPNsense subnet router：<https://youtu.be/XXx7NDgDaRU>
- Tailscale OPNsense plugin：<https://www.youtube.com/watch?v=VD2oMin_V3M>
- TrueNAS SATA passthrough：<https://www.youtube.com/watch?v=M3pKprTdNqQ>
- NFS 掛載：<https://youtu.be/txx0z-4HlSQ>

查證時引用的資料：

- Proxmox 官方 PCI(e) Passthrough 文件：<https://pve.proxmox.com/wiki/PCI(e)_Passthrough>
- PVE 9.0 發布新聞稿：<https://www.proxmox.com/en/about/company-details/press-releases/proxmox-virtual-environment-9-0>
- vfio_virqfd 併入 vfio 的 commit：<https://lore.kernel.org/r/5-v5-fc5346cacfd4+4c482-vfio_modules_jgg@nvidia.com>
- Proxmox 論壇 LSI 9300-8i 直通討論（rombar 解法）：<https://forum.proxmox.com/threads/sas3008-e-g-lsi-9300-8i-incompatible-with-proxmox.103159>
- TrueNAS 論壇 Fault 2668h 與清 BIOS 做法：<https://forums.truenas.com/t/fault-2668h-installing-lsi9305-16i-on-a-machine-running-truenas-on-proxmox-with-pci-passthrough/35021>
- Community Scripts post-install（去訂閱 apt hook）：<https://community-scripts.github.io/ProxmoxVE/scripts?id=post-pve-install>

