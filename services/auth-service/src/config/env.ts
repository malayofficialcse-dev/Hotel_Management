import dotenv from "dotenv";
// In local development, use this service's .env even if the parent shell has
// a stale DATABASE_URL set. Production continues to use its injected secrets.
dotenv.config({ override: process.env.NODE_ENV !== "production" });

export const env = {
  PORT: parseInt(process.env.PORT || "8001", 10),
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "hotel-jwt-access-secret-2026",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "hotel-jwt-refresh-secret-2026",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:8002",
};

