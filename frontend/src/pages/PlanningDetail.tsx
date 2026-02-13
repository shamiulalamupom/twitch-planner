import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toPng } from "html-to-image";

import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/useAuth";
import type { EventItem, Planning } from "../lib/types";
import { Modal } from "../components/Modal";
import {
  buildIsoFromDayAndTime,
  fromIso,
  isoTimeHHmm,
  listDaysInclusive,
  toYmd,
} from "../lib/dates";

type PlanningWithEvents = Planning & { events: EventItem[] };

const shortDayNames: Record<string, string> = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
  samedi: "Sam",
  dimanche: "Dim",
};

type RawgSearchResult = {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
};

function capFirst(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function PlanningDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const nav = useNavigate();

  const exportRef = useRef<HTMLDivElement | null>(null);

  const [planning, setPlanning] = useState<PlanningWithEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageErr, setPageErr] = useState<string | null>(null);

  // Export
  const [exporting, setExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Planning edit modal
  const [planEditOpen, setPlanEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [savingPlanning, setSavingPlanning] = useState(false);
  const [planEditErr, setPlanEditErr] = useState<string | null>(null);

  // Event modal
  const [eventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<EventItem | null>(
    null,
  );
  const [evTitle, setEvTitle] = useState("");
  const [evGameName, setEvGameName] = useState("");
  const [evGameImageUrl, setEvGameImageUrl] = useState("");
  const [evDay, setEvDay] = useState("");
  const [evStartTime, setEvStartTime] = useState("21:00");
  const [evEndTime, setEvEndTime] = useState("22:00");
  const [evErr, setEvErr] = useState<string | null>(null);
  const [evBusy, setEvBusy] = useState(false);
  const rawgApiKey = import.meta.env.VITE_RAWG_API_KEY?.trim();
  const canSearchGames = Boolean(rawgApiKey);
  const [gameSearchResults, setGameSearchResults] = useState<
    RawgSearchResult[]
  >([]);
  const [gameSearchLoading, setGameSearchLoading] = useState(false);
  const [gameSearchError, setGameSearchError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  async function load() {
    if (!id) return;
    setPageErr(null);
    setLoading(true);
    try {
      const res = await api<{ planning: PlanningWithEvents }>(
        `/plannings/${id}`,
        { token: token! },
      );
      setPlanning(res.planning);

      setEditName(res.planning.name);
      setEditStart(new Date(res.planning.weekStart).toISOString().slice(0, 10));
      setEditEnd(new Date(res.planning.weekEnd).toISOString().slice(0, 10));
    } catch (e) {
      setPageErr(e instanceof ApiError ? e.message : "Failed to load planning");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const days = useMemo(() => {
    if (!planning) return [];
    return listDaysInclusive(
      new Date(planning.weekStart),
      new Date(planning.weekEnd),
    );
  }, [planning]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    if (!planning) return map;

    const sorted = [...planning.events].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

    for (const ev of sorted) {
      const key = toYmd(fromIso(ev.startsAt));
      (map[key] ??= []).push(ev);
    }
    return map;
  }, [planning]);

  useEffect(() => {
    const query = evGameName.trim();
    if (!canSearchGames || query.length < 2) {
      setGameSearchResults([]);
      setGameSearchLoading(false);
      setGameSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      (async () => {
        setGameSearchLoading(true);
        setGameSearchError(null);
        try {
          const response = await fetch(
            `https://api.rawg.io/api/games?key=${rawgApiKey}&page_size=20&search=${encodeURIComponent(
              query,
            )}`,
            { signal: controller.signal },
          );

          if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Game search failed");
          }

          const data = await response.json();
          const parsedResults: RawgSearchResult[] = Array.isArray(data.results)
            ? data.results.map(
                (item: {
                  id: number;
                  name: string;
                  background_image?: string | null;
                  released?: string | null;
                }) => ({
                  id: item.id,
                  name: item.name,
                  background_image: item.background_image ?? null,
                  released: item.released ?? null,
                }),
              )
            : [];
          setGameSearchResults(parsedResults);
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setGameSearchError(
            error instanceof Error
              ? error.message
              : "Recherche de jeux impossible.",
          );
        } finally {
          setGameSearchLoading(false);
        }
      })();
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [evGameName, rawgApiKey, canSearchGames]);

  function applyGameSuggestion(game: RawgSearchResult) {
    setEvGameName(game.name);
    if (game.background_image) {
      setEvGameImageUrl(game.background_image);
    }
    setGameSearchResults([]);
    setGameSearchError(null);
  }

  function openEventCreate(dayYmd?: string) {
    setEditingEvent(null);
    setEvErr(null);
    setEvTitle("");
    setEvGameName("");
    setEvGameImageUrl("");
    setEvDay(dayYmd ?? (days[0] ? toYmd(days[0]) : ""));
    setEvStartTime("21:00");
    setEvEndTime("22:00");
    setEventOpen(true);
  }

  function openEventEdit(ev: EventItem) {
    setEditingEvent(ev);
    setEvErr(null);
    setEvTitle(ev.title ?? "");
    setEvGameName(ev.gameName);
    setEvGameImageUrl(ev.gameImageUrl ?? "");
    setEvDay(toYmd(fromIso(ev.startsAt)));
    setEvStartTime(isoTimeHHmm(ev.startsAt));
    setEvEndTime(isoTimeHHmm(ev.endsAt));
    setEventOpen(true);
  }

  async function savePlanning() {
    if (!planning) return;

    setPlanEditErr(null);
    setSavingPlanning(true);
    try {
      await api<{ planning: Planning }>(`/plannings/${planning.id}`, {
        method: "PUT",
        token: token!,
        body: JSON.stringify({
          name: editName,
          weekStart: editStart,
          weekEnd: editEnd,
        }),
      });

      setPlanEditOpen(false);
      await load();
    } catch (e) {
      setPlanEditErr(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSavingPlanning(false);
    }
  }

  async function saveEvent() {
    if (!planning) return;
    setEvErr(null);

    if (!evGameName.trim()) {
      setEvErr("Nom du jeu requis.");
      return;
    }
    if (!evDay) {
      setEvErr("Jour requis.");
      return;
    }

    const startsAt = buildIsoFromDayAndTime(evDay, evStartTime);
    const endsAt = buildIsoFromDayAndTime(evDay, evEndTime);

    if (new Date(endsAt) <= new Date(startsAt)) {
      setEvErr("L'heure de fin doit être après l'heure de début.");
      return;
    }

    const newStartMs = new Date(startsAt).getTime();
    const newEndMs = new Date(endsAt).getTime();
    const conflict = planning.events.some((ev) => {
      if (editingEvent && ev.id === editingEvent.id) {
        return false;
      }
      if (toYmd(fromIso(ev.startsAt)) !== evDay) {
        return false;
      }

      const evStart = new Date(ev.startsAt).getTime();
      const evEnd = new Date(ev.endsAt).getTime();
      return newStartMs < evEnd && evStart < newEndMs;
    });

    if (conflict) {
      setEvErr("Un autre stream occupe déjà cette plage horaire.");
      return;
    }

    setEvBusy(true);
    try {
      if (editingEvent) {
        const res = await api<{ event: EventItem }>(
          `/events/${editingEvent.id}`,
          {
            method: "PUT",
            token: token!,
            body: JSON.stringify({
              title: evTitle || null,
              gameName: evGameName,
              gameImageUrl: evGameImageUrl || null,
              startsAt,
              endsAt,
            }),
          },
        );

        setPlanning((prev) =>
          prev
            ? {
                ...prev,
                events: prev.events.map((x) =>
                  x.id === res.event.id ? res.event : x,
                ),
              }
            : prev,
        );
      } else {
        const res = await api<{ event: EventItem }>(
          `/plannings/${planning.id}/events`,
          {
            method: "POST",
            token: token!,
            body: JSON.stringify({
              title: evTitle || null,
              gameName: evGameName,
              gameImageUrl: evGameImageUrl || null,
              startsAt,
              endsAt,
            }),
          },
        );

        setPlanning((prev) =>
          prev ? { ...prev, events: [...prev.events, res.event] } : prev,
        );
      }

      setEventOpen(false);
    } catch (e) {
      setEvErr(e instanceof ApiError ? e.message : "Event save failed");
    } finally {
      setEvBusy(false);
    }
  }

  async function deleteEvent(ev: EventItem) {
    setPageErr(null);
    try {
      await api<void>(`/events/${ev.id}`, { method: "DELETE", token: token! });
      setPlanning((prev) =>
        prev
          ? { ...prev, events: prev.events.filter((x) => x.id !== ev.id) }
          : prev,
      );
      return true;
    } catch (e) {
      setPageErr(e instanceof ApiError ? e.message : "Delete failed");
      return false;
    }
  }

  async function confirmDeleteEvent() {
    if (!deleteEventTarget) return;
    const deleted = await deleteEvent(deleteEventTarget);
    setDeleteEventTarget(null);
    if (deleted) {
      setEventOpen(false);
      setEditingEvent(null);
    }
  }

  async function exportPng() {
    if (!exportRef.current || !planning) return;

    const boardBg = getComputedStyle(exportRef.current).backgroundColor;

    const boardNode = exportRef.current;
    boardNode?.classList.add("tp-exporting");
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: boardBg || "#1f3a7d",
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      const a = document.createElement("a");
      a.href = url;
      a.download = `planning-${planning.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert("Export failed. Check console (often image/CORS).");
    } finally {
      setExporting(false);
      boardNode?.classList.remove("tp-exporting");
    }
  }

  if (loading) return <div className="tp-card">Chargement...</div>;
  if (!planning)
    return <div className="tp-card">{pageErr ?? "Not found."}</div>;

  const trimmedGameQuery = evGameName.trim();
  const showGameSuggestions = canSearchGames && trimmedGameQuery.length >= 2;

  // Pretty range label like the maquette: "26 → 1 Février"
  const startD = new Date(planning.weekStart);
  const endD = new Date(planning.weekEnd);
  const endMonth = capFirst(
    endD.toLocaleDateString("fr-FR", { month: "long" }),
  );
  const rangeLabel = `${startD.getDate()} → ${endD.getDate()} ${endMonth}`;

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          className="border px-3 py-2 rounded bg-white/70"
          type="button"
          onClick={() => nav("/plannings")}
        >
          ← Retour
        </button>

        <div className="flex items-center gap-2">
          {downloadUrl && (
            <a
              className="text-sm underline"
              href={downloadUrl}
              download={`planning-${planning.id}.png`}
            >
              Télécharger à nouveau
            </a>
          )}

          <button
            className="border px-3 py-2 rounded bg-white/70"
            type="button"
            disabled={exporting}
            onClick={exportPng}
          >
            {exporting ? "Export..." : "Exporter PNG"}
          </button>

          <button
            className="border px-3 py-2 rounded bg-white/70"
            type="button"
            onClick={() => openEventCreate()}
          >
            + Event
          </button>

          <button
            className="border px-3 py-2 rounded bg-white/70"
            type="button"
            onClick={() => {
              setPlanEditErr(null);
              setPlanEditOpen(true);
            }}
          >
            Modifier planning
          </button>
        </div>
      </div>

      {pageErr && (
        <div className="tp-card border border-black/10 text-sm">{pageErr}</div>
      )}

      {/* Board (scrollable viewport), exportRef on the fixed-size board */}
      <div className="overflow-x-hidden">
        <div ref={exportRef} className="tp-board-16x9">
          {/* Top header */}
          <div className="tp-board-top">
            <div className="tp-board-top-left">
              <div className="tp-board-title">Planning de stream</div>
              <div className="tp-board-range">{rangeLabel}</div>
            </div>
          </div>

          {/* Days row */}
          <div className="tp-days-row">
            {days.map((d) => {
              const key = toYmd(d);
              const dayEvents = eventsByDay[key] ?? [];
              const hasEvents = dayEvents.length > 0;

              const colStyle = {
                flex: `${hasEvents ? 1.6 : 0.45} 1 0`,
                minWidth: hasEvents ? "140px" : "70px",
                maxWidth: hasEvents ? "220px" : "110px",
              };

              const weekday = d.toLocaleDateString("fr-FR", {
                weekday: "long",
              });
              const dayName = capFirst(weekday);
              const dayLabel =
                hasEvents && dayName
                  ? dayName
                  : (shortDayNames[weekday.toLowerCase()] ??
                    dayName.slice(0, 3).toUpperCase());

              return (
                <div
                  key={key}
                  className="tp-day-col flex flex-col"
                  style={colStyle}
                >
                  <div className="tp-day-head">{dayLabel}</div>

                  <button
                    className="tp-plusbar"
                    type="button"
                    onClick={() => openEventCreate(key)}
                  >
                    +
                  </button>

                  <div className="tp-day-events p-2">
                    {hasEvents ? (
                      dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="tp-event-tile cursor-pointer transition hover:scale-[1.01]"
                          onClick={() => openEventEdit(ev)}
                        >
                          {/* Time tag like: 21h00 */}
                          <div className="tp-time-tag">
                            {isoTimeHHmm(ev.startsAt).replace(":", "h")}
                          </div>

                          {ev.gameImageUrl ? (
                            <img
                              crossOrigin="anonymous"
                              referrerPolicy="no-referrer"
                              src={ev.gameImageUrl}
                              alt={ev.gameName}
                              className="h-36 w-full object-cover"
                            />
                          ) : (
                            <div className="h-36 w-full bg-white/5" />
                          )}

                          {/* Bottom tags */}
                          {ev.title && (
                            <div className="tp-title-tag">{ev.title}</div>
                          )}
                          <div className="tp-game-tag">{ev.gameName}</div>
                        </div>
                      ))
                    ) : (
                      <button
                        className="tp-empty-center"
                        type="button"
                        onClick={() => openEventCreate(key)}
                      >
                        <span className="tp-empty-off">OFF</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Planning edit modal */}
      <Modal
        open={planEditOpen}
        title="Modifier le planning"
        onClose={() => setPlanEditOpen(false)}
      >
        <div className="space-y-3">
          {planEditErr && (
            <div className="border p-2 rounded text-sm">{planEditErr}</div>
          )}

          <div className="tp-field">
            <div className="tp-label">Nom</div>
            <input
              className="tp-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="tp-field">
              <div className="tp-label">Début</div>
              <input
                className="tp-date"
                type="date"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
              />
            </div>
            <div className="tp-field">
              <div className="tp-label">Fin</div>
              <input
                className="tp-date"
                type="date"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="tp-btn tp-btn-secondary"
              type="button"
              onClick={() => setPlanEditOpen(false)}
              disabled={savingPlanning}
            >
              Annuler
            </button>
            <button
              className="tp-btn tp-btn-primary"
              type="button"
              onClick={savePlanning}
              disabled={savingPlanning}
            >
              {savingPlanning ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Event modal */}
      <Modal
        open={eventOpen}
        title={editingEvent ? "Modifier un event" : "Créer un event"}
        onClose={() => setEventOpen(false)}
      >
        <div className="space-y-3">
          {evErr && <div className="border p-2 rounded text-sm">{evErr}</div>}

          <div className="tp-field">
            <div className="tp-label">Nom du jeu *</div>
            <div className="space-y-2">
              <input
                className="tp-input"
                value={evGameName}
                onChange={(e) => setEvGameName(e.target.value)}
              />
              {!canSearchGames && (
                <p className="text-xs text-slate-500">
                  Activez la recherche automatique en définissant{" "}
                  <code className="font-semibold">VITE_RAWG_API_KEY</code>.
                </p>
              )}
              {showGameSuggestions && (
                <div className="tp-game-suggestions">
                  {gameSearchLoading && (
                    <p className="tp-game-suggestion-meta">
                      Recherche de jeux...
                    </p>
                  )}
                  {gameSearchError && (
                    <p className="tp-game-suggestion-meta text-red-600">
                      {gameSearchError}
                    </p>
                  )}
                  {!gameSearchLoading &&
                    !gameSearchError &&
                    gameSearchResults.length === 0 && (
                      <p className="tp-game-suggestion-meta">
                        Aucun jeu trouvé.
                      </p>
                    )}
                  {!gameSearchLoading &&
                    !gameSearchError &&
                    gameSearchResults.map((game) => (
                      <button
                        key={game.id}
                        type="button"
                        className="tp-game-suggestion"
                        onClick={() => applyGameSuggestion(game)}
                      >
                        {game.background_image ? (
                          <img
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            src={game.background_image}
                            alt={game.name}
                            className="tp-game-suggestion-thumb"
                          />
                        ) : (
                          <div className="tp-game-suggestion-placeholder" />
                        )}
                        <div className="tp-game-suggestion-info">
                          <p className="font-semibold text-slate-800">
                            {game.name}
                          </p>
                          {game.released && (
                            <p className="tp-game-suggestion-meta">
                              Sortie {game.released}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="tp-field">
            <div className="tp-label">Titre du stream (optionnel)</div>
            <input
              className="tp-input"
              value={evTitle}
              onChange={(e) => setEvTitle(e.target.value)}
            />
          </div>

          <div className="tp-field">
            <div className="tp-label">Image du jeu (URL)</div>
            <input
              className="tp-input"
              value={evGameImageUrl}
              onChange={(e) => setEvGameImageUrl(e.target.value)}
            />
            {evGameImageUrl && (
              <img
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                src={evGameImageUrl}
                alt="Preview"
                className="mt-2 h-28 w-full rounded-xl object-cover"
              />
            )}
          </div>

          <div className="tp-field">
            <div className="tp-label">Jour</div>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => {
                const ymd = toYmd(d);
                const active = evDay === ymd;
                const label = capFirst(
                  d.toLocaleDateString("fr-FR", { weekday: "long" }),
                );

                return (
                  <button
                    key={ymd}
                    type="button"
                    onClick={() => setEvDay(ymd)}
                    className={
                      active
                        ? "tp-btn-purple"
                        : "rounded-lg bg-black/5 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-black/10"
                    }
                    title={`${label} (${ymd})`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="tp-field">
              <div className="tp-label">Heure début</div>
              <input
                className="tp-time"
                type="time"
                value={evStartTime}
                onChange={(e) => setEvStartTime(e.target.value)}
              />
            </div>

            <div className="tp-field">
              <div className="tp-label">Heure fin</div>
              <input
                className="tp-time"
                type="time"
                value={evEndTime}
                onChange={(e) => setEvEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="tp-btn tp-btn-secondary"
              type="button"
              onClick={() => setEventOpen(false)}
              disabled={evBusy}
            >
              Annuler
            </button>
            <button
              className="tp-btn tp-btn-primary"
              type="button"
              onClick={saveEvent}
              disabled={evBusy}
            >
              {evBusy ? "Enregistrement..." : "Enregistrer"}
            </button>
            {editingEvent && (
              <button
                className="tp-btn tp-btn-purple"
                type="button"
                onClick={() => setDeleteEventTarget(editingEvent)}
                disabled={evBusy}
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteEventTarget}
        title="Supprimer l’événement"
        onClose={() => setDeleteEventTarget(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Confirmez-vous la suppression de{" "}
            <strong>{deleteEventTarget?.gameName ?? "cet événement"}</strong> ?
          </p>
          <div className="flex gap-3">
            <button
              className="tp-btn tp-btn-secondary"
              type="button"
              onClick={() => setDeleteEventTarget(null)}
            >
              Annuler
            </button>
            <button
              className="tp-btn tp-btn-purple"
              type="button"
              onClick={confirmDeleteEvent}
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
