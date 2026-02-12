const API_URL = import.meta.env.VITE_API_URL as string;

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pickApiError(
  payload: unknown,
): { message?: string; details?: unknown } | null {
  if (!isRecord(payload)) return null;
  const err = payload["error"];
  if (!isRecord(err)) return null;
  const message =
    typeof err["message"] === "string" ? err["message"] : undefined;
  const details = err["details"];
  return { message, details };
}

export async function api<T>(
  path: string,
  opts: RequestInit & { token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers
      ? Object.fromEntries(new Headers(opts.headers).entries())
      : {}),
  };

  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });

  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    const apiErr = pickApiError(payload);
    const msg = apiErr?.message ?? res.statusText ?? "Request failed";
    throw new ApiError(res.status, msg, apiErr?.details);
  }

  // 204
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
