
"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  FileImage,
} from "lucide-react";

import Link from "next/link";

import {
  getFarms,
  getMissions,
  getMissionOccurrences,
  getAnalysisHistory,
} from "@/lib/api";

import type {
  Farm,
  Mission,
  MissionOccurrence,
  AnalysisHistoryRecord,
} from "@/lib/api";

import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DashboardCamera from "@/components/dashboard/DashboardCamera";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";

export default function HomePage() {

  const [cameraCount, setCameraCount] = useState(0);

  const [farmCount, setFarmCount] = useState(0);
  const [fieldCount, setFieldCount] = useState(0);
  const [scheduledInspectionCount, setScheduledInspectionCount] =
    useState(0);
  const [completedAnalysisCount, setCompletedAnalysisCount] =
    useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [recentInspections, setRecentInspections] =
  useState<AnalysisHistoryRecord[]>([]);

  const [missions, setMissions] = useState<Mission[]>([]);

  const [occurrences, setOccurrences] =
    useState<MissionOccurrence[]>([]);

  useEffect(() => {
  let cancelled = false;

  async function loadDashboardData() {
    setDashboardLoading(true);

    const [farmsResult, missionsResult, occurrencesResult, historyResult] =
      await Promise.allSettled([
        getFarms(),
        getMissions(),
        getMissionOccurrences(90, true),
        getAnalysisHistory(),
      ]);

    if (cancelled) return;

    if (farmsResult.status === "fulfilled") {
  const farms = farmsResult.value;

  setFarmCount(farms.length);
  setFieldCount(
    farms.reduce(
      (total, farm) => total + farm.fields.length,
      0
    )
  );
    }

    if (missionsResult.status === "fulfilled") {
      setMissions(missionsResult.value);
    }

    if (historyResult.status === "fulfilled") {
      const history = [...historyResult.value].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      setRecentInspections(history.slice(0, 5));
      setCompletedAnalysisCount(history.length);
    }

    // Missions and occurrences are separate records.
    // Use occurrence records for the scheduled-inspection count.
    if (occurrencesResult.status === "fulfilled") {
      const occurrences = occurrencesResult.value;

      setScheduledInspectionCount(
        occurrences.filter(
          (occurrence) => occurrence.status === "pending"
        ).length
      );
    }

    if (historyResult.status === "fulfilled") {
      setCompletedAnalysisCount(historyResult.value.length);
    }

    if (missionsResult.status === "rejected") {
      console.error("Failed to load missions:", missionsResult.reason);
    }

    if (farmsResult.status === "rejected") {
      console.error("Failed to load farms:", farmsResult.reason);
    }

    if (occurrencesResult.status === "rejected") {
      console.error(
        "Failed to load inspection occurrences:",
        occurrencesResult.reason
      );
    }

    if (historyResult.status === "rejected") {
      console.error(
        "Failed to load analysis history:",
        historyResult.reason
      );
    }

    setDashboardLoading(false);
  }

  void loadDashboardData();

  return () => {
    cancelled = true;
  };
}, []);

  useEffect(() => {
  try {
    const savedCameras =
      localStorage.getItem(
        "agri-drone-cameras"
      );

    if (!savedCameras) {
      setCameraCount(0);
      return;
    }

    const cameras = JSON.parse(
      savedCameras
    );

    if (Array.isArray(cameras)) {
      setCameraCount(cameras.length);
    }
  } catch {
    setCameraCount(0);
  }
}, []);
  return (
  <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <PageHeader
          title="Dashboard"
          description="Monitor crops, disease detection, and agricultural field activity."
        />

        {/* Overview */}
        <DashboardOverview
          farmCount={farmCount}
          fieldCount={fieldCount}
          scheduledInspectionCount={scheduledInspectionCount}
          completedAnalysisCount={completedAnalysisCount}
        />

            {dashboardLoading && (
              <p className="text-xs text-white/40">
                Refreshing dashboard statistics...
              </p>
            )}

          <DashboardCamera cameraCount={cameraCount} />
          
            {/* AI Analysis shortcut */}
            <Link
              href="/analysis"
              className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-400/30 hover:bg-white/[0.05]"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <FileImage className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-lg font-medium">
                      AI Field Analysis
                    </h2>

                    <p className="mt-1 max-w-xl text-sm leading-6 text-white/40">
                      Open the analysis workspace to detect crops,
                      analyze cabbage diseases, and review AI results.
                    </p>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-emerald-400 transition group-hover:text-emerald-300">
                  Open Analysis
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            

{/* Recent Reports */}
<section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
  <div className="flex items-center justify-between gap-4">
    <div>
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-medium">
          Recent Reports
        </h2>
      </div>

      <p className="mt-1 text-sm text-white/40">
        Review your latest saved AI analysis reports.
      </p>
    </div>

    <Link
      href="/reports"
      className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
    >
      View All Reports
      <ArrowRight className="h-4 w-4" />
    </Link>
  </div>

  {recentInspections.length === 0 ? (
    <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center">
      <FileImage className="mx-auto h-8 w-8 text-white/20" />

      <p className="mt-3 text-sm text-white/50">
        No reports available yet.
      </p>

      <Link
        href="/analysis"
        className="mt-3 inline-flex text-sm text-emerald-400 hover:text-emerald-300"
      >
        Run an AI analysis
      </Link>
    </div>
  ) : (
    <div className="mt-5 space-y-3">
      {recentInspections.map((report) => (
        <div
          key={report.id}
          className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">
              Report #{report.id}
            </p>

            <p className="mt-1 text-xs text-white/40">
              {new Date(report.created_at).toLocaleString()}
            </p>

            <p className="mt-2 text-sm text-white/60">
              {report.crop_count} crops ·{" "}
              {report.diseased_crop_count} diseased crops ·{" "}
              {report.disease_count} disease findings
            </p>
          </div>

          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
          >
            Open Reports
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ))}
    </div>
  )}
</section>


{/* Upcoming Missions */}
<section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
  <div className="flex items-center justify-between gap-4">
    <div>
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-medium">
          Upcoming Missions
        </h2>
      </div>

      <p className="mt-1 text-sm text-white/40">
        Your next scheduled farm inspections.
      </p>
    </div>

    <Link
      href="/missions"
      className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
    >
      Manage Missions
      <ArrowRight className="h-4 w-4" />
    </Link>
  </div>

  {(() => {
    const now = Date.now();

    const upcoming = occurrences
      .filter(
        (item) =>
          item.status === "pending" &&
          new Date(item.scheduled_at).getTime() >= now
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      )
      .slice(0, 5);

    if (upcoming.length === 0) {
      return (
        <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-white/20" />

          <p className="mt-3 text-sm text-white/50">
            No upcoming inspections scheduled.
          </p>

          <Link
            href="/missions"
            className="mt-3 inline-flex text-sm text-emerald-400 hover:text-emerald-300"
          >
            Schedule an inspection
          </Link>
        </div>
      );
    }

    return (
      <div className="mt-5 space-y-3">
        {upcoming.map((occurrence) => {
          const mission = missions.find(
            (item) => item.id === occurrence.mission_id
          );

          return (
            <div
              key={occurrence.id}
              className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {mission?.title ?? `Mission #${occurrence.mission_id}`}
                </p>

                <p className="mt-1 text-sm text-white/50">
                  {new Date(
                    occurrence.scheduled_at
                  ).toLocaleString()}
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Field #{mission?.field_id ?? "Unknown"}
                </p>
              </div>

              <Link
                href={`/analysis?fieldId=${mission?.field_id ?? ""}&occurrenceId=${occurrence.id}`}
                className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
              >
                Open inspection
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    );
  })()}
</section>


      </div>
    </DashboardShell>
  );
}
