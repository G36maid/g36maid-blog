---
title: "在 Debian VM 上用 Nginx 架 HTTPS 與反向代理：自簽 CA、防火牆到分流後端"
description: "從「想跑的服務比能開的 port 多」談起：在 Debian VM 上架 Nginx 的完整流程——個人頁 alias、ufw 防火牆、用 OpenSSL 自建 root CA 簽憑證把網站升級成 HTTPS，最後以兩個 Go 後端示範 proxy_pass 分流，解析尾斜線如何決定 URI 改寫。"
pubDate: 2024-05-13T11:20:18+08:00
category: self-hosting
tags: ["nginx", "reverse-proxy", "https", "openssl", "tls", "debian", "kvm", "ufw", "self-hosting"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1715570418
---

一台機器只有一個對外 IP、能開的 port 又有限，想跑的服務卻永遠比 port 多——自我架站的人早晚會撞上這個問題。這篇整理我 2024 年在一台 Debian VM 上從零架起 Nginx 的完整過程：基本設定、ufw 防火牆、用 OpenSSL 自己當 CA 簽憑證把網站升級成 HTTPS，最後用反向代理把兩個後端服務收在同一個入口後面。環境雖然是 KVM 開出來的 VM，整套流程搬到樹莓派或 VPS 上照樣能跑。

## 1. 環境：Debian VM 與 port forwarding

先用 `qemu-img` 開一塊 qcow2 磁碟，再用 virt-install 裝 Debian 12，裝完把一般帳號加進 sudo 群組。VM 在 NAT 網段裡，宿主機得用 QEMU monitor 的 hostfwd 把 port 轉進去：

```bash
qemu-img create -f qcow2 debian.qcow2 30G
virt-install --name=nginx-lab --vcpus=4 --memory=4096 \
  --disk path=debian.qcow2,size=30 --os-variant=debian12 \
  --cdrom=debian.iso --network=default \
  --console pty,target_type=serial --noautoconsole

virsh qemu-monitor-command --hmp nginx-lab 'hostfwd_add ::3680-:80'
virsh qemu-monitor-command --hmp nginx-lab 'hostfwd_add ::36443-:443'
```

宿主機的 3680/36443 分別對到 VM 的 80/443，之後從區網連 `http://<宿主機IP>:3680` 就是 VM 的網頁服務。接著 `apt install nginx`。Debian 的設定結構值得記一下：`/etc/nginx/nginx.conf` 讀入 `sites-enabled/` 底下的檔案，實際編輯的是 `sites-available/default` 再 symlink 過去，跟 Apache 的 a2ensite 是同一個思路，細節可參考 [Debian wiki 的 Nginx 目錄結構](https://wiki.debian.org/Nginx/DirectoryStructure)。

## 2. 基礎設定：首頁、個人目錄與 IP 白名單

改 `/var/www/html/index.html` 後 `sudo systemctl reload nginx`，預設首頁就換成自己的內容。比較有意思的是模仿多人主機上常見的 `~user/` 個人頁：讓 `/~xxx/` 對應到 `/home/xxx/htdocs/`，用 location 加 alias：

```nginx
location ~ ^/~([\w-]+)/(.*)$ {
    alias /home/$1/htdocs/;
    index index.html;
    try_files $2 $2/ =404;
}
```

**踩雷注意**：nginx 的 worker process 以 `www-data` 身分執行，要能穿越（traverse）home directory 才讀得到檔案。最直覺的做法是 `chmod 755 /home/xxx`，但這等於讓機器上所有本地帳號都能瀏覽你的家目錄——在多人共用的機器上是實實在在的安全性問題。比較好的做法是把網站目錄搬到 `/var/www` 底下、只對 `www-data` 用 `setfacl` 精準開權限，或至少只開目錄的 execute bit 而不是整個 home 讀成 755。

如果只想讓某些內網來源看到特定頁面，ngx_http_access_module 的 allow/deny 可以做簡單的 IP 白名單：

```nginx
location /secret.html {
    allow 192.168.28.0/24;
    deny all;
}
```

## 3. 防火牆：ufw

服務開起來後第一件事是收斂暴露面，只留 22、80、443：

```bash
apt install ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

測試方式：從另一台機器對沒開的 port 連線應該是 timeout 而不是 connection refused，或用 nmap 掃一遍對照。順序很重要——`ufw enable` 之前先把 22/tcp 放行，否則 SSH 會把自己鎖在門外。

ufw 管的是單一主機的暴露面；如果防線要整個外推到家裡網路的邊界，那就是另一套玩法了——我把 OPNsense 塞進 NAS 的過程（與踩雷）記在[在 NAS 裡虛擬化防火牆](/blog/bsd-nas-opnsense-nested-virt/)一篇。

## 4. Access log

nginx 預設就會寫 access log，但值得確認 `/etc/nginx/nginx.conf` 的 `http` 區塊裡有這行：

```nginx
access_log /var/log/nginx/access.log;
```

被掃描或 debug 404 時這個檔案是第一現場，`tail -f /var/log/nginx/access.log` 可以即時看到誰在打你的伺服器、打了什麼路徑。

## 5. 自簽 CA 與 HTTPS

HTTPS 的信任模型建立在 PKI 上：瀏覽器內建一組信任的 root CA，伺服器憑證要嘛由這些 CA 簽出來，要嘛就得自己想辦法讓客戶端信任。內網或練習環境走 Let's Encrypt 不一定方便，自己當 CA 是最乾淨的練習——而且走完一次就會懂憑證警告到底在警告什麼。

流程分兩段。先造一個自簽的 root CA（私鑰加憑證），再產生伺服器的私鑰與 CSR（Certificate Signing Request），交給 CA 簽章：

```bash
# 1. CA 的私鑰與自簽憑證（-x509 表示直接輸出憑證而非 CSR）
openssl genrsa -out ca.key 2048
openssl req -new -x509 -key ca.key -out ca.crt -days 3650

# 2. 伺服器私鑰與 CSR，Common Name 填實際連線的位址
openssl genrsa -out site.key 2048
openssl req -new -key site.key -out site.csr

# 3. 用 CA 簽署 CSR，產出伺服器憑證
openssl x509 -req -in site.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out site.crt -days 825
```

`openssl req` 預設的產物是 CSR，加上 `-x509` 就改成直接自簽輸出憑證（[man page](https://www.openssl.org/docs/man3.0/man1/openssl-req.html)）；不想互動輸入的話有一行版，`-nodes` 表示私鑰不做密碼保護：

```bash
openssl req -x509 -newkey rsa:4096 -sha256 -nodes \
  -keyout site.key -out site.crt -days 3650
```

nginx 端把 `sites-available/default` 的 `listen 80` 換成 443：

```nginx
listen 443 ssl default_server;
listen [::]:443 ssl default_server;
ssl_certificate      /etc/nginx/ssl/site.crt;
ssl_certificate_key  /etc/nginx/ssl/site.key;
ssl_protocols        TLSv1.2 TLSv1.3;
ssl_ciphers          ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
ssl_prefer_server_ciphers on;
```

再加一個 server block 把 HTTP 導去 HTTPS：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;
    return 301 https://$host:36443$request_uri;
}
```

**踩雷注意**：

- 當年的筆記裡 `ssl_protocols` 列了 TLSv1 和 TLSv1.1——這兩個協定已被 [RFC 8996](https://datatracker.ietf.org/doc/html/rfc8996) 正式廢止，現代設定只該留 TLSv1.2 與 TLSv1.3，照抄舊範例前記得檢查這行。
- 瀏覽器只信 root store 裡的 CA，自簽 CA 簽的憑證一定跳警告。解法是把 `ca.crt` 匯入作業系統或瀏覽器的信任清單（Firefox 有自己的憑證儲存，Chromium 系走系統的 NSS/p11-kit），臨時測試也可以 `curl -k` 跳過驗證——但要知道自己跳過了什麼。
- 另一個現代坑：Chrome 從 58 開始憑證比對看 subjectAltName 而不看 Common Name。自簽時用 `-addext "subjectAltName=IP:192.168.28.x"` 把實際連線位址寫進 SAN，否則流程再正確瀏覽器照樣拒收。

## 6. 反向代理分流兩個後端

最後把多個服務收進同一個入口。先用 Go 寫兩個最小的 http server（`net/http` 標準庫就夠）：

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "<h1>Hi! This is host A.</h1>")
    })
    if err := http.ListenAndServe(":8888", nil); err != nil {
        fmt.Println(err)
    }
}
```

另一份只差 port 9999 和回應字串，不重複貼。兩個程式分別 `go run` 掛起來，nginx 加上：

```nginx
location /hostA/ {
    proxy_pass http://127.0.0.1:8888/;
}
location /hostB/ {
    proxy_pass http://127.0.0.1:9999/;
}
```

`sudo systemctl reload nginx` 之後，`/hostA/` 和 `/hostB/` 就各自落到不同後端。

**proxy_pass 尾斜線的行為**是這段最值得搞懂的細節。官方文件的規則是：當 `proxy_pass` 帶有 URI 時，location 匹配到的前綴會被替換成該 URI。以 `location /hostA/` 搭配 `proxy_pass http://127.0.0.1:8888/`（有尾斜線）為例，請求 `/hostA/foo` 送到後端時變成 `/foo`；如果寫成 `http://127.0.0.1:8888`（無尾斜線、無 URI），nginx 就把原始路徑 `/hostA/foo` 原封不動轉過去。上面的後端 handler 掛在 `/`，靠的是替換後的乾淨路徑；反之若後端路由預期帶前綴，就拿掉尾斜線。差一個斜線、行為完全不同，debug 時先檢查這裡。

反向代理的價值也在這一步收攏：後端服務只綁 `127.0.0.1` 不對外暴露，對外統一走 443 的 TLS，未來要加負載平衡、快取或存取控制都在 proxy 層處理；防火牆也只需開 443，8888/9999 完全不必見外。

## 回顧

整套走完，一台 VM 有了防火牆、access log、HTTPS 和統一入口的反向代理——剛好是對外服務的基本盤。之後要加新服務，就是在設定檔多一個 location、多掛一個監聽本機 port 的程序。自簽 CA 對正式網站來說終究要換成 Let's Encrypt 之類的自動簽發，但親手跑過「產 key → 產 CSR → CA 簽章 → 匯入信任」這條路之後，再看瀏覽器那個「您的連線不是私人連線」的警告，就知道它是在驗什麼、又缺了什麼。
