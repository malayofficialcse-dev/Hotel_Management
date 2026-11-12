import cors from "cors";
import express from "express";
import { prisma } from "./config/database.js";
import { employeeRoutes } from "./routes/employee.routes.js";

export function createApp(grpcPort: number) {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.json({ status: "UP", service: "employee-service", runtime: "node-express", grpcPort });
    } catch {
      return res.status(503).json({ status: "DOWN", service: "employee-service", runtime: "node-express", grpcPort });
    }
  });
  app.use("/api/v1/employees", employeeRoutes);
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[Employee Service] request failed", error);
    res.status(500).json({ message: "Internal server error" });
  });
  return app;
}
