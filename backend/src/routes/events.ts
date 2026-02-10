import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError, asyncHandler } from "../lib/http";
import { parseDateTime } from "../lib/dates";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";

const router = Router();

const CreateEventSchema = z.object({
  title: z.string().optional().nullable(),
  gameName: z.string().min(1),
  gameImageUrl: z.string().url().optional().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

router.post(
  "/plannings/:planningId/events",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const planningId = z.string().uuid().parse(req.params.planningId);
    const body = CreateEventSchema.parse(req.body);

    const planning = await prisma.planning.findFirst({
      where: { id: planningId, userId },
    });
    if (!planning) throw new ApiError(404, "Planning not found");

    const startsAt = parseDateTime(body.startsAt);
    const endsAt = parseDateTime(body.endsAt);
    if (endsAt <= startsAt)
      throw new ApiError(400, "endsAt must be after startsAt");

    const event = await prisma.event.create({
      data: {
        planningId,
        title: body.title ?? null,
        gameName: body.gameName,
        gameImageUrl: body.gameImageUrl ?? null,
        startsAt,
        endsAt,
      },
    });

    res.status(201).json({ event });
  }),
);

const UpdateEventSchema = z.object({
  title: z.string().optional().nullable(),
  gameName: z.string().min(1).optional(),
  gameImageUrl: z.string().url().optional().nullable(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

router.put(
  "/events/:eventId",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const eventId = z.string().uuid().parse(req.params.eventId);
    const body = UpdateEventSchema.parse(req.body);

    const existing = await prisma.event.findFirst({
      where: { id: eventId, planning: { userId } },
    });
    if (!existing) throw new ApiError(404, "Event not found");

    const update: any = { ...body };
    if (body.startsAt) update.startsAt = parseDateTime(body.startsAt);
    if (body.endsAt) update.endsAt = parseDateTime(body.endsAt);

    const starts = update.startsAt ?? existing.startsAt;
    const ends = update.endsAt ?? existing.endsAt;
    if (ends <= starts)
      throw new ApiError(400, "endsAt must be after startsAt");

    const event = await prisma.event.update({
      where: { id: eventId },
      data: update,
    });
    res.json({ event });
  }),
);

router.delete(
  "/events/:eventId",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const eventId = z.string().uuid().parse(req.params.eventId);

    const existing = await prisma.event.findFirst({
      where: { id: eventId, planning: { userId } },
    });
    if (!existing) throw new ApiError(404, "Event not found");

    await prisma.event.delete({ where: { id: eventId } });
    res.status(204).send();
  }),
);

export default router;
