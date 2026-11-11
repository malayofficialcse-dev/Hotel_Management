import * as dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '8009', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel_reviews',
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
  BOOKING_SERVICE_URL: process.env.BOOKING_SERVICE_URL || 'http://localhost:8005',
};
