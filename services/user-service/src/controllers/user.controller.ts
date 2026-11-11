import { Controller, Get, Patch, Post, Delete, Body, Param, Headers } from "@nestjs/common";
import { UserService } from "../services/user.service.js";
import { UpdateProfileDto, AddWishlistDto } from "../models/user.dto.js";

@Controller("api/v1/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("health")
  healthCheck() {
    return { status: "UP", service: "user-service", engine: "NestJS + PostgreSQL (Prisma)", port: 8002 };
  }

  @Get("me")
  getProfile(@Headers("x-user-id") userId?: string) {
    const id = userId || "default-guest";
    return this.userService.getProfile(id);
  }

  @Patch("me")
  updateProfile(@Headers("x-user-id") userId: string, @Body() dto: UpdateProfileDto) {
    const id = userId || "default-guest";
    return this.userService.updateProfile(id, dto);
  }

  @Get("me/wishlist")
  getWishlist(@Headers("x-user-id") userId?: string) {
    const id = userId || "default-guest";
    return this.userService.getWishlist(id);
  }

  @Post("me/wishlist")
  addToWishlist(@Headers("x-user-id") userId: string, @Body() dto: AddWishlistDto) {
    const id = userId || "default-guest";
    return this.userService.addToWishlist(id, dto);
  }

  @Delete("me/wishlist/:hotelId")
  removeFromWishlist(@Headers("x-user-id") userId: string, @Param("hotelId") hotelId: string) {
    const id = userId || "default-guest";
    return this.userService.removeFromWishlist(id, hotelId);
  }
}

