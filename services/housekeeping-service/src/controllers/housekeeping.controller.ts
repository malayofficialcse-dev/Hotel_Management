import { Controller, Get, Patch, Post, Body, Param, Query } from "@nestjs/common";
import { HousekeepingService } from "../services/housekeeping.service.js";
import { CleaningStatus } from "../models/housekeeping.schema.js";

@Controller("api/v1/housekeeping")
export class HousekeepingController {
  constructor(private readonly service: HousekeepingService) {}

  @Get("health")
  healthCheck() {
    return { status: "UP", service: "housekeeping-service", engine: "NestJS + MongoDB (Mongoose)", port: 8008 };
  }

  @Get("hotel/:hotelId")
  getTasks(@Param("hotelId") hotelId: string) {
    return this.service.getTasks(hotelId);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: CleaningStatus,
    @Body("notes") notes?: string,
  ) {
    return this.service.updateTaskStatus(id, status, notes);
  }

  @Post()
  createTask(@Body() body: any) {
    return this.service.createTask(body);
  }
}

