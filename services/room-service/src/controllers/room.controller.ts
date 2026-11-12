import type { Request, Response } from "express";
import { status as grpcStatus } from "@grpc/grpc-js";
import { RoomService } from "../services/room.service.js";

const service = new RoomService();

function dependencyStatus(error: unknown) {
  if (error instanceof Error && error.message === "Hotel not found") return 404;
  if (typeof error !== "object" || error === null || !("code" in error)) return 400;
  const code = error.code;
  if (code === 11000) return 409;
  if (code === grpcStatus.UNAVAILABLE || code === grpcStatus.DEADLINE_EXCEEDED) return 503;
  if (code === grpcStatus.NOT_FOUND) return 404;
  return 400;
}

export class RoomController {
  async list(req: Request, res: Response) {
    const hotelId = typeof req.query.hotelId === "string" ? req.query.hotelId : undefined;
    res.json(await service.list(hotelId, req.query.includeInactive === "true"));
  }

  async getByHotel(req: Request, res: Response) {
    res.json(await service.list(req.params.hotelId));
  }

  async get(req: Request, res: Response) {
    const room = await service.get(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    return res.json(room);
  }

  async create(req: Request, res: Response) {
    try {
      return res.status(201).json(await service.create(req.body));
    } catch (error) {
      return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid room" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const room = await service.update(req.params.id, req.body);
      if (!room) return res.status(404).json({ message: "Room not found" });
      return res.json(room);
    } catch (error) {
      return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid room" });
    }
  }

  async delete(req: Request, res: Response) {
    const room = await service.delete(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    return res.status(204).end();
  }

  async availability(req: Request, res: Response) {
    try {
      const room = await service.availability(
        req.params.id,
        typeof req.query.checkIn === "string" ? req.query.checkIn : "",
        typeof req.query.checkOut === "string" ? req.query.checkOut : "",
        Number(req.query.count || 1),
      );
      if (!room) return res.status(404).json({ message: "Room not found" });
      return res.json(room);
    } catch (error) {
      return res.status(dependencyStatus(error)).json({ message: error instanceof Error ? error.message : "Invalid availability request" });
    }
  }

  async inventory(req: Request, res: Response) {
    try {
      const availability = await service.availability(
        req.params.id,
        typeof req.query.checkIn === "string" ? req.query.checkIn : "",
        typeof req.query.checkOut === "string" ? req.query.checkOut : "",
        1,
      );
      if (!availability) return res.status(404).json({ message: "Room not found" });
      return res.json({ inventory: availability.totalInventory, ...availability });
    } catch (error) {
      return res.status(503).json({ message: error instanceof Error ? error.message : "Inventory unavailable" });
    }
  }
}
