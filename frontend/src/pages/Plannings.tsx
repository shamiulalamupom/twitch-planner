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
import { Modal } from "../components/Modal";

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

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("Planning de stream");
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

  function openCreate() {
    setCreateErr(null);
    setName("Planning de stream");
    setWeekStart(defaultStart);
    setWeekEnd(defaultEnd);
    setCreateOpen(true);
  }

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
      setCreateOpen(false);
      nav(`/plannings/${res.planning.id}`);
    } catch (e) {
      setCreateErr(e instanceof ApiError ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  const [deletePlanningTarget, setDeletePlanningTarget] = useState<Planning | null>(null);

  async function deletePlanning(id: string) {
    setErr(null);
    try {
      await api<void>(`/plannings/${id}`, { method: "DELETE", token: token! });
      setPlannings((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  return (
    <div className="tp-section space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Mes plannings
        </h1>

        <button
          className="tp-pill-new"
          onClick={openCreate}
          disabled={creating}
        >
          <span className="text-lg leading-none">＋</span>
          Nouveau planning
        </button>
      </div>

      {err && (
        <div className="tp-card border border-black/10">
          <div className="text-sm">{err}</div>
        </div>
      )}

      {loading ? (
        <div className="tp-card">Chargement...</div>
      ) : plannings.length === 0 ? (
        <div className="tp-card text-slate-700">
          Aucun planning pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plannings.map((p) => (
            <div
              key={p.id}
              className="tp-card flex items-start justify-between gap-4"
            >
              <Link to={`/plannings/${p.id}`} className="min-w-0">
                <div className="text-lg font-bold truncate">{p.name}</div>
                <div className="text-sm text-slate-700">
                  {new Date(p.weekStart).toISOString().slice(0, 10)} →{" "}
                  {new Date(p.weekEnd).toISOString().slice(0, 10)}
                </div>
              </Link>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="border px-3 py-1 rounded bg-white/70 text-sm"
                  onClick={() => nav(`/plannings/${p.id}`)}
                >
                  Ouvrir
                </button>
                <button
                  className="border px-3 py-1 rounded bg-white/70 text-sm"
                  onClick={() => setDeletePlanningTarget(p)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        title="Créer un planning"
        onClose={() => setCreateOpen(false)}
      >
        <div className="space-y-3">
          {createErr && (
            <div className="border p-2 rounded text-sm">{createErr}</div>
          )}

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-700">Nom</div>
            <input
              className="tp-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700">Début</div>
              <input
                className="tp-input"
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700">Fin</div>
              <input
                className="tp-input"
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              className="tp-btn tp-btn-secondary"
              type="button"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Annuler
            </button>
            <button
              className="tp-btn tp-btn-primary"
              type="button"
              onClick={createPlanning}
              disabled={creating}
            >
              {creating ? "Création..." : "Créer"}
            </button>
          </div>

          <div className="text-xs text-slate-600">
            Les dates ne doivent pas se chevaucher.
          </div>
        </div>
      </Modal>
      <Modal
        open={!!deletePlanningTarget}
        title="Supprimer le planning"
        onClose={() => setDeletePlanningTarget(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Êtes-vous sûr de vouloir supprimer{" "}
            <strong>{deletePlanningTarget?.name}</strong> ?
          </p>
          <div className="flex gap-3">
            <button
              className="tp-btn tp-btn-secondary"
              type="button"
              onClick={() => setDeletePlanningTarget(null)}
            >
              Annuler
            </button>
            <button
              className="tp-btn tp-btn-primary"
              type="button"
              onClick={async () => {
                if (!deletePlanningTarget) return;
                await deletePlanning(deletePlanningTarget.id);
                setDeletePlanningTarget(null);
              }}
            >
              Confirmer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
