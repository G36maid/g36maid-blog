---
title: "資安期末作業 hw12 writeup：摩斯漢堡密碼學、Juice Shop 與紅藍對抗"
description: "一場期末考等級的資安作業完整題解:Audacity 摩斯密碼、凱薩/Vigenère/單表替換破解、圖片 XOR 隱寫、OWASP Juice Shop 五關,再到紅隊 nmap 掃 SSH、DH 金鑰交換 MITM、約翰破解 /etc/shadow,最後用 nginx log 抓出攻擊者 IP。"
pubDate: 2024-06-08 15:46:44 +0800
tags: ["ctf", "security", "crypto", "owasp-juice-shop", "nmap", "forensics", "linux"]
category: linux
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1717832804
draft: false
---

> 擴寫自 2024-06-08 的資安課程期末作業筆記（HackMD 原稿），2026-10-23 整理擴寫。依原稿性質，文內 flag 一律以 `HW12{…}` / `NASA{…}` 表示、不附完整值，解法過程照實保留。

期末作業不是一張考卷，而是一整包紅藍對抗演練：五題古典密碼學、幾道申論題、一台裝了 OWASP Juice Shop 的靶站，外加紅隊要滲透的 VM 和藍隊要鑑識的 VM。原稿標題「好想吃摩斯漢堡」是因為整份作業的 flag 都在玩 MOS BURGER 的梗——解到後來真的會餓。以下按當時的解題順序整理。

## 一、密碼學：好想吃摩斯漢堡

### a. 摩斯密碼（27 分）

附件是音檔，直接丟 Audacity 看波形，短長分明：

![Audacity 波形與摩斯翻譯結果](/media/2024-06/rJzqXdCmR.png)

把點劃丟進翻譯器，得到 `.. .-- .- -. - -- --- ... -... ..- .-. --. . .-.`，翻成英文是一句想吃某速食店的話，本身就是 flag 內容。

### b. 凱薩密碼

密文開頭 `uj12{...}`，作業 flag 格式是 `hw12{...}`，u→h、j→w，一眼就是偏移 13 的 ROT13。不想心算就丟 [dCode](https://www.dcode.fr/caesar-cipher) 的暴力破解表，25 種偏移一次攤開來對：

![dCode 凱薩暴力破解表](/media/2024-06/Hk8vNOAmR.png)

🠞13 那行直接中獎。這題的重點其實是「密文裡的已知明文片段（flag 格式前綴）就是破密錨點」。

### c. Vigenère 密碼

一封英文信，內文不斷提到 MOS BURGER——key 就寫在臉上：`mosburger`。用 [cryptii](https://cryptii.com/) 選 Vigenère、填 key 解出明文，flag 也藏在信裡（紀念 Blaise de Vigenère 本人）：

![cryptii 解 Vigenère](/media/2024-06/H1kPSdAXR.png)

### d. 單表替換密碼

這題密文長得多，是一封摩斯漢堡店長的道歉信（前門壞了請大家走側門，順便給 10% 折扣碼）。手爆不現實，用 [planetcalc 的 Substitution cipher breaker](https://planetcalc.com/8047/) 自動求解，順便拿到解密/加密兩把字母對照表：

![planetcalc 單表替換求解器](/media/2024-06/r12fFdCmC.png)

自動求解器靠的是英文單字頻率與 pattern，信越長越好解；解出來的折扣碼就是 flag。

### e. 圖片 XOR 隱寫

給了兩張菜單圖。先 `file` 看素材：

```text
english-menu_A.png: PNG image data, 4960 x 3508, 1-bit grayscale, non-interlaced
english-menu_B.png: PNG image data, 4960 x 3508, 1-bit grayscale, non-interlaced
```

兩張都是 1-bit 灰階、尺寸相同（4960×3508，正好 A4 300dpi），典型的 XOR 隱寫組合。NumPy 一行 `np.bitwise_xor` 就出來：

```python
from PIL import Image
import numpy as np

def xor_images(p1, p2, out):
    a1 = np.array(Image.open(p1).convert('1'))
    a2 = np.array(Image.open(p2).convert('1'))
    assert a1.shape == a2.shape, "size must same"
    result = np.bitwise_xor(a1, a2)
    Image.fromarray(result.astype('uint8') * 255).save(out)
    return result

xor_images('english-menu_A.png', 'english-menu_B.png', 'output_image.png')
```

兩張圖共有的像素抵銷、只留下差異，隱藏的菜單項浮出來，flag 就寫在上面：

![XOR 結果](/media/2024-06/ByY3kqbHC.png)

隱寫題的 checklist 可以參考 [StegOnline 的 checklist](https://georgeom.net/StegOnline/checklist)——先看檔頭、尺寸、色深，再決定往 LSB 或整圖運算方向挖。

## 二、申論題：DNS、CIA 與威脅建模

這部分是純文字題，筆記裡寫了 DNS spoofing/cache poisoning/NXDOMAIN 的差異（前兩者是注入假紀錄、後者是拿不存在的網域名灌爆查詢）、DNSSEC 用數位簽章讓假回應驗不過、以及防禦清單：啟用 DNSSEC、查詢限速、監控查詢流量、定期清快取、補丁。CIA 題要各舉一個實際事件（機密性外洩、勒索軟體打可用性），威脅建模題則給筆電、簡訊實名制、線上期末考三個系統各寫安全需求、假設與對策。這類題的重點是把「假設→威脅→對策」三段講齊，跟 STRIDE 的思路接得上。

## 三、Web：OWASP Juice Shop

記分板先找出來（這關本身也是關），進度一目了然：

![Juice Shop 記分板](/media/2024-06/rk6P75-S0.png)

- **DOM XSS**：在搜尋框注入 `<iframe src="javascript:alert(`xss`)">`，讓前端把 payload 直接塞進 DOM 執行。
- **Bonus Payload**：同上，只是要換成會自動播放的 SoundCloud iframe embed。
- **Confidential Document**：目錄列表沒關。直接逛 `http://localhost:3000/ftp`：

  ![/ftp 目錄列表](/media/2024-06/rkxjKgzr0.png)

- **Error Handling**：戳不存在的路徑讓它炸 stack trace，`/rest` 直接把 Express 版本和內部路徑全部攤在頁面上——這就是為什麼錯誤該集中記 log、不該回給前端：

  ![/rest 的 500 錯誤頁](/media/2024-06/BkfpYxMHA.png)

- **Login Admin**：經典 SQL injection，帳號欄填 `' or 1=1;--`、密碼隨便，WHERE 條件被註解掉、整表成立就登入成功。

CSRF 那題是申論：成因是「請求帶著已被驗證的身份憑證、而伺服器只認憑證不認來源」，像小偷拿你的會員卡消費、店家認卡不認人。防禦就四招：二次驗證、關鍵操作不用 GET、檢查 Referrer、上 CSRF token。

## 四、紅隊：從 nmap 到約翰

第一支 flag 在一台 Alpine VM 上。先全埠掃：

```sh
sudo nmap -V -sV -P- 10.0.2.17
```

重點輸出：`22087/tcp open ssh`（SSH 躲在非標準埠）、8888 是一個自製服務、9999 回了一串 DH 公開參數。SSH 直接連：

```sh
ssh -i ~/.ssh/id_ed25519 student@10.0.2.17 -p 22087
```

拿到第一支 `NASA{...}`——flag 內容本身就在吐槽你掃到了 SSH 換 port、但幸好不用爆破。

第二題是中間人攻擊：8888 服務的橫幅寫著「Hi nasa2024! I am nasa2023. Let's perform Diffie Hellman Key Exchange to send my password to you.」——它要把密碼用 DH 協商出的金鑰加密傳給 nasa2024。DH 的弱點在於沒有身份驗證：當中間人把自己的公鑰換成 **1** 傳給 server，共識金鑰就會變成 `01000000000000000000000000000000` 這種可預測的值。把 8888 的密文接手下來，用 OnlineDomainTools 以 AES-CBC、這把已知金鑰解密：

![AES-CBC 解密 DH 加密訊息](/media/2024-06/SyB7GyMB0.png)

明文裡就是 nasa2023 的密碼，如法登入、拿第二支 `NASA{...}`（內容大意：密碼學在資安裡也很重要）：

![以取得之密碼登入成功](/media/2024-06/SyhLfyGHA.png)

第三題換成 nasa2024 後，到 `/root/comic/server` 選選項 2，讓 comic-server 用路徑穿越 `../../../etc/shadow` 把 shadow 檔讀出來，再交給 [John the Ripper](https://www.openwall.com/john/) 硬爆。原稿的當場心得很誠實：**「系統很慢，因為三層巢狀 VM，現在 john 破解中 QAQ」**——巢狀虛擬機裡跑字典攻擊，CPU 就是要命的。筆記截稿時這支還在跑，root 那行 hash 對應的最終結果就留給讀者自己爆了。

## 五、藍隊：Alpine 鑑識與 nginx log

藍隊 VM 是同台 Alpine。Alpine 沒有 `ss` 也沒有 `systemctl`，要走 OpenRC：

```text
localhost:~# netstat -tulnp
tcp  0.0.0.0:9000 php-fpm (僅 localhost)
tcp  0.0.0.0:22   sshd
tcp  0.0.0.0:80   nginx
localhost:~# rc-status
 crond / acpid / sshd / nginx / php-fpm82 [ started ]
```

![rc-status 與 Image Sharing Server](/media/2024-06/B146OCbSC.png)

網站是個 Image Sharing Server，頁面裡混了一張「hacker」圖片——這就是入侵痕跡。回頭翻 nginx access log，比對 `POST /upload.php` 之後被拉走的檔案與來源 IP，攻擊者 IP 為 `100.87.205.105`（6 月 8 日 21:11 起，從一個奇怪的外部 referer 進來大量 GET `/uploads/*`）。

nginx error log 把案情補完：`/var/www/html/uploads/662f9a8dc30bb.php` 一直在噴 `system(): Argument #1 ($command) cannot be empty`——這是一支吃 `?cmd=` 參數的 PHP webshell，log 裡甚至留著 `?cmd=ash a.sh` 的執行紀錄。結論：上傳功能沒過濾副檔名與內容，攻擊者傳了 webshell 拿到 shell。修補方向也就具體了：上傳白名單＋內容驗證、uploads 目錄禁執行 PHP、移除 webshell 與 `a.sh`、輪換可能外洩的憑證，並以 log 拉出完整入侵時間線。

## 心得

回頭看這份作業，出題結構其實很有一套：古典密碼學在練「認出密碼類型」的直覺，Juice Shop 在練對 Web 漏洞的手感，紅隊題把 nmap、DH 的金鑰交換弱點、路徑穿越、離線破解串成一條攻擊鏈，藍隊題則要求你從 log 反推同一條鏈。紅隊和藍隊看的是同一個事件的兩面——當你在 error log 認出自己紅隊題同款的 webshell 報錯時，這個體感特別強。唯一的美中不足是巢狀 VM 太慢，第三支 flag 到筆記寫完時還躺在 john 的進度條裡，QAQ。

## References

- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)（靶站本體與題目設計）
- [dCode — Caesar Cipher](https://www.dcode.fr/caesar-cipher)
- [cryptii](https://cryptii.com/)（Vigenère 等古典密碼線上解密）
- [planetcalc #8047 — Substitution cipher breaker](https://planetcalc.com/8047/)
- [StegOnline Checklist](https://georgeom.net/StegOnline/checklist)
- [iThelp 鐵人賽：資安隱寫術系列](https://ithelp.ithome.com.tw/m/articles/10323318)
- [Nmap](https://nmap.org/)（`-sV -P-` 服務與全埠掃描）
- [John the Ripper](https://www.openwall.com/john/)
- [RFC 4033 — DNS Security Introduction and Requirements (DNSSEC)](https://datatracker.ietf.org/doc/html/rfc4033)
- [RFC 6234 — HMAC / DH 無驗證之中間人問題可參照 TLS 1.3 RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446)
