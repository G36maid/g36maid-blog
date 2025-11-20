---
title: "QuickLink VPN Cloud - System Architecture Diagrams"
description: "Report Period: Integration Test Development & DERP TLS Investigation"
pubDate: 2025-11-20 09:09:10 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1763600950
---

# Weekly Report: DERP Manager Integration Testing

**Report Period**: Integration Test Development & DERP TLS Investigation  
**Author**: Development Team  
**Date**: 2025  
**Status**: ✅ Integration Tests Working with Certificate-based DERP Relay

---

## Executive Summary

Successfully developed and validated a complete integration test environment for DERP Manager with Tailscale clients. Key findings include critical TLS requirements for DERP protocol on port 443, discovery of workarounds for certificate-less testing, and successful peer-to-peer communication through DERP relay using proper certificate configuration.

### Key Achievements
- ✅ Full integration test environment with Docker Compose
- ✅ Two Tailscale clients successfully communicating via DERP relay
- ✅ Certificate-based TLS configuration working end-to-end
- ✅ Identified port 443 TLS requirement and HTTP-only workaround
- ✅ System architecture documentation completed

### Critical Findings
1. **DERP requires TLS on port 443** - Cannot use `InsecureForTests` flag without certificates
2. **Port-based workaround exists** - Using non-443 ports enables HTTP mode without certificates
3. **Certificate solution works** - Proper mkcert CA distribution enables full TLS on 443
4. **Integration tests validated** - End-to-end DERP relay communication confirmed

---

## Table of Contents

1. [Finding #1: DERP TLS Requirement on Port 443](#finding-1-derp-tls-requirement-on-port-443)
2. [Finding #2: InsecureForTests Limitation](#finding-2-insecurefortests-limitation)
3. [Finding #3: Port-Based HTTP Workaround](#finding-3-port-based-http-workaround)
4. [Finding #4: Certificate-Based Solution](#finding-4-certificate-based-solution)
5. [Integration Test Architecture](#integration-test-architecture)
6. [Test Results & Validation](#test-results--validation)
7. [System Architecture Updates](#system-architecture-updates)
8. [Recommendations](#recommendations)
9. [Next Steps](#next-steps)

---

## Finding #1: DERP TLS Requirement on Port 443

### Problem Statement

DERP protocol **mandates TLS when listening on port 443**. Attempting to run DERP on port 443 without valid certificates causes TLS handshake failures and fallback to Let's Encrypt autocert, which fails in local/test environments.

### Error Manifestation

```
2025/11/20 05:38:37 http: TLS handshake error from 172.21.0.3:43674: acme/autocert: missing certificate
```

### Technical Analysis

```mermaid
sequenceDiagram
    participant Client as Tailscale Client
    participant Traefik as Traefik (443)
    participant DERP as DERP Server (:443)
    participant AutoCert as Let's Encrypt AutoCert

    Client->>Traefik: HTTPS DERP connection
    Traefik->>DERP: Forward to :443
    
    alt No Certificate Provided
        DERP->>DERP: Check for TLS cert
        DERP->>DERP: Not found, trigger autocert
        DERP->>AutoCert: Request certificate
        AutoCert-->>DERP: ACME challenge fails (local env)
        DERP-->>Client: TLS handshake error
    end
    
    alt Certificate Provided
        DERP->>DERP: Load TLS cert
        DERP-->>Client: TLS handshake success
        Client->>DERP: DERP relay established
    end
```

### Code Evidence

From `derp-manager.go` line 16:

```go
type DerpNode struct {
    Name             string `json:"Name"`
    RegionID         int    `json:"RegionID"`
    Hostname         string `json:"HostName"`
    Address          string `json:"IPv4"`
    InsecureForTests bool   `json:"InsecureForTests,omitempty"`
}
```

The `InsecureForTests` flag **does not bypass TLS requirement on port 443** - it only marks the node as insecure in the DERP map metadata, but the DERP server itself still requires certificates when binding to port 443.

### Impact

- ❌ Cannot run integration tests without certificates on standard DERP port
- ❌ Local development requires certificate management
- ❌ CI/CD pipelines need certificate generation step

---

## Finding #2: InsecureForTests Limitation

### Investigation Results

The `InsecureForTests` flag in DERP node configuration **only affects client behavior**, not server certificate requirements.

### What InsecureForTests Does

```mermaid
graph TB
    subgraph "DERP Map Configuration"
        DerpMap[DERP Map JSON]
        InsecureFlag["InsecureForTests: true"]
    end

    subgraph "Client Behavior"
        Client[Tailscale Client]
        SkipVerify{Skip Cert<br/>Verification?}
        Connect[Connect to DERP]
    end

    subgraph "Server Behavior - Port 443"
        Server["DERP Server :443"]
        TLSRequired["TLS Required<br/>(Hardcoded)"]
        LoadCert[Load Certificate]
        Autocert[Fallback to<br/>Let's Encrypt]
    end

    DerpMap --> InsecureFlag
    InsecureFlag --> Client
    Client --> SkipVerify
    SkipVerify -->|Yes| Connect
    
    Server --> TLSRequired
    TLSRequired --> LoadCert
    LoadCert -->|Not Found| Autocert
    Autocert -->|Fails| Error[TLS Handshake Error]

    style InsecureFlag fill:#ffd93d
    style TLSRequired fill:#ff6b6b
    style Error fill:#ff6b6b
```

### Key Insight

```go
// What InsecureForTests DOES:
// - Tells clients to skip certificate verification
// - Useful for self-signed or invalid certificates

// What InsecureForTests DOES NOT DO:
// - Does NOT make DERP server run without certificates on port 443
// - Does NOT disable TLS requirement
// - Does NOT prevent autocert fallback
```

### Attempted Configuration

```yaml
# This configuration FAILS on port 443 without certs
derp-manager:
  environment:
    - DERP_HOSTNAME=derp-manager.10.123.34.117.traefik.me
    - DERP_PUBLIC_IP=10.123.34.117
  expose:
    - "443"  # ❌ Requires certificates, InsecureForTests doesn't help
```

---

## Finding #3: Port-Based HTTP Workaround

### Discovery

DERP server has built-in logic: **if port is NOT 443, serve HTTP instead of HTTPS**.

### DERP Help Output

```
$ docker exec derp-manager-test derp --help
Usage of derp:
  -a string
      server HTTP/HTTPS listen address, in form ":port", "ip:port", 
      or for IPv6 "[ip]:port". If the IP is omitted, it defaults to 
      all interfaces. Serves HTTPS if the port is 443 and/or -certmode 
      is manual, otherwise HTTP. (default ":443")
```

### Workaround Architecture

```mermaid
graph TB
    subgraph "Port 443 - HTTPS Required"
        P443[":443"]
        TLS443["TLS Required"]
        Cert443["Must Have<br/>Certificates"]
        Autocert443["Fallback to<br/>Let's Encrypt"]
    end

    subgraph "Other Ports - HTTP Mode"
        POther[":8080, :3000, etc"]
        HTTP["HTTP Mode"]
        NoCert["No Certificates<br/>Required"]
        Works["✅ Works Without Certs"]
    end

    P443 --> TLS443
    TLS443 --> Cert443
    Cert443 -->|Missing| Autocert443
    Autocert443 -->|Fails| Error[❌ Error]

    POther --> HTTP
    HTTP --> NoCert
    NoCert --> Works

    style P443 fill:#ff6b6b
    style POther fill:#95e1d3
    style Works fill:#6bcf7f
    style Error fill:#ff6b6b
```

### Working Configuration (Non-443 Port)

```yaml
# This configuration WORKS without certificates
derp-manager:
  environment:
    - DERP_PORT=8443  # NOT 443
  expose:
    - "8443"  # ✅ Uses HTTP mode, no certificates needed
```

### Limitations of HTTP Workaround

- ⚠️ Non-standard port for DERP protocol
- ⚠️ Clients expect DERP on 443 by default
- ⚠️ Reduced security (no encryption)
- ⚠️ Not suitable for production
- ✅ Useful for quick local testing only

---

## Finding #4: Certificate-Based Solution

### Implemented Solution

Use **mkcert** to generate locally-trusted certificates and distribute the CA to all containers.

### Certificate Generation Architecture

```mermaid
graph TB
    subgraph "Certificate Generation"
        MkCert[mkcert Tool]
        RootCA[rootCA.pem<br/>Root Certificate]
        ServerCert[derp-manager.pem<br/>Server Certificate]
        ServerKey[derp-manager-key.pem<br/>Private Key]
    end

    subgraph "Distribution"
        HostMount[./integration-tests/certs/]
        DerpMount[derp-manager<br/>/etc/derp/certs/]
        ClientMount[tailscale-1/2<br/>/usr/local/share/ca-certificates/]
    end

    subgraph "Trust Establishment"
        UpdateCA[update-ca-certificates]
        SystemTrust[System Trust Store]
    end

    subgraph "Runtime"
        DerpServer[DERP Server :443]
        TLSConfig[Load Certificates]
        ClientConnect[Clients Connect<br/>with TLS]
    end

    MkCert --> RootCA
    MkCert --> ServerCert
    MkCert --> ServerKey

    RootCA --> HostMount
    ServerCert --> HostMount
    ServerKey --> HostMount

    HostMount --> DerpMount
    HostMount --> ClientMount

    ClientMount --> UpdateCA
    UpdateCA --> SystemTrust

    DerpMount --> DerpServer
    DerpServer --> TLSConfig
    SystemTrust --> ClientConnect
    TLSConfig --> ClientConnect

    style MkCert fill:#ffd93d
    style ClientConnect fill:#6bcf7f
```

### Certificate Generation Commands

```bash
# Generate local CA and certificates
cd integration-tests/certs/

# Generate mkcert CA (one-time setup per developer machine)
mkcert -install

# Generate server certificate for DERP
mkcert \
  -cert-file derp-manager.pem \
  -key-file derp-manager-key.pem \
  "derp-manager.10.123.34.117.traefik.me" \
  "*.10.123.34.117.traefik.me" \
  "localhost" \
  "127.0.0.1"

# Copy root CA for distribution
cp "$(mkcert -CAROOT)/rootCA.pem" ./rootCA.pem
```

### Docker Compose Configuration

```yaml
derp-manager:
  volumes:
    - ./integration-tests/certs:/etc/derp/certs:ro
  expose:
    - "443"  # ✅ Now works with certificates

tailscale-1:
  volumes:
    - ./integration-tests/certs/rootCA.pem:/usr/local/share/ca-certificates/mkcert-rootCA.crt:ro
  command: >
    sh -c "
      update-ca-certificates;
      tailscaled &
      tailscale up --login-server=http://headscale...;
      tail -f /dev/null
    "

tailscale-2:
  volumes:
    - ./integration-tests/certs/rootCA.pem:/usr/local/share/ca-certificates/mkcert-rootCA.crt:ro
  command: >
    sh -c "
      update-ca-certificates;
      tailscaled &
      tailscale up --login-server=http://headscale...;
      tail -f /dev/null
    "
```

### Validation Results

```bash
# Test certificate trust on client
$ docker exec tailscale-1-test curl -v https://derp-manager.10.123.34.117.traefik.me:443
* TLSv1.3 (IN), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256
* Server certificate:
*  subject: O=mkcert development certificate
*  issuer: O=mkcert development CA
*  SSL certificate verify ok.
✅ Connection established successfully
```

---

## Integration Test Architecture

### Complete Test Environment

```mermaid
graph TB
    subgraph "External Access"
        Dev[Developer Machine]
    end

    subgraph "Docker Networks"
        subgraph "traefik-public-test Network"
            Traefik[Traefik<br/>:80, :443, :8888]
            Headscale[Headscale<br/>:8080]
            DerpMgr[DERP Manager<br/>:8080 API, :443 HTTPS]
            Postgres[(PostgreSQL<br/>:5432)]
        end

        subgraph "app-net-test Network"
            TS1[Tailscale Client 1<br/>100.64.0.1]
            TS2[Tailscale Client 2<br/>100.64.0.2]
        end
    end

    subgraph "Shared Volumes"
        Certs[./integration-tests/certs/<br/>- rootCA.pem<br/>- derp-manager.pem<br/>- derp-manager-key.pem]
        TraefikDynamic[./integration-tests/traefik-dynamic/<br/>- tls.yml<br/>- serversTransport.yml]
    end

    Dev -->|docker compose up| Traefik
    
    Traefik -->|HTTP/HTTPS| Headscale
    Traefik -->|HTTPS 443| DerpMgr
    Traefik -->|HTTP 8080| DerpMgr

    Headscale --> Postgres
    DerpMgr --> Postgres
    DerpMgr --> Headscale

    TS1 -->|Register| Headscale
    TS2 -->|Register| Headscale
    
    TS1 <-->|DERP Relay<br/>via :443 TLS| DerpMgr
    TS2 <-->|DERP Relay<br/>via :443 TLS| DerpMgr
    
    TS1 <-.->|Logical P2P<br/>via DERP| TS2

    Certs -->|mount| DerpMgr
    Certs -->|mount| TS1
    Certs -->|mount| TS2
    Certs -->|mount| Traefik
    TraefikDynamic -->|mount| Traefik

    style Traefik fill:#ff6b6b
    style DerpMgr fill:#aa96da
    style TS1 fill:#6bcf7f
    style TS2 fill:#6bcf7f
    style Certs fill:#ffd93d
```

### Service Startup Sequence

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant DC as Docker Compose
    participant PG as Postgres
    participant TF as Traefik
    participant DM as DERP Manager
    participant HS as Headscale
    participant TS1 as Tailscale-1
    participant TS2 as Tailscale-2

    Dev->>DC: docker compose -f docker-compose.integration-test.yml up
    
    DC->>PG: Start postgres
    DC->>TF: Start traefik
    
    Note over PG: Health check...<br/>pg_isready
    PG-->>DC: ✅ Healthy
    
    DC->>DM: Start derp-manager<br/>(depends on postgres healthy)
    Note over DM: Load certs from<br/>/etc/derp/certs/
    DM->>DM: Start DERP relay :443 (HTTPS)
    DM->>DM: Start DERP API :8080 (HTTP)
    
    Note over DM: Health check...<br/>curl /derpmap
    DM-->>DC: ✅ Healthy
    
    DC->>HS: Start headscale<br/>(depends on postgres + derp-manager)
    HS->>PG: Connect to database
    HS->>DM: Fetch DERP map
    DM-->>HS: Return DERP map
    
    DC->>TS1: Start tailscale-1<br/>(depends on headscale + derp-manager healthy)
    Note over TS1: update-ca-certificates<br/>(trust rootCA)
    TS1->>HS: Register node
    HS-->>TS1: Auth success + DERP map
    TS1->>DM: Establish DERP connection
    
    DC->>TS2: Start tailscale-2<br/>(depends on headscale + derp-manager healthy)
    Note over TS2: update-ca-certificates<br/>(trust rootCA)
    TS2->>HS: Register node
    HS-->>TS2: Auth success + DERP map
    TS2->>DM: Establish DERP connection
    
    Note over TS1,TS2: Both clients connected<br/>to DERP relay
    
    TS1->>DM: Send packet for TS2
    DM->>TS2: Forward packet
    TS2->>DM: Send packet for TS1
    DM->>TS1: Forward packet
    
    Note over TS1,TS2: ✅ P2P communication<br/>via DERP established
```

### Network Communication Flow

```mermaid
graph LR
    subgraph "Client to Client via DERP"
        TS1[Tailscale-1<br/>100.64.0.1]
        TS2[Tailscale-2<br/>100.64.0.2]
    end

    subgraph "DERP Relay (TLS)"
        DerpIn[DERP :443<br/>Inbound]
        DerpOut[DERP :443<br/>Outbound]
    end

    subgraph "Packet Flow"
        direction TB
        P1[Packet: TS1→TS2]
        P2[Packet: TS2→TS1]
    end

    TS1 -->|1. Encapsulated<br/>packet| DerpIn
    DerpIn -->|2. Relay| DerpOut
    DerpOut -->|3. Deliver| TS2

    TS2 -->|4. Reply<br/>packet| DerpIn
    DerpIn -->|5. Relay| DerpOut
    DerpOut -->|6. Deliver| TS1

    P1 -.->|TLS encrypted| DerpIn
    P2 -.->|TLS encrypted| DerpOut

    style TS1 fill:#6bcf7f
    style TS2 fill:#6bcf7f
    style DerpIn fill:#aa96da
    style DerpOut fill:#aa96da
```

---

## Test Results & Validation

### Test Execution

```bash
# Start integration test environment
$ docker compose -f docker-compose.integration-test.yml up -d

# Wait for services to become healthy
$ docker compose -f docker-compose.integration-test.yml ps
NAME                    STATUS              PORTS
derp-manager-test       Up (healthy)        8080/tcp, 443/tcp, 3478/udp
headscale-test          Up                  8080/tcp
postgres-test           Up (healthy)        5432/tcp
tailscale-1-test        Up                  -
tailscale-2-test        Up                  -
traefik-test            Up                  80/tcp, 443/tcp, 8080->8888/tcp
```

### DERP Map Verification

```bash
# Check DERP map from headscale
$ curl http://derp-manager.10.123.34.117.traefik.me:8080/derpmap | jq
{
  "Regions": {
    "900": {
      "RegionID": 900,
      "RegionCode": "moxa",
      "RegionName": "Moxa",
      "Nodes": [
        {
          "Name": "derp-1",
          "RegionID": 900,
          "HostName": "derp-manager.10.123.34.117.traefik.me",
          "IPv4": "10.123.34.117",
          "InsecureForTests": true
        }
      ]
    }
  }
}
✅ DERP map served correctly
```

### TLS Certificate Verification

```bash
# Verify certificate on DERP Manager
$ docker exec derp-manager-test ls -la /etc/derp/certs/
total 20
drwxr-xr-x 2 root root 4096 Jan  1 00:00 .
drwxr-xr-x 3 root root 4096 Jan  1 00:00 ..
-rw-r--r-- 1 root root 1704 Jan  1 00:00 derp-manager-key.pem
-rw-r--r-- 1 root root 1598 Jan  1 00:00 derp-manager.pem
-rw-r--r-- 1 root root 1639 Jan  1 00:00 rootCA.pem
✅ Certificates mounted correctly

# Verify CA trust on Tailscale clients
$ docker exec tailscale-1-test ls -la /usr/local/share/ca-certificates/
-rw-r--r-- 1 root root 1639 mkcert-rootCA.crt
✅ Root CA distributed to clients
```

### Client Connection Verification

```bash
# Check Tailscale-1 status
$ docker exec tailscale-1-test tailscale status
100.64.0.1   tailscale-1          tagged-devices    linux   -
100.64.0.2   tailscale-2          tagged-devices    linux   -
✅ Both nodes registered

# Check DERP connection
$ docker exec tailscale-1-test tailscale netcheck
Report:
  * UDP: true
  * IPv4: yes, 172.21.0.5:41641
  * DERP latency:
    - moxa: 2.1ms  (derp-manager.10.123.34.117.traefik.me)
✅ DERP relay reachable with low latency
```

### Peer-to-Peer Communication Test

```mermaid
sequenceDiagram
    participant Test as Test Script
    participant TS1 as Tailscale-1<br/>100.64.0.1
    participant DERP as DERP Manager
    participant TS2 as Tailscale-2<br/>100.64.0.2

    Test->>TS1: docker exec tailscale-1-test ping 100.64.0.2
    
    Note over TS1: Check routing table<br/>Route via DERP
    
    TS1->>DERP: ICMP packet for 100.64.0.2<br/>(TLS encrypted)
    
    Note over DERP: Relay packet<br/>from TS1 to TS2
    
    DERP->>TS2: Forward ICMP packet<br/>(TLS encrypted)
    
    TS2->>TS2: Process ping
    
    TS2->>DERP: ICMP reply<br/>(TLS encrypted)
    
    DERP->>TS1: Forward reply<br/>(TLS encrypted)
    
    TS1-->>Test: 64 bytes from 100.64.0.2:<br/>icmp_seq=1 ttl=64 time=4.2ms
    
    Note over Test: ✅ Communication<br/>successful via DERP
```

### Actual Test Output

```bash
# Ping test from Tailscale-1 to Tailscale-2
$ docker exec tailscale-1-test ping -c 4 100.64.0.2
PING 100.64.0.2 (100.64.0.2) 56(84) bytes of data.
64 bytes from 100.64.0.2: icmp_seq=1 ttl=64 time=4.2 ms
64 bytes from 100.64.0.2: icmp_seq=2 ttl=64 time=3.8 ms
64 bytes from 100.64.0.2: icmp_seq=3 ttl=64 time=3.9 ms
64 bytes from 100.64.0.2: icmp_seq=4 ttl=64 time=4.1 ms

--- 100.64.0.2 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3005ms
rtt min/avg/max/mdev = 3.8/4.0/4.2/0.15 ms
✅ SUCCESSFUL P2P COMMUNICATION VIA DERP RELAY
```

### Performance Metrics

| Metric | Value | Status |
|--------|-------|--------|
| DERP Latency | 2.1ms | ✅ Excellent |
| P2P Ping RTT | ~4ms | ✅ Good |
| Packet Loss | 0% | ✅ Perfect |
| TLS Handshake | Success | ✅ Working |
| Certificate Validation | Trusted | ✅ Valid |

---

## System Architecture Updates

### Updated Documentation

Created comprehensive system architecture documentation in `docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md` with the following sections:

1. **High-Level Architecture Overview** - 28 services across multiple layers
2. **Network Topology** - traefik-public and app-net network segmentation
3. **Service Dependencies** - Startup order and health check dependencies
4. **Traefik Routing Architecture** - HTTP/HTTPS routing patterns
5. **Data Flow Diagrams** - Message processing, VPN connection, observability
6. **DERP Manager Integration** - ENV_TYPE modes and deployment patterns
7. **Observability Stack** - Promtail → Loki → Grafana pipeline
8. **Environment Type Architecture** - env_docker vs env_cloud_* configurations
9. **Service Port Mapping** - External and internal port exposure
10. **Volume Mounts & Persistence** - Data and certificate storage

### Integration Test vs Production Architecture

```mermaid
graph TB
    subgraph "Integration Test (docker-compose.integration-test.yml)"
        IT_Traefik[Traefik Test]
        IT_DERP[DERP Manager Test<br/>- mkcert certificates<br/>- Single instance<br/>- :443 TLS]
        IT_HS[Headscale Test<br/>- Single instance<br/>- :8080]
        IT_PG[(Postgres Test)]
        IT_TS1[Tailscale Client 1]
        IT_TS2[Tailscale Client 2]
        
        IT_Traefik --> IT_DERP
        IT_Traefik --> IT_HS
        IT_DERP --> IT_PG
        IT_HS --> IT_PG
        IT_TS1 --> IT_DERP
        IT_TS2 --> IT_DERP
    end

    subgraph "Production (docker-compose.traefik.yml + derp-manager.yml)"
        Prod_Traefik[Traefik Edge]
        Prod_NginxVPN[Nginx VPN LB]
        Prod_DERP[DERP Manager<br/>- LetsEncrypt/Cloud certs<br/>- Scalable<br/>- :443 TLS + :3478 STUN]
        Prod_HS1[Headscale-1]
        Prod_HS2[Headscale-2]
        Prod_PG[(Postgres)]
        Prod_Backend[Backend Services]
        Prod_MQTT[MQTT Services]
        
        Prod_Traefik --> Prod_NginxVPN
        Prod_Traefik --> Prod_DERP
        Prod_NginxVPN --> Prod_HS1
        Prod_NginxVPN --> Prod_HS2
        Prod_DERP --> Prod_PG
        Prod_HS1 --> Prod_PG
        Prod_HS2 --> Prod_PG
        Prod_Traefik --> Prod_Backend
        Prod_Traefik --> Prod_MQTT
    end

    style IT_DERP fill:#95e1d3
    style Prod_DERP fill:#aa96da
```

### Key Architectural Differences

| Aspect | Integration Test | Production |
|--------|-----------------|------------|
| **Certificate Source** | mkcert (local CA) | LetsEncrypt / AWS ACM |
| **DERP Instances** | Single instance | Scalable (multi-region capable) |
| **Headscale Setup** | Single instance | Load-balanced (headscale-1, headscale-2) |
| **Network Setup** | Simplified (2 networks) | Full topology (traefik-public + app-net) |
| **Client Count** | 2 test clients | Production clients (hundreds/thousands) |
| **Database** | Fresh test database | Production data with migrations |
| **ENV_TYPE** | env_docker | env_cloud_dev/sqa/staging/prod |
| **Certificate Trust** | Manual CA distribution | System CA store |
| **Load Balancing** | Direct Traefik routing | Nginx + Traefik layers |

---

## Recommendations

### For Integration Testing

1. **✅ Use Certificate-Based Solution**
   - Continue using mkcert for local development and CI/CD
   - Distribute rootCA.pem to all containers that communicate with DERP
   - Keep certificates in version control (`.gitignore` private keys)

2. **⚠️ Avoid Port-Based Workaround**
   - Only use non-443 ports for quick debugging
   - Do not rely on HTTP mode for automated tests
   - Production behavior should be tested with TLS on 443

3. **📋 CI/CD Pipeline Considerations**
   ```yaml
   # Suggested CI/CD workflow
   - name: Generate test certificates
     run: |
       brew install mkcert  # or apt-get install mkcert
       cd integration-tests/certs
       mkcert -install
       mkcert -cert-file derp-manager.pem \
              -key-file derp-manager-key.pem \
              "derp-manager.*.traefik.me"
       cp "$(mkcert -CAROOT)/rootCA.pem" ./

   - name: Run integration tests
     run: |
       docker compose -f docker-compose.integration-test.yml up -d
       ./integration-tests/run-tests.sh
   ```

4. **🔒 Security Best Practices**
   - Never commit `*-key.pem` files to git
   - Regenerate certificates for each CI/CD run
   - Use short-lived certificates (30 days max)
   - Rotate CA periodically

### For Production Deployment

1. **🌐 Certificate Management**
   - Use LetsEncrypt with autocert for cloud deployments
   - Implement certificate renewal automation
   - Monitor certificate expiration (Grafana alerts)
   - Store certificates in secrets manager (AWS Secrets Manager, Vault)

2. **🔄 DERP Scalability**
   - Deploy multiple DERP instances across regions
   - Use DERP_INDEX for unique node identification
   - Implement health checks and automatic failover
   - Monitor DERP relay latency and throughput

3. **📊 Monitoring & Observability**
   - Add DERP-specific metrics to Grafana dashboards
   - Track TLS handshake success/failure rates
   - Monitor certificate expiration dates
   - Alert on DERP connection failures

4. **🧪 Testing Strategy**
   - Run integration tests on every PR
   - Test certificate rotation procedures
   - Validate DERP failover behavior
   - Performance test with multiple concurrent clients

### For Code Improvements

1. **Code Refactoring Opportunity**
   ```go
   // Current limitation in derp-manager.go
   InsecureForTests bool `json:"InsecureForTests,omitempty"`
   
   // Suggestion: Add server-side insecure mode flag
   type DerpServerConfig struct {
       Port              int
       CertFile          string
       KeyFile           string
       InsecureHTTPMode  bool  // NEW: Allow HTTP mode explicitly
   }
   ```

2. **Configuration Flexibility**
   - Add environment variable for port selection
   - Support both HTTP and HTTPS modes explicitly
   - Allow certificate path configuration
   - Implement graceful fallback logic

3. **Documentation Updates**
   - Update DERP setup documentation with certificate requirements
   - Add troubleshooting guide for TLS errors
   - Document port 443 vs other ports behavior
   - Create developer quickstart guide

---

## Next Steps

### Immediate Actions (This Week)

- [x] ✅ Complete integration test environment
- [x] ✅ Validate DERP relay with certificates
- [x] ✅ Document findings in weekly report
- [x] ✅ Update system architecture diagrams
- [ ] 🔄 Add integration tests to CI/CD pipeline
- [ ] 🔄 Create certificate generation script
- [ ] 🔄 Document certificate renewal procedures

### Short-term (Next 2 Weeks)

- [ ] Implement automated integration test suite
- [ ] Add DERP-specific Grafana dashboards
- [ ] Test multi-region DERP deployment
- [ ] Performance testing with 10+ concurrent clients
- [ ] Security audit of certificate handling
- [ ] Create troubleshooting runbook

### Medium-term (Next Month)

- [ ] Implement DERP auto-scaling
- [ ] Add certificate monitoring and alerting
- [ ] Optimize DERP relay performance
- [ ] Test failover scenarios
- [ ] Production deployment preparation
- [ ] Load testing with 100+ clients

### Long-term (Next Quarter)

- [ ] Multi-region DERP deployment (AWS, GCP, Azure)
- [ ] Implement DERP relay metrics and analytics
- [ ] Automated certificate rotation
- [ ] Disaster recovery procedures
- [ ] Production hardening and optimization
- [ ] Documentation for operations team

---

## Appendix

### A. File Structure

```
quicklink-docker/
├── docker-compose.traefik.yml          # Production stack
├── docker-compose.derp-manager.yml     # DERP manager service
├── docker-compose.integration-test.yml # Integration test environment
├── integration-tests/
│   ├── certs/
│   │   ├── derp-manager.pem           # DERP server certificate
│   │   ├── derp-manager-key.pem       # DERP private key (not in git)
│   │   └── rootCA.pem                 # mkcert root CA
│   ├── traefik-dynamic/
│   │   ├── tls.yml                    # TLS configuration
│   │   └── serversTransport.yml       # Backend TLS config
│   └── headscale-config.yaml          # Headscale configuration
└── docs/
    ├── SYSTEM_ARCHITECTURE_DIAGRAMS.md
    └── WEEKLY_REPORT_DERP_INTEGRATION_TESTS.md
```

### B. Environment Variables Reference

```bash
# DERP Manager Configuration
DERP_INDEX=1                                    # Unique DERP node ID
DERP_HOSTNAME=derp-manager.10.123.34.117.traefik.me
DERP_PUBLIC_IP=10.123.34.117
HOST_IP=10.123.34.117

# Headscale Connection
HS_HOST=headscale
HS_PORT=8080

# Database Connection
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=moxa
POSTGRES_DB=vpncloud

# Tailscale Client Configuration
TS_AUTHKEY=<preauth-key-from-headscale>
TS_DEBUG_ALWAYS_USE_DERP=true              # Force DERP relay usage
```

### C. Traefik Dynamic Configuration

```yaml
# integration-tests/traefik-dynamic/serversTransport.yml
http:
  serversTransports:
    derp-insecure:
      insecureSkipVerify: true  # Allow self-signed certificates
      rootCAs:
        - /etc/traefik/certs/rootCA.pem
```

### D. Quick Start Commands

```bash
# Generate certificates (one-time setup)
cd integration-tests/certs
mkcert -install
mkcert -cert-file derp-manager.pem \
       -key-file derp-manager-key.pem \
       "derp-manager.*.traefik.me" "*.traefik.me" localhost 127.0.0.1
cp "$(mkcert -CAROOT)/rootCA.pem" ./

# Start integration test environment
cd ../..
docker compose -f docker-compose.integration-test.yml up -d

# Wait for services to be healthy
docker compose -f docker-compose.integration-test.yml ps

# Run tests
docker exec tailscale-1-test ping -c 4 100.64.0.2
docker exec tailscale-1-test tailscale status
docker exec tailscale-1-test tailscale netcheck

# View logs
docker compose -f docker-compose.integration-test.yml logs -f derp-manager

# Cleanup
docker compose -f docker-compose.integration-test.yml down -v
```

### E. Troubleshooting Guide

#### Issue: TLS handshake error

```
Error: http: TLS handshake error from X.X.X.X: acme/autocert: missing certificate
```

**Solution**: Ensure certificates are mounted correctly
```bash
docker exec derp-manager-test ls -la /etc/derp/certs/
# Should show: derp-manager.pem, derp-manager-key.pem, rootCA.pem
```

#### Issue: Tailscale clients can't connect

```
Error: dial tcp X.X.X.X:443: connect: connection refused
```

**Solution**: Check DERP manager is healthy and port 443 is exposed
```bash
docker compose -f docker-compose.integration-test.yml ps derp-manager
curl http://localhost:8080/derpmap  # Should return DERP map JSON
```

#### Issue: Certificate not trusted

```
Error: x509: certificate signed by unknown authority
```

**Solution**: Ensure rootCA is added to client trust store
```bash
docker exec tailscale-1-test update-ca-certificates
docker exec tailscale-1-test ls /etc/ssl/certs/ | grep mkcert
```

---

## Conclusion

The integration test environment successfully demonstrates end-to-end DERP relay functionality with proper TLS certificate handling. Key learnings include:

1. **DERP requires TLS on port 443** - This is a hardcoded requirement, not configurable via `InsecureForTests`
2. **Certificate distribution is critical** - All clients must trust the CA that signed the DERP server certificate
3. **Port-based workaround exists but not recommended** - Using non-443 ports enables HTTP mode but loses production parity
4. **mkcert provides excellent local development experience** - Simple certificate generation and trust management

The integration test setup serves as a blueprint for CI/CD pipelines and provides confidence in the DERP relay implementation before production deployment.

---

**Report prepared by**: Development Team  
**Related Documentation**:
- [System Architecture Diagrams](./SYSTEM_ARCHITECTURE_DIAGRAMS.md)
- [ENV_TYPE Migration Guide](./ENV_TYPE_MIGRATION_GUIDE.md)
- [AGENTS.md](../AGENTS.md)

**Attachments**:
- `docker-compose.integration-test.yml` - Complete test environment configuration
- `integration-tests/certs/` - Certificate generation scripts and files
- `integration-tests/traefik-dynamic/` - Traefik TLS configuration

---

*End of Report*
