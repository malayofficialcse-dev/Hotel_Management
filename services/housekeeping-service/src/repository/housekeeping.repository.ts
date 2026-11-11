import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { HousekeepingTask, HousekeepingDocument, CleaningStatus } from "../models/housekeeping.schema.js";

@Injectable()
export class HousekeepingRepository {
  constructor(@InjectModel(HousekeepingTask.name) private model: Model<HousekeepingDocument>) {}

  async findByHotel(hotelId: string) {
    return this.model.find({ hotelId }).sort({ updatedAt: -1 }).exec();
  }

  async findByStatus(hotelId: string, status: CleaningStatus) {
    return this.model.find({ hotelId, status }).exec();
  }

  async create(data: Partial<HousekeepingTask>) {
    return this.model.create(data);
  }

  async updateStatus(id: string, status: CleaningStatus, notes?: string) {
    return this.model.findByIdAndUpdate(id, { status, notes }, { new: true }).exec();
  }
}

