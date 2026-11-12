import { DepartmentModel } from "../models/department.model.js";
export class DepartmentRepository {
    list(hotelId) {
        return DepartmentModel.find(hotelId ? { hotelId } : {})
            .sort({ createdAt: -1 })
            .lean();
    }
    findById(id) {
        return DepartmentModel.findById(id).lean();
    }
    create(data) {
        return DepartmentModel.create(data);
    }
    update(id, data) {
        return DepartmentModel.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        }).lean();
    }
    delete(id) {
        return DepartmentModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    }
}
