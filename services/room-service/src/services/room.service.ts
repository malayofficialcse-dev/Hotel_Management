import { getBookedRoomCount } from "./booking-client.service.js";
import { requireHotel } from "./hotel-client.service.js";
import { RoomRepository } from "../repositories/room.repository.js";

const repository = new RoomRepository();
const editableFields = [
  "hotelId",
  "name",
  "description",
  "price",
  "capacity",
  "totalInventory",
  "amenities",
  "bedType",
  "roomSize",
  "image",
  "isActive",
];

export interface Availability {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  totalInventory: number;
  currentlyBooked: number;
  availableInventory: number;
  isAvailable: boolean;
  pricePerNight: number;
}

export class RoomService {
  list(hotelId?: string, includeInactive = false) {
    return repository.list(hotelId, includeInactive);
  }

  get(id: string) {
    return repository.findById(id);
  }

  async create(body: Record<string, unknown>) {
    const data = this.pickFields(body);
    for (const field of ["hotelId", "name", "price", "capacity", "totalInventory"]) {
      if (data[field] === undefined || data[field] === "") throw new Error(`${field} is required`);
    }
    await requireHotel(String(data.hotelId));
    return repository.create(data);
  }

  async update(id: string, body: Record<string, unknown>) {
    const data = this.pickFields(body);
    if (Object.keys(data).length === 0) throw new Error("at least one supported field is required");
    if (typeof data.hotelId === "string") await requireHotel(data.hotelId);
    return repository.update(id, data);
  }

  delete(id: string) {
    return repository.delete(id);
  }

  async availability(id: string, checkIn: string, checkOut: string, count: number): Promise<Availability | null> {
    if (!Number.isInteger(count) || count < 1) throw new Error("count must be a positive integer");
    const room = await repository.findById(id);
    if (!room || !room.isActive) return null;

    let currentlyBooked = 0;
    if (checkIn || checkOut) {
      const start = new Date(`${checkIn}T00:00:00.000Z`);
      const end = new Date(`${checkOut}T00:00:00.000Z`);
      if (!checkIn || !checkOut || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        throw new Error("checkIn and checkOut must be valid dates and checkOut must be after checkIn");
      }
      currentlyBooked = await getBookedRoomCount(id, checkIn, checkOut);
    }

    const totalInventory = room.totalInventory;
    const availableInventory = Math.max(0, totalInventory - currentlyBooked);
    return {
      roomTypeId: id,
      checkIn,
      checkOut,
      totalInventory,
      currentlyBooked,
      availableInventory,
      isAvailable: availableInventory >= count,
      pricePerNight: room.price,
    };
  }

  private pickFields(body: Record<string, unknown>) {
    return Object.fromEntries(editableFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
  }
}
