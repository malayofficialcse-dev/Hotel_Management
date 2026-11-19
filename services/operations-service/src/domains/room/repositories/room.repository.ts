import mongoose from "mongoose";
import { RoomModel } from "../models/room.model.js";

export class RoomRepository {
  list(hotelId?: string, includeInactive = false) {
    return RoomModel.find({
      ...(hotelId ? { hotelId } : {}),
      ...(includeInactive ? {} : { isActive: true }),
    })
      .sort({ hotelId: 1, name: 1 })
      .lean();
  }

  findById(id: string) {
    if (!mongoose.isValidObjectId(id)) return Promise.resolve(null);
    return RoomModel.findById(id).lean();
  }

  create(data: Record<string, unknown>) {
    return RoomModel.create(data);
  }

  update(id: string, data: Record<string, unknown>) {
    if (!mongoose.isValidObjectId(id)) return Promise.resolve(null);
    return RoomModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  }

  delete(id: string) {
    if (!mongoose.isValidObjectId(id)) return Promise.resolve(null);
    return RoomModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  }
}
