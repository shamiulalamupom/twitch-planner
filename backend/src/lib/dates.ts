import { ApiError } from "./http";

export function parseDateOnly(dateStr: string): Date {
  // expects YYYY-MM-DD
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, "Invalid date");
  return d;
}

export function parseDateTime(isoStr: string): Date {
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, "Invalid datetime");
  return d;
}
