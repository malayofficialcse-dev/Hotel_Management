export const HOTEL_ROUTES = {
  BASE: "/api/v1/hotels",
  HEALTH: "/api/v1/hotels/health",
  GET_ALL: "/api/v1/hotels",
  GET_BY_SLUG: "/api/v1/hotels/:slug",
  CREATE: "/api/v1/hotels",
  UPDATE: "/api/v1/hotels/:id",
  DELETE: "/api/v1/hotels/:id",
} as const;

export type HotelRoutes = typeof HOTEL_ROUTES;

