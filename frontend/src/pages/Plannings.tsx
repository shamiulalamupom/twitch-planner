import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/useAuth";
import type { Planning } from "../lib/types";
import {
  endOfWeekSaturdayLocal,
  startOfWeekSundayLocal,
  toYmd,
} from "../lib/dates";

export function Plannings() {
  const { token } = useAuth();
  const nav = useNavigate();

  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const defaultStart = useMemo(
    () => toYmd(startOfWeekSundayLocal(today)),
    [today],
  );
  const defaultEnd = useMemo(
    () => toYmd(endOfWeekSaturdayLocal(today)),
    [today],
  );

  const [name, setName] = useState("My Planning");
  const [weekStart, setWeekStart] = useState(defaultStart);
  const [weekEnd, setWeekEnd] = useState(defaultEnd);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const res = await api<{ plannings: Planning[] }>("/plannings", {
        token: token!,
      });
      setPlannings(res.plannings);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load plannings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createPlanning() {
    setCreateErr(null);
    setCreating(true);
    try {
      const res = await api<{ planning: Planning }>("/plannings", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ name, weekStart, weekEnd }),
      });
      setPlannings((prev) => [res.planning, ...prev]);
      nav(`/plannings/${res.planning.id}`);
    } catch (e) {
      setCreateErr(e instanceof ApiError ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function deletePlanning(id: string) {
    if (!confirm("Delete this planning?")) return;
    setErr(null);
    try {
      await api<void>(`/plannings/${id}`, { method: "DELETE", token: token! });
      setPlannings((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Plannings</h1>
        <button
          className="border px-3 py-2 rounded"
          onClick={refresh}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="border rounded p-4 space-y-3">
        <div className="font-semibold">Create planning</div>
        {createErr && (
          <div className="border p-2 rounded text-sm">{createErr}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-sm">Name</div>
            <input
              className="border w-full p-2 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm">Start date</div>
            <input
              className="border w-full p-2 rounded"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm">End date</div>
            <input
              className="border w-full p-2 rounded"
              type="date"
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Mes plannings
          </h1>

          <button
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-white shadow hover:bg-emerald-600"
            onClick={createPlanning}
            disabled={creating}
          >
            <span className="text-lg leading-none">＋</span>
            Nouveau planning
          </button>
        </div>

        <div className="text-xs text-gray-600">
          Note: overlapping date ranges should be rejected by the backend (409).
        </div>
      </div>

      {err && <div className="border p-2 rounded text-sm">{err}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : plannings.length === 0 ? (
        <div className="text-gray-600">No plannings yet.</div>
      ) : (
        <div className="border rounded">
          <div className="grid grid-cols-12 gap-2 p-3 border-b text-sm font-semibold">
            <div className="col-span-5">Name</div>
            <div className="col-span-5">Range</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {plannings.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-12 gap-2 p-3 border-b items-center"
            >
              <div className="col-span-5">
                <Link className="underline" to={`/plannings/${p.id}`}>
                  {p.name}
                </Link>
              </div>
              <div className="col-span-5 text-sm text-gray-700">
                {new Date(p.weekStart).toISOString().slice(0, 10)} →{" "}
                {new Date(p.weekEnd).toISOString().slice(0, 10)}
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Link
                  className="border px-3 py-1 rounded text-sm"
                  to={`/plannings/${p.id}`}
                >
                  Open
                </Link>
                <button
                  className="border px-3 py-1 rounded text-sm"
                  onClick={() => deletePlanning(p.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
