import { Controller, Get } from "@nestjs/common";
import { GatewayService } from "../services/gateway.service.js";

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get("health")
  getHealth() {
    return this.gatewayService.checkServicesHealth();
  }
}

