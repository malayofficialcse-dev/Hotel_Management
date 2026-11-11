import { Injectable, OnModuleInit } from "@nestjs/common";
import { HotelRepository } from "../repository/hotel.repository.js";
import { RedisService } from "../config/redis.service.js";
import { SEED_HOTELS } from "../utils/seed_data.js";

@Injectable()
export class HotelService implements OnModuleInit {
  constructor(
    private readonly repo: HotelRepository,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.repo.count();
      if (count === 0) {
        console.log("🌱 [Hotel Service] Seeding initial hotels into MongoDB...");
        for (const hotel of SEED_HOTELS) {
          await this.repo.create(hotel);
        }
        console.log("✅ Seed completed.");
      }
    } catch (e: any) {
      console.warn("⚠️ Hotel MongoDB seed notice:", e.message);
    }
  }

  async getHotels(query: { city?: string; category?: string; search?: string; minPrice?: number; maxPrice?: number }) {
    const cacheKey = `cache:hotels:list:${JSON.stringify(query)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return { source: "cache", data: JSON.parse(cached) };

    const filter: any = { isActive: true };
    if (query.city && query.city !== "All") filter.city = new RegExp(query.city, "i");
    if (query.category && query.category !== "All Stays" && query.category !== "All") {
      filter.category = query.category;
    }
    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, "i") },
        { location: new RegExp(query.search, "i") },
        { city: new RegExp(query.search, "i") },
      ];
    }
    if (query.minPrice || query.maxPrice) {
      filter.basePrice = {};
      if (query.minPrice) filter.basePrice.$gte = Number(query.minPrice);
      if (query.maxPrice) filter.basePrice.$lte = Number(query.maxPrice);
    }

    try {
      const hotels = await this.repo.findAll(filter);
      if (hotels.length > 0) {
        await this.redis.set(cacheKey, JSON.stringify(hotels), 120);
        return { source: "db", data: hotels };
      }
    } catch {}

    return { source: "fallback", data: SEED_HOTELS };
  }

  async getHotelBySlug(slug: string) {
    try {
      const hotel = await this.repo.findBySlugOrId(slug);
      if (hotel) return hotel;
    } catch {}
    return SEED_HOTELS.find((h) => h.slug === slug) || null;
  }

  async createHotel(data: any) {
    return this.repo.create(data);
  }
}

