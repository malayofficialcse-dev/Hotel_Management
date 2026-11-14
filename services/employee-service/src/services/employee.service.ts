import { randomUUID } from "node:crypto";
import { DepartmentClientService } from "./department-client.service.js";
import { EmployeeRepository } from "../repositories/employee.repository.js";
import { employeeFields } from "../models/employee.model.js";

const repository = new EmployeeRepository();
const departments = new DepartmentClientService();

function getHotelShortCode(hotelName?: string, hotelId?: string): string {
  if (hotelName && hotelName.trim()) {
    const words = hotelName.trim().split(/[\s-_]+/);
    if (words.length > 1) {
      return words.map((w) => w[0]).join("").toUpperCase().slice(0, 4);
    }
    return hotelName.trim().slice(0, 3).toUpperCase();
  }
  if (hotelId && hotelId.trim()) {
    const words = hotelId.trim().split(/[\s-_]+/);
    if (words.length > 1) {
      return words.map((w) => w[0]).join("").toUpperCase().slice(0, 4);
    }
    return hotelId.trim().slice(0, 3).toUpperCase();
  }
  return "HTL";
}

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
    for (const field of ["departmentId", "name", "email", "position", "joiningDate"]) {
      if (typeof data[field] !== "string" || !data[field]) throw new Error(`${field} is required`);
    }

    let userId = typeof data.userId === "string" && data.userId.trim() ? data.userId.trim() : "";
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      userId = randomUUID();
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
    const hotelId = String(data.hotelId || department.hotelId || "");

    const hotelShort = getHotelShortCode(
      typeof data.hotelName === "string" ? data.hotelName : undefined,
      hotelId
    );
    const prefix = `${hotelShort}/EMP/`;
    const count = await repository.countByPrefixOrHotel(prefix, hotelId);
    const seq = String(count + 1).padStart(4, "0");
    const employeeCode = `${prefix}${seq}`;

    const employee = await repository.create({
      userId,
      employeeCode,
      hotelId: hotelId || undefined,
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
