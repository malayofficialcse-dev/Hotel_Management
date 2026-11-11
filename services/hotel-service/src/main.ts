import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { env } from "./config/env.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(env.PORT);
  console.log(`🚀 [NestJS Hotel Service] listening on port ${env.PORT} (MongoDB hotel_catalog)`);
}
bootstrap();

