import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../lib/env";
import { ApiError } from "../lib/http";

export type AuthUser = { id: string };
export type AuthedRequest = Request & { user?: AuthUser };

export function requireAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer "))
    return next(new ApiError(401, "Missing token"));

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string };
    if (!payload.sub) return next(new ApiError(401, "Invalid token"));
    req.user = { id: payload.sub };
    next();
  } catch {
    next(new ApiError(401, "Invalid token"));
  }
}
