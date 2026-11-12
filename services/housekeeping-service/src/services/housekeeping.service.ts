import { HousekeepingRepository } from "../repositories/housekeeping.repository.js";
import { taskStatuses, type TaskStatus } from "../models/housekeeping-task.model.js";
import { requireEmployee } from "./employee-client.service.js";

const repository = new HousekeepingRepository();
const editableFields = ["hotelId", "roomNumber", "status", "assignedTo", "taskType", "priority", "checklist", "notes", "inspectedBy"];

function pickFields(body: Record<string, unknown>) {
  return Object.fromEntries(editableFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
}

export class HousekeepingService {
  list(hotelId?: string, status?: string) {
    if (status && !taskStatuses.includes(status as TaskStatus)) throw new Error("status is invalid");
    return repository.list({ hotelId, status: status as TaskStatus | undefined });
  }

  async create(body: Record<string, unknown>) {
    const data = pickFields(body);
    for (const field of ["hotelId", "roomNumber"]) {
      if (typeof data[field] !== "string" || !data[field]) throw new Error(`${field} is required`);
    }
    if (data.assignedTo) await requireEmployee(String(data.assignedTo));
    return repository.create(data);
  }

  async update(id: string, body: Record<string, unknown>) {
    const data = pickFields(body);
    if (Object.keys(data).length === 0) throw new Error("at least one supported field is required");
    if (data.status !== undefined && !taskStatuses.includes(data.status as TaskStatus)) {
      throw new Error("status is invalid");
    }
    if (data.assignedTo) await requireEmployee(String(data.assignedTo));
    if (data.status === "CLEAN" || data.status === "INSPECTED") data.completedAt = new Date();
    return repository.update(id, data);
  }

  delete(id: string) {
    return repository.delete(id);
  }
}
