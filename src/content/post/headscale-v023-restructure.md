---
title: "Headscale v0.23 目錄大搬家：一個 fork 維護者的升級筆記"
description: "從 0.22.3 升上 headscale v0.23 的目錄結構對照、machine→node 改名影響，以及 fork 自訂功能（ACL、Tag-Lock、主動斷線）的搬遷實錄。"
pubDate: 2025-07-08 02:30:30 +0800
draft: false
category: self-hosting
tags: ["headscale", "tailscale", "fork", "golang", "self-hosting"]
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1751913030
---

> 本文擴寫於 2026-11-02，原稿為 2025-07-08 的 HackMD 升版筆記（fork 維護者把自訂版 headscale 從 0.22.3 對齊 upstream v0.23 時的目錄結構對照與函式搬遷記錄），已依 GitHub 實際 repo tree 核對並修正。

維護一個帶大量自訂功能的 headscale fork，最怕的就是 upstream 丟出一個「主要目的是重構」的版本。v0.23.0 正是這種：官方自己都說，這一版原本只想整理程式碼結構，結果一路長成 284 個檔案變更、32,316 行新增、24,245 行刪除的大改版。我在 2025 年 7 月才認真把它 merge 進來——此時 upstream 已經推進到 v0.26.1，但對 fork 來說，0.22.3 → 0.23 是最痛的一段路，因為「檔案搬家」本身就是 breaking change，所有自己 patch 過的程式碼都得重新對位。

這篇筆記記錄 0.22.3 → 0.23 的目錄對應、machine → node 的改名風暴，以及我 fork 裡的 ACL、Tag-Lock、主動斷線等功能各搬去哪裡。

## 1. 目錄大搬家：0.22.3 → 0.23 對照

先講結論：`hscontrol/` 底下那個「什麼都塞在同一層」的結構沒了，改成按職責分套件。以下是我用 `git tree` 逐檔比對兩個 tag 後整理的對照（比原筆記多了幾處修正）：

```text
hscontrol/acls.go      --> hscontrol/policy/acls.go        (+ acls_types.go)
hscontrol/matcher.go   --> hscontrol/policy/matcher/matcher.go
hscontrol/config.go    --> hscontrol/types/config.go
hscontrol/db.go        --> hscontrol/db/db.go
hscontrol/machine.go   --> hscontrol/types/node.go + hscontrol/db/node.go
hscontrol/preauth_keys.go --> hscontrol/db/preauth_keys.go + hscontrol/types/preauth_key.go
hscontrol/routes.go    --> hscontrol/db/routes.go + hscontrol/types/routes.go
hscontrol/users.go     --> hscontrol/db/users.go + hscontrol/types/users.go
hscontrol/api_key.go   --> hscontrol/db/api_key.go + hscontrol/types/api_key.go
hscontrol/derp.go / derp_server.go --> hscontrol/derp/ + hscontrol/derp/server/
hscontrol/app.go       == 留在頂層（但內容大改）
hscontrol/grpcv1.go    == 留在頂層
hscontrol/noise.go     == 留在頂層
hscontrol/oidc.go      == 留在頂層
```

幾個原筆記裡沒查清楚的點，這次補齊：

- `protocol_common.go` 和 `protocol_common_poll.go` 的答案很簡單——**它們被刪了**。整個 poller 串流邏輯重寫成 channel-based 的 `hscontrol/notifier/`，產生 client map 的邏輯抽成新的 `hscontrol/mapper/`，進入點收斂到頂層的 `poll.go` 與 `handlers.go`，認證流程則進了 `auth.go`。想在 fork 上動 poll 行為的人，要找的不再是那兩個檔案。
- proto 這邊：`machine.proto` 改名 `node.proto`（#1553，API 層的 Machine 全部變成 Node），另外 0.23 **新增了 `policy.proto`**——我原本筆記裡寫的「acl.proto == same」是錯的，0.22.3 根本沒有 `acl.proto` 這個檔案。
- `preauth_keys.go` 拆兩半時，types 側是單數的 `preauth_key.go`，不是我當時草草記下的 `types/preauth_keys.go`。

## 2. machine → node：改名是骨牌，不是替換

`machine.go → node.go` 聽起來只是 rename，實際上是一次徹底的重命名運動：gRPC API、資料庫模型、protobuf、連 MagicDNS 的網域格式都動了。對 fork 的意義是：我所有以 `machine` 為名的自訂函式（`ExpireMachines`、`GetMachineByAuthKeyAndHostname` 這些）在 merge 時都要決定——跟著 upstream 改成 Node，還是保留舊名並承擔之後每次 rebase 的衝突成本。我最後選擇跟著改，一次痛完。

同一波裡還有 `preauth_keys.go` 的登入流程調整（`checkKeyValidity` 前後的 fallback 查找），以及 fork 自己加的 VPN IP 綁定：preauth key 的 tag 裡塞 `tag:vpnip_` 前綴就能指定分配的 IP：

```go
var vpnIpTags string
var ips MachineAddresses
for _, tag := range machine.ForcedTags {
    if strings.Contains(tag, "vpnip_") {
        vpnIpTags = strings.TrimPrefix(tag, "tag:vpnip_")
        break
    }
}

if len(vpnIpTags) == 0 {
    ips, err = h.getAvailableIPs() // 走原本的 allocator
} else {
    addr, _ := netip.ParseAddr(vpnIpTags)
    ips = append(ips, addr)
}
```

這段搬進 `types/node.go` 後邏輯不變，但周圍的型別名全換了，merge 時幾乎等於重寫。

## 3. policy 拆套件，YAML 出局

ACL 相關的 `acls.go`、`acls_types.go`、`matcher.go` 整組搬進 `hscontrol/policy/`。更關鍵的是 **YAML 格式不再支援，policy 只吃 HuJSON**（#1792）。如果環境裡的 policy 檔還是 `.yaml`，升級前必須先轉格式——HuJSON 是 JSON 的超集，YAML 得手動轉。

fork 側我在 `policy/acls.go` 加了一組「熱載入」入口：

```go
func LoadACLPolicyFromPath
func LoadACLPolicyFromPathAndUpdate
func LoadACLPolicyFromBytes
func LoadACLPolicyFromBytesAndUpdate
```

搭配 app 層的定期檢查，檔案有變就自動 reload：

```go
syncLastStateChangeTicker := time.NewTicker(10 * time.Second)
checkLastACLModifyTicker := time.NewTicker(10 * time.Second)

errorGroup.Go(func() error {
    for {
        select {
        case <-ctx.Done():
            return nil
        case <-syncLastStateChangeTicker.C:
            h.syncLastStateChangeFromDB()
        case <-checkLastACLModifyTicker.C:
            if h.checkACLModified() {
                h.ReloadACL()
            }
        }
    }
})
```

upstream 0.23 同時把 poller 換成 notifier channel、加入 delta updates（只推送有變動的節點），所以「輪詢 + 主動 reload」這套在新架構下要重新對位——`handlePollCommon` 的簽名和周邊狀態都變了。

## 4. DB 與 config：拆檔之餘還有 schema 地雷

`db.go` 變成 `db/` 套件後，除了檔案搬家，還有兩個和 fork 直接相關的點。

一是 routes 表的唯一鍵約束。我 fork 的版本演進裡（MRC V4.0.0 一機一路由 → V4.1.0 一機多路由），曾把 `machine_id` 設成 unique key，升級時要主動清掉：

```go
if db.Migrator().HasConstraint(&Route{}, "routes_machine_id_key") {
    if err := db.Migrator().DropConstraint(&Route{}, "routes_machine_id_key"); err != nil {
        panic(err)
    } else if db.Migrator().HasIndex(&Route{}, "routes_machine_id_key") {
        if err := db.Migrator().DropIndex(&Route{}, "routes_machine_id_key"); err != nil {
            panic(err)
        }
    }
}
```

二是 config 結構整個重排（#1700）：`db_path`、`db_host` 這些設定搬進新的 `database` 區塊，**舊結構直接移除，必須轉換**，PostgreSQL 還多了 max open/idle 連線設定。我在 fork 裡另外讓這些值支援環境變數展開：

```go
db_path := os.ExpandEnv(viper.GetString("db_path"))
db_host := os.ExpandEnv(viper.GetString("db_host"))
db_port, err := strconv.Atoi(os.ExpandEnv(viper.GetString("db_port")))
if err != nil {
    db_port = 5432
}
```

另外 Tag-Lock 這個 fork 自訂功能（`PreAuthKeyTagLock` 模型 + 掃描既有 `tag:sguser%` tags 建初始鎖定記錄）跟著 `AutoMigrate` 一起搬到 `db/` 下的遷移流程裡；`grpcv1.go` 留在頂層，但裡面的 `ExpireMachines`、`LockPreAuthKeyTagLock` 等 RPC 宣告要對到改名後的 `node.proto`。

## 踩雷注意

- **資料庫先備份再升級**，官方 release notes 反覆強調這句；0.23 的版本化遷移（#1644）一旦執行沒有回頭路。
- config 的 `database` 區塊和 DNS 區塊（#2034）都是強制轉換，舊 `config.yaml` 直接餵會起不來。
- MagicDNS 網域不再含使用者名稱，且 `dns.base_domain` 不能與 `server_url` 相同或為其子集合。
- Docker image 的 entrypoint 從 shell 換成 headscale 本體，`headscale serve` 要改成 `serve`，`/var/lib/headscale` 也不會自動建立了。
- 最舊支援的 Tailscale client 是 1.42。

## 個人評價

這次 merge 我大概花了一個週末：目錄對照表本身半天就能整理完，真正的成本在 fork 自訂函式逐一「搬進新房間」。但不得不說，0.23 之後的 headscale 明顯好維護——`policy/`、`db/`、`types/` 各司其職，poller 重寫之後的 delta update 也讓狀態同步更即時。對 fork 維護者而言，這種「搬家一次、之後好住」的重構是值得跟的；痛只是痛在當下。如果你也在維護有自訂功能的 headscale fork，我的建議是：先建這張對照表，再動 merge，順序錯了會痛苦加倍。
