import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function generateTokenPair(payload: { id: string; email: string; name: string; role: string; hotelId?: string; departmentId?: string }) {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: payload.id, role: payload.role, hotelId: payload.hotelId, departmentId: payload.departmentId }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

  return { accessToken, refreshToken, expiresIn: 900 };
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

