import type { Request, Response } from "express";
import { HousekeepingService } from "../services/housekeeping.service.js";
import { emitRoomStatusChange } from "../websocket/ws-gateway.js";

const service = new HousekeepingService();

function dependencyStatus(error: unknown) {
  return error instanceof Error && error.message.includes("unavailable") ? 503 : 400;
}

export class HousekeepingController {
  async list(req: Request, res: Response) {
    try {
      return res.json(
        await service.list(
          typeof req.query.hotelId === "string" ? req.query.hotelId : undefined,
          typeof req.query.status === "string" ? req.query.status : undefined,
          typeof req.query.taskDate === "string" ? req.query.taskDate : undefined,
          typeof req.query.departmentId === "string" ? req.query.departmentId : undefined,
        ),
      );
    } catch (error) {
      return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid filters" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const task = await service.create(req.body);
      // Emit real-time WS event
      emitRoomStatusChange({
        event: "housekeeping.task_created",
        taskId: String((task as { _id?: unknown })._id ?? ""),
        hotelId: (task as { hotelId?: string }).hotelId ?? req.body.hotelId ?? "",
        roomNumber: (task as { roomNumber?: string }).roomNumber ?? req.body.roomNumber ?? "",
        status: (task as { status?: string }).status ?? "DIRTY",
        priority: (task as { priority?: string }).priority,
        assignedTo: (task as { assignedTo?: string }).assignedTo,
        taskType: (task as { taskType?: string }).taskType,
        timestamp: new Date().toISOString(),
      });
      return res.status(201).json(task);
    } catch (error) {
      return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid task" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const task = await service.update(req.params.id, req.body);
      if (!task) return res.status(404).json({ message: "Housekeeping task not found" });
      // Emit real-time WS event
      emitRoomStatusChange({
        event: "room.status_changed",
        taskId: String((task as { _id?: unknown })._id ?? req.params.id),
        hotelId: (task as { hotelId?: string }).hotelId ?? "",
        roomNumber: (task as { roomNumber?: string }).roomNumber ?? "",
        status: (task as { status?: string }).status ?? "",
        priority: (task as { priority?: string }).priority,
        assignedTo: (task as { assignedTo?: string }).assignedTo,
        taskType: (task as { taskType?: string }).taskType,
        guestName: (task as { guestName?: string }).guestName,
        bookingReference: (task as { bookingReference?: string }).bookingReference,
        updatedBy: typeof req.body.updatedBy === "string" ? req.body.updatedBy : undefined,
        timestamp: new Date().toISOString(),
      });
      return res.json(task);
    } catch (error) {
      return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid task" });
    }
  }

  async delete(req: Request, res: Response) {
    const task = await service.delete(req.params.id);
    if (!task) return res.status(404).json({ message: "Housekeeping task not found" });
    return res.status(204).end();
  }
}
