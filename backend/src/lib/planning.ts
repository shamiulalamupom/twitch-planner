import { prisma } from "./prisma";
import { ApiError } from "./http";

export async function assertNoPlanningOverlap(params: {
  userId: string;
  start: Date;
  end: Date;
  excludePlanningId?: string;
}) {
  const { userId, start, end, excludePlanningId } = params;

  const overlap = await prisma.planning.findFirst({
    where: {
      userId,
      ...(excludePlanningId ? { id: { not: excludePlanningId } } : {}),
      // overlap condition (inclusive)
      weekStart: { lte: end },
      weekEnd: { gte: start },
    },
    select: { id: true, name: true, weekStart: true, weekEnd: true },
  });

  if (overlap) {
    throw new ApiError(
      409,
      `Planning overlaps with existing planning "${overlap.name}" (${overlap.weekStart.toISOString().slice(0, 10)} → ${overlap.weekEnd.toISOString().slice(0, 10)})`,
    );
  }
}
