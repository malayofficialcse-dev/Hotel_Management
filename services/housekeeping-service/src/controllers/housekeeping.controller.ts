import type { Request, Response } from "express";
import { status as grpcStatus } from "@grpc/grpc-js";
import { HousekeepingService } from "../services/housekeeping.service.js";

const service = new HousekeepingService();

function dependencyStatus(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return 400;
  return error.code === grpcStatus.UNAVAILABLE || error.code === grpcStatus.DEADLINE_EXCEEDED ? 503 : 400;
}

export class HousekeepingController {
  async list(req: Request, res: Response) {
    try {
      return res.json(
        await service.list(
          typeof req.query.hotelId === "string" ? req.query.hotelId : undefined,
          typeof req.query.status === "string" ? req.query.status : undefined,
        ),
      );
    } catch (error) {
      return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid filters" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      return res.status(201).json(await service.create(req.body));
    } catch (error) {
      return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid task" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const task = await service.update(req.params.id, req.body);
      if (!task) return res.status(404).json({ message: "Housekeeping task not found" });
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
