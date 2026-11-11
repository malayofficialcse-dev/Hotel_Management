export const ROOM_ROUTES = {
  BASE: "/api/v1/rooms",
  HEALTH: "/api/v1/rooms/health",
  BY_HOTEL: "/api/v1/rooms/hotel/:hotelId",
  BY_ID: "/api/v1/rooms/:id",
  CHECK_AVAILABILITY: "/api/v1/rooms/:id/availability",
  CREATE: "/api/v1/rooms",
  UPDATE: "/api/v1/rooms/:id",
  DELETE: "/api/v1/rooms/:id",
} as const;

export type RoomRoutes = typeof ROOM_ROUTES;

