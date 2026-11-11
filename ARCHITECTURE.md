# 🏨 Enterprise Hotel Management Platform — Architecture Blueprint
### Polyglot Microservices (NestJS + Go + PostgreSQL + MongoDB + Redis + RabbitMQ + gRPC + Kubernetes)

> **Visual Diagram**: A vector diagram has been generated at [`architecture-diagram.svg`](./architecture-diagram.svg) and an interactive web viewer at [`architecture-diagram.html`](./architecture-diagram.html).

![StayEase Architecture Diagram](./architecture-diagram.svg)

---

## 1. Enterprise Technology Matrix

| Layer / Service | Technology | Database / State Store | ORM / Driver | Protocols / Ports |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | **NestJS** | — | — | HTTP REST (`:8000`), Rate Limiting, Reverse Proxy |
| **Authentication** | **NestJS** | **PostgreSQL** (`hotel_auth_db`) | **Prisma** | HTTP (`:8001`), gRPC (`:50050`), Redis Session Cache |
| **Guest / User Management** | **NestJS** | **PostgreSQL** (`hotel_users_db`) | **Prisma** | HTTP (`:8002`), Profiles, KYC, Preferences |
| **Hotel Management** | **NestJS** | **MongoDB** (`hotel_catalog`) | **Mongoose** | HTTP (`:8003`), Rich Media, Facilities, Geolocation |
| **Room Management** | **NestJS** | **MongoDB** (`hotel_catalog`) | **Mongoose** | HTTP (`:8004`), Room Layouts, Dynamic Specs |
| **Booking Engine** | **Go (Golang)** | **PostgreSQL** (`hotel_bookings_db`) | **pgx / sqlc** | HTTP (`:8005`), gRPC (`:50051`), Redis Distributed Lock |
| **Payment & Invoicing** | **NestJS** | **PostgreSQL** (`hotel_payments_db`) | **Prisma** | HTTP (`:8006`), Stripe Webhooks, Ledgers |
| **Employee & Department** | **NestJS** | **PostgreSQL** (`hotel_operations_db`) | **Prisma** | HTTP (`:8007`), Staff, Shifts, Permissions |
| **Housekeeping & Maintenance** | **NestJS** | **MongoDB** (`hotel_housekeeping`) | **Mongoose** | HTTP (`:8008`), Cleaning Logs, Checklists |
| **Guest Reviews & Ratings** | **NestJS** | **MongoDB** (`hotel_reviews`) | **Mongoose** | HTTP (`:8009`), Multi-criteria Ratings, Photos |
| **Notifications** | **Go (Golang)** | **MongoDB / PostgreSQL** | **pgx / Mongoose** | HTTP (`:8010`), gRPC (`:50052`), RabbitMQ Consumer |
| **Analytics & Reporting** | **Go (Golang)** | **PostgreSQL / ClickHouse** | **pgx / sqlc** | HTTP (`:8011`), Occupancy, ADR, RevPAR metrics |
| **Distributed Cache & Locks**| **Redis 7** | In-Memory Cluster | `ioredis` / `go-redis` | Port `:6379`, 10-Min Hold TTL, `SET NX EX` locks |
| **Message Broker** | **RabbitMQ** | Disk-Backed AMQP | `amqplib` / `amqp091-go`| Ports `:5672`, Management UI `:15672` |
| **Internal RPC** | **gRPC** | Protocol Buffers (`proto/`) | `@grpc/grpc-js` / `google.golang.org/grpc` | Synchronous high-throughput inter-service RPC |
| **Containerization** | **Docker** | Multi-Stage Alpine Builds | — | OCI compliant container images |
| **Orchestration** | **Kubernetes (K8s)**| Namespaced Manifests (`k8s/`) | — | Ingress-NGINX, Horizontal Pod Autoscalers (HPA) |
| **CI/CD Pipeline** | **GitHub Actions**| Automated CI/CD (`.github/`) | — | Build, Vet, Test, Container Push, Cluster Rollout |

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

    subgraph NestServices["NestJS Microservices (Business Domain)"]
        AuthSvc["Auth Service\n(NestJS + Prisma) :8001"]
        UserSvc["Guest Management\n(NestJS + Prisma) :8002"]
        HotelSvc["Hotel Catalog\n(NestJS + Mongo) :8003"]
        RoomSvc["Room Inventory\n(NestJS + Mongo) :8004"]
        PaySvc["Payment Service\n(NestJS + Prisma) :8006"]
        EmpSvc["Employee & Dept\n(NestJS + Prisma) :8007"]
        HouseSvc["Housekeeping\n(NestJS + Mongo) :8008"]
        ReviewSvc["Review Service\n(NestJS + Mongo) :8009"]
    end

    subgraph GoServices["High-Performance Go Microservices"]
        BookingSvc["Booking Engine (Go)\n- Distributed Locking (Redlock)\n- 10-Min Hold State Machine\n- Port :8005 / gRPC :50051"]
        NotifSvc["Notification Service (Go)\n- RabbitMQ Event Consumer\n- SMS / Email / Push Worker\n- Port :8010 / gRPC :50052"]
        AnalyticsSvc["Analytics Service (Go)\n- Financial & KPI Aggregation\n- Port :8011"]
    end

    subgraph EventBroker["Async Message Broker (RabbitMQ)"]
        RabbitMQ{{"RabbitMQ Event Bus (:5672)\nTopics: booking.created, payment.succeeded,\nroom.cleaned, notification.dispatch"}}
    end

    subgraph StorageLayer["Data & Persistence Layer"]
        PG[("PostgreSQL 16 Cluster\n- hotel_auth_db\n- hotel_users_db\n- hotel_bookings_db\n- hotel_payments_db\n- hotel_operations_db")]
        Mongo[("MongoDB 7 Replica Set\n- hotel_catalog\n- hotel_housekeeping\n- hotel_reviews")]
        RedisMaster[("Redis 7 In-Memory Cluster\n- Room Distributed Locks\n- 10-Minute Cart Holds (TTL: 600s)\n- Catalog Cache")]
    end

    %% Client flows
    Web --> GW
    AdminApp --> GW

    %% Gateway routes
    GW -->|/api/v1/auth| AuthSvc
    GW -->|/api/v1/users| UserSvc
    GW -->|/api/v1/hotels| HotelSvc
    GW -->|/api/v1/rooms| RoomSvc
    GW -->|/api/v1/bookings| BookingSvc
    GW -->|/api/v1/payments| PaySvc
    GW -->|/api/v1/employees| EmpSvc
    GW -->|/api/v1/housekeeping| HouseSvc
    GW -->|/api/v1/reviews| ReviewSvc
    GW -->|/api/v1/analytics| AnalyticsSvc

    %% gRPC Inter-service
    BookingSvc -.->|gRPC Token Check| AuthSvc
    PaySvc -.->|gRPC Confirm Booking| BookingSvc
    RoomSvc -.->|gRPC Availability Query| BookingSvc

    %% Data Connections
    AuthSvc --> PG
    UserSvc --> PG
    BookingSvc --> PG
    PaySvc --> PG
    EmpSvc --> PG

    HotelSvc --> Mongo
    RoomSvc --> Mongo
    HouseSvc --> Mongo
    ReviewSvc --> Mongo

    HotelSvc --> RedisMaster
    BookingSvc --> RedisMaster

    %% Event Bus Connections
    BookingSvc -->|Publish booking.hold| RabbitMQ
    PaySvc -->|Publish payment.succeeded| RabbitMQ
    HouseSvc -->|Publish room.cleaned| RabbitMQ
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
        Booking->>PG: Check availability & count active overlapping stays
        Booking->>PG: INSERT booking (status: 'PENDING_PAYMENT', expires_at: NOW() + 10m)
        Booking->>Redis: Set 10-Minute Cart Hold (TTL: 600s)
        Booking->>Redis: Release Distributed Lock
        Booking->>Rabbit: Publish event: "booking.held"
        Booking-->>Guest: 201 Created (bookingCode, countdown: 600s, totalPrice)
    end

    Guest->>Pay: POST /api/v1/payments/intent (bookingId, amount)
    Pay-->>Guest: Return Stripe clientSecret
    Guest->>Pay: Submit Payment
    Pay->>PG: Record Payment (status: 'SUCCESS')
    Pay->>Booking: gRPC ConfirmBooking(bookingId, paymentId)
    Booking->>PG: UPDATE booking SET status = 'CONFIRMED'
    Booking->>Redis: Invalidate hold key
    Booking->>Rabbit: Publish event: "booking.confirmed"
    Rabbit-)Notif: Consume "booking.confirmed"
    Notif-)Guest: Send Email & WhatsApp Confirmation Ticket with QR Pass
```

---

## 4. Local Orchestration (Docker Compose)

The environment starts all data stores, message broker, and microservices in isolated containers with a single command:

```bash
# 1. Start databases, RabbitMQ, Redis, and all microservices
npm run services:up

# 2. Check running services
docker compose -f services/docker-compose.yml ps

# 3. Access RabbitMQ Management Dashboard
# URL: http://localhost:15672
# User: hotel_admin | Password: hotel_rabbit_pass

# 4. Stop all services
npm run services:down
```

---

## 5. Kubernetes Production Deployment (`k8s/`)

Deploying to production on AWS EKS, Google GKE, or self-hosted Kubernetes:

```bash
# 1. Create Namespace & ConfigMaps
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml

# 2. Deploy Services, StatefulSets, and Ingress
kubectl apply -f k8s/services-deployments.yaml

# 3. Verify Rollout Status
kubectl rollout status deployment/api-gateway -n hotel-platform
kubectl rollout status deployment/booking-service -n hotel-platform
```

---

## 6. Continuous Integration & Deployment (GitHub Actions)

The `.github/workflows/ci-cd.yml` workflow automatically runs on every push:
1. **Frontend Verification**: TypeScript type-checking (`npm run typecheck`) and production build (`npm run build`).
2. **Go Services Validation**: Go static analysis and testing across `booking-service`, `auth-service`, and `user-service`.
3. **Container Build & Registry Publishing**: Multi-stage OCI Docker images pushed to GitHub Container Registry (`ghcr.io`).
4. **Kubernetes Rolling Update**: Automated zero-downtime cluster rollout via `kubectl apply`.
