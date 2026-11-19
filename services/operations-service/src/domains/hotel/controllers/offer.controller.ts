import type { Request, Response } from "express";
import { OfferService } from "../services/offer.service.js";

const service = new OfferService();

export class OfferController {
  async list(req: Request, res: Response) {
    const rows = await service.list(req.query.includeInactive === "true");
    return res.json(rows);
  }

  async create(req: Request, res: Response) {
    try {
      return res.status(201).json(await service.create(req.body));
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Invalid offer" });
    }
  }

  async deactivate(req: Request, res: Response) {
    const offer = await service.deactivate(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    return res.json(offer);
  }
}
