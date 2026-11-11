import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller.js";
import { AuthService } from "./services/auth.service.js";
import { AuthRepository } from "./repository/auth.repository.js";
import { PrismaService } from "./config/prisma.service.js";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, PrismaService],
})
export class AppModule {}

