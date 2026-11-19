import * as dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '8000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'hotel-jwt-secret-key-2026',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:8002',
  OPERATIONS_SERVICE_URL: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
  HOTEL_SERVICE_URL: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
  ROOM_SERVICE_URL: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
  BOOKING_SERVICE_URL: process.env.BOOKING_SERVICE_URL || 'http://localhost:8005',
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8006',
  EMPLOYEE_SERVICE_URL: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
  DEPARTMENT_SERVICE_URL: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
  HOUSEKEEPING_SERVICE_URL: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
  REVIEW_SERVICE_URL: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8010',
  ANALYTICS_SERVICE_URL: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8011',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8013',

  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:8002',
    hotel: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
    room: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
    booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:8005',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8006',
    employee: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
    department: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
    housekeeping: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
    review: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:8020',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8010',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8011',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:8013',
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
