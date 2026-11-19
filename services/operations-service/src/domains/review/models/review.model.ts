import mongoose from "mongoose";
import { reviewDb } from "../../../config/databases.js";

const reviewSchema = new mongoose.Schema({
  hotelId: { type: String, required: true, index: true }, userId: String, userName: { type: String, required: true }, userAvatar: String,
  rating: { type: Number, required: true, min: 1, max: 5 }, title: String, comment: { type: String, required: true },
  ratingsBreakdown: { cleanliness: Number, comfort: Number, location: Number, service: Number, valueForMoney: Number },
  stayDate: Date, verifiedBooking: { type: Boolean, default: false }, bookingCode: String, helpfulCount: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: true }, isHidden: { type: Boolean, default: false },
}, { timestamps: true });
reviewSchema.index({ hotelId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
export const ReviewModel = reviewDb.models.Review || reviewDb.model("Review", reviewSchema);
