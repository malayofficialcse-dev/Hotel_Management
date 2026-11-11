import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { RoomService } from "../services/room.service.js";

@Controller("api/v1/rooms")
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get("health")
  healthCheck() {
    return { status: "UP", service: "room-service", engine: "NestJS + MongoDB (Mongoose)", port: 8004 };
  }

  @Get("hotel/:hotelId")
  getRoomsByHotel(@Param("hotelId") hotelId: string) {
    return this.roomService.getRoomsByHotel(hotelId);
  }

  @Get(":id")
  getRoomById(@Param("id") id: string) {
    return this.roomService.getRoomById(id);
  }

  @Get(":id/availability")
  checkAvailability(
    @Param("id") id: string,
    @Query("checkIn") checkIn: string,
    @Query("checkOut") checkOut: string,
    @Query("count") count?: string,
  ) {
    const requestedCount = count ? parseInt(count, 10) : 1;
    return this.roomService.checkAvailability(id, checkIn, checkOut, requestedCount);
  }

  @Post()
  createRoom(@Body() body: any) {
    return this.roomService.createRoom(body);
  }
}

