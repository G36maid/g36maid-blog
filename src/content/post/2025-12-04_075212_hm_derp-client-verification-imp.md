---
title: "DERP Client Verification Implementation"
description: "This document details the implementation of the DERP client verification system, which enforces access control for the DERP relay by vali…"
pubDate: 2025-12-04 07:52:12 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1764805932
---

This document details the implementation of the DERP client verification system, which enforces access control for the DERP relay by validating client nodes against the Headscale database.

## 1. Architecture Overview

The system consists of three main components: the DERP Server (running `tailscale/derp`), a custom Mock Verify Server, and the Headscale PostgreSQL database.

```mermaid
graph TD
    subgraph "DERP Node"
        DERP[DERP Server<br/>(tailscale/derp)]
    end

    subgraph "Verification Service"
        VS[Mock Verify Server<br/>(Go Service)]
        Cache[TTL Cache<br/>(In-Memory)]
        VS --> Cache
    end

    subgraph "Control Plane"
        DB[(Headscale DB<br/>Postgres)]
    end

    Client[Tailscale Client] -- "Connect" --> DERP
    DERP -- "POST /verify" --> VS
    VS -- "Query Status" --> DB
```

## 2. Component Details

### 2.1 DERP Server
The DERP server is the standard `tailscale.com/cmd/derper` binary (v1.78.1). It is configured to delegate client verification to an external HTTP endpoint.

- **Binary**: `tailscale/derp`
- **Configuration Flags**:
  - `--verify-client-url`: The URL of the verification service (e.g., `http://mock-verify-server:8080/verify`).
  - `--verify-client-url-fail-open`: (Optional) If set to `true`, allows clients to connect if the verification server is unreachable. Default is `false` (fail closed).

**Behavior**:
When a client attempts to connect, the DERP server sends a JSON POST request to the configured URL:
```json
{
  "NodePublic": "nodekey:..."
}
```

### 2.2 Mock Verify Server
This is a custom Go service designed to bridge the DERP server and the Headscale database. It implements the verification logic required by our specific environment.

- **Source**: `integration-tests/mock-verify-server/main.go`
- **Endpoint**: `POST /verify`
- **Caching**: Implements an in-memory TTL cache (default 5 minutes) to reduce database load.

**Verification Logic**:
A node is allowed access **only if** all the following conditions are met:
1.  **Exists**: The node key exists in the `nodes` table.
2.  **Not Deleted**: The `deleted_at` column is `NULL`.
3.  **Not Expired**: The `expiry` column is either:
    -   `NULL` (or zero time `0001-01-01`)
    -   In the future (`expiry > NOW()`)
4.  **Online Status**: *Note: The check for `is_online` is currently implemented but commented out in the source code.*

**Response**:
The server returns a JSON response indicating whether the connection should be allowed:
```json
{
  "Allow": true
}
```

### 2.3 Database Schema
The verification server queries the `nodes` table in the Headscale PostgreSQL database.

**Key Columns**:
- `machine_key`: The machine identifier.
- `node_key`: The node identifier (used for lookup).
- `expiry`: Timestamp when the node's key expires.
- `is_online`: Boolean indicating if the node is currently connected to the control plane.
- `deleted_at`: Timestamp when the node was deleted (soft delete).

## 3. Configuration & Deployment

### 3.1 Environment Variables
The system is configured via environment variables passed to the `derp-manager` container (which launches `derp`) and the `mock-verify-server`.

**DERP Manager (`derp-manager-test`):**
| Variable | Description | Default |
| :--- | :--- | :--- |
| `DERP_VERIFY_CLIENT_URL` | URL for the verification endpoint | `http://mock-verify-server:8080/verify` |
| `DERP_VERIFY_CLIENT_URL_FAIL_OPEN` | Allow access on verify error | `false` |

**Mock Verify Server (`mock-verify-server`):**
| Variable | Description |
| :--- | :--- |
| `POSTGRES_HOST` | Database hostname |
| `POSTGRES_PORT` | Database port (5432) |
| `POSTGRES_USER` | Database username |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name (`vpncloud`) |

### 3.2 Startup Flow
1.  **DERP Manager** starts and executes `startup.sh`.
2.  It detects `DERP_VERIFY_CLIENT_URL` is set.
3.  It constructs the `derp` command with `--verify-client-url`.
4.  **DERP Server** launches and begins accepting connections, validating each against the **Mock Verify Server**.
