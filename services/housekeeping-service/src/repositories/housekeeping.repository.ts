import mongoose from "mongoose";
import { HousekeepingTaskModel, type TaskStatus } from "../models/housekeeping-task.model.js";

export class HousekeepingRepository {
  list(filters: { hotelId?: string; status?: TaskStatus }) {
    return HousekeepingTaskModel.find({
      ...(filters.hotelId ? { hotelId: filters.hotelId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    })
      .sort({ priority: -1, updatedAt: -1 })
      .lean();
  }

  findById(id: string) {
    if (!mongoose.isValidObjectId(id)) return Promise.resolve(null);
    return HousekeepingTaskModel.findById(id).lean();
  }

  create(data: Record<string, unknown>) {
    return HousekeepingTaskModel.create(data);
  }

  update(id: string, data: Record<string, unknown>) {
    if (!mongoose.isValidObjectId(id)) return Promise.resolve(null);
    return HousekeepingTaskModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  }

  delete(id: string) {
    if (!mongoose.isValidObjectId(id)) return Promise.resolve(null);
    return HousekeepingTaskModel.findByIdAndDelete(id).lean();
  }
}
