
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  SkipForward,
  X,
} from "lucide-react";

import {
  getFarms,
  getMissions,
  getMissionOccurrences,
  createMission,
  cancelMission,
  updateMissionOccurrence,
  type Farm,
  type Mission,
  type MissionOccurrence,
  type MissionCreateInput,
  type MissionOccurrenceUpdate,
} from "@/lib/api";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";

type Notice = {
  type: "success" | "error";
  message: string;
};

type MissionStatusFilter = "all" | "active" | "cancelled";

const inputClass =
  "w-full min-w-0 rounded-xl border border-white/10 bg-[#111] p-3 text-sm text-white scheme-dark placeholder:text-white/30 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-50";

const panelClass = "rounded-2xl border border-white/10 bg-white/[0.03]";

function formatDate(value?: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRecurrence(mission: Mission) {
  const recurrence = mission.recurrence_type;

  if (recurrence === "once") return "One-time";
  if (recurrence === "daily") return "Daily";
  if (recurrence === "weekly") return "Weekly";
  if (recurrence === "fortnightly") return "Every two weeks";
  if (recurrence === "monthly") return "Monthly";

  if (recurrence === "custom") {
    const interval = mission.interval_value ?? 1;
    const unit = mission.interval_unit ?? "week";
    const plural = interval === 1 ? unit : `${unit}s`;

    return `Every ${interval} ${plural}`;
  }

  return recurrence;
}

function getFieldName(farms: Farm[], fieldId: number) {
  for (const farm of farms) {
    const field = farm.fields?.find((item) => item.id === fieldId);

    if (field) {
      return field.name;
    }
  }

  return `Field #${fieldId}`;
}

function getLocalDateTimeValue(date = new Date()) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    completed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    pending: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    skipped: "border-white/10 bg-white/[0.06] text-white/50",
    cancelled: "border-red-400/20 bg-red-400/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
        styles[status] ??
        "border-white/10 bg-white/[0.06] text-white/60"
      }`}
    >
      {status}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  warning = false,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof CalendarDays;
  warning?: boolean;
}) {
  return (
    <div className={`${panelClass} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/50">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-2 text-xs text-white/40">{description}</p>
        </div>

        <div
          className={`rounded-xl p-3 ${
            warning
              ? "bg-red-400/10 text-red-300"
              : "bg-emerald-400/10 text-emerald-300"
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [occurrences, setOccurrences] = useState<MissionOccurrence[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<MissionStatusFilter>("all");

  const [title, setTitle] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [notes, setNotes] = useState("");
  const [startsAt, setStartsAt] = useState(() =>
    getLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)),
  );
  const [endsAt, setEndsAt] = useState("");
  const [recurrence, setRecurrence] =
    useState<MissionCreateInput["recurrence_type"]>("once");
  const [intervalValue, setIntervalValue] = useState("1");
  const [intervalUnit, setIntervalUnit] =
    useState<NonNullable<MissionCreateInput["interval_unit"]>>("week");

  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");

  const fields = useMemo(
    () =>
      farms.flatMap((farm) =>
        (farm.fields ?? []).map((field) => ({
          ...field,
          farmName: farm.name,
        })),
      ),
    [farms],
  );

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [farmsData, missionsData, occurrencesData] = await Promise.all([
        getFarms(),
        getMissions(true),
        getMissionOccurrences(90, true),
      ]);

      setFarms(farmsData);
      setMissions(missionsData);
      setOccurrences(occurrencesData);
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load your missions. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeMissions = useMemo(
    () => missions.filter((mission) => mission.status === "active"),
    [missions],
  );

  const pendingOccurrences = useMemo(
    () =>
      occurrences.filter(
        (occurrence) => occurrence.status === "pending",
      ),
    [occurrences],
  );

  const overdueOccurrences = useMemo(
    () =>
      pendingOccurrences.filter(
        (occurrence) =>
          new Date(occurrence.scheduled_at).getTime() < Date.now(),
      ),
    [pendingOccurrences],
  );

  const visibleMissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return missions.filter((mission) => {
      const matchesStatus =
        statusFilter === "all" || mission.status === statusFilter;

      const matchesSearch =
        !query ||
        mission.title.toLowerCase().includes(query) ||
        (mission.notes ?? "").toLowerCase().includes(query) ||
        getFieldName(farms, mission.field_id).toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [farms, missions, search, statusFilter]);

  const sortedOccurrences = useMemo(
    () =>
      [...occurrences].sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime(),
      ),
    [occurrences],
  );

  function resetForm() {
    setTitle("");
    setFieldId("");
    setNotes("");
    setStartsAt(
      getLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)),
    );
    setEndsAt("");
    setRecurrence("once");
    setIntervalValue("1");
    setIntervalUnit("week");
  }

  async function handleCreateMission(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setNotice(null);

    if (!title.trim()) {
      setNotice({ type: "error", message: "Enter a mission title." });
      return;
    }

    if (!fieldId) {
      setNotice({ type: "error", message: "Select a field." });
      return;
    }

    const startDate = new Date(startsAt);

    if (Number.isNaN(startDate.getTime())) {
      setNotice({ type: "error", message: "Choose a valid start date." });
      return;
    }

    if (endsAt) {
      const endDate = new Date(endsAt);

      if (
        Number.isNaN(endDate.getTime()) ||
        endDate.getTime() <= startDate.getTime()
      ) {
        setNotice({
          type: "error",
          message: "The end date must be after the start date.",
        });
        return;
      }
    }

    if (
      recurrence === "custom" &&
      (!Number.isInteger(Number(intervalValue)) ||
        Number(intervalValue) < 1)
    ) {
      setNotice({
        type: "error",
        message: "The custom interval must be a whole number greater than zero.",
      });
      return;
    }

    const body: MissionCreateInput = {
      title: title.trim(),
      field_id: Number(fieldId),
      notes: notes.trim() || undefined,
      starts_at: startDate.toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
      recurrence_type: recurrence,
      interval_value:
        recurrence === "custom" ? Number(intervalValue) : undefined,
      interval_unit: recurrence === "custom" ? intervalUnit : undefined,
      timezone_name:
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Maseru",
    };

    setSubmitting(true);

    try {
      await createMission(body);
      await loadData();

      setShowForm(false);
      resetForm();
      setNotice({
        type: "success",
        message: "Mission scheduled successfully.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not create the mission.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelMission(mission: Mission) {
    const confirmed = window.confirm(
      `Cancel "${mission.title}"? Pending occurrences will be skipped.`,
    );

    if (!confirmed) return;

    setNotice(null);
    setBusyId(mission.id);

    try {
      await cancelMission(mission.id);
      await loadData();
      setNotice({
        type: "success",
        message: "Mission cancelled.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not cancel the mission.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleSkipOccurrence(occurrence: MissionOccurrence) {
    const confirmed = window.confirm(
      "Skip this scheduled occurrence?",
    );

    if (!confirmed) return;

    setNotice(null);
    setBusyId(occurrence.id);

    try {
      const body: MissionOccurrenceUpdate = { status: "skipped" };
      await updateMissionOccurrence(occurrence.id, body);
      await loadData();

      setNotice({
        type: "success",
        message: "Occurrence skipped.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not skip this occurrence.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleRescheduleOccurrence(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!rescheduleId || !rescheduleValue) {
      setNotice({
        type: "error",
        message: "Choose a new date and time.",
      });
      return;
    }

    const date = new Date(rescheduleValue);

    if (Number.isNaN(date.getTime())) {
      setNotice({
        type: "error",
        message: "Choose a valid date and time.",
      });
      return;
    }

    setNotice(null);
    setBusyId(rescheduleId);

    try {
      const body: MissionOccurrenceUpdate = {
        scheduled_at: date.toISOString(),
      };

      await updateMissionOccurrence(rescheduleId, body);
      await loadData();

      setRescheduleId(null);
      setRescheduleValue("");
      setNotice({
        type: "success",
        message: "Occurrence rescheduled.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not reschedule this occurrence.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full min-w-0 max-w-full space-y-5 overflow-x-hidden p-3 pb-8 sm:space-y-6 sm:p-5 sm:pb-10 md:p-8">
        <PageHeader
          title="Mission Planner"
          description="Schedule crop inspections and track upcoming field work. Missions organise your plan; you still run AI analysis manually."
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <CalendarDays size={16} className="text-emerald-300" />
            <span>Plan, review and manage your field missions.</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setNotice(null);
                setShowForm((current) => !current);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Close form" : "New mission"}
            </button>
          </div>
        </div>

        {notice && (
          <div
            role="alert"
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              notice.type === "success"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-red-400/20 bg-red-400/10 text-red-300"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}
            <p className="flex-1">{notice.message}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss message"
              className="rounded-md p-1 transition hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4 sm:gap-4">
          <StatCard
            title="Total missions"
            value={missions.length}
            description="All scheduled missions"
            icon={CalendarDays}
          />
          <StatCard
            title="Active missions"
            value={activeMissions.length}
            description="Missions still in progress"
            icon={CheckCircle2}
          />
          <StatCard
            title="Pending occurrences"
            value={pendingOccurrences.length}
            description="Scheduled field activities"
            icon={Clock3}
          />
          <StatCard
            title="Overdue"
            value={overdueOccurrences.length}
            description="Pending activities past their time"
            icon={AlertCircle}
            warning={overdueOccurrences.length > 0}
          />
        </div>

        {showForm && (
          <section className={`${panelClass} overflow-hidden`}>
            <div className="border-b border-white/10 px-5 py-4 md:px-6">
              <h2 className="font-semibold text-white">Create a mission</h2>
              <p className="mt-1 text-sm text-white/50">
                Choose a field, set the schedule and select a recurrence.
              </p>
            </div>

            <form
              onSubmit={handleCreateMission}
              className="space-y-5 p-5 md:p-6"
            >
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/70">
                    Mission title <span className="text-emerald-300">*</span>
                  </span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={inputClass}
                    placeholder="e.g. Cabbage field inspection"
                    maxLength={150}
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/70">
                    Field <span className="text-emerald-300">*</span>
                  </span>
                  <select
                    value={fieldId}
                    onChange={(event) => setFieldId(event.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Select a field</option>
                    {fields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.name} — {field.farmName}
                      </option>
                    ))}
                  </select>

                  {fields.length === 0 && (
                    <p className="text-xs text-amber-300">
                      No fields found. Create a farm and field before scheduling
                      a mission.
                    </p>
                  )}
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/70">
                    Start date and time
                  </span>
                 <input
                    id="startsAt"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                    className={inputClass}
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/70">
                    End date and time{" "}
                    <span className="text-white/30">(optional)</span>
                  </span>
                  <input
                      id="endsAt"
                      type="datetime-local"
                      value={endsAt}
                      min={startsAt || undefined}
                      onChange={(event) => setEndsAt(event.target.value)}
                      className={inputClass}
                    />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/70">
                    Recurrence
                  </span>
                  <select
                    value={recurrence}
                    onChange={(event) =>
                      setRecurrence(
                        event.target.value as MissionCreateInput["recurrence_type"],
                      )
                    }
                    className={inputClass}
                  >
                    <option value="once">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Every two weeks</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom interval</option>
                  </select>
                </label>

                {recurrence === "custom" && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-white/70">
                        Repeat every
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={intervalValue}
                        onChange={(event) =>
                          setIntervalValue(event.target.value)
                        }
                        className={inputClass}
                        required
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-white/70">
                        Unit
                      </span>
                      <select
                        value={intervalUnit}
                        onChange={(event) =>
                          setIntervalUnit(
                            event.target.value as NonNullable<
                              MissionCreateInput["interval_unit"]
                            >,
                          )
                        }
                        className={inputClass}
                      >
                        <option value="day">Days</option>
                        <option value="week">Weeks</option>
                        <option value="month">Months</option>
                      </select>
                    </label>
                  </div>
                )}

                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-white/70">
                    Notes <span className="text-white/30">(optional)</span>
                  </span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className={`${inputClass} min-h-24 resize-y`}
                    placeholder="Add inspection instructions or other details..."
                    maxLength={2000}
                    rows={3}
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || fields.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {submitting ? "Scheduling..." : "Schedule mission"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className={`${panelClass} overflow-hidden`}>
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-white">Your missions</h2>
              <p className="mt-1 text-sm text-white/50">
                Review schedules and manage active missions.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search missions..."
                  aria-label="Search missions"
                  className={`${inputClass} pl-9 sm:w-56`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as MissionStatusFilter,
                  )
                }
                aria-label="Filter missions by status"
                className={`${inputClass} sm:w-40`}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 px-5 py-16 text-sm text-white/50">
              <Loader2 size={18} className="animate-spin text-emerald-300" />
              Loading missions...
            </div>
          ) : visibleMissions.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <CalendarDays size={22} />
              </div>
              <h3 className="mt-4 font-medium text-white">
                {missions.length === 0
                  ? "No missions scheduled yet"
                  : "No missions match your search"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
                {missions.length === 0
                  ? "Create a mission to plan your next field inspection."
                  : "Try a different search term or change the status filter."}
              </p>

              {missions.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400"
                >
                  <Plus size={16} />
                  Create your first mission
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {visibleMissions.map((mission) => {
                const missionOccurrences = sortedOccurrences.filter(
                  (occurrence) => occurrence.mission_id === mission.id,
                );

                return (
                  <article
                    key={mission.id}
                    className="p-5 transition hover:bg-white/[0.02] md:p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                          <CalendarDays size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words font-semibold text-white">
                              {mission.title}
                            </h3>
                            <StatusBadge status={mission.status} />
                          </div>

                          <p className="mt-2 flex items-center gap-2 text-sm text-white/50">
                            <MapPin
                              size={15}
                              className="shrink-0 text-emerald-300"
                            />
                            {getFieldName(farms, mission.field_id)}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/40">
                            <span>
                              Starts: {formatDate(mission.starts_at)}
                            </span>
                            <span>
                              Repeats: {formatRecurrence(mission)}
                            </span>
                            {mission.ends_at && (
                              <span>
                                Ends: {formatDate(mission.ends_at)}
                              </span>
                            )}
                          </div>

                          {mission.notes && (
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">
                              {mission.notes}
                            </p>
                          )}

                          {missionOccurrences.length > 0 && (
                            <p className="mt-3 text-xs text-white/40">
                              {missionOccurrences.length} occurrence
                              {missionOccurrences.length === 1 ? "" : "s"} in
                              the loaded schedule
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap lg:shrink-0">
                        <Link
                          href={`/analysis?fieldId=${mission.field_id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/15"
                        >
                          Open analysis
                        </Link>

                        {mission.status === "active" && (
                          <button
                            type="button"
                            onClick={() => void handleCancelMission(mission)}
                            disabled={busyId === mission.id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-white/60 transition hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
                          >
                            {busyId === mission.id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <X size={15} />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-white/10 p-5 md:p-6">
            <h2 className="font-semibold text-white">Scheduled occurrences</h2>
            <p className="mt-1 text-sm text-white/50">
              Upcoming and overdue activities generated from your mission
              schedules.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 px-5 py-12 text-sm text-white/50">
              <Loader2 size={18} className="animate-spin text-emerald-300" />
              Loading scheduled activities...
            </div>
          ) : sortedOccurrences.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Clock3 size={24} className="mx-auto text-white/30" />
              <p className="mt-3 text-sm text-white/60">
                No occurrences found in the loaded schedule.
              </p>
              <p className="mt-1 text-xs text-white/40">
                Create a mission or refresh the page to check again.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {sortedOccurrences.map((occurrence) => {
                const mission = missions.find(
                  (item) => item.id === occurrence.mission_id,
                );

                const isOverdue =
                  occurrence.status === "pending" &&
                  new Date(occurrence.scheduled_at).getTime() < Date.now();

                return (
                  <div
                    key={occurrence.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isOverdue
                            ? "bg-red-400/10 text-red-300"
                            : "bg-emerald-400/10 text-emerald-300"
                        }`}
                      >
                        {isOverdue ? (
                          <AlertCircle size={19} />
                        ) : (
                          <Clock3 size={19} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-sm font-medium text-white">
                            {mission?.title ?? `Mission #${occurrence.mission_id}`}
                          </h3>
                          <StatusBadge
                            status={isOverdue ? "overdue" : occurrence.status}
                          />
                        </div>

                        <p className="mt-1 text-sm text-white/50">
                          {formatDate(occurrence.scheduled_at)}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {mission
                            ? getFieldName(farms, mission.field_id)
                            : `Occurrence #${occurrence.id}`}
                        </p>

                        {occurrence.completed_at && (
                          <p className="mt-1 text-xs text-emerald-300/80">
                            Completed: {formatDate(occurrence.completed_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap md:w-auto md:shrink-0">
                      {occurrence.analysis_record_id != null && (
                        <Link
                          href="/reports"
                          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          View report
                        </Link>
                      )}

                      {occurrence.status === "pending" && (
                        <>
                          <Link
                            href={`/analysis?fieldId=${mission?.field_id ?? ""}&occurrenceId=${occurrence.id}`}
                            className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
                          >
                            Run analysis
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleId(occurrence.id);
                              setRescheduleValue(
                                getLocalDateTimeValue(
                                  new Date(occurrence.scheduled_at),
                                ),
                              );
                              setNotice(null);
                            }}
                            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            Reschedule
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleSkipOccurrence(occurrence)}
                            disabled={busyId === occurrence.id}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 transition hover:border-amber-400/20 hover:bg-amber-400/10 hover:text-amber-300 disabled:opacity-50"
                          >
                            {busyId === occurrence.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <SkipForward size={14} />
                            )}
                            Skip
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {rescheduleId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="reschedule-heading"
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101010] p-5 shadow-2xl md:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="reschedule-heading"
                    className="font-semibold text-white"
                  >
                    Reschedule occurrence
                  </h2>
                  <p className="mt-1 text-sm text-white/50">
                    Choose the new date and time for this activity.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRescheduleId(null);
                    setRescheduleValue("");
                  }}
                  aria-label="Close reschedule form"
                  className="rounded-lg p-2 text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={handleRescheduleOccurrence}
                className="mt-5 space-y-5"
              >
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/70">
                    New date and time
                  </span>
                  <input
                    type="datetime-local"
                    value={rescheduleValue}
                    onChange={(event) =>
                      setRescheduleValue(event.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </label>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRescheduleId(null);
                      setRescheduleValue("");
                    }}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={busyId === rescheduleId}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {busyId === rescheduleId && (
                      <Loader2 size={15} className="animate-spin" />
                    )}
                    Save schedule
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-emerald-300" />
          <div>
            <p className="text-sm font-medium text-white/80">
              Important
            </p>
            <p className="mt-1 text-sm leading-6 text-white/50">
              Scheduling a mission does not automatically launch a drone or run
              AI analysis. Select <span className="text-white/70">Run analysis</span>{" "}
              when you are ready to analyse a field. The analysis must be saved
              before it can be used as a completed mission record.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
