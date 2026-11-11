import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Hotel, HotelDocument } from "../models/hotel.schema.js";

@Injectable()
export class HotelRepository {
  constructor(@InjectModel(Hotel.name) private model: Model<HotelDocument>) {}

  async findAll(filter: any, sort: any = { rating: -1 }) {
    return this.model.find(filter).sort(sort).exec();
  }

  async findBySlugOrId(identifier: string) {
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      return this.model.findById(identifier).exec();
    }
    return this.model.findOne({ slug: identifier }).exec();
  }

  async create(data: Partial<Hotel>) {
    return this.model.create(data);
  }

  async update(slug: string, data: Partial<Hotel>) {
    return this.model.findOneAndUpdate({ slug }, data, { new: true }).exec();
  }

  async delete(slug: string) {
    return this.model.findOneAndDelete({ slug }).exec();
  }

  async count() {
    return this.model.countDocuments().exec();
  }
}

