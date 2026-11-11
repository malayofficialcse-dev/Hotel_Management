import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "8001", 10),
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/hotel_auth_db?schema=public",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "hotel-jwt-access-secret-2026",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "hotel-jwt-refresh-secret-2026",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:8002",
};

