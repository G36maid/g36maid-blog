---
title: "Headscale v0.23 Upgrade & Refactor Report"
description: "Headscale v0.23 was originally intended as a refactoring release focused on maintainability. However, it evolved into a major upgrade wit…"
pubDate: 2025-07-10 07:20:22 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1752103222
---

## Summary

Headscale v0.23 was originally intended as a refactoring release focused on maintainability. However, it evolved into a major upgrade with broad architectural and functional changes, including:

* Module-based code organization (`policy`, `mapper`, `notifier`, `types`, `db`, etc.)
* Improved test coverage and reduced technical debt
* Introduction of delta updates and real-time node notifications
* Breaking changes in configuration, policy format, and API structure

## Upstream Highlights (v0.23)

| Area            | Description                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Code Refactor   | Split into logical packages with reduced global state. Improved maintainability.                      |
| Policy System   | New `policy` module. YAML format deprecated. Now uses **HuJSON**.                                     |
| Notifier System | Introduced real-time updates via `notifier` and Go channels. Replaces poll interval model.            |
| Delta Updates   | Clients now receive only diffs (added/removed/updated nodes), improving performance.                  |
| Polling Rewrite | The polling system is now channel-driven, allowing immediate client notifications.                    |
| Node Model      | API structure renamed: `Machine` → `Node`. All references updated.                                    |
| DNS Changes     | MagicDNS domains no longer contain usernames (configurable).                                          |
| Docker          | Uses [ko](https://github.com/ko-build/ko) for image builds. Entrypoint changed. Config paths updated. |
| CLI             | All CLI commands (except `serve`) require minimal config. stdout/stderr handling unified.             |
| DERP            | Requires private key. Validates DERP config strictly at startup.                                      |
| Configuration   | YAML structure reorganized. See updated `config-example.yaml`.                                        |



## File Structure Changes

### Module Mappings

| Old File                  | New Location (v0.23)                         |
| ------------------------- | -------------------------------------------- |
| `acls.go`                 | `policy/acls.go`                             |
| `config.go`               | `types/config.go`                            |
| `db.go`                   | `db/db.go`                                   |
| `machine.go`              | `node.go`                                    |
| `routes.go`               | `db/routes.go`, `types/routes.go`            |
| `preauth_keys.go`         | `db/preauth_keys.go`, `types/preauth_key.go` |
| `protocol_common.go`      | `auth.go`                                    |
| `protocol_common_poll.go` | `poll.go`                                    |
| `headscale.proto`         | Unchanged                                    |
| `machine.proto`           | Renamed to `node.proto`                      |

---


## Key Technical Insights for Migration

### Critical Architecture Changes

**1. Policy Management System Overhaul**
- **Old (0.22.3-dev)**: File-based ACL with helper functions (`copyACLConfig`, `getPendingACLConfig`, etc.) for safe modifications
- **New (0.23-dev)**: Unified `GetPolicy`/`SetPolicy` API supporting both file mode and DB mode
- **Challenge**: DB mode creates new policy records (versioned), while file mode requires atomic writes

**2. Real-time Notification System**
- **New Feature**: `notifier` module with channel-based node updates
- **Benefit**: Immediate ACL policy propagation vs. periodic polling
- **Architecture**: Each connected node gets a dedicated Go channel for `StateUpdate` messages
- **Batching**: Intelligent update batching for performance (patches merged, full updates sent immediately)

**3. Clustering Considerations**
- **File Mode**: Requires timestamp-based polling to detect changes across instances
- **DB Mode**: Shared database provides consistency but still needs inter-instance notification
- **Solution**: Background policy watcher for both modes with configurable intervals

## Business Requirements in Old version (v0.22.3-dev)

**Requirements for Multi-Instance Deployment:**
1. **Shared State**: Database or shared filesystem
2. **Change Detection**: Timestamp-based polling or file watching
3. **Notification**: Each instance notifies its own connected nodes
4. **Atomic Operations**: Prevent race conditions in policy updates

### [New Feature] ACL Control API + Active ACL Reload
**Business Need:** Fine-grained ACL management from control panels without manual file editing
**Technical Implementation:**
- Added REST/gRPC APIs for ACL manipulation (`ACLCreateGroup`, `ACLGroupAddUser`, etc.)
- Implemented active ACL reload to propagate changes immediately
- **Clustering Support:** Shared database + file monitoring with timestamp-based synchronization
- **Challenge in v0.23:** Old helper functions (`copyACLConfig`, `getPendingACLConfig`) no longer needed due to new `SetPolicy`/`GetPolicy` paradigm

### [New Feature] Transparent Mode
**Business Need:** Allow nodes to advertise subnets transparently without manual route configuration
**Technical Implementation:**
- Modified route handling in `routes.go`, `grpcv1.go`, `protocol_common_poll.go`
- Enabled automatic subnet advertisement for any node
- **Challenge in v0.23:** Deep integration required with new `notifier` and `mapper` modules

### [Feature] Tag-Lock System
**Business Need:** Implement tiered access control for different user plans
**Technical Implementation:**
- Default tag assigned to each user
- Additional tags locked based on subscription tier
- Prevents privilege escalation
- **Challenge in v0.23:** Requires careful integration with new node model and `types/preauth_key.go`

### [Feature] Environment Variable Config Support
**Business Need:** Simplified cluster deployment without manual config file management
**Technical Implementation:**
- Added `${ENV_VAR}` support in YAML config files
- Enables container-based deployment with environment-specific settings
- **Status in v0.23:** ✅ Already supported in `types/config.go`

### [Feature] Custom IP via VPN Tag
**Business Need:** Assign specific IP addresses to nodes based on their purpose/role
**Technical Implementation:**
- PreAuthKey contains IP assignment logic
- Tags determine IP allocation policy
- **Challenge in v0.23:** Requires reimplementation in `db/node.go` and `types/preauth_key.go`

### [Feature] Group-based Route Isolation
**Business Need:** Prevent cross-group route advertisement for security
**Technical Implementation:**
- Group membership determines route visibility
- Prevents unauthorized subnet access
- **Challenge in v0.23:** May be partially handled by new `mapper` module and delta updates

### [Optimization] Database Connection Reduction
**Business Need:** Improved performance and reduced database load in clustered environments
**Technical Implementation:**
- Reduced frequency of node refresh operations
- Batch database operations where possible
- **Status in v0.23:** ✅ Improved through modular `db/` architecture and `notifier` system


## Mapping: Old Custom Features vs Upstream v0.23

| Legacy Feature                | Upstream Status      | Old Location(s)                                     | New Module(s) / File(s)                      | Notes                                                  |
| ----------------------------- | -------------------- | --------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| ACL Control API (`SetPolicy`) | ✅ Merged             | `acls.go`, `grpcv1.go`                              | `policy/acls.go`, `db/policy.go`             | Uses HuJSON format; validated with new `policy` loader |
| Active ACL Reload             | ✅ Merged             | `app.go`, `acls.go`                                 | `notifier/`, `hscontrol/app.go`              | Now handled via `notifier.NotifyAll`                   |
| Tag-Lock Feature              | ❌ Not Upstream       | `db.go`, `grpcv1.go`, `preauth_keys.go`             | `db/preauth_keys.go`, `types/preauth_key.go` | Patch required; DB tag filtering must be re-integrated |
| Transparent Mode Support      | ❌ Not Upstream       | `routes.go`, `grpcv1.go`, `protocol_common_poll.go` | `poll.go`, `db/routes.go`, `node.go`         | Requires notifier + mapper integration                 |
| Active Disconnect API         | ❌ Not Upstream       | `grpcv1.go`, `machine.go`, `preauth_keys.go`        | `db/node.go`, `grpcv1.go`                    | Needs deep re-integration using new notifier lifecycle |
| Custom VPN IP via `tag`       | ❌ Not Upstream       | `machine.go`, `preauth_keys.go`                     | `db/node.go`, `types/preauth_key.go`         | Custom IP assignment logic must be ported              |
| Group-based Route Isolation   | ⚠️ Partially Covered | `machine.go`                                        | `db/routes.go`, `notifier/`                  | Delta update & `mapper` may partially cover this       |
| DB Connection Optimization    | ✅ Improved           | `app.go`, `machine.go`, `routes.go`                 | `db/`, `notifier/`, `poll.go`                | Modularized DB layer improves performance              |
| YAML Env Var Support          | ✅ Supported          | `config.go`                                         | `types/config.go`                            | `${ENV}` placeholders supported out of the box         |
| Machine → Node Rename         | ✅ Renamed            | `machine.go`, `machine.proto`                       | `db/node.go`, `proto/v1/node.proto`          | Unified naming between backend and API                 |


## Each Features:

### porting ACL Control Apis:

The migration from v0.22.3-dev to the target v0.23 release involves a fundamental architectural shift in how Access Control Lists (ACLs) are managed.

*   **Legacy System (v0.22.3-dev):**
    *   Offered numerous granular API endpoints (e.g., `ACLCreateGroup`, `ACLGroupAddUser`).
    *   Relied on helper functions (`copyACLConfig`, `getPendingACLConfig`) to manage a "pending changes" workflow.
    *   This system was designed exclusively for `FileMode`, using a temporary file mechanism to ensure changes were atomic.

*   **New System (v0.23):**
    *   Introduces a generalized API with two primary endpoints: `GetPolicy` and `SetPolicy`.
    *   Adds `DBMode`, allowing policies to be stored in a database as a single string.
    *   Integrates a `Notifier` mechanism within `SetPolicy` to proactively push updates to connected nodes.

The central challenge is that the new, powerful `SetPolicy` function, as implemented in the upstream version, **only supports `DBMode`**, while our requirement is to support both `FileMode` and `DBMode` for our clustered environment.

### 2. Analysis of Potential Solutions

We have evaluated three potential strategies for porting our existing ACL functionalities.

---

#### **Solution 1: Generalize `SetPolicy` and Re-implement ACL APIs as Wrappers**

*   **Description:** This approach focuses on making the new `SetPolicy` function the universal entry point for all policy modifications. The first step is to extend `SetPolicy` to properly handle `FileMode`, including implementing atomic file writes to prevent corruption in a clustered environment. Subsequently, all legacy `ACL*` APIs would be re-implemented as lightweight wrappers that perform a "Read-Modify-Write" cycle:
    1.  Call `GetPolicy` to fetch the current policy (from file or DB).
    2.  Unmarshal the policy string into a Go struct and modify it in memory.
    3.  Marshal the updated struct back into a string.
    4.  Call the now-unified `SetPolicy` with the new policy string.

*   **Pros:**
    *   **Clean Architecture:** Aligns with the intended design of the new version.
    *   **DRY (Don't Repeat Yourself):** The logic for validation, storage, and node notification is centralized in `SetPolicy`.
    *   **Maintainability:** Easier to debug and maintain, as all write operations flow through a single, well-defined function.

*   **Cons:**
    *   **Upfront Effort:** Requires an initial investment to correctly implement `FileMode` support within `SetPolicy`.

---

#### **Solution 2: Implement Dual-Mode Logic in Each Legacy API**

*   **Description:** In this alternative, each of the old `ACL*` functions (`ACLCreateGroup`, etc.) would be individually responsible for handling both `FileMode` and `DBMode`. Each function would contain an `if/else` block to switch between writing to a file or writing to the database.

*   **Pros:**
    *   **Direct Porting:** Might feel like a more direct, one-to-one port of the existing code's functionality.

*   **Cons:**
    *   **Massive Code Duplication:** The logic for file I/O, database I/O, validation, and node notification would be repeated across dozens of functions.
    *   **Maintenance Nightmare:** A bug in the storage logic would need to be fixed in every single API function.
    *   **Inconsistent Behavior:** High risk of different APIs behaving slightly differently, leading to subtle bugs.

---

#### **Solution 3: Make the Old Helper Functions Mode-Aware**

*   **Description:** This solution involves modifying the old helper functions (`copyACLConfig`, etc.) to support both `FileMode` and `DBMode`. The `ACL*` APIs would then be rebuilt on top of these enhanced helpers.

*   **Pros:**
    *   Abstracts the storage layer away from the main API logic.

*   **Cons:**
    *   **Fights the New Paradigm:** This approach essentially ignores the new `GetPolicy`/`SetPolicy` model and tries to force the old "pending changes" workflow onto the new architecture.
    *   **Unnecessary Complexity:** It re-implements a custom storage and transaction layer that `SetPolicy` is already designed to handle, creating a redundant and awkward middle ground.



### Critical Technical Considerations

**1. Database Policy Storage**
- DB mode stores policy as JSON string in `policies` table
- Each `SetPolicy` call creates a new record (versioned approach)
- `GetPolicy` returns latest by ID/timestamp
- No old helper functions needed (`copyACLConfig`, `getPendingACLConfig`)

**2. Clustering Implementation**
- **File Mode**: Requires file watching with timestamp comparison
- **DB Mode**: Requires periodic DB polling for policy updates
- **Solution**: Background `PolicyWatcher` for both modes
- **Notification**: Each instance only notifies its own connected nodes

**3. Real-time Update Flow**
```
SetPolicy() → Validate → Store → Update In-Memory → NotifyAll() → Node Channels
```

**4. Notifier Architecture**
- Each node gets dedicated channel: `map[NodeID]chan<- StateUpdate`
- Batching system for efficiency (patches merged, full updates immediate)
- Timeout protection prevents deadlocks
- Channel replacement on reconnection


## current project structure

### tree headscale-v0.22.3-dev
```bash
.
├── buf.gen.yaml
├── cmd
│   └── headscale
│       ├── cli
│       │   ├── api_key.go
│       │   ├── configtest.go
│       │   ├── debug.go
│       │   ├── dump_config.go
│       │   ├── generate.go
│       │   ├── mockoidc.go
│       │   ├── nodes.go
│       │   ├── preauthkeys.go
│       │   ├── pterm_style.go
│       │   ├── root.go
│       │   ├── routes.go
│       │   ├── server.go
│       │   ├── users.go
│       │   ├── utils.go
│       │   └── version.go
│       └── headscale.go
├── Dockerfile
├── go.mod
├── go.sum
├── hscontrol
│   ├── acls.go
│   ├── acls_types.go
│   ├── api_common.go
│   ├── api.go
│   ├── api_key.go
│   ├── app.go
│   ├── config.go
│   ├── db.go
│   ├── derp.go
│   ├── derp_server.go
│   ├── dns.go
│   ├── grpcv1.go
│   ├── handler_legacy.go
│   ├── handler_placeholder.go
│   ├── machine.go
│   ├── matcher.go
│   ├── metrics.go
│   ├── noise.go
│   ├── oidc.go
│   ├── platform_config.go
│   ├── preauth_keys.go
│   ├── protocol_common.go
│   ├── protocol_common_poll.go
│   ├── protocol_common_utils.go
│   ├── protocol_legacy.go
│   ├── protocol_legacy_poll.go
│   ├── protocol_noise.go
│   ├── protocol_noise_poll.go
│   ├── routes.go
│   ├── templates
│   │   ├── apple.html
│   │   └── windows.html
│   ├── users.go
│   └── utils.go
├── LICENSE
├── proto
│   ├── buf.lock
│   ├── buf.yaml
│   └── headscale
│       └── v1
│           ├── acl.proto
│           ├── apikey.proto
│           ├── device.proto
│           ├── headscale.proto
│           ├── machine.proto
│           ├── preauthkey.proto
│           ├── routes.proto
│           └── user.proto
├── README.md
└── swagger.go

```
### tree headscale-v0.23-dev

```bash
.
├── buf.gen.yaml
├── CHANGELOG.md
├── cmd
│   └── headscale
│       ├── cli
│       │   ├── api_key.go
│       │   ├── configtest.go
│       │   ├── debug.go
│       │   ├── dump_config.go
│       │   ├── generate.go
│       │   ├── mockoidc.go
│       │   ├── nodes.go
│       │   ├── policy.go
│       │   ├── preauthkeys.go
│       │   ├── pterm_style.go
│       │   ├── root.go
│       │   ├── routes.go
│       │   ├── serve.go
│       │   ├── users.go
│       │   ├── utils.go
│       │   └── version.go
│       ├── headscale.go
│       └── headscale_test.go
├── go.mod
├── go.sum
├── headscale
├── hscontrol
│   ├── app.go
│   ├── assets
│   │   └── oidc_callback_template.html
│   ├── auth.go
│   ├── auth_noise.go
│   ├── db
│   │   ├── api_key.go
│   │   ├── api_key_test.go
│   │   ├── db.go
│   │   ├── db_test.go
│   │   ├── ip.go
│   │   ├── ip_test.go
│   │   ├── node.go
│   │   ├── node_test.go
│   │   ├── policy.go
│   │   ├── preauth_keys.go
│   │   ├── preauth_keys_test.go
│   │   ├── routes.go
│   │   ├── routes_test.go
│   │   ├── suite_test.go
│   │   ├── testdata
│   │   │   ├── 0-22-3-to-0-23-0-routes-are-dropped-2063.sqlite
│   │   │   └── 0-22-3-to-0-23-0-routes-fail-foreign-key-2076.sqlite
│   │   ├── users.go
│   │   └── users_test.go
│   ├── derp
│   │   ├── derp.go
│   │   └── server
│   │       └── derp_server.go
│   ├── grpcv1.go
│   ├── grpcv1_test.go
│   ├── handlers.go
│   ├── mapper
│   │   ├── mapper.go
│   │   ├── mapper_test.go
│   │   ├── suite_test.go
│   │   ├── tail.go
│   │   └── tail_test.go
│   ├── metrics.go
│   ├── noise.go
│   ├── notifier
│   │   ├── metrics.go
│   │   ├── notifier.go
│   │   └── notifier_test.go
│   ├── oidc.go
│   ├── platform_config.go
│   ├── policy
│   │   ├── acls.go
│   │   ├── acls_test.go
│   │   ├── acls_types.go
│   │   └── matcher
│   │       ├── matcher.go
│   │       └── matcher_test.go
│   ├── poll.go
│   ├── suite_test.go
│   ├── tailsql.go
│   ├── templates
│   │   ├── apple.html
│   │   └── windows.html
│   ├── types
│   │   ├── api_key.go
│   │   ├── common.go
│   │   ├── config.go
│   │   ├── config_test.go
│   │   ├── const.go
│   │   ├── node.go
│   │   ├── node_test.go
│   │   ├── policy.go
│   │   ├── preauth_key.go
│   │   ├── routes.go
│   │   ├── routes_test.go
│   │   ├── testdata
│   │   │   ├── base-domain-in-server-url.yaml
│   │   │   ├── base-domain-not-in-server-url.yaml
│   │   │   ├── dns_full_no_magic.yaml
│   │   │   ├── dns_full.yaml
│   │   │   ├── minimal.yaml
│   │   │   └── policy-path-is-loaded.yaml
│   │   └── users.go
│   └── util
│       ├── addr.go
│       ├── addr_test.go
│       ├── const.go
│       ├── dns.go
│       ├── dns_test.go
│       ├── file.go
│       ├── key.go
│       ├── log.go
│       ├── net.go
│       ├── string.go
│       ├── string_test.go
│       ├── test.go
│       ├── util.go
│       └── util_test.go
├── LICENSE
├── Makefile
├── mkdocs.yml
├── proto
│   ├── buf.lock
│   ├── buf.yaml
│   └── headscale
│       └── v1
│           ├── apikey.proto
│           ├── device.proto
│           ├── headscale.proto
│           ├── node.proto
│           ├── policy.proto
│           ├── preauthkey.proto
│           ├── routes.proto
│           └── user.proto
├── README.md
├── structure.txt
├── swagger.go
└── todo.md

38 directories, 205 files

```
## dirs change from 0.22.3 to 0.23

```bash
hscontrol/acls.go --> polocy/acls.go
hscontrol/api_common.go
hscontrol/app.go == same
hscontrol/config.go --> types/config.go
hscontrol/db.go --> db/db.go
hscontrol/grpcv1.go == same
hscontrol/machine.go --> rename to node.go
hscontrol/preauth_keys.go --> db/preauth_keys.go | types/preauth_keys.go == db/preauth_keys.go
hscontrol/protocol_common.go -- auth.go
hscontrol/protocol_common_poll.go -- pull.go
hscontrol/routes.go db/routes.go | types/routes.go
hscontrol/users.go db/users.go | types/users.go
proto/headscale/v1/acl.proto == same
proto/headscale/v1/headscale.proto == same
proto/headscale/v1/machine.proto --> remane to node.proto
proto/headscale/v1/preauthkey.proto ==same
proto/headscale/v1/routes.proto ==smae
```
