import { Injectable, OnModuleInit } from "@nestjs/common";
import { RoomRepository } from "../repository/room.repository.js";
import { SEED_ROOMS } from "../utils/seed_rooms.js";
import { env } from "../config/env.js";
import axios from "axios";

@Injectable()
export class RoomService implements OnModuleInit {
  constructor(private readonly repo: RoomRepository) {}

  async onModuleInit() {
    try {
      const count = await this.repo.count();
      if (count === 0) {
        console.log("🌱 [Room Service] Seeding initial room types into MongoDB...");
        for (const room of SEED_ROOMS) {
          await this.repo.create(room);
        }
        console.log("✅ Seed completed.");
      }
    } catch (e: any) {
      console.warn("⚠️ Room MongoDB seed notice:", e.message);
    }
  }

  async getRoomsByHotel(hotelId: string) {
    try {
      const rooms = await this.repo.findByHotel(hotelId);
      if (rooms.length > 0) return rooms;
    } catch {}
    return SEED_ROOMS.filter((r) => r.hotelId === hotelId);
  }

  async getRoomById(id: string) {
    try {
      const room = await this.repo.findById(id);
      if (room) return room;
    } catch {}
    return SEED_ROOMS[0];
  }

  async checkAvailability(roomTypeId: string, checkIn: string, checkOut: string, count: number = 1) {
    const room = await this.getRoomById(roomTypeId);
    let bookedCount = 0;

    try {
      // Connect to Go Booking Engine
      const res = await axios.get(
        `${env.BOOKING_SERVICE_URL}/internal/rooms/${roomTypeId}/booked-count?checkIn=${checkIn}&checkOut=${checkOut}`,
        { timeout: 3000 }
      );
      if (res.data?.success) {
        bookedCount = res.data.count || 0;
      }
    } catch {
      // Fallback
    }

    const available = Math.max(0, room.totalInventory - bookedCount);
    return {
      roomTypeId,
      checkIn,
      checkOut,
      totalInventory: room.totalInventory,
      currentlyBooked: bookedCount,
      availableInventory: available,
      isAvailable: available >= count,
      pricePerNight: room.price,
    };
  }

  async createRoom(data: any) {
    return this.repo.create(data);
  }
}

