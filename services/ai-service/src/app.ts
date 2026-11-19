import express from "express";
import cors from "cors";
import { aiRouter } from "./routes/ai.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Mount AI routes at both root and /api/v1/ai for direct and gateway proxies
  app.use("/api/v1/ai", aiRouter);
  app.use("/", aiRouter);

  return app;
}
