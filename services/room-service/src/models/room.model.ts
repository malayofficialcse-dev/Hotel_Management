import mongoose, { type InferSchemaType } from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    totalInventory: { type: Number, required: true, min: 0 },
    amenities: { type: [String], default: [] },
    bedType: { type: String, default: "" },
    roomSize: { type: String, default: "" },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

roomSchema.index({ hotelId: 1, name: 1 }, { unique: true });

export type Room = InferSchemaType<typeof roomSchema> & { id: string };
export const RoomModel = (mongoose.models.Room ||
  mongoose.model("Room", roomSchema)) as mongoose.Model<InferSchemaType<typeof roomSchema>>;
