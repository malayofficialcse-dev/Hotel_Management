import { Router } from "express";
import { RoomController } from "../controllers/room.controller.js";

const controller = new RoomController();
export const roomRoutes = Router();

roomRoutes.get("/hotel/:hotelId", (req, res, next) => void controller.getByHotel(req, res).catch(next));
roomRoutes.get("/", (req, res, next) => void controller.list(req, res).catch(next));
roomRoutes.post("/", (req, res, next) => void controller.create(req, res).catch(next));
roomRoutes.get("/:id/availability", (req, res, next) => void controller.availability(req, res).catch(next));
roomRoutes.get("/:id", (req, res, next) => void controller.get(req, res).catch(next));
roomRoutes.patch("/:id", (req, res, next) => void controller.update(req, res).catch(next));
roomRoutes.put("/:id", (req, res, next) => void controller.update(req, res).catch(next));
roomRoutes.delete("/:id", (req, res, next) => void controller.delete(req, res).catch(next));
