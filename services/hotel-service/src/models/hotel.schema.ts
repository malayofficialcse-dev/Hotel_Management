import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type HotelDocument = Hotel & Document;

@Schema({ timestamps: true })
export class Hotel {
  @Prop({ type: String, required: true, unique: true, index: true })
  slug: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, index: true })
  city: string;

  @Prop({ type: String, required: true })
  location: string;

  @Prop({ type: String })
  address?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ type: String, required: true })
  mainImage: string;

  @Prop({ type: [String], default: [] })
  galleryImages: string[];

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, required: true, index: true })
  basePrice: number;

  @Prop({ type: Number, default: 4.8 })
  rating: number;

  @Prop({ type: Number, default: 0 })
  reviewsCount: number;

  @Prop({ type: String, required: true, index: true })
  category: string;

  @Prop({ type: String })
  tag?: string;

  @Prop({ type: String })
  offer?: string;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const HotelSchema = SchemaFactory.createForClass(Hotel);
HotelSchema.index({ city: 1, category: 1, basePrice: 1 });
