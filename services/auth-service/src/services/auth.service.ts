import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { AuthRepository } from "../repository/auth.repository.js";
import { RegisterDto, LoginDto } from "../models/auth.dto.js";
import { generateTokenPair, verifyAccessToken, verifyRefreshToken } from "../utils/token.util.js";
import bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(private readonly repo: AuthRepository) {}

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
}

