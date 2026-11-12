import { Hotel } from "./data";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

export interface HoldRoomPayload {
  hotelId: string; hotelName: string; roomTypeId: string; roomTypeName: string;
  checkInDate: string; checkOutDate: string; guestsCount: number; roomCount: number;
  guestFirstName: string; guestLastName: string;
  guestEmail: string; guestPhone: string; specialRequests?: string;
}
export interface HoldRoomResponse { bookingId: string; bookingCode: string; expiresAt: string; holdSeconds: number; totalPrice: number; }

export interface AdminHotel {
  _id: string;
  slug: string;
  name: string;
  city: string;
  location: string;
  mainImage?: string;
  basePrice: number;
  rating: number;
  reviewsCount: number;
  tag?: string;
  offer?: string;
  category: string;
  amenities?: string[];
  description?: string;
  isActive: boolean;
}

export interface AdminRoom {
  _id: string;
  hotelId: string;
  name: string;
  price: number;
  capacity: number;
  totalInventory: number;
  bedType?: string;
  isActive: boolean;
}

export interface AdminDepartment {
  _id: string;
  hotelId: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface AdminEmployee {
  id: string;
  departmentId: string;
  name: string;
  email: string;
  position: string;
  isActive: boolean;
  department?: { id?: string; _id?: string; name: string } | null;
}

export interface HousekeepingTask {
  _id: string;
  hotelId: string;
  roomNumber: string;
  status: string;
  assignedTo?: string;
  taskType?: string;
  priority?: string;
}

export interface AdminBooking {
  id: string;
  booking_code: string;
  hotel_id: string;
  hotel_name: string;
  room_type_id: string;
  room_type_name: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  created_at: string;
}

export interface AdminOffer {
  _id: string;
  code: string;
  name: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

export interface PublicRoom {
  id: string;
  name: string;
  beds: string;
  detail: string;
  inclusions: string;
  price: number;
  image: string;
  capacity: number;
  totalInventory: number;
}

function getToken() { return typeof window === "undefined" ? undefined : window.localStorage.getItem("stayease-token") || undefined; }

function toPublicHotel(hotel: AdminHotel): Hotel {
  const categories: Hotel["category"][] = [
    "Boutique hotels",
    "Beach resorts",
    "Heritage stays",
    "City hotels",
    "Villas & retreats",
  ];
  return {
    id: hotel.slug || hotel._id,
    name: hotel.name,
    city: hotel.city,
    location: hotel.location,
    image: hotel.mainImage || "",
    price: hotel.basePrice,
    rating: String(hotel.rating),
    reviews: hotel.reviewsCount,
    tag: hotel.tag || "",
    features: hotel.amenities || [],
    offer: hotel.offer || "",
    category: categories.includes(hotel.category as Hotel["category"])
      ? (hotel.category as Hotel["category"])
      : "Boutique hotels",
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers); headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const accessToken = getToken(); if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as { data?: T; message?: string } & T;
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
  return (body.data === undefined ? body : body.data) as T;
}

export const api = {
  async register(data: { email: string; password: string; name: string; phone?: string }) { const result = await request<{ user: unknown; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(data) }); if (typeof window !== "undefined" && result.token) window.localStorage.setItem("stayease-token", result.token); return result; },
  async login(data: { email: string; password: string }) { const result = await request<{ user: unknown; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(data) }); if (typeof window !== "undefined" && result.token) window.localStorage.setItem("stayease-token", result.token); return result; },
  logout() { if (typeof window !== "undefined") window.localStorage.removeItem("stayease-token"); },
  async getHotels(filters?: { city?: string; category?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<Hotel[]> { const params = new URLSearchParams(); Object.entries(filters || {}).forEach(([key, value]) => { if (value && value !== "All" && value !== "All Stays") params.set(key, String(value)); }); return (await request<AdminHotel[]>(`/hotels?${params}`)).map(toPublicHotel); },
  async getHotel(identifier: string): Promise<Hotel> { return toPublicHotel(await request<AdminHotel>(`/hotels/${encodeURIComponent(identifier)}`)); },
  getAdminHotels() { return request<AdminHotel[]>("/hotels?includeInactive=true"); },
  createHotel(data: Record<string, unknown>) { return request<AdminHotel>("/hotels", { method: "POST", body: JSON.stringify(data) }); },
  updateHotel(id: string, data: Record<string, unknown>) { return request<AdminHotel>(`/hotels/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }); },
  deleteHotel(id: string) { return request<void>(`/hotels/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  getAdminRooms() { return request<AdminRoom[]>("/rooms?includeInactive=true"); },
  createRoom(data: Record<string, unknown>) { return request<AdminRoom>("/rooms", { method: "POST", body: JSON.stringify(data) }); },
  deleteRoom(id: string) { return request<void>(`/rooms/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  getAdminDepartments() { return request<AdminDepartment[]>("/departments"); },
  createDepartment(data: Record<string, unknown>) { return request<AdminDepartment>("/departments", { method: "POST", body: JSON.stringify(data) }); },
  deleteDepartment(id: string) { return request<void>(`/departments/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  getAdminEmployees() { return request<AdminEmployee[]>("/employees"); },
  createEmployee(data: Record<string, unknown>) { return request<AdminEmployee>("/employees", { method: "POST", body: JSON.stringify(data) }); },
  deleteEmployee(id: string) { return request<void>(`/employees/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  getAdminHousekeepingTasks() { return request<HousekeepingTask[]>("/housekeeping"); },
  createHousekeepingTask(data: Record<string, unknown>) { return request<HousekeepingTask>("/housekeeping", { method: "POST", body: JSON.stringify(data) }); },
  updateHousekeepingTask(id: string, data: Record<string, unknown>) { return request<HousekeepingTask>(`/housekeeping/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }); },
  deleteHousekeepingTask(id: string) { return request<void>(`/housekeeping/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  getAdminReservations() { return request<{ bookings: AdminBooking[]; total: number }>("/bookings/admin"); },
  getAdminOffers() { return request<AdminOffer[]>("/offers?includeInactive=true"); },
  getAdminPayments() { return request<AdminPayment[]>("/payments/admin"); },
  getAdminReviews() { return request<AdminReview[]>("/reviews/admin"); },
  createOffer(data: Record<string, unknown>) { return request<AdminOffer>("/offers", { method: "POST", body: JSON.stringify(data) }); },
  deleteOffer(id: string) { return request<void>(`/offers/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  async getRoomsByHotel(hotelId: string): Promise<PublicRoom[]> {
    const rows = await request<(AdminRoom & { description?: string; amenities?: string[]; roomSize?: string; image?: string })[]>(
      `/rooms/hotel/${encodeURIComponent(hotelId)}`,
    );
    return rows.map((room) => ({
      id: room._id,
      name: room.name,
      beds: `${room.bedType || "Room"} · ${room.capacity} guests${room.roomSize ? ` · ${room.roomSize}` : ""}`,
      detail: room.description || "",
      inclusions: room.amenities?.join(" · ") || "",
      price: room.price,
      image: room.image || "",
      capacity: room.capacity,
      totalInventory: room.totalInventory,
    }));
  },
  checkRoomAvailability(roomId: string, checkIn: string, checkOut: string, count = 1) { const params = new URLSearchParams({ checkIn, checkOut, count: String(count) }); return request<{ isAvailable: boolean; availableInventory: number }>(`/rooms/${encodeURIComponent(roomId)}/availability?${params}`); },
  async holdRoom(payload: HoldRoomPayload) {
    try {
      const result = await request<{
        booking: { id: string; booking_code: string; expires_at: string; total_price: number };
        expires_in_seconds: number;
      }>("/bookings/hold", {
        method: "POST",
        body: JSON.stringify({
          hotel_id: payload.hotelId,
          hotel_name: payload.hotelName,
          room_type_id: payload.roomTypeId,
          room_type_name: payload.roomTypeName,
          check_in_date: payload.checkInDate,
          check_out_date: payload.checkOutDate,
          guests_count: payload.guestsCount,
          room_count: payload.roomCount,
          guest_first_name: payload.guestFirstName,
          guest_last_name: payload.guestLastName,
          guest_email: payload.guestEmail,
          guest_phone: payload.guestPhone,
          special_requests: payload.specialRequests,
        }),
      });
      return {
        success: true as const,
        data: {
          bookingId: result.booking.id,
          bookingCode: result.booking.booking_code,
          expiresAt: result.booking.expires_at,
          holdSeconds: result.expires_in_seconds,
          totalPrice: result.booking.total_price,
        },
      };
    } catch (error) {
      return { success: false as const, message: error instanceof Error ? error.message : "Booking request failed" };
    }
  },
  confirmBooking(bookingId: string) { return request<{ success: boolean }>(`/bookings/${bookingId}/confirm`, { method: "POST" }).then(() => true).catch(() => false); },
  getBookingByCode(code: string) { return request<any>(`/bookings/code/${encodeURIComponent(code)}`); },
  createPaymentIntent(bookingId: string, bookingCode: string, amount: number) { return request<any>("/payments/intent", { method: "POST", body: JSON.stringify({ bookingId, bookingCode, amount }) }); },
  confirmPaymentIntent(paymentId: string) { return request<any>("/payments/confirm", { method: "POST", body: JSON.stringify({ paymentId }) }); },
  getUserProfile(userId = "default-guest") { return request<any>("/users/me", { headers: { "x-user-id": userId } }); },
  updateUserProfile(data: Record<string, unknown>, userId = "default-guest") { return request<any>("/users/me", { method: "PATCH", headers: { "x-user-id": userId }, body: JSON.stringify(data) }); },
  getWishlist(userId = "default-guest") { return request<any[]>("/users/me/wishlist", { headers: { "x-user-id": userId } }); },
  addWishlist(hotelId: string, userId = "default-guest") { return request<any>("/users/me/wishlist", { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify({ hotelId }) }); },
  removeWishlist(hotelId: string, userId = "default-guest") { return request<any>(`/users/me/wishlist/${encodeURIComponent(hotelId)}`, { method: "DELETE", headers: { "x-user-id": userId } }); },
  getHousekeepingTasks(hotelId: string) { return request<any[]>(`/housekeeping/hotel/${hotelId}`); },
  getHotelReviews(hotelId: string) { return request<any[]>(`/reviews/hotel/${hotelId}`); },
  createReview(data: Record<string, unknown>) { return request<any>("/reviews", { method: "POST", body: JSON.stringify(data) }); },
  getEmployees(departmentId?: string) { return request<any[]>(`/employees${departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : ""}`); },
  getDepartments() { return request<any[]>("/departments"); },
  getAnalyticsOverview() { return request<any>("/analytics/overview"); },
};

export interface AdminPayment { id: string; bookingCode: string; amount: number; currency: string; status: string; provider: string; paymentMethod?: string | null; createdAt: string; refunds?: { amount: number; status: string }[]; }
export interface AdminReview { _id: string; hotelId: string; userName: string; rating: number; title?: string; comment: string; isApproved: boolean; isHidden: boolean; createdAt: string; }
