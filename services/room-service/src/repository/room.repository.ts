import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Room, RoomDocument } from "../models/room.schema.js";

@Injectable()
export class RoomRepository {
  constructor(@InjectModel(Room.name) private model: Model<RoomDocument>) {}

  async findByHotel(hotelId: string) {
    return this.model.find({ hotelId, isActive: true }).sort({ price: 1 }).exec();
  }

  async findById(id: string) {
    return this.model.findById(id).exec();
  }

  async create(data: Partial<Room>) {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<Room>) {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async count() {
    return this.model.countDocuments().exec();
  }
}

