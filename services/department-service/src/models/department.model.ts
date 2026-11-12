import mongoose, { type InferSchemaType } from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    hotelId: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 1000 },
    headId: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

departmentSchema.index({ hotelId: 1, name: 1 }, { unique: true });

export type Department = InferSchemaType<typeof departmentSchema> & { id: string };
export const DepartmentModel =
  mongoose.models.Department || mongoose.model("Department", departmentSchema);
