import mongoose from "mongoose";
import { OfferModel } from "../models/offer.model.js";

export class OfferRepository {
  list(includeInactive: boolean) {
    return OfferModel.find(includeInactive ? {} : { isActive: true }).sort({ createdAt: -1 }).lean();
  }

  create(data: Record<string, unknown>) {
    return OfferModel.create(data);
  }

  deactivate(id: string) {
    if (!mongoose.isValidObjectId(id)) return null;
    return OfferModel.findByIdAndUpdate(id, { isActive: false }, { new: true, runValidators: true }).lean();
  }
}
