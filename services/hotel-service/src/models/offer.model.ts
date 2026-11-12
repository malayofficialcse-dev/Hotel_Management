import mongoose, { type InferSchemaType } from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 32 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", maxlength: 2000 },
    discountType: { type: String, enum: ["PERCENTAGE", "FIXED"], required: true },
    discountValue: { type: Number, required: true, min: 0.01 },
    startsAt: { type: Date },
    endsAt: { type: Date },
    hotelIds: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

offerSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

export type Offer = InferSchemaType<typeof offerSchema> & { id: string };
export const OfferModel = (mongoose.models.Offer ||
  mongoose.model("Offer", offerSchema)) as mongoose.Model<InferSchemaType<typeof offerSchema>>;
