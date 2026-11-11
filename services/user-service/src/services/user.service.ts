import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRepository } from "../repository/user.repository.js";
import { UpdateProfileDto, AddWishlistDto } from "../models/user.dto.js";

@Injectable()
export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async getProfile(userId: string) {
    const profile = await this.repo.findById(userId);
    if (!profile) {
      // Fallback guest profile
      return {
        id: userId,
        email: "guest@stayease.com",
        name: "Guest Traveler",
        phone: "+91 98765 43210",
        country: "India",
        wishlist: [],
      };
    }
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.repo.updateProfile(userId, dto);
  }

  async getWishlist(userId: string) {
    return this.repo.getWishlist(userId);
  }

  async addToWishlist(userId: string, dto: AddWishlistDto) {
    return this.repo.addToWishlist(userId, dto);
  }

  async removeFromWishlist(userId: string, hotelId: string) {
    await this.repo.removeFromWishlist(userId, hotelId);
    return { success: true, message: "Removed from wishlist" };
  }
}

