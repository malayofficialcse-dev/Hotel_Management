# Hotel Management Platform â€” Microservices Architecture
## Production-Grade Polyglot Backend

## AI Concierge

The AI Service runs on port `8013`. It refreshes its hotel search catalog from
active records at `HOTEL_SERVICE_URL/api/v1/hotels` on startup and every five
minutes, then updates the local vector index and Pinecone when configured. If
the Operations Service is unavailable, the bundled catalog remains as a local
fallback; check `/api/v1/ai/health` and `liveCatalogSynced` to distinguish live
data from fallback data. `POST /api/v1/ai/sync-vectors` forces a refresh.

Set `HOTEL_SERVICE_URL` and `HOUSEKEEPING_SERVICE_URL` to the Operations Service
base URL, `GEMINI_API_KEY` for Gemini generation and embeddings, and
`PINECONE_API_KEY`, `PINECONE_HOST`, and `PINECONE_INDEX` for cloud vector
storage. The local semantic encoder remains available without Gemini. Room
service requests require an active booking context and a room number; the
concierge confirms the request only after Operations Service saves the task.

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

## Booking and Payment: Docker Compose

The booking and payment services have separate Docker images. To run them
together with the PostgreSQL databases they need, plus Redis and RabbitMQ, run
these commands from the repository root in PowerShell:

```powershell
docker compose -f services/docker-compose.booking-payment.yml up --build -d
docker compose -f services/docker-compose.booking-payment.yml ps
docker compose -f services/docker-compose.booking-payment.yml logs -f booking-service payment-service
```

The first startup initializes `hotel_bookings_db` and `hotel_payments_db` using
`services/infra/init-databases.sql`. Wait for both app containers to be running,
then check their health endpoints:

```powershell
Invoke-RestMethod http://localhost:8005/health
Invoke-RestMethod http://localhost:8006/api/v1/payments/health
```

The services are published on ports 8005 and 8006. PostgreSQL is published on
55432, Redis on 16379, and RabbitMQ on 5673 (management UI: 15673). The local
Compose file uses development-only credentials; replace them before sharing
this setup. Booking calls the auth and operations services on the Windows host
at ports 8001 and 8020. Those services must be running for authenticated booking
and room availability flows. Stop the stack with:

```powershell
docker compose -f services/docker-compose.booking-payment.yml down
```

This preserves the local database volume. To erase the local database and start
from scratch, run `docker compose -f services/docker-compose.booking-payment.yml down -v`.

## Build and deploy the two images to Kubernetes

The focused Kubernetes resources are in `k8s/booking-payment.yaml`. They create
two replicas each and internal `ClusterIP` services. PostgreSQL, Redis,
RabbitMQ, the auth service, and the hotel/room operations service are expected
to be reachable already; this manifest does not create stateful databases.
Provision the booking and payment schemas first using
`services/booking-service/sql/schema.sql` and
`services/payment-service/sql/schema.sql` if your database provider has not
already applied them. Keep the two `DATABASE_URL`s pointed at their respective
databases. URL-encode reserved characters in database passwords.

### Quick local deployment on Docker Desktop Kubernetes

For a local demo, `k8s/local-infra.yaml` also creates PostgreSQL, Redis, and
RabbitMQ. From **Command Prompt** at the repository root, build the two images
into Docker Desktop's local image store:

```cmd
docker build -t hotel-booking-service:local -f services/booking-service/Dockerfile services/booking-service
docker build -t hotel-payment-service:local -f services/payment-service/Dockerfile services/payment-service
```

Create the namespace and ConfigMap for PostgreSQL's existing database bootstrap
script, then start the local dependencies:

```cmd
kubectl apply -f k8s/namespace.yaml
kubectl create configmap postgres-init --from-file=01-init-databases.sql=services/infra/init-databases.sql --namespace hotel-platform --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f k8s/local-infra.yaml
kubectl wait --for=condition=Available deployment/postgres deployment/redis deployment/rabbitmq --namespace hotel-platform --timeout=180s
```

Create a local-only Secret with URLs that use Kubernetes service DNS names:

```cmd
kubectl create secret generic booking-payment-secrets --namespace hotel-platform --from-literal=BOOKING_DATABASE_URL=postgres://hotel:local_only_change_me@postgres:5432/hotel_bookings_db?sslmode=disable --from-literal=PAYMENT_DATABASE_URL=postgres://hotel:local_only_change_me@postgres:5432/hotel_payments_db?sslmode=disable --from-literal=REDIS_URL=redis://redis:6379 --from-literal=RABBITMQ_URL=amqp://hotel_local:local_only_change_me@rabbitmq:5672 --from-literal=AUTH_SERVICE_URL=http://auth-service:8001 --from-literal=HOTEL_SERVICE_URL=http://operations-service:8020 --from-literal=STRIPE_SECRET_KEY=sk_test_local_dummy --from-literal=STRIPE_WEBHOOK_SECRET=whsec_local_dummy --dry-run=client -o yaml | kubectl apply -f -
```

The dummy credentials are for this local demo only. Deploy booking and payment,
then check their rollout and pod states:

```cmd
kubectl apply -f k8s/booking-payment.yaml
kubectl rollout status deployment/booking-service --namespace hotel-platform --timeout=180s
kubectl rollout status deployment/payment-service --namespace hotel-platform --timeout=180s
kubectl get deployments,services,pods -n hotel-platform -o wide
```

The `hotel-platform` pods are the Kubernetes workloads. To call their health
endpoints without changing your Compose containers' ports, run each command in
a separate Command Prompt window:

```cmd
kubectl port-forward -n hotel-platform service/booking-service 18005:8005
```

```cmd
kubectl port-forward -n hotel-platform service/payment-service 18006:8006
```

In a third window, check the responses:

```cmd
curl.exe http://localhost:18005/health
curl.exe http://localhost:18006/api/v1/payments/health
```

To inspect a failing pod, use `kubectl get pods -n hotel-platform` to find its
name, then run `kubectl logs -n hotel-platform POD_NAME` or
`kubectl describe pod -n hotel-platform POD_NAME`. The auth and operations
services are not included in this local demo; booking health should work, but
authenticated booking and room availability require those services too. The
payment code currently returns mock intents, so this setup does not process real
payments. The local images are referenced directly by the manifests; for a
remote cluster, push them to a registry and update the image names.

Build and push from the repository root. Substitute a registry/repository that
your Kubernetes nodes can pull from:

```powershell
$env:REGISTRY = "ghcr.io/YOUR_GITHUB_USER"
$env:TAG = "booking-payment-v1"
docker login ghcr.io
docker build -t "$env:REGISTRY/hotel-booking-service:$env:TAG" -f services/booking-service/Dockerfile services/booking-service
docker build -t "$env:REGISTRY/hotel-payment-service:$env:TAG" -f services/payment-service/Dockerfile services/payment-service
docker push "$env:REGISTRY/hotel-booking-service:$env:TAG"
docker push "$env:REGISTRY/hotel-payment-service:$env:TAG"
```

Create the namespace and a local, ignored environment file for Kubernetes
credentials. Edit the copied file with the real database, Redis, RabbitMQ,
auth/operations URLs and Stripe values; do not commit it:

```powershell
kubectl apply -f k8s/namespace.yaml
Copy-Item k8s/booking-payment-secrets.example k8s/booking-payment-secrets.env
notepad k8s/booking-payment-secrets.env
kubectl create secret generic booking-payment-secrets --namespace hotel-platform --from-env-file=k8s/booking-payment-secrets.env --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f k8s/booking-payment.yaml
kubectl set image deployment/booking-service booking-service="$env:REGISTRY/hotel-booking-service:$env:TAG" -n hotel-platform
kubectl set image deployment/payment-service payment-service="$env:REGISTRY/hotel-payment-service:$env:TAG" -n hotel-platform
kubectl rollout status deployment/booking-service -n hotel-platform
kubectl rollout status deployment/payment-service -n hotel-platform
```

The sample Secret file contains placeholders and must be edited before applying.
If the image repository is private, configure an `imagePullSecret` for the
namespace. For a local cluster such as minikube, you can instead build/load the
images into that cluster and set the two deployment images to those local image
tags. These services stay internal to Kubernetes; reach them temporarily for
checks with:

```powershell
kubectl port-forward -n hotel-platform service/booking-service 8005:8005
kubectl port-forward -n hotel-platform service/payment-service 8006:8006
```

Run each port-forward command in its own terminal, then call the same health
URLs at `localhost`. In the full app, route traffic
through the API Gateway and its Ingress; do not expose the service pods directly
to the public internet. View logs with
`kubectl logs -n hotel-platform deployment/booking-service` and
`kubectl logs -n hotel-platform deployment/payment-service`.

Deployment packages the current application behavior as-is. In particular,
`PaymentService.createIntent()` currently creates a mock payment intent, and
the controller confirmation endpoint is not a substitute for a verified Stripe
webhook. Configure Stripe credentials and implement/verify the real payment
flow before accepting real payments. Also, booking currently serves HTTP only;
the configured gRPC port is not started by `main.go` and is intentionally not
exposed by these manifests.

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
