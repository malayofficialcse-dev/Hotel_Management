import { Router } from "express";
import { HotelController } from "../controllers/hotel.controller.js";
import multer from "multer";
import { imageUpload } from "../middleware/image-upload.js";

const controller = new HotelController();
export const hotelRoutes = Router();

hotelRoutes.post("/images", (req, res, next) => {
  imageUpload.single("image")(req, res, (error) => {
    if (error) {
      const status = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ message: error.message });
    }
    void controller.uploadImage(req, res).catch(next);
  });
});
hotelRoutes.get("/", (req, res, next) => void controller.list(req, res).catch(next));
hotelRoutes.post("/", (req, res, next) => void controller.create(req, res).catch(next));
hotelRoutes.get("/:identifier", (req, res, next) => void controller.get(req, res).catch(next));
hotelRoutes.patch("/:identifier", (req, res, next) => void controller.update(req, res).catch(next));
hotelRoutes.put("/:identifier", (req, res, next) => void controller.update(req, res).catch(next));
hotelRoutes.delete("/:identifier", (req, res, next) => void controller.delete(req, res).catch(next));
