export const USER_ROUTES = {
  BASE: "/api/v1/users",
  HEALTH: "/api/v1/users/health",
  PROFILE: "/api/v1/users/me",
  UPDATE_PROFILE: "/api/v1/users/me",
  WISHLIST: "/api/v1/users/me/wishlist",
  ADD_WISHLIST: "/api/v1/users/me/wishlist",
  REMOVE_WISHLIST: "/api/v1/users/me/wishlist/:hotelId",
  PREFERENCES: "/api/v1/users/me/preferences",
} as const;

export type UserRoutes = typeof USER_ROUTES;

