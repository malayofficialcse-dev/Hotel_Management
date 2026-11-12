export const GATEWAY_ROUTES = {
  HEALTH: "/health",
  AUTH: "/api/v1/auth",
  USERS: "/api/v1/users",
  HOTELS: "/api/v1/hotels",
  ROOMS: "/api/v1/rooms",
  BOOKINGS: "/api/v1/bookings",
  PAYMENTS: "/api/v1/payments",
  EMPLOYEES: "/api/v1/employees",
  DEPARTMENTS: "/api/v1/departments",
  HOUSEKEEPING: "/api/v1/housekeeping",
  REVIEWS: "/api/v1/reviews",
  NOTIFICATIONS: "/api/v1/notifications",
  ANALYTICS: "/api/v1/analytics",
} as const;

export type GatewayRoutes = typeof GATEWAY_ROUTES;

