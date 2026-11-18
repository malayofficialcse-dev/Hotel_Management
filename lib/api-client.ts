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
  galleryImages?: string[];
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
  description?: string;
  amenities?: string[];
  bedType?: string;
  roomSize?: string;
  image?: string;
  isActive: boolean;
}

export interface AdminRoomAvailability {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  totalInventory: number;
  currentlyBooked: number;
  availableInventory: number;
  isAvailable: boolean;
  pricePerNight: number;
}

export interface RoomAvailabilityCalendar {
  roomTypeId: string;
  startDate: string;
  endDate: string;
  totalInventory: number;
  days: Array<{
    date: string;
    bookedInventory: number;
    availableInventory: number;
    isAvailable: boolean;
    status: "AVAILABLE" | "PARTIALLY_BOOKED" | "LIMITED" | "FULL";
  }>;
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
  employeeCode?: string;
  userId?: string;
  hotelId?: string;
  departmentId: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  joiningDate?: string;
  salary?: number | null;
  role?: string;
  permissions?: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }> | null;
  isActive: boolean;
  department?: { id?: string; _id?: string; name: string; hotelId?: string } | null;
}

export interface HousekeepingTask {
  _id: string;
  hotelId: string;
  departmentId?: string;
  departmentName?: string;
  roomNumber: string;
  taskDate?: string;
  scheduledDate?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  bookingReference?: string;
  checkInDate?: string;
  checkOutDate?: string;
  status: string;
  assignedTo?: string;
  taskType?: string;
  priority?: string;
  updatedAt?: string;
  createdAt?: string;
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
  guests_count?: number;
  room_count?: number;
  total_price: number;
  status: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone?: string;
  created_at: string;
}

export interface UserBooking {
  id: string;
  booking_code: string;
  hotel_id: string;
  hotel_name: string;
  room_type_id: string;
  room_type_name: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  guests_count: number;
  room_count: number;
  total_price: number;
  status: string;
  created_at: string;
}

export interface AdminOffer {
  _id: string;
  hotelId?: string;
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

export interface PublicReview {
  _id: string;
  hotelId: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  stayDate?: string;
  verifiedBooking?: boolean;
  helpfulCount?: number;
  createdAt?: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  hotelId?: string;
  departmentId?: string;
  department?: { id?: string; _id?: string; name?: string; hotelId?: string } | null;
  phone?: string;
  employeeCode?: string;
  permissions?: any;
}

function getToken() { return typeof window === "undefined" ? undefined : window.localStorage.getItem("stayease-token") || undefined; }

let sessionValidation: Promise<boolean | null> | null = null;
let sessionRefresh: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!sessionRefresh) {
    sessionRefresh = (async () => {
      const refreshToken = window.localStorage.getItem("stayease-refresh-token");
      if (!refreshToken) return null;

      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
        });
        if (!response.ok) return null;

        const result = await response.json() as {
          tokens?: { accessToken?: string; refreshToken?: string };
          data?: { tokens?: { accessToken?: string; refreshToken?: string } };
        };
        const tokens = result.tokens || result.data?.tokens;
        if (!tokens?.accessToken || !tokens.refreshToken) return null;

        window.localStorage.setItem("stayease-token", tokens.accessToken);
        window.localStorage.setItem("stayease-refresh-token", tokens.refreshToken);
        return tokens.accessToken;
      } catch {
        return null;
      }
    })().finally(() => {
      sessionRefresh = null;
    });
  }

  return sessionRefresh;
}

function validateCurrentSession(token: string): Promise<boolean | null> {
  if (!sessionValidation) {
    sessionValidation = fetch(`${API_BASE_URL}/auth/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const result = await response.json().catch(() => null) as { valid?: boolean } | null;
        return typeof result?.valid === "boolean" ? result.valid : null;
      })
      .catch(() => null)
      .finally(() => {
        sessionValidation = null;
      });
  }

  return sessionValidation;
}

function getUser(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("stayease-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAdminDataScope() {
  const user = getUser();
  if (!user || user.role === "ADMIN" || user.email?.toLowerCase() === "mala@gmail.com") return null;
  return {
    hotelId: user.hotelId || user.department?.hotelId,
    departmentId: user.departmentId || user.department?.id || user.department?._id,
  };
}

function scopeByHotel<T>(rows: T[], getHotelId: (row: T) => string | undefined): T[] {
  const scope = getAdminDataScope();
  if (!scope) return rows;
  if (!scope.hotelId) return [];
  return rows.filter((row) => getHotelId(row) === scope.hotelId);
}

function scopeByDepartmentOrHotel<T>(
  rows: T[],
  getDepartmentId: (row: T) => string | undefined,
  getHotelId: (row: T) => string | undefined,
): T[] {
  const scope = getAdminDataScope();
  if (!scope) return rows;
  if (scope.departmentId) return rows.filter((row) => getDepartmentId(row) === scope.departmentId);
  if (!scope.hotelId) return [];
  return rows.filter((row) => getHotelId(row) === scope.hotelId);
}

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
    galleryImages: hotel.galleryImages || [],
    price: hotel.basePrice,
    rating: String(hotel.rating),
    reviews: hotel.reviewsCount,
    description: hotel.description || "",
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
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const accessToken = getToken(); if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  let response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
  const authPathsWithoutRefresh = ["/auth/login", "/auth/refresh", "/auth/validate"];
  if (response.status === 401 && accessToken && !authPathsWithoutRefresh.includes(path)) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      headers.set("Authorization", `Bearer ${refreshedToken}`);
      response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
    }
  }

  const body = (await response.json().catch(() => ({}))) as { data?: T; message?: string } & T;
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined" && accessToken && !authPathsWithoutRefresh.includes(path)) {
      const sessionIsValid = await validateCurrentSession(getToken() || accessToken);
      if (sessionIsValid === false) {
        window.localStorage.removeItem("stayease-token");
        window.localStorage.removeItem("stayease-refresh-token");
        window.localStorage.removeItem("stayease-user");
        if (window.location.pathname.startsWith("/admin") && !window.location.pathname.startsWith("/admin/login")) {
          window.location.href = "/admin/login?reason=expired";
        }
      }
    }
    throw new Error(body.message || `Request failed (${response.status})`);
  }
  return (body.data === undefined ? body : body.data) as T;
}

export const api = {
  getToken() { return getToken(); },
  getUser() { return getUser(); },
  async register(data: { email: string; password: string; name: string; phone?: string }) {
    const result = await request<{
      user: UserSession;
      token?: string;
      tokens?: { accessToken: string; refreshToken: string };
    }>("/auth/register", { method: "POST", body: JSON.stringify(data) });
    const token = result.tokens?.accessToken || result.token;
    if (typeof window !== "undefined") {
      if (token) window.localStorage.setItem("stayease-token", token);
      if (result.tokens?.refreshToken) window.localStorage.setItem("stayease-refresh-token", result.tokens.refreshToken);
      if (result.user) window.localStorage.setItem("stayease-user", JSON.stringify(result.user));
    }
    return { ...result, token };
  },
  async login(data: { email: string; password: string }) {
    const result = await request<{
      user: UserSession;
      token?: string;
      tokens?: { accessToken: string; refreshToken: string };
    }>("/auth/login", { method: "POST", body: JSON.stringify(data) });
    const token = result.tokens?.accessToken || result.token;
    if (typeof window !== "undefined") {
      if (token) window.localStorage.setItem("stayease-token", token);
      if (result.tokens?.refreshToken) window.localStorage.setItem("stayease-refresh-token", result.tokens.refreshToken);
      if (result.user) window.localStorage.setItem("stayease-user", JSON.stringify(result.user));
    }
    return { ...result, token };
  },
  logout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("stayease-token");
      window.localStorage.removeItem("stayease-refresh-token");
      window.localStorage.removeItem("stayease-user");
      window.dispatchEvent(new Event("stayease-user-updated"));
    }
  },
  async getProfile(): Promise<UserSession & { phone?: string; createdAt?: string }> {
    const res = await request<{ success: boolean; user: UserSession & { phone?: string; createdAt?: string } }>("/auth/me");
    if (res.user && typeof window !== "undefined") {
      window.localStorage.setItem("stayease-user", JSON.stringify(res.user));
      window.dispatchEvent(new Event("stayease-user-updated"));
    }
    return res.user;
  },
  async updateProfile(data: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }): Promise<UserSession & { phone?: string; createdAt?: string }> {
    const res = await request<{ success: boolean; message: string; user: UserSession & { phone?: string; createdAt?: string } }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (res.user && typeof window !== "undefined") {
      window.localStorage.setItem("stayease-user", JSON.stringify(res.user));
      window.dispatchEvent(new Event("stayease-user-updated"));
    }
    return res.user;
  },
  async getHotels(filters?: { city?: string; category?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<Hotel[]> { const params = new URLSearchParams(); Object.entries(filters || {}).forEach(([key, value]) => { if (value && value !== "All" && value !== "All Stays") params.set(key, String(value)); }); return (await request<AdminHotel[]>(`/hotels?${params}`)).map(toPublicHotel); },
  async getHotel(identifier: string): Promise<Hotel> { return toPublicHotel(await request<AdminHotel>(`/hotels/${encodeURIComponent(identifier)}`)); },
  async getAdminHotels() {
    const rows = await request<AdminHotel[]>("/hotels?includeInactive=true");
    return scopeByHotel(rows, (hotel) => hotel.slug || hotel._id);
  },
  uploadHotelImage(file: File) {
    const form = new FormData();
    form.append("image", file);
    return request<{ url: string; publicId: string }>("/hotels/images", { method: "POST", body: form });
  },
  createHotel(data: Record<string, unknown>) { return request<AdminHotel>("/hotels", { method: "POST", body: JSON.stringify(data) }); },
  updateHotel(id: string, data: Record<string, unknown>) { return request<AdminHotel>(`/hotels/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }); },
  deleteHotel(id: string) { return request<void>(`/hotels/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  async getAdminRooms() {
    const rows = await request<AdminRoom[]>("/rooms?includeInactive=true");
    return scopeByHotel(rows, (room) => room.hotelId);
  },
  getRoomsForHotel(hotelId: string) {
    return request<AdminRoom[]>(`/rooms/hotel/${encodeURIComponent(hotelId)}`);
  },
  getRoomAvailability(id: string, checkIn: string, checkOut: string, count: number) {
    const params = new URLSearchParams({ checkIn, checkOut, count: String(count) });
    return request<AdminRoomAvailability>(`/rooms/${encodeURIComponent(id)}/availability?${params}`);
  },
  getRoomAvailabilityCalendar(roomTypeId: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({ roomTypeId, startDate, endDate });
    return request<RoomAvailabilityCalendar>(`/bookings/availability?${params}`);
  },
  uploadRoomImage(file: File) {
    const form = new FormData();
    form.append("image", file);
    return request<{ url: string; publicId: string }>("/rooms/images", { method: "POST", body: form });
  },
  createRoom(data: Record<string, unknown>) { return request<AdminRoom>("/rooms", { method: "POST", body: JSON.stringify(data) }); },
  updateRoom(id: string, data: Record<string, unknown>) { return request<AdminRoom>(`/rooms/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }); },
  deleteRoom(id: string) { return request<void>(`/rooms/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  async getAdminDepartments() {
    const rows = await request<AdminDepartment[]>("/departments");
    return scopeByDepartmentOrHotel(rows, (department) => department._id, (department) => department.hotelId);
  },
  createDepartment(data: Record<string, unknown>) { return request<AdminDepartment>("/departments", { method: "POST", body: JSON.stringify(data) }); },
  deleteDepartment(id: string) { return request<void>(`/departments/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  async getAdminEmployees() {
    const rows = await request<AdminEmployee[]>("/employees");
    return scopeByDepartmentOrHotel(rows, (employee) => employee.departmentId, (employee) => employee.hotelId || employee.department?.hotelId);
  },
  createEmployee(data: Record<string, unknown>) { return request<AdminEmployee>("/employees", { method: "POST", body: JSON.stringify(data) }); },
  updateEmployee(id: string, data: Record<string, unknown>) { return request<AdminEmployee>(`/employees/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }); },
  deleteEmployee(id: string) { return request<void>(`/employees/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  async getAdminHousekeepingTasks() {
    const rows = await request<HousekeepingTask[]>("/housekeeping");
    return scopeByDepartmentOrHotel(rows, (task) => task.departmentId, (task) => task.hotelId);
  },
  createHousekeepingTask(data: Record<string, unknown>) { return request<HousekeepingTask>("/housekeeping", { method: "POST", body: JSON.stringify(data) }); },
  updateHousekeepingTask(id: string, data: Record<string, unknown>) { return request<HousekeepingTask>(`/housekeeping/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }); },
  deleteHousekeepingTask(id: string) { return request<void>(`/housekeeping/${encodeURIComponent(id)}`, { method: "DELETE" }); },
  async getAdminReservations(params?: { page?: number; limit?: number }) {
    const qs = params && (params.page || params.limit)
      ? `?${new URLSearchParams({
          ...(params.page ? { page: String(params.page) } : {}),
          ...(params.limit ? { limit: String(params.limit) } : {}),
        }).toString()}`
      : "";
    const result = await request<{
      bookings: AdminBooking[];
      total: number;
      page?: number;
      limit?: number;
      total_pages?: number;
    }>(`/bookings/admin${qs}`);
    const bookings = scopeByHotel(result.bookings, (booking) => booking.hotel_id);
    return { ...result, bookings, total: result.total || bookings.length };
  },
  async getAdminOffers() {
    const rows = await request<AdminOffer[]>("/offers?includeInactive=true");
    return scopeByHotel(rows, (offer) => offer.hotelId);
  },
  async getAdminPayments() {
    const rows = await request<AdminPayment[]>("/payments/admin");
    const scope = getAdminDataScope();
    if (!scope) return rows;

    const bookings = await api.getAdminReservations();
    const scopedBookingIds = new Set(
      bookings.bookings
        .flatMap((booking) => [booking.id, booking.booking_code])
        .map((reference) => reference.trim().toLowerCase()),
    );
    return rows.filter((payment) => {
      const paymentHotelId = payment.hotelId || (
        typeof payment.metadata?.hotelId === "string" ? payment.metadata.hotelId : undefined
      );
      return (
        (Boolean(scope.hotelId) && paymentHotelId === scope.hotelId) ||
        scopedBookingIds.has((payment.bookingId || "").trim().toLowerCase()) ||
        scopedBookingIds.has(payment.bookingCode.trim().toLowerCase())
      );
    });
  },
  async getAdminReviews() {
    const rows = await request<AdminReview[]>("/reviews/admin");
    return scopeByHotel(rows, (review) => review.hotelId);
  },
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
  checkRoomAvailability(roomId: string, checkIn: string, checkOut: string, count = 1) { const params = new URLSearchParams({ checkIn, checkOut, count: String(count) }); return request<AdminRoomAvailability>(`/rooms/${encodeURIComponent(roomId)}/availability?${params}`); },
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
  async getBookingByCode(code: string) {
    try {
      const res = await request<any>(`/bookings/code?code=${encodeURIComponent(code)}`);
      return res?.data || res;
    } catch {
      const res = await request<any>(`/bookings/code/${encodeURIComponent(code)}`);
      return res?.data || res;
    }
  },
  getMyBookings() {
    return request<{ bookings: UserBooking[]; total: number }>("/bookings/mine");
  },
  getPaymentByBookingCode(code: string) {
    return request<any>(`/payments/lookup?code=${encodeURIComponent(code)}`);
  },
  createPaymentIntent(bookingId: string, bookingCode: string, amount: number, paymentMethod?: string) {
    return request<any>("/payments/intent", { method: "POST", body: JSON.stringify({ bookingId, bookingCode, amount, paymentMethod }) });
  },
  confirmPaymentIntent(data: string | { paymentId: string; paymentMethod?: string;[key: string]: unknown }) {
    const body = typeof data === "string" ? { paymentId: data } : data;
    return request<{ success: boolean; message: string; payment: any; billNumber?: string; receiptUrl?: string }>("/payments/confirm", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  getUserProfile(userId = "default-guest") { return request<any>("/users/me", { headers: { "x-user-id": userId } }); },
  updateUserProfile(data: Record<string, unknown>, userId = "default-guest") { return request<any>("/users/me", { method: "PATCH", headers: { "x-user-id": userId }, body: JSON.stringify(data) }); },
  getWishlist(userId = "default-guest") { return request<any[]>("/users/me/wishlist", { headers: { "x-user-id": userId } }); },
  addWishlist(hotelId: string, userId = "default-guest") { return request<any>("/users/me/wishlist", { method: "POST", headers: { "x-user-id": userId }, body: JSON.stringify({ hotelId }) }); },
  removeWishlist(hotelId: string, userId = "default-guest") { return request<any>(`/users/me/wishlist/${encodeURIComponent(hotelId)}`, { method: "DELETE", headers: { "x-user-id": userId } }); },
  getHousekeepingTasks(hotelId: string) { return request<any[]>(`/housekeeping/hotel/${hotelId}`); },
  getHotelReviews(hotelId: string) { return request<PublicReview[]>(`/reviews/hotel/${encodeURIComponent(hotelId)}`); },
  createReview(data: Record<string, unknown>) { return request<any>("/reviews", { method: "POST", body: JSON.stringify(data) }); },
  getEmployees(departmentId?: string) { return request<any[]>(`/employees${departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : ""}`); },
  getDepartments() { return request<any[]>("/departments"); },
  async getAnalyticsOverview() {
    const overview = await request<Record<string, unknown>>("/analytics/overview");
    if (!getAdminDataScope()) return overview;
    const hotels = Array.isArray(overview.hotels)
      ? scopeByHotel(overview.hotels as AdminHotel[], (hotel) => hotel.slug || hotel._id)
      : overview.hotels;
    const rooms = Array.isArray(overview.rooms)
      ? scopeByHotel(overview.rooms as AdminRoom[], (room) => room.hotelId)
      : overview.rooms;
    const reservations = Array.isArray(overview.reservations)
      ? scopeByHotel(overview.reservations as AdminBooking[], (booking) => booking.hotel_id)
      : overview.reservations;
    const employees = Array.isArray(overview.employees)
      ? scopeByDepartmentOrHotel(overview.employees as AdminEmployee[], (employee) => employee.departmentId, (employee) => employee.hotelId || employee.department?.hotelId)
      : overview.employees;
    const tasks = Array.isArray(overview.tasks)
      ? scopeByDepartmentOrHotel(overview.tasks as HousekeepingTask[], (task) => task.departmentId, (task) => task.hotelId)
      : overview.tasks;
    return { ...overview, hotels, rooms, reservations, employees, tasks };
  },
};

export interface AdminPayment {
  id: string;
  bookingId?: string;
  hotelId?: string;
  bookingCode: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  paymentMethod?: string | null;
  receiptUrl?: string | null;
  metadata?: {
    billNumber?: string;
    invoiceNumber?: string;
    transactionId?: string;
    guestName?: string;
    hotelName?: string;
    [key: string]: unknown;
  } | null;
  createdAt: string;
  refunds?: { amount: number; status: string }[];
}
export interface AdminReview { _id: string; hotelId: string; userName: string; rating: number; title?: string; comment: string; isApproved: boolean; isHidden: boolean; createdAt: string; }
