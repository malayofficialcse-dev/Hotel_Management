import { Controller, Get, Param } from "@nestjs/common";

@Controller("internal/rooms")
export class InternalHotelController {
  @Get(":roomTypeId/inventory")
  getInventory(@Param("roomTypeId") roomTypeId: string) {
    // Fallback room inventory
    return { inventory: 5 };
  }
}

