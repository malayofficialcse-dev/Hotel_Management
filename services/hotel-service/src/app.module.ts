import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HotelController } from "./controllers/hotel.controller.js";
import { InternalHotelController } from "./controllers/internal-hotel.controller.js";
import { HotelService } from "./services/hotel.service.js";
import { HotelRepository } from "./repository/hotel.repository.js";
import { RedisService } from "./config/redis.service.js";
import { Hotel, HotelSchema } from "./models/hotel.schema.js";
import { env } from "./config/env.js";

@Module({
  imports: [
    MongooseModule.forRoot(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 }),
    MongooseModule.forFeature([{ name: Hotel.name, schema: HotelSchema }]),
  ],
  controllers: [HotelController, InternalHotelController],
  providers: [HotelService, HotelRepository, RedisService],
})
export class AppModule {}

