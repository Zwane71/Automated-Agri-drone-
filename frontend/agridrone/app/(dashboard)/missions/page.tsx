"use client";

import { Plus } from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";

import MissionCard, {
  type Mission,
} from "@/components/missions/MissionCard";

import MissionStats from "@/components/missions/MissionStats";

const missions: Mission[] = [
  {
    id: 1,
    name: "North Field Survey",
    field: "North Field",
    date: "Today",
    status: "active",
    coverage: "68%",
  },
  {
    id: 2,
    name: "Cabbage Health Scan",
    field: "East Field",
    date: "Tomorrow",
    status: "planned",
    coverage: "0%",
  },
  {
    id: 3,
    name: "South Field Analysis",
    field: "South Field",
    date: "18 Sep 2026",
    status: "completed",
    coverage: "100%",
  },
];

export default function MissionsPage() {
  const total = missions.length;

  const active = missions.filter(
    (mission) => mission.status === "active"
  ).length;

  const planned = missions.filter(
    (mission) => mission.status === "planned"
  ).length;

  const completed = missions.filter(
    (mission) => mission.status === "completed"
  ).length;

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">

        <PageHeader
          title="Missions"
          description="Plan, monitor and review your drone field missions."
          action={
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" />
              New Mission
            </button>
          }
        />

        <MissionStats
          total={total}
          active={active}
          planned={planned}
          completed={completed}
        />

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-medium">
              Recent Missions
            </h2>

            <p className="mt-1 text-sm text-white/35">
              Your latest drone operations.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
              />
            ))}
          </div>
        </section>

      </div>
    </DashboardShell>
  );
}