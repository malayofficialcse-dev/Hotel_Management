export const HOUSEKEEPING_ROUTES = {
  BASE: "/api/v1/housekeeping",
  HEALTH: "/api/v1/housekeeping/health",
  BY_HOTEL: "/api/v1/housekeeping/hotel/:hotelId",
  UPDATE_STATUS: "/api/v1/housekeeping/:id/status",
  CREATE: "/api/v1/housekeeping",
  INSPECT: "/api/v1/housekeeping/:id/inspect",
} as const;

export type HousekeepingRoutes = typeof HOUSEKEEPING_ROUTES;

