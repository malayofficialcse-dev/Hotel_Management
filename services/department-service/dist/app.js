import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { departmentRoutes } from "./routes/department.routes.js";
export function createApp(grpcPort) {
    const app = express();
    app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
    app.use(express.json({ limit: "1mb" }));
    app.get("/health", (_req, res) => {
        const ready = mongoose.connection.readyState === 1;
        return res.status(ready ? 200 : 503).json({
            status: ready ? "UP" : "DOWN",
            service: "department-service",
            runtime: "node-express",
            grpcPort,
        });
    });
    app.use("/api/v1/departments", departmentRoutes);
    app.use((error, _req, res, _next) => {
        console.error("[Department Service] request failed", error);
        res.status(500).json({ message: "Internal server error" });
    });
    return app;
}
