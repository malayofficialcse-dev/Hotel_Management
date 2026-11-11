export const PAYMENT_ROUTES = {
  BASE: "/api/v1/payments",
  HEALTH: "/api/v1/payments/health",
  INTENT: "/api/v1/payments/intent",
  CONFIRM: "/api/v1/payments/confirm",
  WEBHOOK: "/api/v1/payments/webhook",
  REFUND: "/api/v1/payments/refund",
  BY_BOOKING: "/api/v1/payments/booking/:bookingId",
} as const;

export type PaymentRoutes = typeof PAYMENT_ROUTES;

