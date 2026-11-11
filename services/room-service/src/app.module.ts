import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RoomController } from "./controllers/room.controller.js";
import { InternalRoomController } from "./controllers/internal-room.controller.js";
import { RoomService } from "./services/room.service.js";
import { RoomRepository } from "./repository/room.repository.js";
import { Room, RoomSchema } from "./models/room.schema.js";
import { env } from "./config/env.js";

@Module({
  imports: [
    MongooseModule.forRoot(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 }),
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  controllers: [RoomController, InternalRoomController],
  providers: [RoomService, RoomRepository],
})
export class AppModule {}

