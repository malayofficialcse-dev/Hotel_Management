import { Controller, Post, Body, Get, Headers, UnauthorizedException, HttpCode, HttpStatus, Inject } from "@nestjs/common";
import { AuthService } from "../services/auth.service.js";
import { RegisterDto, LoginDto, RefreshTokenDto } from "../models/auth.dto.js";

@Controller()
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) { }

  @Get("health")
  healthCheck() {
    return { status: "UP", service: "auth-service", engine: "NestJS + Prisma + PostgreSQL", port: 8001 };
  }

  @Get("api/v1/auth/health")
  apiHealthCheck() {
    return { status: "UP", service: "auth-service", engine: "NestJS + Prisma + PostgreSQL", port: 8001 };
  }

  @Post("api/v1/auth/register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("api/v1/auth/login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("api/v1/auth/refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  // Public/Gateway validation endpoint via GET
  @Get("api/v1/auth/validate")
  validateGet(@Headers("authorization") authHeader?: string) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing Bearer token");
    }
    const token = authHeader.split(" ")[1];
    return this.authService.validateToken(token);
  }

  // Public/Gateway validation endpoint via POST
  @Post("api/v1/auth/validate")
  @HttpCode(HttpStatus.OK)
  validatePost(@Body("token") bodyToken?: string, @Headers("authorization") authHeader?: string) {
    const token = bodyToken || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);
    if (!token) {
      throw new UnauthorizedException("Missing token in body or Authorization header");
    }
    return this.authService.validateToken(token);
  }

  // Inter-service internal token validation endpoint
  @Post("internal/auth/validate")
  @HttpCode(HttpStatus.OK)
  async internalValidate(@Body("token") bodyToken?: string, @Headers("authorization") authHeader?: string) {
    const token = bodyToken || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);
    if (!token) {
      throw new UnauthorizedException("Missing token");
    }
    const result = await this.authService.validateToken(token);
    if (!result.valid || !result.user) {
      throw new UnauthorizedException("Invalid or expired token");
    }
    return result;
  }
}
