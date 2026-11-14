import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../config/prisma.service.js";

@Injectable()
export class AuthRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) { }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, phone: true, role: true, isActive: true },
    });
  }

  async createUser(data: { email: string; passwordHash: string; name: string; phone?: string; role?: any }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        phone: data.phone,
        role: data.role || "CUSTOMER",
      },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
  }

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async deleteRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.delete({ where: { tokenHash } }).catch(() => null);
  }
}

