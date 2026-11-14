import mongoose, { type InferSchemaType } from "mongoose";

export const taskStatuses = ["DIRTY", "IN_PROGRESS", "CLEAN", "INSPECTED", "MAINTENANCE"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

const housekeepingTaskSchema = new mongoose.Schema(
  {
    hotelId: { type: String, required: true, trim: true, index: true },
    roomNumber: { type: String, required: true, trim: true, index: true },
    taskDate: { type: String, trim: true, default: "", index: true },
    scheduledDate: { type: Date },
    guestName: { type: String, trim: true, default: "" },
    guestEmail: { type: String, trim: true, default: "" },
    guestPhone: { type: String, trim: true, default: "" },
    bookingReference: { type: String, trim: true, default: "" },
    checkInDate: { type: String, trim: true, default: "" },
    checkOutDate: { type: String, trim: true, default: "" },
    status: { type: String, enum: taskStatuses, default: "DIRTY", index: true },
    assignedTo: { type: String, trim: true, default: "" },
    taskType: { type: String, trim: true, default: "STANDARD" },
    priority: { type: String, enum: ["LOW", "NORMAL", "HIGH", "URGENT"], default: "NORMAL" },
    checklist: { type: [String], default: [] },
    notes: { type: String, default: "", maxlength: 2000 },
    inspectedBy: { type: String, trim: true, default: "" },
    completedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

housekeepingTaskSchema.index({ hotelId: 1, status: 1, updatedAt: -1 });

export type HousekeepingTask = InferSchemaType<typeof housekeepingTaskSchema> & { id: string };
type HousekeepingTaskDocument = InferSchemaType<typeof housekeepingTaskSchema>;
const existingHousekeepingTaskModel = mongoose.models.HousekeepingTask as
  | mongoose.Model<HousekeepingTaskDocument>
  | undefined;
export const HousekeepingTaskModel: mongoose.Model<HousekeepingTaskDocument> =
  existingHousekeepingTaskModel ??
  mongoose.model<HousekeepingTaskDocument>("HousekeepingTask", housekeepingTaskSchema);
