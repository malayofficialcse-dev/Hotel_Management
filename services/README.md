# Hotel Management Platform â€” Microservices Architecture
## Production-Grade Polyglot Backend

---

## Service Map

| # | Service | Tech | Port | Database | Responsibility |
|---|---------|------|------|----------|----------------|
| 0 | **API Gateway** | NestJS | 8000 | â€” | Single public entry point, rate limiting, reverse proxy |
| 1 | **Auth Service** | **NestJS + Prisma** | 8001 | PostgreSQL + Redis | Registration, login, JWT access/refresh tokens |
| 2 | **User Service** | **NestJS + Prisma** | 8002 | PostgreSQL | User profiles, wishlist, preferences |
| 3â€“4, 7â€“9, 12 | **Operations Service** | Node.js + Express + Mongoose / Prisma | 8020 | Existing MongoDB databases + PostgreSQL | Hotels, rooms, departments, employees, housekeeping, and reviews |
| 5 | **Booking Service** | Go + Chi | 8005 / 50051 gRPC | PostgreSQL + Redis | Reservations, 10-min hold, double-booking prevention |
| 6 | **Payment Service** | NestJS + Prisma | 8006 | PostgreSQL | Stripe integration, webhooks, refunds |
| 10 | **Notification Service** | Go | 8010 | PostgreSQL / MongoDB | Event notifications |
| 11 | **Analytics Service** | Go | 8011 | PostgreSQL | Portfolio reporting |

---

## Inter-Service Communication Map

```text
API Gateway (:8000)
  /api/v1/auth/**, /api/v1/users/**       -> Auth / User services
  /api/v1/hotels/**, /api/v1/offers/**    -> Operations Service (:8020)
  /api/v1/rooms/**                        -> Operations Service (:8020)
  /api/v1/employees/**                    -> Operations Service (:8020)
  /api/v1/departments/**                  -> Operations Service (:8020)
  /api/v1/housekeeping/**                 -> Operations Service (:8020)
  /api/v1/reviews/**                      -> Operations Service (:8020)
  /api/v1/bookings/**, /api/v1/payments/** -> Booking / Payment services
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

### Cloudinary hotel and room images

Set the Cloudinary API URL in
`services/operations-service/.env`:

```env
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
```

Keep the real API secret in the ignored `.env` files; do not commit or paste it
into chat. Restart both services after setting it. The admin Hotel and Room
forms can upload JPEG, PNG, WebP, or AVIF files up to 8 MB. Hotel uploads set
the cover and gallery image URLs; room uploads set that room type's image URL.
Customer hotel cards, hotel detail pages, and room selection read those URLs
from the operations service, with local fallback images when an image is
not set.

### Seed hotels, rooms, departments, employees, reservations, and payments

With the API Gateway, operations, booking, payment, and authentication services
running, create or reactivate the three sample hotels,
seed their room types, ensure ten standard departments per active hotel, and
insert up to 20 linked employees, reservations, and matching payments. Redis
must also be available to the Booking Service.

```powershell
$env:SEED_AUTH_TOKEN = "<admin-or-staff-access-token>"
npm run seed:departments-employees
```

The access token is used to check existing reservations before creating new
ones. The script reuses existing records, reactivates matching inactive catalog
records, and links each reservation to a hotel and room type. Each payment is
associated with its reservation and confirmed through the Payment Service.
Access tokens expire after 15 minutes, so sign in immediately before running
the seed command.
These are sample guest/payment records for development; payment intents use the
service's mock payment flow and do not charge a real card.

Preview without writing by adding `-- --dry-run` (this does not require the
access token). Set `SEED_API_URL` to use a different API Gateway URL.

### Auth Service: missing `public.users` table

The Auth Service loads its local `.env` ahead of stale shell variables and runs
`prisma db push` automatically before `npm run dev`. If you start the compiled
service directly, apply the schema manually from the service directory:

```powershell
cd services/auth-service
npm run prisma:push
```

This creates or updates the `users` and `refresh_tokens` tables. Confirm that
`DATABASE_URL` points to the intended local `hotel_auth_db` before running it.

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
2. In Render dashboard: **New +** â†’ **Blueprint**
3. Select your repository. Render reads [`render.yaml`](./render.yaml) automatically.
4. Set **secret** env vars manually in Render dashboard:
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (Payment Service)
   - `MONGODB_URI` (Review Service â€” use MongoDB Atlas)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (Auth Service)
5. After deploy, copy the API Gateway URL and set it in Vercel:
   - `NEXT_PUBLIC_API_URL=https://hotel-api-gateway.onrender.com/api/v1`

---

## Frontend (Vercel)

```bash
# Development
npm run dev        # http://localhost:3000

# Production build (runs clean with âœ“ 0 TypeScript errors)
npm run build
```

The Next.js app uses `lib/api-client.ts` for backend calls via the API Gateway.
Public hotel browsing requires the Operations Service; operational admin screens show
service errors instead of presenting failed requests as live data.

---

## Folder Structure

```
services/
â”œâ”€â”€ api-gateway/           # NestJS â€” Port 8000
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â”œâ”€â”€ middleware/
â”‚   â”‚   â”œâ”€â”€ proxy/
â”‚   â”‚   â”œâ”€â”€ health/
â”‚   â”‚   â”œâ”€â”€ app.module.ts
â”‚   â”‚   â””â”€â”€ main.ts
â”‚   â””â”€â”€ Dockerfile
â”‚
â”œâ”€â”€ auth-service/          # NestJS + Prisma â€” Port 8001
â”‚   â”œâ”€â”€ config/
â”‚   â”œâ”€â”€ prisma/
â”‚   â”œâ”€â”€ src/
â”‚   â””â”€â”€ Dockerfile
â”‚
â”œâ”€â”€ user-service/          # NestJS + Prisma â€” Port 8002
â”‚   â”œâ”€â”€ prisma/
â”‚   â”œâ”€â”€ src/
â”‚   â””â”€â”€ Dockerfile
â”‚
â”‚
├── operations-service/    # Unified Express API — REST :8020
│   └── src/domains/{hotel,room,department,employee,housekeeping,review}/{config,models,repositories,services,controllers,routes,middleware,utils}
│
â”œâ”€â”€ booking-service/       # Go + Chi â€” HTTP 8005, gRPC 50051
â”‚   â””â”€â”€ [same structure]
â”‚
â”œâ”€â”€ payment-service/       # NestJS + Prisma â€” Port 8006
â”‚   â”œâ”€â”€ prisma/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â”œâ”€â”€ models/
â”‚   â”‚   â”œâ”€â”€ repository/
â”‚   â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ controllers/
â”‚   â”‚   â”œâ”€â”€ middleware/
â”‚   â”‚   â””â”€â”€ modules/
â”‚   â””â”€â”€ Dockerfile
â”‚
â”‚
â”‚
â”œâ”€â”€ infra/
â”‚   â””â”€â”€ init-databases.sql # Creates all 6 PostgreSQL databases
â”œâ”€â”€ ../proto/              # Shared gRPC contracts
â”œâ”€â”€ docker-compose.yml
â””â”€â”€ render.yaml
```
