import { Injectable } from "@nestjs/common";
import { PrismaService } from "../config/prisma.service.js";

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.userProfile.findUnique({
      where: { id },
      include: { wishlist: true, preferences: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.userProfile.findUnique({ where: { email } });
  }

  async upsertProfile(id: string, email: string, name: string, phone?: string) {
    return this.prisma.userProfile.upsert({
      where: { id },
      create: { id, email, name, phone },
      update: { name, phone },
    });
  }

  async updateProfile(id: string, data: any) {
    return this.prisma.userProfile.update({
      where: { id },
      data,
    });
  }

  async getWishlist(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: "desc" },
    });
  }

  async addToWishlist(userId: string, data: any) {
    return this.prisma.wishlistItem.upsert({
      where: { userId_hotelId: { userId, hotelId: data.hotelId } },
      create: { userId, ...data },
      update: data,
    });
  }

  async removeFromWishlist(userId: string, hotelId: string) {
    return this.prisma.wishlistItem.delete({
      where: { userId_hotelId: { userId, hotelId } },
    }).catch(() => null);
  }
}

