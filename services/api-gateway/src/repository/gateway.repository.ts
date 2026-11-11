import { Injectable } from "@nestjs/common";
import { ServiceHealthStatus } from "../models/gateway.dto.js";

@Injectable()
export class GatewayRepository {
  private healthLogs: ServiceHealthStatus[] = [];

  recordHealth(status: ServiceHealthStatus) {
    this.healthLogs.push(status);
    if (this.healthLogs.length > 100) {
      this.healthLogs.shift();
    }
  }

  getRecentLogs() {
    return this.healthLogs;
  }
}

