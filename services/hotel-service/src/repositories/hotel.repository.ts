import mongoose from "mongoose";
import { HotelModel } from "../models/hotel.model.js";

export interface HotelFilters {
  city?: string;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  includeInactive?: boolean;
}

function escaped(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class HotelRepository {
  list(filters: HotelFilters) {
    const query: Record<string, unknown> = {};
    if (!filters.includeInactive) query.isActive = true;
    if (filters.city) query.city = new RegExp(escaped(filters.city), "i");
    if (filters.category) query.category = filters.category;
    if (filters.search) {
      const search = new RegExp(escaped(filters.search), "i");
      query.$or = [{ name: search }, { city: search }, { location: search }, { slug: search }];
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.basePrice = {
        ...(filters.minPrice === undefined ? {} : { $gte: filters.minPrice }),
        ...(filters.maxPrice === undefined ? {} : { $lte: filters.maxPrice }),
      };
    }
    return HotelModel.find(query).sort({ rating: -1, createdAt: -1 }).lean();
  }

  findByIdentifier(identifier: string) {
    const query = mongoose.isValidObjectId(identifier)
      ? { $or: [{ slug: identifier }, { _id: identifier }] }
      : { slug: identifier };
    return HotelModel.findOne(query).lean();
  }

  create(data: Record<string, unknown>) {
    return HotelModel.create(data);
  }

  update(identifier: string, data: Record<string, unknown>) {
    const query = mongoose.isValidObjectId(identifier)
      ? { $or: [{ slug: identifier }, { _id: identifier }] }
      : { slug: identifier };
    return HotelModel.findOneAndUpdate(query, data, { new: true, runValidators: true }).lean();
  }

  delete(identifier: string) {
    const query = mongoose.isValidObjectId(identifier)
      ? { $or: [{ slug: identifier }, { _id: identifier }] }
      : { slug: identifier };
    return HotelModel.findOneAndUpdate(query, { isActive: false }, { new: true }).lean();
  }
}
