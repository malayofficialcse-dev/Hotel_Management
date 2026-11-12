import { DepartmentModel } from "../models/department.model.js";

export class DepartmentRepository {
  list(hotelId?: string) {
    return DepartmentModel.find(hotelId ? { hotelId } : {})
      .sort({ createdAt: -1 })
      .lean();
  }

  findById(id: string) {
    return DepartmentModel.findById(id).lean();
  }

  create(data: Record<string, unknown>) {
    return DepartmentModel.create(data);
  }

  update(id: string, data: Record<string, unknown>) {
    return DepartmentModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }

  delete(id: string) {
    return DepartmentModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  }
}
