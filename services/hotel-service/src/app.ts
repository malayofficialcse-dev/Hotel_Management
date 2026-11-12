import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { hotelRoutes } from "./routes/hotel.routes.js";

export function createApp(grpcPort: number) {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", (_req, res) => {
    const ready = mongoose.connection.readyState === 1;
    return res.status(ready ? 200 : 503).json({
      status: ready ? "UP" : "DOWN",
      service: "hotel-service",
      runtime: "node-express",
      grpcPort,
    });
  });
  app.use("/api/v1/hotels", hotelRoutes);
  app.use("/internal/hotels", hotelRoutes);
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[Hotel Service] request failed", error);
    res.status(500).json({ message: "Internal server error" });
  });
  return app;
}
