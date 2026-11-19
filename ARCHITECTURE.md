# ðŸ¨ Enterprise Hotel Management Platform â€” Architecture Blueprint
### Polyglot Microservices (NestJS + Go + PostgreSQL + MongoDB + Redis + RabbitMQ + gRPC + Kubernetes)

The current service topology is shown in the Mermaid diagram below.

---

## 1. Enterprise Technology Matrix

| Layer / Service | Technology | Database / State Store | ORM / Driver | Protocols / Ports |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | **NestJS** | â€” | â€” | HTTP REST (`:8000`), Rate Limiting, Reverse Proxy |
| **Authentication** | **NestJS** | **PostgreSQL** (`hotel_auth_db`) | **Prisma** | HTTP (`:8001`), Redis |
| **Guest / User Management** | **NestJS** | **PostgreSQL** (`hotel_users_db`) | **Prisma** | HTTP (`:8002`), Profiles, KYC, Preferences |
| **Unified Operations** | **Node.js + Express** | **MongoDB** (`hotel_catalog`, `hotel_departments`, `hotel_housekeeping`, `hotel_reviews`) + **PostgreSQL** (`hotel_operations_db`) | **Mongoose + Prisma** | REST (`:8020`), all six domain APIs in one process |
| **Booking Engine** | **Go (Golang)** | **PostgreSQL** (`hotel_bookings_db`) | **pgx / sqlc** | HTTP (`:8005`), gRPC (`:50051`), Redis Distributed Lock |
| **Payment & Invoicing** | **NestJS** | **PostgreSQL** (`hotel_payments_db`) | **Prisma** | HTTP (`:8006`), Stripe Webhooks, Ledgers |
| **Notifications** | **Go (Golang)** | **MongoDB / PostgreSQL** | **pgx / Mongoose** | HTTP (`:8010`), gRPC (`:50052`), RabbitMQ Consumer |
| **Analytics & Reporting** | **Go (Golang)** | **PostgreSQL / ClickHouse** | **pgx / sqlc** | HTTP (`:8011`), Occupancy, ADR, RevPAR metrics |
| **Distributed Cache & Locks**| **Redis 7** | In-Memory Cluster | `ioredis` / `go-redis` | Port `:6379`, 10-Min Hold TTL, `SET NX EX` locks |
| **Message Broker** | **RabbitMQ** | Disk-Backed AMQP | `amqplib` / `amqp091-go`| Ports `:5672`, Management UI `:15672` |
| **Internal RPC** | **gRPC** | Protocol Buffers (`proto/`) | Go service interfaces | Used by remaining booking and notification components |
| **Containerization** | **Docker** | Multi-Stage Alpine Builds | â€” | OCI compliant container images |
| **Orchestration** | **Kubernetes (K8s)**| Namespaced Manifests (`k8s/`) | â€” | Ingress-NGINX, Horizontal Pod Autoscalers (HPA) |
| **CI/CD Pipeline** | **GitHub Actions**| Automated CI/CD (`.github/`) | â€” | Build, Vet, Test, Container Push, Cluster Rollout |

---

## 2. Microservice Topology & Event-Driven Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Client & Edge Layer (Vercel)"]
        Web["Next.js 15 Web Application\n(Port 3000 / Vercel Edge)"]
        AdminApp["Pastel Admin Dashboard\n(Occupancy, Staff, Housekeeping)"]
    end

    subgraph GatewayLayer["API Gateway Layer (NestJS - Port 8000)"]
        GW["API Gateway\n- Central JWT Verification\n- Rate Limiting & Helmet\n- Reverse Proxy Routing"]
    end

    subgraph TypeScriptServices["TypeScript Services (NestJS + Express)"]
        AuthSvc["Auth Service\n(NestJS + Prisma) :8001"]
        UserSvc["Guest Management\n(NestJS + Prisma) :8002"]
        OperationsSvc["Operations Service\nHotels, rooms, departments, employees, housekeeping, reviews\n(Express + Mongoose / Prisma) :8020"]
        PaySvc["Payment Service\n(NestJS + Prisma) :8006"]
    end

    subgraph GoServices["High-Performance Go Microservices"]
        BookingSvc["Booking Engine (Go)\n- Distributed Locking (Redlock)\n- 10-Min Hold State Machine\n- Port :8005 / gRPC :50051"]
        NotifSvc["Notification Service (Go)\n- RabbitMQ Event Consumer\n- SMS / Email / Push Worker\n- Port :8010 / gRPC :50052"]
        AnalyticsSvc["Analytics Service (Go)\n- Financial & KPI Aggregation\n- Port :8011"]
    end

    subgraph EventBroker["Async Message Broker (RabbitMQ)"]
        RabbitMQ{{"RabbitMQ Event Bus (:5672)\nTopics include booking.held and payment.succeeded"}}
    end

    subgraph StorageLayer["Data & Persistence Layer"]
        PG[("PostgreSQL 16 Cluster\n- hotel_auth_db\n- hotel_users_db\n- hotel_bookings_db\n- hotel_payments_db\n- hotel_operations_db")]
        Mongo[("MongoDB 7\n- hotel_catalog\n- hotel_departments\n- hotel_housekeeping\n- hotel_reviews")]
        RedisMaster[("Redis 7 In-Memory Cluster\n- Room Distributed Locks\n- 10-Minute Cart Holds (TTL: 600s)\n- Catalog Cache")]
    end

    %% Client flows
    Web --> GW
    AdminApp --> GW

    %% Gateway routes
    GW -->|/api/v1/auth| AuthSvc
    GW -->|/api/v1/users| UserSvc
    GW -->|/api/v1/hotels, rooms, offers| OperationsSvc

    GW -->|/api/v1/bookings| BookingSvc
    GW -->|/api/v1/payments| PaySvc
    GW -->|/api/v1/employees, departments, housekeeping, reviews| OperationsSvc



    GW -->|/api/v1/analytics| AnalyticsSvc

    %% Internal service communication
    BookingSvc -.->|REST inventory and availability| OperationsSvc
    OperationsSvc -.->|booking availability lookup| BookingSvc
    PaySvc -.->|Booking confirmation| BookingSvc

    %% Data Connections
    AuthSvc --> PG
    UserSvc --> PG
    BookingSvc --> PG
    PaySvc --> PG
    OperationsSvc --> PG
    OperationsSvc --> Mongo

    BookingSvc --> RedisMaster

    %% Event Bus Connections
    BookingSvc -->|Publish booking.held| RabbitMQ
    PaySvc -->|Publish payment.succeeded| RabbitMQ
    RabbitMQ -->|Consume events| NotifSvc
    RabbitMQ -->|Consume metrics| AnalyticsSvc
```

---

## 3. High-Concurrency Booking & Payment Flow

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Guest (Next.js App)
    participant GW as API Gateway (NestJS)
    participant Booking as Booking Engine (Go)
    participant Room as Room Service (Express + MongoDB)
    participant Redis as Redis (Distributed Lock)
    participant PG as PostgreSQL (hotel_bookings_db)
    participant Pay as Payment Service (NestJS)
    participant Rabbit as RabbitMQ (Event Bus)
    participant Notif as Notification Worker (Go)

    Guest->>GW: POST /api/v1/bookings/hold (Room, Dates, Guest Info)
    GW->>Booking: Forward Request (with Auth context)

    Booking->>Redis: Acquire Distributed Lock: lock:room:{roomId}:{dates} (TTL 5s)
    alt Lock Failed
        Booking-->>Guest: 409 Conflict ("Room in reservation checkout by another guest")
    else Lock Acquired
        Booking->>PG: Count overlapping active stays
        Booking->>Room: GET /internal/rooms/{roomTypeId}/inventory
        Room-->>Booking: Inventory and authoritative room price
        Booking->>Booking: Reject if requested inventory is unavailable
        Booking->>PG: INSERT booking (status: 'PENDING_PAYMENT', expires_at: NOW() + 10m)
        Booking->>Redis: Set 10-Minute Cart Hold (TTL: 600s)
        Booking->>Redis: Release Distributed Lock
        Booking->>Rabbit: Publish event: "booking.held"
        Booking-->>Guest: 201 Created (bookingCode, countdown: 600s, totalPrice)
    end

    Guest->>GW: POST /api/v1/payments/intent (bookingId, amount)
    GW->>Pay: Forward payment intent request
    Pay-->>Guest: Return Stripe clientSecret
    Guest->>GW: Submit payment confirmation
    GW->>Pay: Forward payment confirmation
    Pay->>PG: Record Payment (status: 'SUCCESS')
    Pay->>Booking: POST /api/v1/bookings/{id}/confirm
    Booking->>PG: UPDATE booking SET status = 'CONFIRMED'
    Booking->>Redis: Invalidate hold key
    Booking->>Rabbit: Publish event: "booking.confirmed"
    Rabbit-)Notif: Consume "booking.confirmed"
    Notif-)Guest: Send Email & WhatsApp Confirmation Ticket with QR Pass
```

---

## 4. Local Orchestration (Docker Compose)

Start the containerized data stores and services with Docker Compose:

```powershell
docker compose -f services\docker-compose.yml up --build

# Check running services
docker compose -f services\docker-compose.yml ps

# Stop containers without removing persisted database volumes
docker compose -f services\docker-compose.yml down
```

For local development without containers, `npm run services:up` and
`npm run services:down` run the repository's Windows service scripts:

```powershell
npm run services:up
npm run services:down
```

---

## 5. Kubernetes Production Deployment (`k8s/`)

The checked-in Kubernetes files are legacy scaffolding, not a production-ready
deployment for the current service map. They do not yet define the complete
service set, secrets, database resources, or validated service configuration.
Reconcile and test those manifests in a non-production cluster before deploying.

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/services-deployments.yaml
```

---

## 6. Continuous Integration & Deployment (GitHub Actions)

The `.github/workflows/ci-cd.yml` file is a deployment scaffold that needs
alignment with the current service languages, image build contexts, and
Kubernetes manifests before it can be used as a release pipeline. Run the
frontend build, service builds/tests, and Compose validation locally until that
workflow is corrected and verified.
