import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { env } from "./env.js";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    this.client = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 });
    this.client.connect().catch((err) => console.warn("⚠️ [Hotel Service] Redis offline:", err.message));
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number = 180): Promise<void> {
    try {
      await this.client.set(key, value, "EX", ttlSeconds);
    } catch {}
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}

