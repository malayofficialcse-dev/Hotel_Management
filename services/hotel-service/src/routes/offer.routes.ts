import { Router, type Request, type Response, type NextFunction } from "express";
import { OfferController } from "../controllers/offer.controller.js";

const controller = new OfferController();
export const offerRoutes = Router();

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Administrator authentication is required." });
  }

  const authServiceUrl = (process.env.AUTH_SERVICE_URL || "http://localhost:8001").replace(/\/$/, "");
  try {
    const response = await fetch(`${authServiceUrl}/internal/auth/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: authorization.slice("Bearer ".length) }),
    });
    if (!response.ok) return res.status(401).json({ message: "Invalid or expired administrator token." });
    const result = await response.json() as { valid?: boolean; user?: { role?: string } };
    if (!result.valid || !result.user) return res.status(401).json({ message: "Invalid or expired administrator token." });
    if (result.user.role !== "ADMIN") return res.status(403).json({ message: "Administrator access is required." });
    next();
  } catch {
    return res.status(503).json({ message: "Auth service is unavailable." });
  }
}

offerRoutes.use(requireAdmin);
offerRoutes.get("/", (req, res, next) => void controller.list(req, res).catch(next));
offerRoutes.post("/", (req, res, next) => void controller.create(req, res).catch(next));
offerRoutes.delete("/:id", (req, res, next) => void controller.deactivate(req, res).catch(next));
