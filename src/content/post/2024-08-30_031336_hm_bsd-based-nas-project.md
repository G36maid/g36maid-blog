---
title: "BSD-based NAS Project"
description: "This project aims to enhance the security features of a NAS by virtualizing a firewall within the NAS to filter unauthorized access reque…"
pubDate: 2024-08-30 03:13:36 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1724958816
---

## About
This project aims to enhance the security features of a NAS by virtualizing a firewall within the NAS to filter unauthorized access requests.

## System Overview

### Operating System
- **FreeBSD**: The entire system is based on FreeBSD.

### Storage
- **TrueNAS Core**: Utilized for storage management.
    - ZFS file system 
        - Pooled Storage
        - Snapshots and Clones
        - Raid Z1 & Z2 & Z3
### Firewall
- **OPNsense**: The firewall used for securing the NAS.
  - [OPNsense Documentation](https://hackmd.io/nILN8FuKQMqFTJ9QzEG4oA)

### Networking
- **Tailscale**: Used for secure networking and VPN.
  - [Tailscale Installation on OPNsense](https://tailscale.com/kb/1097/install-opnsense)

## Architecture
```
┌──────────────────────────────────────────────────────────┐
│                           TrueNAS CORE                   │
│          ┌────────────────────────────────────────────┐  │
│          │                                            │  │
│          │                           OPNsense VM      │  │
│          │       ┌ ─ ─ ─ ─ ─ ┐   ┌──────────────────┐ │  │
│          │    ┌───────────┐      │                  │ │  │
│          │ ┌──┴────────┐  │  │   │  LAN    tailscale│ │  │
│          │ │           │  │      │┌─────┐    ┌─────┐│ │  │
│          │ │  ZFS Raid │  │  │   ││ ix0 │    │ ix1 ││ │  │
│          │ │  Stroages │  ├ ─    │└─────┘    └─────┘│ │  │
│          │ │  VM/jails ├──┘      │   ▲          ▲   │ │  │
│          │ └────────┬──┘         └───┼──────────┼───┘ │  │
│          │          │                │          │     │  │
│          │          │                │   PCIe   │     │  │
│          │          │                │   pass   │     │  │
│          │ ┌────────┴─────────┐      │   thru   │     │  │
│          │ │                  │      │          │     │  │
│          │ │     bridge0      │      │          │     │  │
│  ┌────┐  │ │┌─────┐    ┌─────┐│   ┌──┴──┐    ┌──┴──┐  │  │
│  │Wifi├──┼─┼┤ ix0 │    │ ix1 ││   │ ix2 │    │ ix3 │  │  │
│  └────┘  │ │└──┬──┘    └──┬──┘│   └──┬──┘    └──┬──┘  │  │
│   .102   │ └───┼──────────┼───┘      │          │     │  │
│          └─────┼──────────┼──────────┼──────────┼─────┘  │
│                │          │.2        │.1        │        │
│                ▼          └──────────┘          ▼        │
│            to GamePC      internal ips      to vlan.     │
└──────────────────────────────────────────────────────────┘
```

## Services

### TrueNAS Features
- **TrueNAS Core Plugins**: (Currently down)
- **Docker/VM**: Only available on FreeNAS or TrueNAS Scale.

### Additional Services(in develop)
- **Sunshine + Moonlight**: Game streaming setup.
- using opnsense Upnp features    
## Security

### Security Features
- **BSD Firewall**: Securing the NAS environment.
- **OPNsense Firewall**: Implemented to filter network traffic.
- **VLAN via Tailscale**: VLAN segmentation for secure networking.
- **Two-Factor Authentication**: Additional layer of security.
- **Log Server**: (Not yet implemented)

## Issues and Failures

### Issues
- Unable to open certain BSDVMs on macOS 10.15 due to checksum invalidation. (virtualbox)


- KVM / QEMU Failure with nested FreeBSD bhyve
https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=246168

- graphic dirver failed on intel atom i3-N305 in FreeBSD 13.2 to 14
    - work well on Ubuntu & Arch

- the link aggression about firewall need to explore

#### July
- Successfully installed both systems on VirtualBox.
  - Learned FreeBSD commands.
- Installed TrueNAS Core on NTU CSIE workstation using QEMU/KVM.
  - Bhyve backend couldn't match QEMU/KVM frontend, preventing nested VM use.

#### August
- Acquired a new bare-metal machine at III (Intel Atom i3 N305).
- Successfully installed FreeBSD 13.2 and 14.1.
  - Found unclear update instructions in official documentation.
- TrueNAS Core installation failed on a single-drive system.
  - Used a layer of virtualization to simulate the problem.
- Bhyve couldn't nest up to 3 layers.
  - Adopted a flat structure to run the setup.
- Successfully set up Tailscale in OPNsense.

### New Intel Atom Machine

#### Hardware Specifications
- **NICs**: igc0, igc1
- **Wi-Fi**: iwlwifi0
  - Issue: "DHCP: no buffer space available"
- **Graphics**: Only framebuffer graphics driver available.
    - intel UHD graphics

## Documentation and Resources

### Documentation
- [Firewall and LAN](https://opnsense.org/about/about-opnsense/)
- [VLAN on WAN](https://tailscale.com/kb/1097/install-opnsense)
- [TrueNAS Core](https://forums.truenas.com/t/how-to-install-pfsense-on-virtual-machine-on-truenas-core/3317)

### Discussion Forums
- [TrueNAS Forum: Installing pfSense on TrueNAS](https://forums.truenas.com/t/how-to-install-pfsense-on-virtual-machine-on-truenas-core/3317/2)
- [TrueNAS Forum: pfSense vs. OPNsense](https://forums.truenas.com/t/pfsense-vs-opnsense/1166)
- [TrueNAS Forum: System Architecture Advice](https://forums.truenas.com/t/advise-on-system-architecture/1311/12)

### Tips and Guides
- [Using bhyve on FreeBSD](https://jjasghar.github.io/blog/2019/06/03/using-bhyve-on-freebsd/)
- [OPNsense Installation on bhyve](https://in4bsd.com/notes/opnsense-installation-on-bhyve/)

### net tools
https://tailscale.com/kb/1097/install-opnsense
https://tailscale.com/kb/1299/opnsense-unbound

## NAS Types
- **FreeNAS (12 - )**: Based on FreeBSD.
- **TrueNAS Core (13 + )**: Based on FreeBSD.
- **TrueNAS Scale**: Based on Debian.

- [Comparison: TrueNAS Core vs. TrueNAS Scale (2024)](https://forums.lawrencesystems.com/t/truenas-core-vs-truenas-scale-2024/20314/5)

## FreeBSD Development

### EZjail
- [EZjail Management](https://handbook.bsdcn.org/di-17-zhang-jail/17.6.-shi-yong-ezjail-guan-li-jail)

### QEMU & Virsh Setup
```
qemu-img create -f qcow2 -o cluster_size=2M disk00.qcow2 256G

virt-install \
--name=TruenasCore \
--vcpus=8 \
--memory=16384 \
--disk path=raid/disk00.qcow2 \
--disk path=raid/disk01.qcow2 \
--disk path=raid/disk02.qcow2 \
--disk path=raid/disk03.qcow2 \
--disk path=raid/disk04.qcow2 \
--disk path=raid/disk05.qcow2 \
--disk path=raid/disk06.qcow2 \
--cdrom=Truenas.iso \
--network=default \
--os-variant=freebsd12.0 \
--console pty,target_type=serial \
--graphics vnc,listen=0.0.0.0,password=0910 \
--noautoconsole

virsh qemu-monitor-command --hmp TruenasCore 'hostfwd_add ::3636-:22'
```

### Jails

### bhyve 

### Auto-install Script

## VM Setup Status
- **FreeNAS**: Pending
- **TrueNAS Core**: Successfully set up.
- **TrueNAS Scale**: Pending

### VirtualBox
- Successful on homelab.
- Attempting on office machine (insufficient disk space).
- macOS too old.

### VMware
- Failed on office machine (macOS too old).

### KVM
- Successful on workstation.

## Machines Involved
- **Homelab**: Development environment.
- **Gaming PC**: Client machine.
- **NAS Machine**: In purchase.
- **Office MacBook**: 2013 version (used for testing).
