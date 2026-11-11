import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "8008", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/hotel_housekeeping",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://hotel_admin:hotel_rabbit_pass@localhost:5672",
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:8001",
};

