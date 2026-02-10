import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { ApiError, asyncHandler } from "../lib/http";

const router = Router();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { email, password } = SignupSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "Email already in use");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: {
        id: true,
        email: true,
        twitchUrl: true,
        logoUrl: true,
        createdAt: true,
      },
    });

    const token = jwt.sign({}, env.JWT_SECRET, {
      subject: user.id,
      expiresIn: "7d",
    });
    res.status(201).json({ token, user });
  }),
);

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError(401, "Invalid credentials");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Invalid credentials");

    const token = jwt.sign({}, env.JWT_SECRET, {
      subject: user.id,
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        twitchUrl: user.twitchUrl,
        logoUrl: user.logoUrl,
        createdAt: user.createdAt,
      },
    });
  }),
);

export default router;
