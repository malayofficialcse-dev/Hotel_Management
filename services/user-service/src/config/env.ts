import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "8002", 10),
  DATABASE_URL: process.env.DATABASE_URL || "",
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:8001",
};

