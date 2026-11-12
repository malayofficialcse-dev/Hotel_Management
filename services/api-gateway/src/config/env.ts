import * as dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '8000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'hotel-jwt-secret-key-2026',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:8002',
  HOTEL_SERVICE_URL: process.env.HOTEL_SERVICE_URL || 'http://localhost:8003',
  ROOM_SERVICE_URL: process.env.ROOM_SERVICE_URL || 'http://localhost:8004',
  BOOKING_SERVICE_URL: process.env.BOOKING_SERVICE_URL || 'http://localhost:8005',
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8006',
  EMPLOYEE_SERVICE_URL: process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:8007',
  DEPARTMENT_SERVICE_URL: process.env.DEPARTMENT_SERVICE_URL || 'http://localhost:8012',
  HOUSEKEEPING_SERVICE_URL: process.env.HOUSEKEEPING_SERVICE_URL || 'http://localhost:8008',
  REVIEW_SERVICE_URL: process.env.REVIEW_SERVICE_URL || 'http://localhost:8009',
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8010',
  ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8011',

  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:8002',
    hotel: process.env.HOTEL_SERVICE_URL || 'http://localhost:8003',
    room: process.env.ROOM_SERVICE_URL || 'http://localhost:8004',
    booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:8005',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8006',
    employee: process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:8007',
    department: process.env.DEPARTMENT_SERVICE_URL || 'http://localhost:8012',
    housekeeping: process.env.HOUSEKEEPING_SERVICE_URL || 'http://localhost:8008',
    review: process.env.REVIEW_SERVICE_URL || 'http://localhost:8009',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8010',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8011',
  },

  cors: {
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  },

  rateLimit: {
    general: {
      windowMs: 15 * 60 * 1000,
      max: 1000,
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 50,
    },
  },
};
