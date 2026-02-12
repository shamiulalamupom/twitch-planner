import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export function PlanningDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const nav = useNavigate();

  const [planning, setPlanning] = useState<PlanningWithEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // planning edit
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [savingPlanning, setSavingPlanning] = useState(false);
  const [planMsg, setPlanMsg] = useState<string | null>(null);

  // event modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  const [evTitle, setEvTitle] = useState("");
  const [evGameName, setEvGameName] = useState("");
  const [evGameImageUrl, setEvGameImageUrl] = useState("");
  const [evDay, setEvDay] = useState(""); // YYYY-MM-DD
  const [evStartTime, setEvStartTime] = useState("09:00");
  const [evEndTime, setEvEndTime] = useState("10:00");
  const [evErr, setEvErr] = useState<string | null>(null);
  const [evBusy, setEvBusy] = useState(false);

  async function load() {
    setErr(null);
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
      setErr(e instanceof ApiError ? e.message : "Failed to load planning");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const days = useMemo(() => {
    if (!planning) return [];
    const s = new Date(planning.weekStart);
    const e = new Date(planning.weekEnd);
    return listDaysInclusive(s, e);
  }, [planning]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    if (!planning) return map;

    const sorted = [...planning.events].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

    for (const ev of sorted) {
      const key = toYmd(fromIso(ev.startsAt));
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [planning]);

  function openCreateModal(dayYmd?: string) {
    setEditingEvent(null);
    setEvErr(null);
    setEvTitle("");
    setEvGameName("");
    setEvGameImageUrl("");
    setEvDay(dayYmd ?? (days[0] ? toYmd(days[0]) : ""));
    setEvStartTime("09:00");
    setEvEndTime("10:00");
    setModalOpen(true);
  }

  function openEditModal(ev: EventItem) {
    setEditingEvent(ev);
    setEvErr(null);
    setEvTitle(ev.title ?? "");
    setEvGameName(ev.gameName);
    setEvGameImageUrl(ev.gameImageUrl ?? "");
    setEvDay(toYmd(fromIso(ev.startsAt)));
    setEvStartTime(isoTimeHHmm(ev.startsAt));
    setEvEndTime(isoTimeHHmm(ev.endsAt));
    setModalOpen(true);
  }

  async function savePlanning() {
    if (!planning) return;
    setPlanMsg(null);
    setErr(null);
    setSavingPlanning(true);
    try {
      const res = await api<{ planning: Planning }>(
        `/plannings/${planning.id}`,
        {
          method: "PUT",
          token: token!,
          body: JSON.stringify({
            name: editName,
            weekStart: editStart,
            weekEnd: editEnd,
          }),
        },
      );

      // reload to keep events fresh + enforce server truth
      setPlanMsg("Saved.");
      await load();
      setEditName(res.planning.name);
      setEditStart(new Date(res.planning.weekStart).toISOString().slice(0, 10));
      setEditEnd(new Date(res.planning.weekEnd).toISOString().slice(0, 10));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSavingPlanning(false);
    }
  }

  async function saveEvent() {
    if (!planning) return;
    setEvErr(null);

    if (!evGameName.trim()) {
      setEvErr("Game name is required.");
      return;
    }
    if (!evDay) {
      setEvErr("Day is required.");
      return;
    }

    const startsAt = buildIsoFromDayAndTime(evDay, evStartTime);
    const endsAt = buildIsoFromDayAndTime(evDay, evEndTime);

    if (new Date(endsAt) <= new Date(startsAt)) {
      setEvErr("End time must be after start time.");
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

      setModalOpen(false);
    } catch (e) {
      setEvErr(e instanceof ApiError ? e.message : "Event save failed");
    } finally {
      setEvBusy(false);
    }
  }

  async function deleteEvent(ev: EventItem) {
    if (!confirm("Delete this event?")) return;
    setErr(null);
    try {
      await api<void>(`/events/${ev.id}`, { method: "DELETE", token: token! });
      setPlanning((prev) =>
        prev
          ? { ...prev, events: prev.events.filter((x) => x.id !== ev.id) }
          : prev,
      );
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  if (loading) return <div>Loading...</div>;
  if (err && !planning)
    return <div className="border p-2 rounded text-sm">{err}</div>;
  if (!planning) return <div>Not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{planning.name}</h1>
          <div className="text-sm text-gray-700">
            {new Date(planning.weekStart).toISOString().slice(0, 10)} →{" "}
            {new Date(planning.weekEnd).toISOString().slice(0, 10)}
          </div>
        </div>
        <button
          className="border px-3 py-2 rounded"
          onClick={() => nav("/plannings")}
        >
          Back
        </button>
      </div>

      <div className="border rounded p-4 space-y-3">
        <div className="font-semibold">Edit planning</div>
        {planMsg && <div className="border p-2 rounded text-sm">{planMsg}</div>}
        {err && <div className="border p-2 rounded text-sm">{err}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="text-sm">Name</div>
            <input
              className="border w-full p-2 rounded"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm">Start date</div>
            <input
              className="border w-full p-2 rounded"
              type="date"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm">End date</div>
            <input
              className="border w-full p-2 rounded"
              type="date"
              value={editEnd}
              onChange={(e) => setEditEnd(e.target.value)}
            />
          </div>
        </div>

        <button
          className="border px-4 py-2 rounded"
          onClick={savePlanning}
          disabled={savingPlanning}
        >
          {savingPlanning ? "Saving..." : "Save planning"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="font-semibold">Events</div>
        <button
          className="border px-3 py-2 rounded"
          onClick={() => openCreateModal()}
        >
          Add event
        </button>
      </div>

      <div className="overflow-x-auto border rounded">
        <div
          className="min-w-225 grid"
          style={{
            gridTemplateColumns: `repeat(${days.length}, minmax(220px, 1fr))`,
          }}
        >
          {days.map((d) => {
            const key = toYmd(d);
            const dayEvents = eventsByDay[key] ?? [];
            return (
              <div key={key} className="border-r last:border-r-0">
                <div className="border-b p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {d.toLocaleDateString(undefined, { weekday: "long" })}
                    </div>
                    <div className="text-xs text-gray-600">{key}</div>
                  </div>
                  <button
                    className="border px-2 py-1 rounded text-xs"
                    onClick={() => openCreateModal(key)}
                  >
                    + Add
                  </button>
                </div>

                <div className="p-3 space-y-2">
                  {dayEvents.length === 0 ? (
                    <div className="text-sm text-gray-500">No events</div>
                  ) : (
                    dayEvents.map((ev) => (
                      <div key={ev.id} className="border rounded p-2 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold">
                              {ev.gameName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {isoTimeHHmm(ev.startsAt)} →{" "}
                              {isoTimeHHmm(ev.endsAt)}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              className="border px-2 py-1 rounded text-xs"
                              onClick={() => openEditModal(ev)}
                            >
                              Edit
                            </button>
                            <button
                              className="border px-2 py-1 rounded text-xs"
                              onClick={() => deleteEvent(ev)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {ev.title && <div className="text-sm">{ev.title}</div>}
                        {ev.gameImageUrl && (
                          <img
                            src={ev.gameImageUrl}
                            alt={ev.gameName}
                            className="w-full h-28 object-cover rounded"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editingEvent ? "Edit event" : "Add event"}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-3">
          {evErr && <div className="border p-2 rounded text-sm">{evErr}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-sm">Game name *</div>
              <input
                className="border w-full p-2 rounded"
                value={evGameName}
                onChange={(e) => setEvGameName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm">Game image URL</div>
              <input
                className="border w-full p-2 rounded"
                value={evGameImageUrl}
                onChange={(e) => setEvGameImageUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm">Stream title (optional)</div>
              <input
                className="border w-full p-2 rounded"
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm">Day</div>
              <select
                className="border w-full p-2 rounded"
                value={evDay}
                onChange={(e) => setEvDay(e.target.value)}
              >
                {days.map((d) => {
                  const ymd = toYmd(d);
                  return (
                    <option key={ymd} value={ymd}>
                      {d.toLocaleDateString(undefined, { weekday: "long" })} (
                      {ymd})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-sm">Start time</div>
              <input
                className="border w-full p-2 rounded"
                type="time"
                value={evStartTime}
                onChange={(e) => setEvStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm">End time</div>
              <input
                className="border w-full p-2 rounded"
                type="time"
                value={evEndTime}
                onChange={(e) => setEvEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="border px-3 py-2 rounded"
              onClick={() => setModalOpen(false)}
              disabled={evBusy}
            >
              Cancel
            </button>
            <button
              className="border px-3 py-2 rounded"
              onClick={saveEvent}
              disabled={evBusy}
            >
              {evBusy ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
