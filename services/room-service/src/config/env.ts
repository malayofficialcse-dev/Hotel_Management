import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "8004", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/hotel_catalog",
  BOOKING_SERVICE_URL: process.env.BOOKING_SERVICE_URL || "http://localhost:8005",
};

