---
title: "jpcorrect-backend Architecture"
description: "jpcorrect-backend is a Go-based REST API for a Japanese language correction platform. This architecture combines GORM-based persistence (…"
pubDate: 2026-03-11 14:22:36 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1773210156
---

## Overview

jpcorrect-backend is a Go-based REST API for a Japanese language correction platform. This architecture combines **GORM-based persistence** (migrated from pgx/sqlc) with **WebRTC real-time communication** features.

> **Refactor Commit**: `ce929a6` (2026-01-28)  
> **WebRTC Integration**: `41f63b5` (2026-02-22)

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["🌐 Client Layer"]
        REQ[HTTP Request]
        WSCLIENT[WebSocket Client]
    end

    subgraph Entry["📦 Entry Point"]
        MAIN["cmd/jpcorrect/main.go"]
        EXEC["cmd.Execute()"]
        MAIN --> EXEC
    end

    subgraph CmdLayer["⚙️ Command Layer (internal/cmd/)"]
        GORMDB["GORM Database<br/>(Connection Pool)"]
        AUTOMIGRATE["AutoMigrate<br/>(Schema Sync)"]
        HTTPTRANS["HTTP Transport<br/>(Connection Pool)"]
        JWKSINIT["JWKS Initialization<br/>(JWT Key Fetch)"]
        CORS["CORS Config<br/>(ALLOWED_ORIGINS)"]
        HTTPS["HTTPS/TLS<br/>(Auto-detect certs)"]
        SERVER["HTTP Server<br/>(Graceful Shutdown)"]
        ROUTER["Gin Router Setup"]
        
        EXEC --> GORMDB
        GORMDB --> AUTOMIGRATE
        EXEC --> HTTPTRANS
        EXEC --> JWKSINIT
        EXEC --> CORS
        EXEC --> HTTPS
        EXEC --> SERVER
        EXEC --> ROUTER
    end

    subgraph DatabaseLayer["🗄️ Database Layer (internal/database/)"]
        GORMCONN["NewGormDB()<br/>(PostgreSQL Driver)"]
        POOL["Connection Pool<br/>MaxOpen=50, MaxIdle=10<br/>Lifetime=1h"]
        
        GORMCONN --> POOL
    end

    subgraph APILayer["🔌 API Layer (internal/api/)"]
        AUTHMW["AuthMiddleware<br/>(JWT Validation)"]
        HANDLERS["REST Handlers<br/>(CRUD Operations)"]
        PROXY["API Tools Proxy<br/>(Reverse Proxy)"]
        WSUPGRADER["WebSocket Upgrader<br/>(CORS Check)"]
        RATELIMIT["Rate Limiter<br/>(15 conn / 10s)"]
        WSHandler["WebRTC Handler<br/>(Signaling)"]
        RESP["JSON Response<br/>(Error Handling)"]
        
        ROUTER --> AUTHMW
        ROUTER --> WSUPGRADER
        WSUPGRADER --> RATELIMIT
        RATELIMIT --> WSHandler
        AUTHMW --> HANDLERS
        AUTHMW --> PROXY
        HANDLERS --> RESP
        PROXY --> RESP
        WSHandler --> RESP
    end

    subgraph DomainLayer["📋 Domain Layer (internal/domain/)"]
        MODELS["Domain Models<br/>(User, Event, EventAttendee,<br/>Mistake, Transcript)"]
        WEBRTC["WebRTC Domain<br/>(Client, WebRTCRepository)"]
        ENUMS["Enums<br/>(EventMode, MistakeType,<br/>EventAttendeeRole)"]
        REPOS["Repository Interfaces<br/>(Data Access Contracts)"]
        ERRORS["Domain Errors<br/>(ErrNotFound, ErrDuplicateEntry,<br/>AuthError)"]
    end

    subgraph RepoLayer["💾 Repository Layer (internal/repository/)"]
        GORMREPO["GORM Repositories<br/>(gorm_*.go)"]
        ERRORMAP["MapGormError()<br/>(Error Mapping)"]
        
        GORMREPO --> ERRORMAP
    end

    subgraph DB["🗄️ PostgreSQL"]
        TABLES["Tables (AutoMigrate):<br/>• user (uuid, soft delete)<br/>• event<br/>• event_attendee<br/>• mistake<br/>• transcript"]
    end

    subgraph External["🌍 External Services"]
        APITOOLS["API Tools Service<br/>(MarkAccent, Furigana,<br/>DictQuery, SentenceQuery)"]
        JWKS["JWKS Endpoint<br/>(JWT Public Keys)"]
    end

    %% Connections
    REQ --> MAIN
    WSCLIENT --> MAIN
    
    GORMDB --> GORMCONN
    AUTOMIGRATE --> MODELS
    JWKSINIT --> JWKS
    CORS --> WSUPGRADER
    HTTPS --> SERVER
    
    HANDLERS --> REPOS
    HANDLERS --> MODELS
    WSHandler --> WEBRTC
    REPOS --> GORMREPO
    
    PROXY --> APITOOLS
    AUTHMW --> JWKS
    
    GORMREPO --> TABLES
    POOL --> TABLES

    %% Styling
    classDef entry fill:#4299e1,stroke:#2b6cb0,color:#fff
    classDef api fill:#48bb78,stroke:#276749,color:#fff
    classDef domain fill:#ed8936,stroke:#c05621,color:#fff
    classDef repo fill:#9f7aea,stroke:#6b46c1,color:#fff
    classDef db fill:#f56565,stroke:#c53030,color:#fff
    classDef ext fill:#718096,stroke:#4a5568,color:#fff
    
    class MAIN,EXEC entry
    class AUTHMW,HANDLERS,PROXY,RESP,WSUPGRADER,RATELIMIT,WSHandler api
    class MODELS,REPOS,ERRORS,ENUMS,WEBRTC domain
    class GORMREPO,ERRORMAP repo
    class GORMCONN,POOL,TABLES db
    class APITOOLS,JWKS ext
```

## Data Model

```mermaid
erDiagram
    USER {
        uuid ID PK "type:uuid, primaryKey"
        string Email UK "uniqueIndex"
        string Name
        string AvatarURL "nullable"
        string Timezone "default: Asia/Taipei"
        int LateStreak "default: 0"
        int Points "default: 0"
        int Level "default: 0"
        timestamp CreatedAt
        timestamp DeletedAt "soft delete"
    }
    
    EVENT {
        uuid ID PK "type:uuid, primaryKey"
        string Title
        string Description "nullable"
        timestamp StartTime
        float ExpDuration
        float ActDuration "nullable"
        string RecordLink "nullable"
        EventMode Mode "default: report"
        string Note "nullable"
    }
    
    EVENT_ATTENDEE {
        uuid ID PK "type:uuid, primaryKey"
        uuid EventID FK "index"
        uuid UserID FK "index"
        EventAttendeeRole Role "default: member"
        timestamp JoinedAt "nullable"
        timestamp LeavedAt "nullable"
    }
    
    MISTAKE {
        uuid ID PK "type:uuid, primaryKey"
        uuid EventID FK "index"
        uuid UserID FK "index"
        MistakeType Type "default: grammar"
        string OriginText
        string FixedText
        float StartTime
        float EndTime
        string Comment "nullable"
        string Note "nullable"
    }
    
    TRANSCRIPT {
        uuid ID PK "type:uuid, primaryKey"
        uuid EventID FK "index"
        uuid UserID FK "index"
        string Transcript
        string Accent "type: jsonb"
        float StartTime
        float EndTime
        string Note "nullable"
    }
    
    USER ||--o{ EVENT_ATTENDEE : "attends"
    EVENT ||--o{ EVENT_ATTENDEE : "has attendees"
    EVENT ||--o{ MISTAKE : "has mistakes"
    EVENT ||--o{ TRANSCRIPT : "has transcripts"
    USER ||--o{ MISTAKE : "makes"
    USER ||--o{ TRANSCRIPT : "creates"
```

## Enums

```mermaid
graph LR
    subgraph EventMode
        EM1[report]
        EM2[conversation]
        EM3[discussion]
        EM4[review]
    end
    
    subgraph MistakeType
        MT1[grammar]
        MT2[vocab]
        MT3[pronounce]
        MT4[advanced]
    end
    
    subgraph EventAttendeeRole
        AR1[member]
        AR2[emcee]
    end
```

## Request Flow

### REST API Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant H as Handler
    participant R as GORM Repository
    participant DB as PostgreSQL

    C->>M: HTTP Request + JWT Token
    
    alt Invalid/No Token
        M->>C: 401 Unauthorized
    end
    
    M->>M: Validate JWT via JWKS
    M->>M: Extract userID to Context
    M->>H: Forward Request
    
    H->>H: Parse UUID from params
    H->>R: Call Repository Method
    
    alt Not Found
        R->>DB: GORM Query
        DB->>R: gorm.ErrRecordNotFound
        R->>R: MapGormError()
        R->>H: domain.ErrNotFound
        H->>C: 404 Not Found
    else Duplicate Entry
        R->>DB: GORM Create
        DB->>R: duplicate key error
        R->>R: MapGormError()
        R->>H: domain.ErrDuplicateEntry
        H->>C: 409 Conflict
    else Success
        R->>DB: GORM Query
        DB->>R: Rows
        R->>R: MapGormError() → nil
        R->>H: Domain Model
        H->>C: 200 OK + JSON
    end
```

### WebSocket (WebRTC) Flow

```mermaid
sequenceDiagram
    participant C as WebSocket Client
    participant RL as Rate Limiter
    participant WS as WebSocket Upgrader
    participant H as Hub
    participant PEER as Other Clients

    C->>RL: Connection Request (IP)
    
    alt Rate Limited (15+ in 10s)
        RL->>C: 429 Too Many Requests
    else Allowed
        RL->>WS: Proceed
        WS->>WS: Check Origin (CORS)
        
        alt Invalid Origin
            WS->>C: Reject Connection
        else Valid Origin
            WS->>H: Upgrade & Register Client
            H->>C: {"type": "connected", "payload": {"id": "..."}}
            
            loop Message Loop
                C->>H: WebSocket Message
                
                alt join-room
                    H->>PEER: {"type": "user-joined", ...}
                end
                alt offer/answer/ice-candidate
                    H->>PEER: Forward to target
                end
                alt get-online-users
                    H->>C: {"type": "online-users-list", ...}
                end
                alt leave-room
                    H->>PEER: {"type": "user-left", ...}
                end
            end
            
            C->>H: Disconnect
            H->>PEER: {"type": "user-left", ...}
            H->>H: Cleanup Client
        end
    end
```

## API Endpoints

```mermaid
graph LR
    subgraph "Public API (No Auth)"
        HEALTH["GET /healthz"]
        WS["GET /ws<br/>(WebSocket/WebRTC)"]
    end
    
    subgraph "v1 API (JWT Required)"
        subgraph "API Tools Proxy"
            MA["POST /v1/mark-accent"]
            MF["POST /v1/mark-furigana"]
            UH["POST /v1/usage-query/headwords"]
            UU["POST /v1/usage-query/url"]
            UI["POST /v1/usage-query/id-details"]
            DQ["POST /v1/dict-query"]
            SQ["POST /v1/sentence-query"]
        end
        
        subgraph "Users"
            UC["POST /v1/users"]
            UG["GET /v1/users/:id"]
            UU2["PUT /v1/users/:id"]
            UD["DELETE /v1/users/:id"]
            UGN["GET /v1/users/name/:name"]
        end
        
        subgraph "Practices (→ Event)"
            PC["POST /v1/practices"]
            PG["GET /v1/practices/:id"]
            PU["PUT /v1/practices/:id"]
            PD["DELETE /v1/practices/:id"]
            PGU["GET /v1/practices/user/:user_id"]
        end
        
        subgraph "Mistakes"
            MC["POST /v1/mistakes"]
            MG["GET /v1/mistakes/:id"]
            MU["PUT /v1/mistakes/:id"]
            MD["DELETE /v1/mistakes/:id"]
            MGE["GET /v1/mistakes/event/:event_id"]
            MGU["GET /v1/mistakes/user/:user_id"]
        end
        
        subgraph "Transcripts"
            TC["POST /v1/transcripts"]
            TG["GET /v1/transcripts/:id"]
            TU["PUT /v1/transcripts/:id"]
            TD["DELETE /v1/transcripts/:id"]
            TGM["GET /v1/transcripts/mistake/:mistake_id"]
        end
    end
    
    style PC fill:#fbd38d,stroke:#c05621
    style PG fill:#fbd38d,stroke:#c05621
    style PU fill:#fbd38d,stroke:#c05621
    style PD fill:#fbd38d,stroke:#c05621
    style PGU fill:#fbd38d,stroke:#c05621
    style MGE fill:#fbd38d,stroke:#c05621
```

> 🟠 Orange routes indicate backward-compatible mappings: `/practices` → `Event`

## WebSocket Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `connected` | Server → Client | Confirmation with assigned client ID |
| `join-room` | Client → Server | Join with username |
| `user-joined` | Server → Others | Broadcast new user |
| `user-left` | Server → Others | Broadcast user departure |
| `get-online-users` | Client → Server | Request online user list |
| `online-users-list` | Server → Client | List of online users |
| `current-users` | Server → Client | Current users on join |
| `offer` | Client → Server → Target | WebRTC SDP offer |
| `answer` | Client → Server → Target | WebRTC SDP answer |
| `ice-candidate` | Client → Server → Target | ICE candidate |
| `leave-room` | Client → Server | Leave current room |
| `error` | Server → Client | Error message |

## Layer Responsibilities

| Layer | Package | Responsibility |
|-------|---------|----------------|
| **Entry** | `cmd/jpcorrect` | Application bootstrap |
| **Command** | `internal/cmd` | Server lifecycle, GORM setup, AutoMigrate, CORS, HTTPS |
| **Database** | `internal/database` | GORM connection factory, pool configuration |
| **API** | `internal/api` | HTTP handling, routing, JWT auth, WebSocket, rate limiting |
| **Domain** | `internal/domain` | Business entities, enums, repository interfaces |
| **Repository** | `internal/repository` | GORM implementations, error mapping |

## Key Design Patterns

### Repository Pattern with GORM
```go
// Domain defines the interface
type UserRepository interface {
    GetByID(ctx context.Context, userID uuid.UUID) (*User, error)
    Create(ctx context.Context, user *User) error
    // ...
}

// Repository implements with GORM
type gormUserRepository struct {
    db *gorm.DB
}

func (r *gormUserRepository) GetByID(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
    var user domain.User
    err := r.db.WithContext(ctx).First(&user, "id = ?", userID).Error
    return &user, MapGormError(err)  // Always map errors!
}
```

### Error Mapping Pattern
```go
// MapGormError maps GORM specific errors to domain errors.
func MapGormError(err error) error {
    if err == nil {
        return nil
    }
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return domain.ErrNotFound
    }
    if strings.Contains(err.Error(), "duplicate key") {
        return domain.ErrDuplicateEntry
    }
    return err
}
```

### Dependency Injection
```go
// API struct receives *gorm.DB and creates repositories
type API struct {
    db                *gorm.DB
    userRepo          domain.UserRepository
    eventRepo         domain.EventRepository
    eventAttendeeRepo domain.EventAttendeeRepository
    transcriptRepo    domain.TranscriptRepository
    mistakeRepo       domain.MistakeRepository
    webrtcRepo        domain.WebRTCRepository
    rateLimiter       *RateLimiter
    upgrader          websocket.Upgrader
}

func NewAPI(url string, transport *http.Transport, db *gorm.DB, jwksURL string, allowedOrigins []string) *API {
    return &API{
        db:                db,
        userRepo:          repository.NewGormUserRepository(db),
        eventRepo:         repository.NewGormEventRepository(db),
        eventAttendeeRepo: repository.NewGormEventAttendeeRepository(db),
        transcriptRepo:    repository.NewGormTranscriptRepository(db),
        mistakeRepo:       repository.NewGormMistakeRepository(db),
        webrtcRepo:        NewHub(),
        rateLimiter:       NewRateLimiter(10*time.Second, 15),
        upgrader:          websocket.Upgrader{...},
    }
}
```

### Hub Pattern (WebRTC)
```go
// Hub manages all connected WebSocket clients
type Hub struct {
    mu      sync.RWMutex
    clients map[string]*domain.Client
}

func (h *Hub) AddClient(c *domain.Client)
func (h *Hub) RemoveClient(id string)
func (h *Hub) GetClient(id string) (*domain.Client, bool)
func (h *Hub) BroadcastExcept(senderId string, msgType string, payload interface{})
```

### Rate Limiter (Sliding Window)
```go
type RateLimiter struct {
    mu       sync.Mutex
    attempts map[string][]time.Time
    window   time.Duration  // 10 seconds
    max      int            // 15 connections
}
```

## Security Features

### Rate Limiting
- **Window**: 10 seconds
- **Max Connections**: 15 per IP
- **Response**: 429 Too Many Requests when exceeded
- **Cleanup**: Background goroutine removes expired IP records every 2x window duration

### CORS (WebSocket)
```go
// Environment: ALLOWED_ORIGINS (comma-separated)
upgrader := websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        origin := r.Header.Get("Origin")
        for _, allowed := range allowedOrigins {
            if allowed == "*" || allowed == origin {
                return true
            }
        }
        return false
    },
}
```

### HTTPS/TLS
- **Auto-detection**: Checks for cert/key files on startup
- **Cert Path**: `API_CERT_PATH` (default: `./certs/cert.pem`)
- **Key Path**: `API_KEY_PATH` (default: `./certs/key.pem`)
- **Fallback**: HTTP mode if certificates not found (development only)

## Technology Stack

| Component | Technology |
|-----------|------------|
| HTTP Framework | Gin |
| ORM | GORM |
| Database | PostgreSQL |
| Database Driver | gorm.io/driver/postgres |
| Authentication | JWT with JWKS |
| WebSocket | gorilla/websocket |
| WebRTC | Signaling server (peer-to-peer via WebSocket) |
| UUID | google/uuid |
| Migrations | GORM AutoMigrate |
| Testing | go-sqlmock |
| Hot Reload | Air |
| Containerization | Docker, docker-compose |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `API_TOOLS_URL` | Yes | External API tools base URL |
| `JWKS_URL` | Yes | JWKS endpoint for JWT validation |
| `ALLOWED_ORIGINS` | No* | Comma-separated CORS origins for WebSocket |
| `PORT` | No | Server port (default: 8080) |
| `API_CERT_PATH` | No | TLS certificate path |
| `API_KEY_PATH` | No | TLS private key path |
| `GIN_MODE` | No | debug/release |

\* `ALLOWED_ORIGINS` is required in production mode for WebSocket connections.

## File Structure

```
.
├── cmd/
│   ├── jpcorrect/main.go          # Entry point
│   └── webrtc-demo/               # WebRTC demo (HTML/JS/Go)
├── internal/
│   ├── api/                       # HTTP handlers
│   │   ├── api.go                 # API struct + NewAPI + Register
│   │   ├── auth.go                # JWT middleware
│   │   ├── api_tools.go           # External API proxy
│   │   ├── webrtc.go              # WebSocket handler + Hub + RateLimiter
│   │   ├── user.go                # User handlers
│   │   ├── practice.go            # Event handlers (backward compat)
│   │   ├── mistake.go             # Mistake handlers
│   │   └── transcript.go          # Transcript handlers
│   ├── cmd/                       # Server setup
│   │   ├── api.go                 # Execute() + AutoMigrate + CORS + HTTPS
│   │   └── db.go                  # DB connection test
│   ├── database/                  # GORM connection
│   │   └── gorm.go                # NewGormDB()
│   ├── domain/                    # Business entities
│   │   ├── user.go                # User + UserRepository
│   │   ├── event.go               # Event + EventRepository + EventMode
│   │   ├── event_attendee.go      # EventAttendee + Repository + Role
│   │   ├── mistake.go             # Mistake + Repository + MistakeType
│   │   ├── transcript.go          # Transcript + Repository
│   │   ├── webrtc.go              # Client + WebRTCRepository
│   │   └── errors.go              # Domain errors
│   └── repository/                # GORM implementations
│       ├── errors.go              # MapGormError()
│       ├── gorm_user.go           # UserRepository impl
│       ├── gorm_event.go          # EventRepository impl
│       ├── gorm_event_attendee.go # EventAttendeeRepository impl
│       ├── gorm_mistake.go        # MistakeRepository impl
│       └── gorm_transcript.go     # TranscriptRepository impl
├── db/
│   ├── schema.sql                 # Reference schema (legacy)
│   └── migrations/                # SQL migrations (secondary)
├── docs/
│   └── refactor-pgx-to-gorm.md    # Refactor documentation
├── Dockerfile                     # Multi-stage build
├── docker-compose.yml             # Local dev environment
└── AGENTS.md                      # AI coding guidelines
```

## Migration Summary (pgx → GORM)

### What Changed

| Component | Before (pgx) | After (GORM) |
|-----------|--------------|--------------|
| **ID Type** | `int` (auto-increment) | `uuid.UUID` |
| **Schema Mgmt** | SQL migrations | AutoMigrate |
| **Connection** | `pgxpool.Pool` | `*gorm.DB` |
| **Query Style** | Raw SQL + sqlc | GORM ORM |
| **Error Handling** | Manual | `MapGormError()` |
| **Soft Delete** | Manual | Built-in (`DeletedAt`) |
| **Tests** | None | go-sqlmock |

### Domain Model Changes

| Component | Status |
|-----------|--------|
| WebRTC/WebSocket | ✅ Integrated |
| Rate Limiter | ✅ Integrated |
| CORS Validation | ✅ Integrated |
| HTTPS/TLS | ✅ Integrated |
| `/ai-corrections` routes | ❌ Merged into Event/Mistake |
| `/notes` routes | ❌ Merged into Mistake.Note |
| `Practice` domain | 🔄 Renamed to `Event` |
| `Note` domain | 🔄 Merged into Mistake.Note |
| `AICorrection` domain | 🔄 Merged into Event/Mistake |

### New Domain Models

| Model | Description |
|-------|-------------|
| `Event` | Replaces Practice/Note/AICorrection; has `EventMode` enum |
| `EventAttendee` | Links Users to Events with role (member/emcee) |

## Development Workflow

### Adding a New Domain Model

1. Define struct in `internal/domain/new_model.go`:
```go
type NewModel struct {
    ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
    // ... other fields
    CreatedAt time.Time      `json:"created_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at"`
}
```

2. Define repository interface:
```go
type NewModelRepository interface {
    GetByID(ctx context.Context, id uuid.UUID) (*NewModel, error)
    Create(ctx context.Context, m *NewModel) error
    Update(ctx context.Context, m *NewModel) error
    Delete(ctx context.Context, id uuid.UUID) error
}
```

3. Implement in `internal/repository/gorm_new_model.go`:
```go
func (r *gormNewModelRepository) Create(ctx context.Context, m *domain.NewModel) error {
    if m.ID == uuid.Nil {
        m.ID = uuid.New()
    }
    return MapGormError(r.db.WithContext(ctx).Create(m).Error)
}
```

4. Add to AutoMigrate in `internal/cmd/api.go`:
```go
db.AutoMigrate(
    &domain.User{},
    &domain.Event{},
    // ... existing models
    &domain.NewModel{},  // Add here
)
```

5. Register in `internal/api/api.go` and create handlers.


## jpcorrect-backend Architecture before migration

## Overview

jpcorrect-backend is a Go-based REST API for a Japanese language correction platform. It follows a clean architecture pattern with clear separation between layers.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["🌐 Client Layer"]
        REQ[HTTP Request]
        WSCLIENT[WebSocket Client]
    end

    subgraph Entry["📦 Entry Point"]
        MAIN["cmd/jpcorrect/main.go"]
        EXEC["cmd.Execute()"]
        MAIN --> EXEC
    end

    subgraph CmdLayer["⚙️ Command Layer (internal/cmd/)"]
        DBCONN["Database Connection<br/>(pgxpool)"]
        HTTPTRANS["HTTP Transport<br/>(Connection Pool)"]
        JWKSINIT["JWKS Initialization<br/>(JWT Key Fetch)"]
        CORS["CORS Config<br/>(ALLOWED_ORIGINS)"]
        HTTPS["HTTPS/TLS Config<br/>(cert.pem, key.pem)"]
        SERVER["HTTP Server<br/>(Graceful Shutdown)"]
        ROUTER["Gin Router Setup"]
        
        EXEC --> DBCONN
        EXEC --> HTTPTRANS
        EXEC --> JWKSINIT
        EXEC --> CORS
        EXEC --> HTTPS
        EXEC --> SERVER
        EXEC --> ROUTER
    end

    subgraph APILayer["🔌 API Layer (internal/api/)"]
        AUTHMW["AuthMiddleware<br/>(JWT Validation)"]
        HANDLERS["REST Handlers<br/>(CRUD Operations)"]
        PROXY["API Tools Proxy<br/>(Reverse Proxy)"]
        WSUPGRADER["WebSocket Upgrader<br/>(CORS Check)"]
        RATELIMIT["Rate Limiter<br/>(15 conn / 10s)"]
        WSHandler["WebRTC Handler<br/>(Signaling)"]
        RESP["JSON Response<br/>(Error Handling)"]
        
        ROUTER --> AUTHMW
        ROUTER --> WSUPGRADER
        WSUPGRADER --> RATELIMIT
        RATELIMIT --> WSHandler
        AUTHMW --> HANDLERS
        AUTHMW --> PROXY
        HANDLERS --> RESP
        PROXY --> RESP
        WSHandler --> RESP
    end

    subgraph DomainLayer["📋 Domain Layer (internal/domain/)"]
        MODELS["Domain Models<br/>(User, Practice, Mistake,<br/>Note, Transcript, AICorrection)"]
        WEBRTC["WebRTC Domain<br/>(Client, WebRTCRepository)"]
        REPOS["Repository Interfaces<br/>(Data Access Contracts)"]
        ERRORS["Domain Errors<br/>(ErrNotFound, AuthError)"]
    end

    subgraph RepoLayer["💾 Repository Layer (internal/repository/)"]
        CONN["Connection Interface<br/>(Exec, Query, QueryRow)"]
        PGREPO["PostgreSQL Repositories<br/>(postgres_*.go)"]
        
        CONN --> PGREPO
    end

    subgraph DB["🗄️ Database (PostgreSQL)"]
        SCHEMA["jpcorrect Schema"]
        TABLES["Tables:<br/>• user<br/>• practice<br/>• mistake<br/>• note<br/>• transcript<br/>• ai_correction"]
    end

    subgraph External["🌍 External Services"]
        APITOOLS["API Tools Service<br/>(MarkAccent, Furigana,<br/>DictQuery, SentenceQuery)"]
        JWKS["JWKS Endpoint<br/>(JWT Public Keys)"]
    end

    %% Connections
    REQ --> MAIN
    WSCLIENT --> MAIN
    
    DBCONN --> CONN
    JWKSINIT --> JWKS
    CORS --> WSUPGRADER
    HTTPS --> SERVER
    
    HANDLERS --> REPOS
    HANDLERS --> MODELS
    WSHandler --> WEBRTC
    REPOS --> PGREPO
    
    PROXY --> APITOOLS
    AUTHMW --> JWKS
    
    PGREPO --> SCHEMA
    SCHEMA --> TABLES

    %% Styling
    classDef entry fill:#4299e1,stroke:#2b6cb0,color:#fff
    classDef api fill:#48bb78,stroke:#276749,color:#fff
    classDef domain fill:#ed8936,stroke:#c05621,color:#fff
    classDef repo fill:#9f7aea,stroke:#6b46c1,color:#fff
    classDef db fill:#f56565,stroke:#c53030,color:#fff
    classDef ext fill:#718096,stroke:#4a5568,color:#fff
    
    class MAIN,EXEC entry
    class AUTHMW,HANDLERS,PROXY,RESP,WSUPGRADER,RATELIMIT,WSHandler api
    class MODELS,REPOS,ERRORS,WEBRTC domain
    class CONN,PGREPO repo
    class SCHEMA,TABLES db
    class APITOOLS,JWKS ext
```

## Data Model

```mermaid
erDiagram
    USER {
        int user_id PK "GENERATED ALWAYS AS IDENTITY"
        text name "NOT NULL"
    }
    
    PRACTICE {
        int practice_id PK "GENERATED ALWAYS AS IDENTITY"
        int user_id FK
        date date
        double duration
    }
    
    MISTAKE {
        int mistake_id PK "GENERATED ALWAYS AS IDENTITY"
        int practice_id FK "NOT NULL"
        int user_id FK "NOT NULL"
        double start_time "DEFAULT 0, NOT NULL"
        double end_time "DEFAULT 0, NOT NULL"
        mistake_status status "NOT NULL (ENUM)"
        mistake_type type "NOT NULL (ENUM)"
    }
    
    NOTE {
        int note_id PK "GENERATED ALWAYS AS IDENTITY"
        int practice_id FK "NOT NULL"
        text content
    }
    
    TRANSCRIPT {
        int transcript_id PK "GENERATED ALWAYS AS IDENTITY"
        int mistake_id FK "NOT NULL"
        text content
        text furigana
        text accent
    }
    
    AI_CORRECTION {
        int ai_correction_id PK "GENERATED ALWAYS AS IDENTITY"
        int mistake_id FK "NOT NULL"
        text content
    }
    
    USER ||--o{ PRACTICE : "has many"
    PRACTICE ||--o{ MISTAKE : "has many"
    USER ||--o{ MISTAKE : "has many"
    PRACTICE ||--o| NOTE : "has one"
    MISTAKE ||--o| TRANSCRIPT : "has one"
    MISTAKE ||--o| AI_CORRECTION : "has one"
```

## Request Flow

### REST API Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant H as Handler
    participant R as Repository
    participant DB as PostgreSQL

    C->>M: HTTP Request + JWT Token
    
    alt Invalid/No Token
        M->>C: 401 Unauthorized
    end
    
    M->>M: Validate JWT via JWKS
    M->>M: Extract userID to Context
    M->>H: Forward Request
    
    H->>H: Parse & Validate Params
    H->>R: Call Repository Method
    
    alt Not Found
        R->>DB: Query
        DB->>R: No Rows
        R->>H: ErrNotFound
        H->>C: 404 Not Found
    else Success
        R->>DB: Query
        DB->>R: Rows
        R->>H: Domain Model
        H->>C: 200 OK + JSON
    end
```

### WebSocket (WebRTC) Flow

```mermaid
sequenceDiagram
    participant C as WebSocket Client
    participant RL as Rate Limiter
    participant WS as WebSocket Upgrader
    participant H as Hub
    participant PEER as Other Clients

    C->>RL: Connection Request (IP)
    
    alt Rate Limited (15+ in 10s)
        RL->>C: 429 Too Many Requests
    else Allowed
        RL->>WS: Proceed
        WS->>WS: Check Origin (CORS)
        
        alt Invalid Origin
            WS->>C: Reject Connection
        else Valid Origin
            WS->>H: Upgrade & Register Client
            H->>C: {"type": "connected", "payload": {"id": "..."}}
            
            loop Message Loop
                C->>H: WebSocket Message
                
                alt join-room
                    H->>PEER: {"type": "user-joined", ...}
                else offer/answer/ice-candidate
                    H->>PEER: Forward to target
                else get-online-users
                    H->>C: {"type": "online-users-list", ...}
                else leave-room
                    H->>PEER: {"type": "user-left", ...}
                end
            end
            
            C->>H: Disconnect
            H->>PEER: {"type": "user-left", ...}
            H->>H: Cleanup Client
        end
    end
```

## API Endpoints

```mermaid
graph LR
    subgraph "Public API (No Auth)"
        HEALTH["GET /healthz"]
        WS["GET /ws<br/>(WebSocket/WebRTC)"]
    end
    
    subgraph "v1 API (JWT Required)"
        subgraph "API Tools Proxy"
            MA["POST /v1/mark-accent"]
            MF["POST /v1/mark-furigana"]
            UH["POST /v1/usage-query/headwords"]
            UU["POST /v1/usage-query/url"]
            UI["POST /v1/usage-query/id-details"]
            DQ["POST /v1/dict-query"]
            SQ["POST /v1/sentence-query"]
        end
        
        subgraph "Users"
            UC["POST /v1/users"]
            UG["GET /v1/users/:id"]
            UU2["PUT /v1/users/:id"]
            UD["DELETE /v1/users/:id"]
            UGN["GET /v1/users/name/:name"]
        end
        
        subgraph "Practices"
            PC["POST /v1/practices"]
            PG["GET /v1/practices/:id"]
            PU["PUT /v1/practices/:id"]
            PD["DELETE /v1/practices/:id"]
            PGU["GET /v1/practices/user/:user_id"]
        end
        
        subgraph "Mistakes"
            MC["POST /v1/mistakes"]
            MG["GET /v1/mistakes/:id"]
            MU["PUT /v1/mistakes/:id"]
            MD["DELETE /v1/mistakes/:id"]
            MGP["GET /v1/mistakes/practice/:practice_id"]
            MGU["GET /v1/mistakes/user/:user_id"]
        end
        
        subgraph "Notes"
            NC["POST /v1/notes"]
            NG["GET /v1/notes/:id"]
            NU["PUT /v1/notes/:id"]
            ND["DELETE /v1/notes/:id"]
            NGP["GET /v1/notes/practice/:practice_id"]
        end
        
        subgraph "Transcripts"
            TC["POST /v1/transcripts"]
            TG["GET /v1/transcripts/:id"]
            TU["PUT /v1/transcripts/:id"]
            TD["DELETE /v1/transcripts/:id"]
            TGM["GET /v1/transcripts/mistake/:mistake_id"]
        end
        
        subgraph "AI Corrections"
            AC["POST /v1/ai-corrections"]
            AG["GET /v1/ai-corrections/:id"]
            AU["PUT /v1/ai-corrections/:id"]
            AD["DELETE /v1/ai-corrections/:id"]
            AGM["GET /v1/ai-corrections/mistake/:mistake_id"]
        end
    end
```

## WebSocket Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `connected` | Server → Client | Confirmation with assigned client ID |
| `join-room` | Client → Server | Join with username |
| `user-joined` | Server → Others | Broadcast new user |
| `user-left` | Server → Others | Broadcast user departure |
| `get-online-users` | Client → Server | Request online user list |
| `online-users-list` | Server → Client | List of online users |
| `current-users` | Server → Client | Current users on join |
| `offer` | Client → Server → Target | WebRTC SDP offer |
| `answer` | Client → Server → Target | WebRTC SDP answer |
| `ice-candidate` | Client → Server → Target | ICE candidate |
| `leave-room` | Client → Server | Leave current room |
| `error` | Server → Client | Error message |

## Layer Responsibilities

| Layer | Package | Responsibility |
|-------|---------|----------------|
| **Entry** | `cmd/jpcorrect` | Application bootstrap |
| **Command** | `internal/cmd` | Server lifecycle, dependency wiring, TLS config |
| **API** | `internal/api` | HTTP handling, routing, auth, WebSocket, rate limiting |
| **Domain** | `internal/domain` | Business entities, repository interfaces |
| **Repository** | `internal/repository` | Data persistence implementation |

## Key Design Patterns

### Repository Pattern
```go
// Domain defines the interface
type UserRepository interface {
    GetByID(ctx context.Context, userID int) (*User, error)
    Create(ctx context.Context, user *User) error
    // ...
}

// Repository implements with PostgreSQL
type postgresUserRepository struct {
    conn Connection
}
```

### Dependency Injection
```go
// API struct receives all repositories
type API struct {
    userRepo      domain.UserRepository
    practiceRepo  domain.PracticeRepository
    webrtcRepo    domain.WebRTCRepository
    rateLimiter   *RateLimiter
    upgrader      websocket.Upgrader
    // ...
}

// Wired in cmd/api.go
func NewAPI(url string, transport *http.Transport, conn repository.Connection, jwksURL string, allowedOrigins []string) *API {
    userRepo := repository.NewPostgresUser(conn)
    webrtcRepo := NewHub()
    rateLimiter := NewRateLimiter(10*time.Second, 15)
    // ...
}
```

### Connection Abstraction
```go
// Interface allows testing with mocks
type Connection interface {
    Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
    Query(context.Context, string, ...any) (pgx.Rows, error)
    QueryRow(context.Context, string, ...any) pgx.Row
}
```

### Hub Pattern (WebRTC)
```go
// Hub manages all connected WebSocket clients
type Hub struct {
    mu      sync.RWMutex
    clients map[string]*domain.Client
}

func (h *Hub) AddClient(c *domain.Client)
func (h *Hub) RemoveClient(id string)
func (h *Hub) GetClient(id string) (*domain.Client, bool)
func (h *Hub) BroadcastExcept(senderId string, msgType string, payload interface{})
```

### Rate Limiter (Sliding Window)
```go
type RateLimiter struct {
    mu       sync.Mutex
    attempts map[string][]time.Time
    window   time.Duration  // 10 seconds
    max      int            // 15 connections
}
```

### Connection Abstraction
```go
// Interface allows testing with mocks
type Connection interface {
    Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
    Query(context.Context, string, ...any) (pgx.Rows, error)
    QueryRow(context.Context, string, ...any) pgx.Row
}
```

## Security Features

### Rate Limiting
- **Window**: 10 seconds
- **Max Connections**: 15 per IP
- **Response**: 429 Too Many Requests when exceeded
- **Cleanup**: Background goroutine removes expired IP records every 2x window duration

### CORS (WebSocket)
```go
// Environment: ALLOWED_ORIGINS (comma-separated)
upgrader := websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        origin := r.Header.Get("Origin")
        for _, allowed := range allowedOrigins {
            if allowed == "*" || allowed == origin {
                return true
            }
        }
        return false
    },
}
```

### HTTPS/TLS
- **Auto-detection**: Checks for cert/key files on startup
- **Cert Path**: `API_CERT_PATH` (default: `./certs/cert.pem`)
- **Key Path**: `API_KEY_PATH` (default: `./certs/key.pem`)
- **Fallback**: HTTP mode if certificates not found (development only)

## Technology Stack

| Component | Technology |
|-----------|------------|
| HTTP Framework | Gin |
| Database | PostgreSQL (pgx v5) |
| Authentication | JWT with JWKS |
| WebSocket | gorilla/websocket |
| WebRTC | Signaling server (peer-to-peer via WebSocket) |
| Migrations | golang-migrate |
| SQL Generation | sqlc |
| Hot Reload | Air |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `API_TOOLS_URL` | Yes | External API tools base URL |
| `JWKS_URL` | Yes | JWKS endpoint for JWT validation |
| `ALLOWED_ORIGINS` | No* | Comma-separated CORS origins |
| `PORT` | No | Server port (default: 8080) |
| `API_CERT_PATH` | No | TLS certificate path |
| `API_KEY_PATH` | No | TLS private key path |
| `GIN_MODE` | No | debug/release |

\* `ALLOWED_ORIGINS` is required in production mode for WebSocket connections.
