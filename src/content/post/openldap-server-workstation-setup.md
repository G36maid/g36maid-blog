---
title: "OpenLDAP 伺服器 + 工作站建置實錄：自簽 CA、SSSD 與 sudoers 進 LDAP"
description: "整理自 2025 年課程作業的 LDAP 集中帳號教學：Debian 上用 ldapmodify -Y EXTERNAL 改 suffix/rootdn、certtool 自簽 CA 與 ldaps 踩雷、Arch 工作站以 SSSD/NSS/PAM 接上，sudoRole 進 LDAP、三條 ACL 與 python-ldap 建刪帳號腳本。"
pubDate: 2025-07-25 13:59:48 +0800
category: linux
tags: ["ldap", "openldap", "sssd", "sudo", "tls", "certificate", "linux", "arch-linux"]
draft: false
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1753423188
---

# OpenLDAP 伺服器 + 工作站建置實錄

> 本文擴寫於 2026-11，原文是 2025 年一份課程作業的整理，內容已去識別化。情境很單純：一間工作站機房要集中管理帳號，LDAP 伺服器跑在 Debian/Ubuntu，工作站是 Arch Linux。

## 為什麼 2025 年還在用 LDAP

帳號集中管理不是新需求：幾十台機器、兩種身分（管理群和一般登入帳號），總不能每台機器手動 `useradd` 再對帳。2025 年的自由軟體世界當然有更完整的方案——FreeIPA、Samba AD，或直接用 SSSD 綁現有的 Active Directory——但它們通常要再架 Kerberos KDC 或 Domain Controller。如果只是「帳號和密碼集中放一處、機器透過網路查」，一個 slapd 加上 SSSD 就是最少依賴的組合；[SSSD 官方文件](https://sssd.io/docs/introduction.html)至今仍把 `id_provider = ldap` 列為一級公民，所以在小型機房裡 LDAP 還是活得好好的。之前在[架 Online Judge 管一批機器](/blog/cms-online-judge-deployment/)時就遇過同樣的帳號問題，這次直接把它做成正規解法。

## 1. 伺服器：suffix、rootdn、rootpw

Debian 的 slapd 預設 suffix 是安裝時問你的那個值，要改成自己的：

```ldif
# suffix.ldif
dn: olcDatabase={1}mdb,cn=config
changetype: modify
replace: olcSuffix
olcSuffix: dc=lab,dc=example,dc=org
```

```bash
sudo ldapmodify -Y EXTERNAL -H ldapi:/// -f suffix.ldif
```

`-H ldapi:///` 走本機 Unix socket，`-Y EXTERNAL` 是 SASL 的 EXTERNAL 機制：身分不靠密碼，而是從連線層「外部」取得——這裡是 socket 的 `SO_PEERCRED`，也就是「你是本機的誰」。root 連進來就對應到 `cn=config` 的管理身分，所以改 config 完全不用密碼；這也是所有 OpenLDAP 教學第一步都是這條指令的原因。同樣方式改 `olcRootDN`、`olcRootPW`（rootpw 建議先用 `slappasswd` 產生雜湊再貼進 LDIF），然後灌入 base 結構：

```ldif
# base.ldif
dn: dc=lab,dc=example,dc=org
dc: lab
objectClass: top
objectClass: domain

dn: cn=admin,dc=lab,dc=example,dc=org
cn: admin
objectClass: organizationalRole
description: admin account

dn: ou=people,dc=lab,dc=example,dc=org
ou: people
objectClass: organizationalUnit

dn: ou=group,dc=lab,dc=example,dc=org
ou: group
objectClass: organizationalUnit
```

## 2. TLS：自簽 CA 與 ldaps

機房內網也不該讓密碼走明文。用 `certtool`（套件 `gnutls-bin`）自簽一組 CA 和 server 憑證：

```bash
sudo apt install gnutls-bin ssl-cert

# CA 私鑰
sudo certtool --generate-privkey --bits 4096 --outfile labcakey.pem

# ca.tmpl
cn = Lab Example CA
ca
cert_signing_key
expiration_days = 3650

sudo certtool --generate-self-signed \
  --load-privkey labcakey.pem \
  --template ca.tmpl \
  --outfile /usr/local/share/ca-certificates/lab-ca.crt
sudo update-ca-certificates

# server 私鑰
sudo certtool --generate-privkey --bits 2048 \
  --outfile /etc/ldap/server_key.pem

# server.tmpl
organization = Lab Example
cn = ldap.lab.example
tls_www_server
encryption_key
signing_key
expiration_days = 3652

sudo certtool --generate-certificate \
  --load-privkey /etc/ldap/server_key.pem \
  --load-ca-certificate /etc/ssl/certs/lab-ca.pem \
  --load-ca-privkey labcakey.pem \
  --template server.tmpl \
  --outfile /etc/ldap/server_cert.pem

sudo chgrp openldap /etc/ldap/server_key.pem
sudo chmod 0640 /etc/ldap/server_key.pem
```

這裡最容易踩的雷是 **CN 必須等於客戶端連線用的 hostname**（`ldap.lab.example`），不是伺服器的 FQDN 或 IP 都會在驗證時炸出 `certificate verify failed`。自簽 CA 的另一個坑是信任鏈：CA 憑證要裝進**每一台**客戶端的系統信任庫，只裝伺服器自己沒用。

Ubuntu 的 [LDAP TLS 文件](https://ubuntu.com/server/docs/ldap-and-transport-layer-security-tls)把流程講得很清楚。至於 `starttls` 和 `ldaps` 的差別：前者是在明文的 389 連線上用 `StartTLS` 操作升級成 TLS（傳統 389 埠），後者從 TCP 636 一開始就是 TLS。功能等價，但 `ldaps://` 需要在 `/etc/default/slapd` 明確加進服務清單：

```bash
SLAPD_SERVICES="ldap:/// ldapi:/// ldaps:///"
sudo systemctl restart slapd
```

之後客戶端都走 `ldaps://` 就好，可以少想一層「連線升級到底成功了沒」。

## 3. 工作站：SSSD、NSS、PAM

Arch 端安裝 `openldap`、`sssd`、`nss-pam-ldap`，把 CA 憑證拷過去執行 `update-ca-trust`，然後寫 `/etc/sssd/sssd.conf`（記得 `chmod 0600`）：

```ini
[sssd]
config_file_version = 2
services = nss, pam, sudo
domains = LDAP
[domain/LDAP]
cache_credentials = true
enumerate = true
id_provider = ldap
auth_provider = ldap
ldap_uri = ldaps://ldap.lab.example
ldap_search_base = dc=lab,dc=example,dc=org
ldap_tls_reqcert = demand
ldap_tls_cacert = /etc/ssl/certs/lab-ca.pem
chpass_provider = ldap
ldap_network_timeout = 2
sudo_provider = ldap
sudoers_base = ou=sudo,dc=lab,dc=example,dc=org
ldap_schema = rfc2307bis
ldap_group_member = uniqueMember
[nss]
filter_users = root
```

細節參數（`ldap_schema`、群組成員屬性的選擇）照 [Arch Wiki 的 LDAP authentication 頁](https://wiki.archlinux.org/title/LDAP_authentication)和 [sssd.conf(5)](https://man.archlinux.org/man/sssd.conf.5) 對照即可。NSS 接著掛上 `sss`：

```text
passwd: files systemd sss
group: files [SUCCESS=merge] systemd sss
shadow: files systemd sss
sudoers: files sss
```

`[SUCCESS=merge]` 是 glibc nsswitch 的動作指令：預設 `files` 查到資料就停（後面根本輪不到 LDAP）；加上 merge 之後，`files` 命中**還會繼續查下一個來源並把結果合併**。放在 `group` 這行，是為了讓本地群組和 LDAP 群組的成員能同時出現，例如某帳號的輔助群組一半在 `/etc/group`、一半在 LDAP。PAM 端在 `system-auth` 加 `pam_sss.so`，並保留 `pam_mkhomedir.so` 那行，LDAP 帳號首次登入才會自動建家目錄。

原稿還關掉了 nscd 的 passwd/group 快取——因為 SSSD 自己有快取，兩層快取疊著常常查到過期資料，debug 時更是災難。

## 4. 群組與 sudoers 進 LDAP

```ldif
dn: cn=ta,ou=group,dc=lab,dc=example,dc=org
objectClass: posixGroup
cn: ta
gidNumber: 1001

dn: cn=student,ou=group,dc=lab,dc=example,dc=org
objectClass: posixGroup
cn: student
gidNumber: 1002

dn: cn=ta_sudo,ou=sudo,dc=lab,dc=example,dc=org
objectClass: top
objectClass: sudoRole
cn: ta_sudo
sudoUser: %ta
sudoHost: ALL
sudoCommand: ALL
```

`sudoRole` 需要 sudo 的 LDAP schema；Debian 的 sudo 套件不像某些發行版會附 schema 檔，得自己抓 `sudo.ldif` 餵進去（詳見 [sudoers.ldap 手冊](https://www.sudo.ws/docs/man/sudoers.ldap.man/)）。之後 `ta` 群組的帳號在任何主機都能 sudo，`student` 不行——sudo 規則本身也變成集中管理的資料，工作站端的 `/etc/sudoers` 幾乎不用動。

## 5. ACL

三條規則解決「誰能改什麼」：

```ldif
access to attrs=userPassword
    by self write
    by * none

access to attrs=homeDirectory,uidNumber,gidNumber
    by * none

access to *
    by self write
    by * read
```

第一條讓密碼只有本人能改；第二條把家目錄和 uid/gid 對所有人封鎖，連讀都不行（不然等於告訴大家機器上有哪些帳號結構可以偽造）；第三條是兜底——其他人其他屬性可讀、只有本人可寫。ACL 由上而下第一條命中即生效，所以順序本身就是語意。

## 6. python-ldap 腳本

批次建帳號/刪帳號用 [python-ldap](https://www.python-ldap.org/en/python-ldap-3.4.3/index.html) 收斂成一個小函式就夠：

```python
#!/usr/bin/env python3
import getpass, ldap

BASE = "dc=lab,dc=example,dc=org"
ADMIN = f"cn=admin,{BASE}"

conn = ldap.initialize("ldaps://ldap.lab.example")
conn.simple_bind_s(ADMIN, getpass.getpass("admin password: "))

def add_user(uid, password, uid_number, gid_number=1002):
    dn = f"uid={uid},ou=people,{BASE}"
    conn.add_s(dn, [
        ("objectClass", [b"inetOrgPerson", b"posixAccount"]),
        ("uid", [uid.encode()]),
        ("cn", [uid.encode()]),
        ("userPassword", [password.encode()]),
        ("homeDirectory", [f"/home/{uid}".encode()]),
        ("uidNumber", [str(uid_number).encode()]),
        ("gidNumber", [str(gid_number).encode()]),
    ])

def del_user(uid):
    conn.delete_s(f"uid={uid},ou=people,{BASE}")
```

一個誠實的註腳：這樣直接把 `userPassword` 用明文丟進 `add_s`，存進去的也是明文——正式一點的作法是先用 `slappasswd` 或 `ldap.sasl` 算出 `{SSHA}` 雜湊再寫入，或改用 `ldappasswd` 改密碼。批次腳本圖快的時候特別容易忘。

---

全部跑完之後，從任何一台工作站用 LDAP 帳號 SSH 進去：家目錄自動建立、`ta` 群組能 sudo、`student` 不能，管理面只剩一台伺服器。以 2025 年的標準這套做法毫不起眼，但「十幾台機器、一個 slapd」的場景裡，它到今天都還是最省事的路。
