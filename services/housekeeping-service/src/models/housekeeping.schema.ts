import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type HousekeepingDocument = HousekeepingTask & Document;

export enum CleaningStatus {
  CLEAN = "CLEAN",
  DIRTY = "DIRTY",
  IN_PROGRESS = "IN_PROGRESS",
  INSPECTED = "INSPECTED",
}

@Schema({ timestamps: true })
export class HousekeepingTask {
  @Prop({ type: String, required: true, index: true })
  hotelId: string;

  @Prop({ type: String, required: true, index: true })
  roomNumber: string;

  @Prop({ type: String, enum: CleaningStatus, default: CleaningStatus.DIRTY })
  status: CleaningStatus;

  @Prop({ type: String })
  assignedTo?: string;

  @Prop({ type: String, default: "STANDARD" })
  taskType: string;

  @Prop({ type: [String], default: [] })
  checklist: string[];

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: String })
  inspectedBy?: string;
}

export const HousekeepingTaskSchema = SchemaFactory.createForClass(HousekeepingTask);
HousekeepingTaskSchema.index({ hotelId: 1, status: 1 });
