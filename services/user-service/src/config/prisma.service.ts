import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log("✅ [User Service] Connected to PostgreSQL (hotel_users_db)");
    } catch (e: any) {
      console.warn("⚠️ [User Service] DB connection notice:", e.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

