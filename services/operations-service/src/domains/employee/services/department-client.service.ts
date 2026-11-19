import { DepartmentModel } from "../../department/models/department.model.js";

export interface DepartmentSummary {
  _id?: string;
  id?: string;
  name: string;
  hotelId: string;
  isActive?: boolean;
}

function decodeDepartments(reply: { json: string }): DepartmentSummary[] {
  const parsed: unknown = JSON.parse(reply.json || "[]");
  if (!Array.isArray(parsed)) throw new Error("Department service returned an invalid response");
  return parsed as DepartmentSummary[];
}

export class DepartmentClientService {
  async list() {
    return DepartmentModel.find({ isActive: true }).lean<DepartmentSummary[]>();
  }

  async requireDepartment(id: string) {
    const department = await DepartmentModel.findById(id).lean<DepartmentSummary>();
    if (!department) throw new Error("Department not found");
    return department;
  }
}
