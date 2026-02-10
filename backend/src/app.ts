import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./lib/env";
import { ApiError } from "./lib/http";

import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import planningRoutes from "./routes/plannings";
import eventRoutes from "./routes/events";
import { setupSwagger } from "./swagger";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRoutes);
  app.use("/me", meRoutes);
  app.use("/plannings", planningRoutes);
  app.use("/", eventRoutes);

  setupSwagger(app);

  // 404
  app.use((_req, _res, next) => next(new ApiError(404, "Not found")));

  // error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err?.status ?? 500;
    const message = err?.message ?? "Internal server error";
    const details = err?.details;

    if (status >= 500) console.error(err);

    res.status(status).json({ error: { message, details } });
  });

  return app;
}
