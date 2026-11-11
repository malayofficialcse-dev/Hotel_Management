import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import amqp from "amqplib";
import { env } from "../config/env.js";

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: any = null;

  async onModuleInit() {
    try {
      this.connection = await amqp.connect(env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange("hotel_events", "topic", { durable: true });
      this.logger.log("✅ [Housekeeping] Connected to RabbitMQ exchange 'hotel_events'");
    } catch (err: any) {
      this.logger.warn(`⚠️ [Housekeeping] RabbitMQ connection failed: ${err.message}. Events will be skipped.`);
    }
  }

  async publish(routingKey: string, payload: any) {
    if (!this.channel) {
      this.logger.warn(`RabbitMQ channel not ready. Dropping event ${routingKey}`);
      return;
    }

    try {
      const data = Buffer.from(JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }));

      this.channel.publish("hotel_events", routingKey, data, { persistent: true });
      this.logger.log(`📤 Event published: ${routingKey}`);
    } catch (err: any) {
      this.logger.error(`Failed to publish event ${routingKey}: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch {}
  }
}

