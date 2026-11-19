import type { Request, Response } from "express";
import { HotelService } from "../services/hotel.service.js";
import { uploadHotelImage } from "../services/cloudinary.service.js";

const service = new HotelService();

function optionalNumber(value: unknown, name: string) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a number`);
  return parsed;
}

export class HotelController {
  async uploadImage(req: Request, res: Response) {
    if (!req.file) return res.status(400).json({ message: "An image file is required." });
    try {
      return res.status(201).json(await uploadHotelImage(req.file));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloudinary image upload failed.";
      const status = message.startsWith("CLOUDINARY_URL") ? 503 : 502;
      if (status === 502) console.error("[Hotel Service] Cloudinary upload failed", error);
      return res.status(status).json({ message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const data = await service.list({
        city: typeof req.query.city === "string" ? req.query.city : undefined,
        category: typeof req.query.category === "string" ? req.query.category : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        minPrice: optionalNumber(req.query.minPrice, "minPrice"),
        maxPrice: optionalNumber(req.query.maxPrice, "maxPrice"),
        includeInactive: req.query.includeInactive === "true",
      });
      return res.json(data);
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Invalid filters" });
    }
  }

  async get(req: Request, res: Response) {
    const hotel = await service.get(req.params.identifier);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    return res.json(hotel);
  }

  async create(req: Request, res: Response) {
    try {
      return res.status(201).json(await service.create(req.body));
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Invalid hotel" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const hotel = await service.update(req.params.identifier, req.body);
      if (!hotel) return res.status(404).json({ message: "Hotel not found" });
      return res.json(hotel);
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Invalid hotel" });
    }
  }

  async delete(req: Request, res: Response) {
    const hotel = await service.delete(req.params.identifier);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    return res.status(204).end();
  }
}
