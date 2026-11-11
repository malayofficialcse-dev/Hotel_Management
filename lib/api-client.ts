import { hotels as mockHotels, Hotel } from "./data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface HoldRoomPayload {
  hotelId: string;
  roomTypeId: string;
  userId?: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  guestsCount: number;
  roomCount: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
}

export interface HoldRoomResponse {
  bookingId: string;
  bookingCode: string;
  expiresAt: string;
  holdSeconds: number;
  totalPrice: number;
}

export const api = {
  // -------------------------------------------------------------
  // 1. Authentication Service (NestJS :8001 via Gateway)
  // -------------------------------------------------------------
  async register(data: { email: string; password: string; name: string; phone?: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { success: true, user: { email: data.email, name: data.name, role: "CUSTOMER" }, token: "sim-token" };
    }
  },

  async login(data: { email: string; password: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { success: true, user: { email: data.email, name: "Guest User", role: "CUSTOMER" }, token: "sim-token" };
    }
  },

  // -------------------------------------------------------------
  // 2. Hotel Catalog Service (NestJS + MongoDB :8003 via Gateway)
  // -------------------------------------------------------------
  async getHotels(filters?: { city?: string; category?: string; search?: string }): Promise<Hotel[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.city && filters.city !== "All") params.append("city", filters.city);
      if (filters?.category && filters.category !== "All Stays") params.append("category", filters.category);
      if (filters?.search) params.append("search", filters.search);

      const res = await fetch(`${API_BASE_URL}/hotels?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch hotels from API Gateway");
      const json = await res.json();
      return json.data || mockHotels;
    } catch {
      let results = [...mockHotels];
      if (filters?.category && filters.category !== "All Stays") {
        results = results.filter((h) => h.category === filters.category);
      }
      if (filters?.city && filters.city !== "All") {
        results = results.filter((h) => h.city.toLowerCase() === filters.city?.toLowerCase());
      }
      return results;
    }
  },

  async getHotel(identifier: string): Promise<Hotel | undefined> {
    try {
      const res = await fetch(`${API_BASE_URL}/hotels/${identifier}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Hotel not found");
      const json = await res.json();
      return json.data;
    } catch {
      return mockHotels.find((h) => h.id === identifier);
    }
  },

  // -------------------------------------------------------------
  // 3. Room Management Service (NestJS + MongoDB :8004 via Gateway)
  // -------------------------------------------------------------
  async getRoomsByHotel(hotelId: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/hotel/${hotelId}`);
      if (!res.ok) throw new Error("Failed to load rooms");
      const json = await res.json();
      return json;
    } catch {
      return [];
    }
  },

  async checkRoomAvailability(roomId: string, checkIn: string, checkOut: string, count: number = 1) {
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/availability?checkIn=${checkIn}&checkOut=${checkOut}&count=${count}`);
      return await res.json();
    } catch {
      return { isAvailable: true, availableInventory: 4 };
    }
  },

  // -------------------------------------------------------------
  // 4. Booking Engine Service (Go + Redis Concurrency :8005 via Gateway)
  // -------------------------------------------------------------
  async holdRoom(payload: HoldRoomPayload): Promise<{ success: boolean; data?: HoldRoomResponse; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || "Failed to hold room" };
      return { success: true, data: data.data };
    } catch {
      const bookingCode = "SE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 600 * 1000).toISOString();
      return {
        success: true,
        data: {
          bookingId: "sim-" + Date.now(),
          bookingCode,
          expiresAt,
          holdSeconds: 600,
          totalPrice: 8960,
        },
      };
    }
  },

  async confirmBooking(bookingId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/confirm`, { method: "POST" });
      return res.ok;
    } catch {
      return true;
    }
  },

  async getBookingByCode(code: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/code/${code}`);
      if (!res.ok) throw new Error("Booking not found");
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  // -------------------------------------------------------------
  // 5. Payment Service (NestJS + PostgreSQL :8006 via Gateway)
  // -------------------------------------------------------------
  async createPaymentIntent(bookingId: string, bookingCode: string, amount: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, bookingCode, amount }),
      });
      return await res.json();
    } catch {
      return { success: true, clientSecret: `pi_mock_${Date.now()}` };
    }
  },

  async confirmPaymentIntent(paymentId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      return await res.json();
    } catch {
      return { success: true, message: "Payment confirmed" };
    }
  },

  // -------------------------------------------------------------
  // 6. User / Guest Service (NestJS + PostgreSQL :8002 via Gateway)
  // -------------------------------------------------------------
  async getUserProfile(userId: string = "default-guest") {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { "x-user-id": userId },
      });
      return await res.json();
    } catch {
      return { id: userId, name: "Guest User", email: "guest@stayease.internal" };
    }
  },

  async getWishlist(userId: string = "default-guest") {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me/wishlist`, {
        headers: { "x-user-id": userId },
      });
      return await res.json();
    } catch {
      return [];
    }
  },

  // -------------------------------------------------------------
  // 7. Housekeeping Service (NestJS + MongoDB :8008 via Gateway)
  // -------------------------------------------------------------
  async getHousekeepingTasks(hotelId: string = "palm-house") {
    try {
      const res = await fetch(`${API_BASE_URL}/housekeeping/hotel/${hotelId}`);
      return await res.json();
    } catch {
      return [];
    }
  },

  // -------------------------------------------------------------
  // 8. Guest Reviews Service (NestJS + MongoDB :8009 via Gateway)
  // -------------------------------------------------------------
  async getHotelReviews(hotelId: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/hotel/${hotelId}`);
      if (!res.ok) throw new Error("Failed to load reviews");
      const json = await res.json();
      return json;
    } catch {
      return [];
    }
  },

  // -------------------------------------------------------------
  // 9. Employee & Operations Service (NestJS + PostgreSQL :8007 via Gateway)
  // -------------------------------------------------------------
  async getEmployees(departmentId?: string) {
    try {
      const url = departmentId
        ? `${API_BASE_URL}/employees?departmentId=${departmentId}`
        : `${API_BASE_URL}/employees`;
      const res = await fetch(url);
      return await res.json();
    } catch {
      return [];
    }
  },

  // -------------------------------------------------------------
  // 10. Analytics Service (Go :8011 via Gateway)
  // -------------------------------------------------------------
  async getAnalyticsOverview() {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/overview`);
      const json = await res.json();
      return json.data;
    } catch {
      return {
        totalBookings: 1428,
        totalRevenue: 9854200.0,
        activeGuests: 312,
        occupancyRate: 84.6,
      };
    }
  },
};
