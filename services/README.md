# Hotel Management Platform — Microservices Architecture
## Production-Grade Polyglot Backend

---

## Service Map

| # | Service | Tech | Port | Database | Responsibility |
|---|---------|------|------|----------|----------------|
| 0 | **API Gateway** | NestJS | 8000 | — | Single public entry point, rate limiting, reverse proxy |
| 1 | **Auth Service** | **NestJS + Prisma** | 8001 | PostgreSQL + Redis | Registration, login, JWT access/refresh tokens |
| 2 | **User Service** | **NestJS + Prisma** | 8002 | PostgreSQL | User profiles, wishlist, preferences |
| 3 | **Hotel Service** | Node.js + Express + Mongoose | 8003 / 50053 gRPC | MongoDB | Hotel catalog, search, and property management |
| 4 | **Room Service** | Node.js + Express + Mongoose | 8004 / 50054 gRPC | MongoDB | Room types, inventory, and booking-backed availability |
| 5 | **Booking Service** | Go + Chi | 8005 / 50051 gRPC | PostgreSQL + Redis | Reservations, 10-min hold, double-booking prevention |
| 6 | **Payment Service** | NestJS + Prisma | 8006 | PostgreSQL | Stripe integration, webhooks, refunds |
| 7 | **Employee Service** | Node.js + Express + Prisma | 8007 / 50057 gRPC | PostgreSQL | Employee records and department-aware staff directory |
| 8 | **Housekeeping Service** | Node.js + Express + Mongoose | 8008 / 50058 gRPC | MongoDB | Room cleaning tasks, assignment, inspection, and status |
| 9 | **Review Service** | NestJS + Mongoose | 8009 | MongoDB | Guest reviews, ratings, moderation |
| 10 | **Notification Service** | Go | 8010 | PostgreSQL / MongoDB | Event notifications |
| 11 | **Analytics Service** | Go | 8011 | PostgreSQL | Portfolio reporting |
| 12 | **Department Service** | Node.js + Express + Mongoose | 8012 / 50059 gRPC | MongoDB | Property departments and the gRPC directory |

---

## Inter-Service Communication Map

```
API Gateway (8000)
│
├── POST /api/v1/auth/**        → Auth Service (8001)
├── GET/PATCH /api/v1/users/**  → User Service (8002) [validates via Auth: 8001]
├── GET /api/v1/hotels/**       → Hotel & Room Service (8003)
├── GET /api/v1/rooms/**        → Room Service (8004) [availability via Booking: 8005]
├── POST /api/v1/bookings/**    → Booking Service (8005) [inventory via Room: 8004]
├── POST /api/v1/payments/**    → Payment Service (8006) [confirms booking via: 8005]
├── /api/v1/employees/**        → Employee Service (8007) [department lookup via gRPC]
├── /api/v1/housekeeping/**     → Housekeeping Service (8008) [employee validation via gRPC]
└── /api/v1/departments/**      → Department Service (8012) [hotel lookup via gRPC]
```

---

## Local Development on Windows (No Containers)

Start the local PostgreSQL and MongoDB services first. Install Node.js/npm and
Go and make sure they are on `PATH`. Redis and RabbitMQ are optional for startup,
but features that use them will be unavailable until those local services are
running. Each microservice must have a local `.env` configuration pointing to
`localhost`.

Run from the repository root or the `services` directory:

```powershell
.\start-services.ps1
```

The script opens a separate PowerShell window for each service whose runtime is
installed. If Go is missing, it still starts available Node services and lists
the Go services it skipped. Install Go from https://go.dev/dl/, reopen
PowerShell, and run it again to start all services. The script installs missing
Node dependencies locally, loads each service's `.env`, and never creates or
starts Docker images or containers. Close the service windows or run
`.\stop-services.ps1` to stop the managed service processes; local database
services remain running.

Check logs in each service window. The API Gateway is available at
`http://localhost:8000`.

`npm run services:up` and `npm run services:down` are aliases for these
PowerShell scripts.

### PostgreSQL authentication errors

If a service exits with Prisma `P1000` or `password authentication failed`,
PostgreSQL is reachable but the username/password in that service's `.env`
does not match the local PostgreSQL account. Check the credentials first:

```powershell
psql -h localhost -p 5432 -U postgres -d hotel_payments_db -W -c "select 1"
```

Use the password configured for your local PostgreSQL installation in
`services/payment-service/.env`'s `DATABASE_URL`, keeping the existing host,
port, and database name. URL-encode reserved characters in the password (for
example, `@` as `%40`). Apply the same local PostgreSQL credentials to the
other PostgreSQL-backed service `.env` files. Restart the affected service
terminals after saving.

---

## Production Deployment (Render)

1. Push repository to GitHub
2. In Render dashboard: **New +** → **Blueprint**  
3. Select your repository. Render reads [`render.yaml`](./render.yaml) automatically.
4. Set **secret** env vars manually in Render dashboard:
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (Payment Service)
   - `MONGODB_URI` (Review Service — use MongoDB Atlas)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (Auth Service)
5. After deploy, copy the API Gateway URL and set it in Vercel:
   - `NEXT_PUBLIC_API_URL=https://hotel-api-gateway.onrender.com/api/v1`

---

## Frontend (Vercel)

```bash
# Development
npm run dev        # http://localhost:3000

# Production build (runs clean with ✓ 0 TypeScript errors)
npm run build
```

The Next.js app uses `lib/api-client.ts` for backend calls via the API Gateway.
Public hotel browsing requires the hotel catalog API; operational admin screens show
service errors instead of presenting failed requests as live data.

---

## Folder Structure

```
services/
├── api-gateway/           # NestJS — Port 8000
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── proxy/
│   │   ├── health/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── Dockerfile
│
├── auth-service/          # NestJS + Prisma — Port 8001
│   ├── config/
│   ├── prisma/
│   ├── src/
│   └── Dockerfile
│
├── user-service/          # NestJS + Prisma — Port 8002
│   ├── prisma/
│   ├── src/
│   └── Dockerfile
│
├── hotel-service/         # Express + Mongoose — REST 8003, gRPC 50053
│   └── src/{config,models,repositories,services,controllers,routes,grpc}
├── room-service/          # Express + Mongoose — REST 8004, gRPC 50054
│   └── src/{config,models,repositories,services,controllers,routes,grpc}
│
├── booking-service/       # Go + Chi — HTTP 8005, gRPC 50051
│   └── [same structure]
│
├── payment-service/       # NestJS + Prisma — Port 8006
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── repository/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── modules/
│   └── Dockerfile
│
├── review-service/        # NestJS + Mongoose — Port 8009
│   └── [NestJS structure]
│
├── employee-service/      # Express + Prisma/PostgreSQL — REST 8007, gRPC 50057
│   └── src/{config,models,repositories,services,controllers,routes,grpc}
├── housekeeping-service/  # Express + Mongoose — REST 8008, gRPC 50058
│   └── src/{config,models,repositories,services,controllers,routes,grpc}
├── department-service/    # Express + Mongoose — REST 8012, gRPC 50059
│   └── src/{config,models,repositories,services,controllers,routes,grpc}
│
├── infra/
│   └── init-databases.sql # Creates all 6 PostgreSQL databases
├── ../proto/              # Shared gRPC contracts
├── docker-compose.yml
└── render.yaml
```
