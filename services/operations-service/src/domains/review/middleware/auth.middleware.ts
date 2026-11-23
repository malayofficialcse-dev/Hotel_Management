import type { NextFunction, Request, Response } from "express";
import axios from "axios";
export type ReviewUser = { id: string; email: string; role: string };
export type ReviewRequest = Request & { user?: ReviewUser | any };
export async function reviewAuth(req: Request, res: Response, next: NextFunction) {
  const reviewReq = req as ReviewRequest;
  const forwardedId = req.header("x-user-id");
  if (forwardedId) { reviewReq.user = { id: forwardedId, email: req.header("x-user-email") || "", role: req.header("x-user-role") || "" }; return next(); }
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try { const response = await axios.post(`${process.env.AUTH_SERVICE_URL || "http://localhost:8001"}/internal/auth/validate`, { token }, { timeout: 4000 }); reviewReq.user = response.data.user; next(); }
  catch { res.status(401).json({ message: "Invalid or expired token" }); }
}
