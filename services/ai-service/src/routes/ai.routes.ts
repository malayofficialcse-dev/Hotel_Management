import { Router } from "express";
import {
  chatHandler,
  syncVectorsHandler,
  healthHandler,
  tracesHandler,
} from "../controllers/ai.controller.js";

export const aiRouter = Router();

aiRouter.post("/chat", chatHandler);
aiRouter.post("/sync-vectors", syncVectorsHandler);
aiRouter.get("/health", healthHandler);
aiRouter.get("/traces", tracesHandler);
