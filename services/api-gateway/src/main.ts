import { ServerResponse } from "node:http";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { GATEWAY_ROUTES } from "./routes/gateway.routes.js";

const proxyRoutes = [
  { route: GATEWAY_ROUTES.AUTH, target: env.AUTH_SERVICE_URL },
  { route: GATEWAY_ROUTES.USERS, target: env.USER_SERVICE_URL },
  { route: GATEWAY_ROUTES.HOTELS, target: env.HOTEL_SERVICE_URL },
  { route: GATEWAY_ROUTES.ROOMS, target: env.ROOM_SERVICE_URL },
  { route: GATEWAY_ROUTES.BOOKINGS, target: env.BOOKING_SERVICE_URL },
  { route: GATEWAY_ROUTES.PAYMENTS, target: env.PAYMENT_SERVICE_URL },
  { route: GATEWAY_ROUTES.EMPLOYEES, target: env.EMPLOYEE_SERVICE_URL },
  { route: GATEWAY_ROUTES.DEPARTMENTS, target: env.DEPARTMENT_SERVICE_URL },
  { route: GATEWAY_ROUTES.HOUSEKEEPING, target: env.HOUSEKEEPING_SERVICE_URL },
  { route: GATEWAY_ROUTES.REVIEWS, target: env.REVIEW_SERVICE_URL },
  { route: GATEWAY_ROUTES.NOTIFICATIONS, target: env.NOTIFICATION_SERVICE_URL },
  { route: GATEWAY_ROUTES.ANALYTICS, target: env.ANALYTICS_SERVICE_URL },
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: env.CLIENT_URL,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    rateLimit({
      windowMs: env.rateLimit.general.windowMs,
      max: env.rateLimit.general.max,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  for (const { route, target } of proxyRoutes) {
    const baseTarget = target.replace(/\/$/, "");
    app.use(
      route,
      createProxyMiddleware({
        target: `${baseTarget}${route}`,
        changeOrigin: true,
        on: {
          proxyReq: fixRequestBody,
          error: (error, _request, response) => {
            const service = route.split("/").pop() || "upstream";
            console.error(`[API Gateway] ${service} proxy failed`, error.message);
            if (!(response instanceof ServerResponse) || response.headersSent) return;
            response.writeHead(503, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ message: `${service} service unavailable` }));
          },
        },
      }),
    );
  }

  await app.listen(env.PORT);
  console.log(`[API Gateway] NestJS gateway listening on port ${env.PORT}`);
}

bootstrap().catch((error) => {
  console.error("[API Gateway] startup failed", error);
  process.exitCode = 1;
});
