import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HousekeepingController } from "./controllers/housekeeping.controller.js";
import { HousekeepingService } from "./services/housekeeping.service.js";
import { RabbitMQService } from "./services/rabbitmq.service.js";
import { HousekeepingRepository } from "./repository/housekeeping.repository.js";
import { HousekeepingTask, HousekeepingTaskSchema } from "./models/housekeeping.schema.js";
import { AuthMiddleware } from "./middleware/auth.middleware.js";
import { env } from "./config/env.js";

@Module({
  imports: [
    MongooseModule.forRoot(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 }),
    MongooseModule.forFeature([{ name: HousekeepingTask.name, schema: HousekeepingTaskSchema }]),
  ],
  controllers: [HousekeepingController],
  providers: [HousekeepingService, HousekeepingRepository, RabbitMQService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: "api/v1/housekeeping/health", method: RequestMethod.GET })
      .forRoutes(
        { path: "api/v1/housekeeping/:id/status", method: RequestMethod.PATCH },
        { path: "api/v1/housekeeping", method: RequestMethod.POST }
      );
  }
}
