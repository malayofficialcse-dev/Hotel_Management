import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { ValidationPipe } from "@nestjs/common";
import { env } from "./config/env.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(env.PORT);
  console.log(`🚀 [NestJS Auth Service] listening on port ${env.PORT} (PostgreSQL hotel_auth_db)`);
}
bootstrap();

