export const REVIEW_ROUTES = {
  BASE: "/api/v1/reviews",
  HEALTH: "/api/v1/reviews/health",
  BY_HOTEL: "/api/v1/reviews/hotel/:hotelId",
  HOTEL_STATS: "/api/v1/reviews/hotel/:hotelId/stats",
  CREATE: "/api/v1/reviews",
  MARK_HELPFUL: "/api/v1/reviews/:id/helpful",
  MODERATE: "/api/v1/reviews/:id/moderate",
} as const;

export type ReviewRoutes = typeof REVIEW_ROUTES;

