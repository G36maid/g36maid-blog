---
title: "Lab Setup Guide"
description: "我這台VM是 opnsense 背後的子網設備，我覺得這是最方便的方式了"
pubDate: 2025-04-30 12:56:52 +0800
tags: ["tailscale", "bash", "sudo", "終端機", "opnsense", "權限"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1745989012
category: linux
---

我這台VM是 opnsense 背後的子網設備，我覺得這是最方便的方式了

1. 下載並安裝 Tailscale  
    * https://tailscale.com/download
2. 登入帳號（會跳轉到瀏覽器）
3. 加入群組
    * 目前權限是除了lab以外，應該只能看到自己的設備

4. 在終端機執行：

   ```bash
   sudo tailscale up --accept-routes
   ```

5. 連接到 VM：

   ```bash
   ssh group15@192.168.101.21
   ```
