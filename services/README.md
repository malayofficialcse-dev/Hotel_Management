# Hotel Management Platform — Microservices Architecture
## Production-Grade Polyglot Backend

---

## Service Map

| # | Service | Tech | Port | Database | Responsibility |
|---|---------|------|------|----------|----------------|
| 0 | **API Gateway** | NestJS | 8000 | — | Single public entry point, rate limiting, reverse proxy |
| 1 | **Auth Service** | **Go + Chi** | 8001 | PostgreSQL + Redis | Registration, login, JWT access/refresh tokens |
| 2 | **User Service** | **Go + Chi** | 8002 | PostgreSQL | User profiles, wishlist, preferences |
| 3 | **Hotel & Room Service** | **Go + Chi** | 8003 | PostgreSQL + Redis | Hotel catalog, search, room types, availability |
| 4 | **Booking Service** | **Go + Chi** | 8004 | PostgreSQL + Redis | Reservations, 10-min hold, double-booking prevention |
| 5 | **Payment Service** | NestJS + Prisma | 8005 | PostgreSQL | Stripe integration, webhooks, refunds |
| 6 | **Review Service** | NestJS + Mongoose | 8006 | MongoDB | Guest reviews, ratings, moderation |
| 7 | **Department Service** | NestJS + Prisma | 8007 | PostgreSQL | Staff, departments, tasks, schedules |

---

## Inter-Service Communication Map

```
API Gateway (8000)
│
├── POST /api/v1/auth/**        → Auth Service (8001)
├── GET/PATCH /api/v1/users/**  → User Service (8002) [validates via Auth: 8001]
├── GET /api/v1/hotels/**       → Hotel & Room Service (8003)
├── GET /api/v1/rooms/**        → Hotel & Room Service (8003) [availability via Booking: 8004]
├── POST /api/v1/bookings/**    → Booking Service (8004) [inventory via Hotel: 8003]
├── POST /api/v1/payments/**    → Payment Service (8005) [confirms booking via: 8004]
├── GET/POST /api/v1/reviews/** → Review Service (8006) [verifies booking via: 8004]
└── /api/v1/departments/**      → Department Service (8007) [validates via Auth: 8001]
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

The Next.js app uses `lib/api-client.ts` for all backend calls via the API Gateway, with graceful fallback to local mock data if services are offline.

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
├── auth-service/          # Go + Chi — Port 8001
│   ├── config/
│   ├── models/
│   ├── repository/
│   ├── services/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── main.go
│   ├── go.mod
│   └── Dockerfile
│
├── user-service/          # Go + Chi — Port 8002
│   └── [same structure as auth-service]
│
├── hotel-room-service/    # Go + Chi — Port 8003
│   └── [same structure]
│
├── booking-service/       # Go + Chi — Port 8004
│   └── [same structure]
│
├── payment-service/       # NestJS + Prisma — Port 8005
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
├── review-service/        # NestJS + Mongoose — Port 8006
│   └── [NestJS structure]
│
├── department-service/    # NestJS + Prisma — Port 8007
│   └── [NestJS structure]
│
├── infra/
│   └── init-databases.sql # Creates all 6 PostgreSQL databases
├── docker-compose.yml
└── render.yaml
```
