import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { PaymentController } from "./controllers/payment.controller.js";
import { PaymentService } from "./services/payment.service.js";
import { StripeService } from "./services/stripe.service.js";
import { RabbitMQService } from "./services/rabbitmq.service.js";
import { PaymentRepository } from "./repository/payment.repository.js";
import { AuthMiddleware } from "./middleware/auth.middleware.js";

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, StripeService, RabbitMQService, PaymentRepository],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: "api/v1/payments/health", method: RequestMethod.GET },
        { path: "api/v1/payments/webhook", method: RequestMethod.POST }
      )
      .forRoutes(
        { path: "api/v1/payments/refund", method: RequestMethod.POST }
      );
  }
}
