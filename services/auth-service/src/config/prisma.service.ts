import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log("✅ [Auth Service] Connected to PostgreSQL (hotel_auth_db)");
    } catch (e: any) {
      console.warn("⚠️ [Auth Service] DB connection notice:", e.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

