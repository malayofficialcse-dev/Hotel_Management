import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  app.use(helmet({ crossOriginResourcePolicy: false }));

  // Global rate limiter
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // 1. Auth Service (:8001)
  app.use(
    "/api/v1/auth",
    createProxyMiddleware({
      target: env.AUTH_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/v1/auth": "/api/v1/auth" },
    })
  );

  // 2. Guest / User Service (:8002)
  app.use(
    "/api/v1/users",
    createProxyMiddleware({
      target: env.USER_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/v1/users": "/api/v1/users" },
    })
  );

  // 3. Hotel Catalog Service (:8003)
  app.use(
    "/api/v1/hotels",
    createProxyMiddleware({
      target: env.HOTEL_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/v1/hotels": "/api/v1/hotels" },
    })
  );

  // 4. Room Management Service (:8004)
  app.use(
    "/api/v1/rooms",
    createProxyMiddleware({
      target: env.ROOM_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/v1/rooms": "/api/v1/rooms" },
    })
  );

  // 5. Booking Engine Service (Go :8005)
  app.use(
    "/api/v1/bookings",
    createProxyMiddleware({
      target: env.BOOKING_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/v1/bookings": "/api/v1/bookings" },
    })
  );

  // 6. Payment Service (:8006)
  app.use(
    "/api/v1/payments",
    createProxyMiddleware({
      target: env.PAYMENT_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/v1/payments": "/api/v1/payments" },
    })
  );

  // 7. Employee & Department Service (:8007)
  app.use(
    "/api/v1/employees",
    createProxyMiddleware({
      target: env.EMPLOYEE_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/v1/employees": "/api/v1/employees" },
    })
  );

  // 8. Housekeeping Service (:8008)
  app.use(
    "/api/v1/housekeeping",
    createProxyMiddleware({
      target: env.HOUSEKEEPING_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/v1/housekeeping": "/api/v1/housekeeping" },
    })
  );

  // 9. Review Service (:8009)
  app.use(
    "/api/v1/reviews",
    createProxyMiddleware({
      target: env.REVIEW_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/v1/reviews": "/api/v1/reviews" },
    })
  );

  // 10. Notification Service (Go :8010)
  app.use(
    "/api/v1/notifications",
    createProxyMiddleware({
      target: env.NOTIFICATION_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/v1/notifications": "/api/v1/notifications" },
    })
  );

  // 11. Analytics Service (Go :8011)
  app.use(
    "/api/v1/analytics",
    createProxyMiddleware({
      target: env.ANALYTICS_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: { "^/api/v1/analytics": "/api/v1/analytics" },
    })
  );

  const port = env.PORT || 8000;
  await app.listen(port);
  console.log(`🚀 [API Gateway] Unified NestJS Router listening on port ${port}`);
}
bootstrap();

