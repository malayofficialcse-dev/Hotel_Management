import { Router } from "express";
import { RoomController } from "../controllers/room.controller.js";
import multer from "multer";
import { imageUpload } from "../middleware/image-upload.js";

const controller = new RoomController();
export const roomRoutes = Router();

roomRoutes.post("/images", (req, res, next) => {
  imageUpload.single("image")(req, res, (error) => {
    if (error) {
      const status = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ message: error.message });
    }
    void controller.uploadImage(req, res).catch(next);
  });
});
roomRoutes.get("/hotel/:hotelId", (req, res, next) => void controller.getByHotel(req, res).catch(next));
roomRoutes.get("/", (req, res, next) => void controller.list(req, res).catch(next));
roomRoutes.post("/", (req, res, next) => void controller.create(req, res).catch(next));
roomRoutes.get("/:id/availability", (req, res, next) => void controller.availability(req, res).catch(next));
roomRoutes.get("/:id", (req, res, next) => void controller.get(req, res).catch(next));
roomRoutes.patch("/:id", (req, res, next) => void controller.update(req, res).catch(next));
roomRoutes.put("/:id", (req, res, next) => void controller.update(req, res).catch(next));
roomRoutes.delete("/:id", (req, res, next) => void controller.delete(req, res).catch(next));
