import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
  @Prop({ type: String, required: true, index: true })
  hotelId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, default: 2 })
  capacity: number;

  @Prop({ type: Number, default: 5 })
  totalInventory: number;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: String, default: "King Bed" })
  bedType: string;

  @Prop({ type: String, default: "380 sq.ft" })
  roomSize: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.index({ hotelId: 1, price: 1 });
