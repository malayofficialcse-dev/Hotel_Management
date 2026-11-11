import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ _id: false })
class RatingsBreakdown {
  @Prop({ type: Number, min: 1, max: 5 })
  cleanliness?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  comfort?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  location?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  service?: number;

  @Prop({ type: Number, min: 1, max: 5 })
  valueForMoney?: number;
}

const RatingsBreakdownSchema = SchemaFactory.createForClass(RatingsBreakdown);

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: String, required: true, index: true })
  hotelId: string;

  @Prop({ type: String })
  userId?: string;

  @Prop({ type: String, required: true })
  userName: string;

  @Prop({ type: String })
  userAvatar?: string;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String })
  title?: string;

  @Prop({ type: String, required: true })
  comment: string;

  @Prop({ type: RatingsBreakdownSchema })
  ratingsBreakdown?: RatingsBreakdown;

  @Prop({ type: Date })
  stayDate?: Date;

  @Prop({ type: Boolean, default: false })
  verifiedBooking: boolean;

  @Prop({ type: String })
  bookingCode?: string;

  @Prop({ type: Number, default: 0 })
  helpfulCount: number;

  @Prop({ type: Boolean, default: true })
  isApproved: boolean;

  @Prop({ type: Boolean, default: false })
  isHidden: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Compound indexes
ReviewSchema.index({ hotelId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1 });
