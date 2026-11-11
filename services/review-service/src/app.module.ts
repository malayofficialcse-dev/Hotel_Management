import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ReviewController } from "./controllers/review.controller.js";
import { ReviewService } from "./services/review.service.js";
import { ReviewRepository } from "./repository/review.repository.js";
import { Review, ReviewSchema } from "./schemas/review.schema.js";
import { AuthMiddleware } from "./middleware/auth.middleware.js";
import { env } from "./config/env.js";

@Module({
  imports: [
    MongooseModule.forRoot(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 }),
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: "api/v1/reviews", method: RequestMethod.POST }
      );
  }
}
