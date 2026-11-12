import { Injectable } from "@nestjs/common";
import { GatewayRepository } from "../repository/gateway.repository.js";
import { env } from "../config/env.js";
import axios from "axios";

@Injectable()
export class GatewayService {
  constructor(private readonly repo: GatewayRepository) {}

  async checkServicesHealth() {
    const services = [
      { name: "auth-service", url: env.AUTH_SERVICE_URL },
      { name: "user-service", url: env.USER_SERVICE_URL },
      { name: "hotel-service", url: env.HOTEL_SERVICE_URL },
      { name: "room-service", url: env.ROOM_SERVICE_URL },
      { name: "booking-service", url: env.BOOKING_SERVICE_URL },
      { name: "payment-service", url: env.PAYMENT_SERVICE_URL },
      { name: "employee-service", url: env.EMPLOYEE_SERVICE_URL },
      { name: "department-service", url: env.DEPARTMENT_SERVICE_URL },
      { name: "housekeeping-service", url: env.HOUSEKEEPING_SERVICE_URL },
      { name: "review-service", url: env.REVIEW_SERVICE_URL },
      { name: "notification-service", url: env.NOTIFICATION_SERVICE_URL },
      { name: "analytics-service", url: env.ANALYTICS_SERVICE_URL },
    ];

    const results = await Promise.all(
      services.map(async (svc) => {
        const start = Date.now();
        try {
          await axios.get(`${svc.url}/health`, { timeout: 1500 });
          const latencyMs = Date.now() - start;
          const status = { service: svc.name, url: svc.url, status: "UP" as const, latencyMs };
          this.repo.recordHealth(status);
          return status;
        } catch {
          const status = { service: svc.name, url: svc.url, status: "DOWN" as const };
          this.repo.recordHealth(status);
          return status;
        }
      })
    );

    return {
      gateway: "UP",
      timestamp: new Date().toISOString(),
      services: results,
    };
  }
}

