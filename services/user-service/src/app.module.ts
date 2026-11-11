import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { UserController } from "./controllers/user.controller.js";
import { UserService } from "./services/user.service.js";
import { UserRepository } from "./repository/user.repository.js";
import { PrismaService } from "./config/prisma.service.js";
import { AuthMiddleware } from "./middleware/auth.middleware.js";

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: "api/v1/users/health", method: RequestMethod.GET })
      .forRoutes(UserController);
  }
}
