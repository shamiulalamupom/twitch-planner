import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { ApiError, asyncHandler } from "../lib/http";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twitchUrl: true,
        logoUrl: true,
        createdAt: true,
      },
    });
    if (!user) throw new ApiError(404, "User not found");

    res.json({ user });
  }),
);

const UpdateMeSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  twitchUrl: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

router.put(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const data = UpdateMeSchema.parse(req.body);

    const update: any = {};
    if (data.email !== undefined) update.email = data.email;
    if (data.twitchUrl !== undefined) update.twitchUrl = data.twitchUrl;
    if (data.logoUrl !== undefined) update.logoUrl = data.logoUrl;
    if (data.password !== undefined)
      update.passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: update,
      select: {
        id: true,
        email: true,
        twitchUrl: true,
        logoUrl: true,
        createdAt: true,
      },
    });

    res.json({ user });
  }),
);

export default router;
