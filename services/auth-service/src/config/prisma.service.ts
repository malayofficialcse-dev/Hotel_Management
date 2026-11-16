import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      const [database] = await this.$queryRaw<Array<{
        database_name: string;
        schema_name: string;
        users_table_exists: boolean;
      }>>`SELECT current_database() AS database_name,
                current_schema() AS schema_name,
                to_regclass('public.users') IS NOT NULL AS users_table_exists`;

      if (!database.users_table_exists) {
        throw new Error(
          `The users table is missing from ${database.database_name}.${database.schema_name}. Run npm run prisma:push in services/auth-service.`,
        );
      }

      console.log(
        `✅ [Auth Service] Connected to PostgreSQL (${database.database_name}.${database.schema_name})`,
      );
    } catch (e: any) {
      console.error("[Auth Service] Database initialization failed:", e.message);
      throw e;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

