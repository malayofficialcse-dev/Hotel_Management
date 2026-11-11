import { Module } from "@nestjs/common";
import { GatewayController } from "./controllers/gateway.controller.js";
import { GatewayService } from "./services/gateway.service.js";
import { GatewayRepository } from "./repository/gateway.repository.js";

@Module({
  controllers: [GatewayController],
  providers: [GatewayService, GatewayRepository],
})
export class AppModule {}
