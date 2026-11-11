import { Controller, Get, Param } from "@nestjs/common";
import { RoomService } from "../services/room.service.js";

@Controller("internal/rooms")
export class InternalRoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get(":roomTypeId/inventory")
  async getInventory(@Param("roomTypeId") roomTypeId: string) {
    const room = await this.roomService.getRoomById(roomTypeId);
    return { inventory: room?.totalInventory ?? 5 };
  }
}

