
"use client";

import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Sprout,
  Tractor,
} from "lucide-react";

import StatCard from "./StatCard";

interface DashboardOverviewProps {
  farmCount: number;
  fieldCount: number;
  scheduledInspectionCount: number;
  completedAnalysisCount: number;
}

export default function DashboardOverview({
  farmCount,
  fieldCount,
  scheduledInspectionCount,
  completedAnalysisCount,
}: DashboardOverviewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Farms"
        value={farmCount}
        change="Registered farms"
        icon={<Tractor className="h-5 w-5" />}
      />

      <StatCard
        label="Fields Monitored"
        value={fieldCount}
        change="Available for inspection"
        icon={<Sprout className="h-5 w-5" />}
      />

      <StatCard
        label="Scheduled Inspections"
        value={scheduledInspectionCount}
        change="Pending inspection tasks"
        icon={<CalendarClock className="h-5 w-5" />}
      />

      <StatCard
        label="Completed Analyses"
        value={completedAnalysisCount}
        change="Saved AI analysis records"
        icon={<CheckCircle2 className="h-5 w-5" />}
      />
    </div>
  );
}
