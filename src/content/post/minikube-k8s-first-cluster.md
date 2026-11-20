---
title: "從裸 VM 到 minikube：我的第一個 Kubernetes cluster 作業記錄"
description: "網管課作業：virsh 開 VM、serial console、Docker Compose 到 minikube 部署，含 kompose 轉不出 bind mount volume 的失敗案例，最後靠 Helm chart 一次到位。"
pubDate: 2024-03-29T14:45:08+08:00
category: self-hosting
tags: ["docker", "kubernetes", "minikube", "helm", "linux", "tailscale"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1711694708
slug: minikube-k8s-first-cluster
---

> 擴寫自 2024-03 的網管課作業記錄（HackMD 筆記），擴寫於 2026-11。當時環境為 Ubuntu 20.04、minikube 1.3x 版本，版本號與指令請以當時脈絡解讀。

網管課的期末作業不是「在筆電上裝個 Docker 跑跑看」，而是從一台裸的工作站開始：用 virsh 開一台 VM、設定 serial console、做 SSH port forwarding、裝 Docker 跑服務，最後把整套 nginx + MySQL + phpMyAdmin 搬上 minikube。等於把「伺服器是怎麼被架起來的」整條路走一遍。這篇是當時的作業記錄整理，包含中途的失敗案例——kompose 轉不出 bind mount volume 那段，比成功的部分更有參考價值。

## 1. 用 virsh 開一台 VM

工作站上沒有 root 權限給你隨便亂裝，但 libvirt/QEMU 是現成的。先做一個 20G 的 qcow2 磁碟：

```bash
qemu-img create -f qcow2 -o cluster_size=2M ubuntu.qcow2 20G
```

再用 `virt-install` 把 VM 開起來，Ubuntu 20.04、2 vCPU、8G RAM：

```bash
virt-install \
  --name=nasa-hw5 \
  --vcpus=2 \
  --memory=8192 \
  --disk path=./ubuntu.qcow2,size=20 \
  --cdrom=ubuntu.iso \
  --os-variant=ubuntu20.04 \
  --network=default \
  --console pty,target_type=serial \
  --graphics vnc,listen=0.0.0.0,password=<password> \
  --noautoconsole
```

安裝階段需要圖形介面，透過 VNC 連進去點完安裝程式（`virsh vncdisplay nasa-hw5` 查顯示器編號）。裝完後記得 `virsh edit nasa-hw5` 把安裝光碟那段刪掉再開機，不然會又進安裝程式。開壞了就砍掉重來：

```bash
virsh shutdown nasa-hw5
virsh undefine nasa-hw5 --remove-all-storage
```

VM 化的好處在這裡就浮現了：整台機器是一個 qcow2 檔，測到爛掉直接 undefine 重開，不用怕把工作站弄壞。後來我自己在 FreeBSD 上玩巢狀虛擬化跑 OPNsense（見[〈BSD NAS + OPNsense 巢狀虛擬化〉](/blog/bsd-nas-opnsense-nested-virt/)），概念完全相通，只是 hypervisor 換人。

## 2. Serial console 與 SSH port forwarding

VNC 只在安裝時用，之後的管理靠 serial console。編輯 `/etc/default/grub`：

```
GRUB_TIMEOUT=2
GRUB_TERMINAL="console serial"
GRUB_SERIAL_COMMAND="serial --speed=115200"
GRUB_CMDLINE_LINUX="console=tty1 console=ttyS0,115200"
```

`sudo update-grub` 後重開機，回到工作站 `virsh console nasa-hw5` 就能直接看到開機訊息和登入提示。serial console 最大的好處是不依賴網路——網路設定弄壞了還救得回來。

SSH 的部分，安裝時已勾選 openssh-server，但 VM 在 libvirt 的 NAT 網段裡，外部連不進來。最省事的做法是 QEMU monitor 的 hostfwd，不用動 libvirt 網路設定：

```bash
virsh qemu-monitor-command --hmp nasa-hw5 'hostfwd_add ::3636-:22'
ssh me@<workstation> -p 3636
```

這招是即時的、不寫進 XML，VM 重開就失效——臨時用很方便，要長期用就得寫進 domain 設定。後面存取 VM 裡的網頁服務時，我改用了另一個方案。

## 3. Docker non-root 設定

VM 裝 Docker 後，第一件事是把自己加進 docker 群組，免得每個指令都 sudo：

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
docker run hello-world
```

`newgrp` 不生效就 reboot 一次。這是 [Docker 官方 post-install 文件](https://docs.docker.com/engine/install/linux-postinstall/)的標準流程，但要注意：docker 群組等於 root 權限，自己一個人用的 VM 無所謂，多人共用的機器要想清楚。

## 4. 第一個容器與內網穿透

跑個 nginx 驗證環境：

```bash
docker run -d -p 8763:80 --name nginx-1 nginx:1.24.0
curl http://localhost:8763
```

服務在 VM 裡，桌機要怎麼看到網頁？照第 2 節的做法，每個 port 都要 hostfwd 一次，很囉唆。所以我用了比較外掛的手段——Tailscale 內網穿透：

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

VM 和桌機都進同一個 tailnet 之後，桌機直接拿 Tailscale 給的 IP 當成 VM 的位址用，所有 port 都通，不用一個一個轉發。嚴格說這偏離了作業的 QEMU 網路主軸，但作業要求是「在桌機的瀏覽器看到服務」，沒規定走哪條路。事後看這是整份作業裡投資報酬率最高的一個決定，後面每個服務都靠它。

## 5. Docker Compose：MySQL + phpMyAdmin

單容器上手後，作業要求用 Compose 編排多容器。MySQL 加 phpMyAdmin 是經典組合：

```yaml
version: "3"
services:
  db:
    image: mysql:latest
    environment:
      MYSQL_ROOT_PASSWORD: <password>
      MYSQL_DATABASE: my_db
    ports:
      - "6033:3306"
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - nasa-net
  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    environment:
      PMA_HOST: db
      PMA_PORT: 3306
    ports:
      - "8888:80"
    networks:
      - nasa-net

networks:
  nasa-net:
volumes:
  db_data:
```

```bash
docker-compose up -d
```

兩個服務掛在同一個 network 上，phpMyAdmin 用 `PMA_HOST: db` 走容器名稱連資料庫——這就是 Compose 的核心價值：網路與相依關係用 YAML 講清楚，不用手動 link。資料庫資料用 named volume 存，`docker-compose down` 不會把資料砍掉。

## 6. minikube：失敗的 kompose 與成功的 Helm

最後一站是把服務搬上 Kubernetes。minikube 在 VM 裡開了一個單節點 cluster：

```bash
minikube start
minikube dashboard
```

第一個嘗試是官方文件提過的[kompose](https://kubernetes.io/docs/tasks/configure-pod-container/translate-compose-kubernetes/)：把現成的 docker-compose.yml 自動轉成 K8s manifests。聽起來很美，實際跑下去在 volume 這關直接陣亡：

```
Volume mount on the host "/home/me/nginx/conf.d" isn't supported
Volume mount on the host "/home/me/nginx/html" isn't supported
```

kompose 對 bind mount（`./nginx/conf.d:/etc/nginx/conf.d` 這種掛宿主機路徑的寫法）無法自動建立對應的 hostPath 或 local volume——Pod 是會被調度器搬來搬去的，宿主機的相對路徑在 K8s 的世界裡沒有意義，這是 Compose 和 K8s 儲存模型根本上的差異，不是工具的 bug。我的 compose 檔偏偏到處都是 bind mount，整組轉出來的 manifest 一次不起。

換方法二：直接用 Bitnami 的 Helm chart。[Helm](https://helm.sh/docs/) 是 K8s 的套件管理器，[phpMyAdmin](https://artifacthub.io/packages/helm/bitnami/phpmyadmin) 和 [MySQL](https://artifacthub.io/packages/helm/bitnami/mysql) 都有現成 chart：

```bash
helm install my-mysql bitnami/mysql
helm install my-phpmyadmin bitnami/phpmyadmin
```

這次一次到位。MySQL 和 phpMyAdmin 都成功部署起來，chart 把 Deployment、Service、ConfigMap 全部包好，連兩者之間的接線都處理掉了。同樣的目標，kompose 轉出來的東西起不來，Helm chart 開箱即用——差別在於 chart 是社群針對 K8s 重新設計過的部署單位，而 kompose 只是逐行翻譯 Compose 的直譯器。後來我是用修改過的 [nanoninja/docker-nginx-php-mysql](https://github.com/nanoninja/docker-nginx-php-mysql) 的 compose 版本跑完了 nginx + php-fpm + MySQL + phpMyAdmin 的 Docker 端需求，K8s 端則交給 Helm chart。作業最後沒完成所有項目，但服務是真的跑起來了。

## 2026-11 update

兩年半後回看：

- **minikube 活得好好的**，最新版是 v1.39.0（2026-09），預設帶 Kubernetes v1.37。不過本地 cluster 的主流選擇多了：kind（K8s 官方 CI 在用）和 k3d（底層是 k3s）在 CI 場景比 minikube 快很多，minikube 的優勢則是 addon 生態（dashboard、ingress 一個指令開）和 VM driver 的隔離度。今天要重做這份作業，VM 裡開 minikube 會變成巢狀虛擬化套兩層，用 `--driver=docker` 或直接在 VM 裡跑 kind 更合理。
- **kompose 還在維護**（v1.38.0，2026-01，三週一個 release），bind mount 的問題則是本質性的：K8s 後來的發展方向是 PV/PVC 與 CSI driver，而不是把宿主機路徑自動轉成 hostPath，所以這類「Compose 直譯到 K8s」的工具註定只適合無狀態服務。當時撞到的牆，現在還是牆。
- Tailscale 那段反而是最有先見之明的：現在它已經是自架服務的標配，VM 裡還會開著。

## References

- [minikube Documentation](https://minikube.sigs.k8s.io/docs/start/)
- [minikube Releases](https://github.com/kubernetes/minikube/releases)
- [Manage Docker as a Non-root User](https://docs.docker.com/engine/install/linux-postinstall/)
- [Translate a Docker Compose File to Kubernetes Resources](https://kubernetes.io/docs/tasks/configure-pod-container/translate-compose-kubernetes/)
- [kompose（kubernetes/kompose）](https://github.com/kubernetes/kompose)
- [Helm Documentation](https://helm.sh/docs/)
- [Bitnami phpMyAdmin Helm Chart](https://artifacthub.io/packages/helm/bitnami/phpmyadmin)
- [Bitnami MySQL Helm Chart](https://artifacthub.io/packages/helm/bitnami/mysql)
- [nanoninja/docker-nginx-php-mysql](https://github.com/nanoninja/docker-nginx-php-mysql)
- [Tailscale](https://tailscale.com/)
