import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "8006", 10),
  DATABASE_URL: process.env.DATABASE_URL || "",
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:8001",
  BOOKING_SERVICE_URL: process.env.BOOKING_SERVICE_URL || "http://localhost:8005",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://hotel_admin:hotel_rabbit_pass@localhost:5672",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};
