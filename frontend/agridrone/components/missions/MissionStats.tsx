import {
  CheckCircle2,
  Clock3,
  Plane,
  Radio,
} from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";

interface MissionStatsProps {
  total: number;
  active: number;
  planned: number;
  completed: number;
}

export default function MissionStats({
  total,
  active,
  planned,
  completed,
}: MissionStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Missions"
        value={total}
        change="All missions"
        icon={<Plane className="h-5 w-5" />}
      />

      <StatCard
        label="Active"
        value={active}
        change="Currently flying"
        icon={<Radio className="h-5 w-5" />}
      />

      <StatCard
        label="Planned"
        value={planned}
        change="Upcoming missions"
        icon={<Clock3 className="h-5 w-5" />}
      />

      <StatCard
        label="Completed"
        value={completed}
        change="Finished missions"
        icon={<CheckCircle2 className="h-5 w-5" />}
      />
    </div>
  );
}