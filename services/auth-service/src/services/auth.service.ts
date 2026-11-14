import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException, Inject } from "@nestjs/common";
import { AuthRepository } from "../repository/auth.repository.js";
import { RegisterDto, LoginDto } from "../models/auth.dto.js";
import { generateTokenPair, verifyAccessToken, verifyRefreshToken } from "../utils/token.util.js";
import bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(@Inject(AuthRepository) private readonly repo: AuthRepository) { }

  async register(dto: RegisterDto) {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.repo.createUser({
      email: dto.email,
      passwordHash,
      name: dto.name,
      phone: dto.phone,
    });

    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.repo.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

    return { success: true, user, tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.repo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.repo.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

    return {
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken) as { id: string };
      const savedToken = await this.repo.findRefreshToken(refreshToken);

      if (!savedToken || savedToken.expiresAt < new Date()) {
        throw new UnauthorizedException("Invalid or expired refresh token");
      }

      const user = savedToken.user;
      const tokens = generateTokenPair({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      await this.repo.deleteRefreshToken(refreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.repo.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

      return { success: true, tokens };
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async validateToken(token: string) {
    try {
      const payload = verifyAccessToken(token) as any;
      return { valid: true, user: payload };
    } catch {
      return { valid: false, user: null };
    }
  }

  async getProfile(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new NotFoundException("User profile not found");
    }
    return { success: true, user };
  }

  async updateProfile(userId: string, dto: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) {
    const user = await this.repo.findFullUserById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updateData: { name?: string; phone?: string; passwordHash?: string } = {};
    if (dto.name !== undefined && dto.name.trim()) {
      updateData.name = dto.name.trim();
    }
    if (dto.phone !== undefined) {
      updateData.phone = dto.phone.trim();
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException("Current password is required to change password");
      }
      const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestException("Current password is incorrect");
      }
      if (dto.newPassword.length < 6) {
        throw new BadRequestException("New password must be at least 6 characters");
      }
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    }

    const updated = await this.repo.updateProfile(userId, updateData);
    return {
      success: true,
      message: "Profile updated successfully",
      user: updated,
    };
  }
}

