import cors from "cors";
import express from "express";
import { Server } from "node:http";
import { hotelRoutes } from "./domains/hotel/routes/hotel.routes.js";
import { offerRoutes } from "./domains/hotel/routes/offer.routes.js";
import { roomRoutes } from "./domains/room/routes/room.routes.js";
import { departmentRoutes } from "./domains/department/routes/department.routes.js";
import { employeeRoutes } from "./domains/employee/routes/employee.routes.js";
import { housekeepingRoutes } from "./domains/housekeeping/routes/housekeeping.routes.js";
import { reviewRoutes } from "./domains/review/routes/review.routes.js";
import { prisma } from "./domains/employee/config/database.js";
import { attachWebSocketGateway } from "./domains/housekeeping/websocket/ws-gateway.js";
import { catalogDb, departmentDb, housekeepingDb, reviewDb } from "./config/databases.js";

export async function createApp() {
  const app = express();
  const allowedClientOrigins = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
  try {
    const configuredOrigin = new URL(process.env.CLIENT_URL || "http://localhost:3000").origin;
    if (["http:", "https:"].includes(new URL(configuredOrigin).protocol)) {
      allowedClientOrigins.add(configuredOrigin);
    }
  } catch {
    console.warn("[Operations Service] Ignoring invalid CLIENT_URL; using local frontend origins.");
  }
  app.use(cors({ origin: [...allowedClientOrigins], credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.get("/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const mongoReady = [catalogDb, departmentDb, housekeepingDb, reviewDb].every(
        (connection) => connection.readyState === 1,
      );
      if (!mongoReady) throw new Error("MongoDB connection unavailable");
      return res.json({
        status: "UP",
        service: "operations-service",
        domains: ["hotel", "room", "department", "employee", "housekeeping", "review"],
      });
    } catch {
      return res.status(503).json({ status: "DEGRADED", service: "operations-service" });
    }
  });

  app.use("/api/v1/hotels", hotelRoutes);
  app.use("/internal/hotels", hotelRoutes);
  app.use("/api/v1/offers", offerRoutes);
  app.use("/api/v1/rooms", roomRoutes);
  app.use("/internal/rooms", roomRoutes);
  app.get("/internal/rooms/:id/inventory", async (req, res, next) => {
    try {
      const { RoomController } = await import("./domains/room/controllers/room.controller.js");
      await new RoomController().inventory(req, res);
    } catch (error) {
      next(error);
    }
  });
  app.use("/api/v1/departments", departmentRoutes);
  app.use("/api/v1/employees", employeeRoutes);
  app.use("/api/v1/housekeeping", housekeepingRoutes);
  app.use("/api/v1/reviews", reviewRoutes);
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[Operations Service] request failed", error);
    res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
  });
  const server = new Server(app);
  await attachWebSocketGateway(server);
  return server;
}
