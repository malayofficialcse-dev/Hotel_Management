import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { HotelService } from "../services/hotel.service.js";

@Controller("api/v1/hotels")
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Get("health")
  healthCheck() {
    return { status: "UP", service: "hotel-service", engine: "NestJS + MongoDB (Mongoose)", port: 8003 };
  }

  @Get()
  async getHotels(
    @Query("city") city?: string,
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Query("minPrice") minPrice?: number,
    @Query("maxPrice") maxPrice?: number,
  ) {
    return this.hotelService.getHotels({ city, category, search, minPrice, maxPrice });
  }

  @Get(":slug")
  async getHotelBySlug(@Param("slug") slug: string) {
    return this.hotelService.getHotelBySlug(slug);
  }

  @Post()
  async createHotel(@Body() body: any) {
    return this.hotelService.createHotel(body);
  }
}

