import mongoose, { type InferSchemaType } from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    city: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true, trim: true },
    mainImage: { type: String, default: "" },
    galleryImages: { type: [String], default: [] },
    basePrice: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    tag: { type: String, default: "" },
    offer: { type: String, default: "" },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "", maxlength: 5000 },
    amenities: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

hotelSchema.index({ city: 1, category: 1, isActive: 1 });
hotelSchema.index({ name: "text", city: "text", location: "text" });

export type Hotel = InferSchemaType<typeof hotelSchema> & { id: string };
export const HotelModel = (mongoose.models.Hotel ||
  mongoose.model("Hotel", hotelSchema)) as mongoose.Model<InferSchemaType<typeof hotelSchema>>;
