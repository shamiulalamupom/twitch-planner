export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

export function fromIso(iso: string) {
  const d = new Date(iso);
  return d;
}

export function startOfWeekSundayLocal(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay(); // 0=Sun..6=Sat
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfWeekSaturdayLocal(d: Date) {
  const s = startOfWeekSundayLocal(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(0, 0, 0, 0);
  return e;
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function listDaysInclusive(start: Date, end: Date) {
  const days: Date[] = [];
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);

  for (let cur = new Date(s); cur <= e; cur = addDays(cur, 1)) {
    days.push(new Date(cur));
  }
  return days;
}

export function isoTimeHHmm(iso: string) {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function buildIsoFromDayAndTime(dayYmd: string, hhmm: string) {
  const [y, m, d] = dayYmd.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0); // local time
  return dt.toISOString();
}
