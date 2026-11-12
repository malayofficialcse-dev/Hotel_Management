import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { RoomController } from "./controllers/room.controller.js";
import { roomRoutes } from "./routes/room.routes.js";

export function createApp(grpcPort: number) {
  const app = express();
  const controller = new RoomController();
  app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", (_req, res) => {
    const ready = mongoose.connection.readyState === 1;
    return res.status(ready ? 200 : 503).json({
      status: ready ? "UP" : "DOWN",
      service: "room-service",
      runtime: "node-express",
      grpcPort,
    });
  });
  app.use("/api/v1/rooms", roomRoutes);
  app.get("/internal/rooms/:id/inventory", (req, res, next) =>
    void controller.inventory(req, res).catch(next),
  );
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[Room Service] request failed", error);
    res.status(500).json({ message: "Internal server error" });
  });
  return app;
}
