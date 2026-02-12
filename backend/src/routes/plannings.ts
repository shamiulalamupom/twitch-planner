import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError, asyncHandler } from "../lib/http";
import { parseDateOnly } from "../lib/dates";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { assertNoPlanningOverlap } from "../lib/planning";
import { Prisma } from "../generated/prisma/browser";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.user!.id;

    const plannings = await prisma.planning.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        weekStart: true,
        weekEnd: true,
        bgColor: true,
        textColor: true,
        accentColor: true,
        createdAt: true,
      },
    });

    res.json({ plannings });
  }),
);

const CreatePlanningSchema = z.object({
  name: z.string().min(1),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const body = CreatePlanningSchema.parse(req.body);

    const weekStart = parseDateOnly(body.weekStart);
    const weekEnd = parseDateOnly(body.weekEnd);
    if (weekEnd < weekStart)
      throw new ApiError(400, "weekEnd must be >= weekStart");

    await assertNoPlanningOverlap({ userId, start: weekStart, end: weekEnd });

    const planning = await prisma.planning.create({
      data: { userId, name: body.name, weekStart, weekEnd },
    });

    res.status(201).json({ planning });
  }),
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const id = z.string().uuid().parse(req.params.id);

    const planning = await prisma.planning.findFirst({
      where: { id, userId },
      include: { events: { orderBy: { startsAt: "asc" } } },
    });
    if (!planning) throw new ApiError(404, "Planning not found");

    res.json({ planning });
  }),
);

const UpdatePlanningSchema = z.object({
  name: z.string().min(1).optional(),
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  weekEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  bgColor: z.string().optional().nullable(),
  textColor: z.string().optional().nullable(),
  accentColor: z.string().optional().nullable(),
});

router.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const id = z.string().uuid().parse(req.params.id);
    const body = UpdatePlanningSchema.parse(req.body);

    const existing = await prisma.planning.findFirst({ where: { id, userId } });
    if (!existing) throw new ApiError(404, "Planning not found");

    const update: Prisma.PlanningUpdateInput = {};
    if (body.weekStart) update.weekStart = parseDateOnly(body.weekStart);
    if (body.weekEnd) update.weekEnd = parseDateOnly(body.weekEnd);

    const currentStart = existing.weekStart;
    const currentEnd = existing.weekEnd;

    const newStart = body.weekStart
      ? parseDateOnly(body.weekStart)
      : currentStart;
    const newEnd = body.weekEnd ? parseDateOnly(body.weekEnd) : currentEnd;

    if (newEnd < newStart)
      throw new ApiError(400, "weekEnd must be >= weekStart");

    await assertNoPlanningOverlap({
      userId,
      start: newStart,
      end: newEnd,
      excludePlanningId: id,
    });

    const planning = await prisma.planning.update({
      where: { id },
      data: update,
    });
    res.json({ planning });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const id = z.string().uuid().parse(req.params.id);

    const existing = await prisma.planning.findFirst({ where: { id, userId } });
    if (!existing) throw new ApiError(404, "Planning not found");

    await prisma.planning.delete({ where: { id } });
    res.status(204).send();
  }),
);

export default router;
