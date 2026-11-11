import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "8003", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/hotel_catalog",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:8001",
};

