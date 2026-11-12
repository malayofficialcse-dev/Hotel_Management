import { Router } from "express";
import { HotelController } from "../controllers/hotel.controller.js";

const controller = new HotelController();
export const hotelRoutes = Router();

hotelRoutes.get("/", (req, res, next) => void controller.list(req, res).catch(next));
hotelRoutes.post("/", (req, res, next) => void controller.create(req, res).catch(next));
hotelRoutes.get("/:identifier", (req, res, next) => void controller.get(req, res).catch(next));
hotelRoutes.patch("/:identifier", (req, res, next) => void controller.update(req, res).catch(next));
hotelRoutes.put("/:identifier", (req, res, next) => void controller.update(req, res).catch(next));
hotelRoutes.delete("/:identifier", (req, res, next) => void controller.delete(req, res).catch(next));
