export const AUTH_ROUTES = {
  BASE: "/api/v1/auth",
  HEALTH: "/api/v1/auth/health",
  REGISTER: "/api/v1/auth/register",
  LOGIN: "/api/v1/auth/login",
  REFRESH: "/api/v1/auth/refresh",
  VALIDATE: "/api/v1/auth/validate",
  LOGOUT: "/api/v1/auth/logout",
} as const;

export type AuthRoutes = typeof AUTH_ROUTES;

