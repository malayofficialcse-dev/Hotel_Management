import { Router } from "express";
import { HousekeepingController } from "../controllers/housekeeping.controller.js";

const controller = new HousekeepingController();
export const housekeepingRoutes = Router();

housekeepingRoutes.get("/", (req, res, next) => void controller.list(req, res).catch(next));
housekeepingRoutes.get("/hotel/:hotelId", (req, res, next) => {
  req.query.hotelId = req.params.hotelId;
  void controller.list(req, res).catch(next);
});
housekeepingRoutes.post("/", (req, res, next) => void controller.create(req, res).catch(next));
housekeepingRoutes.patch("/:id", (req, res, next) => void controller.update(req, res).catch(next));
housekeepingRoutes.put("/:id", (req, res, next) => void controller.update(req, res).catch(next));
housekeepingRoutes.delete("/:id", (req, res, next) => void controller.delete(req, res).catch(next));
