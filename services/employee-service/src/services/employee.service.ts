import { DepartmentClientService } from "./department-client.service.js";
import { EmployeeRepository } from "../repositories/employee.repository.js";
import { employeeFields } from "../models/employee.model.js";

const repository = new EmployeeRepository();
const departments = new DepartmentClientService();

function pickFields(body: Record<string, unknown>) {
  return Object.fromEntries(employeeFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
}

export class EmployeeService {
  async list(departmentId?: string) {
    const [employees, departmentList] = await Promise.all([
      repository.list(departmentId),
      departments.list(),
    ]);
    const byId = new Map(departmentList.map((department) => [department.id || department._id || "", department]));
    return employees.map((employee) => ({ ...employee, department: byId.get(employee.departmentId) || null }));
  }

  async get(id: string) {
    const employee = await repository.findById(id);
    if (!employee || !employee.isActive) return null;
    const department = await departments.requireDepartment(employee.departmentId);
    return { ...employee, department };
  }

  async create(body: Record<string, unknown>) {
    const data = pickFields(body);
    for (const field of ["userId", "departmentId", "name", "email", "position", "joiningDate"]) {
      if (typeof data[field] !== "string" || !data[field]) throw new Error(`${field} is required`);
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(data.userId))) {
      throw new Error("userId must be a valid UUID for an existing auth user");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email).trim())) {
      throw new Error("email must be valid");
    }
    if (Number.isNaN(new Date(String(data.joiningDate)).getTime())) throw new Error("joiningDate must be a valid date");
    const salary = data.salary === undefined || data.salary === null ? undefined : Number(data.salary);
    if (salary !== undefined && (!Number.isFinite(salary) || salary < 0)) {
      throw new Error("salary must be a non-negative number");
    }
    const department = await departments.requireDepartment(String(data.departmentId));
    const employee = await repository.create({
      userId: String(data.userId),
      departmentId: department.id || department._id || String(data.departmentId),
      name: String(data.name).trim(),
      email: String(data.email).trim().toLowerCase(),
      phone: typeof data.phone === "string" ? data.phone : undefined,
      position: String(data.position).trim(),
      joiningDate: new Date(String(data.joiningDate)),
      salary,
    });
    return { ...employee, department };
  }

  async update(id: string, body: Record<string, unknown>) {
    const data = pickFields(body);
    if (Object.keys(data).length === 0) throw new Error("at least one supported field is required");
    if (data.departmentId !== undefined) {
      const department = await departments.requireDepartment(String(data.departmentId));
      data.departmentId = department.id || department._id || data.departmentId;
    }
    if (data.joiningDate !== undefined) {
      const date = new Date(String(data.joiningDate));
      if (Number.isNaN(date.getTime())) throw new Error("joiningDate must be a valid date");
      data.joiningDate = date;
    }
    if (data.email !== undefined) data.email = String(data.email).trim().toLowerCase();
    return repository.update(id, data);
  }

  deactivate(id: string) {
    return repository.deactivate(id);
  }

  listDepartments() {
    return departments.list();
  }
}
