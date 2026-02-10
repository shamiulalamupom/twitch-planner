import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().default("4000"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(16).or(z.string().min(1)), // keep dev-friendly, change later
  DATABASE_URL: z.string().min(1),
});

export const env = EnvSchema.parse(process.env);
