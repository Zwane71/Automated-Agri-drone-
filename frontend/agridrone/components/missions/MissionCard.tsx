import {
  CalendarDays,
  MapPin,
  Plane,
} from "lucide-react";

import MissionStatus from "./MissionStatus";

export interface Mission {
  id: number;
  name: string;
  field: string;
  date: string;
  status: "planned" | "active" | "completed";
  coverage: string;
}

interface MissionCardProps {
  mission: Mission;
}

export default function MissionCard({
  mission,
}: MissionCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
            <Plane className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-medium">
              {mission.name}
            </h3>

            <p className="mt-1 text-xs text-white/35">
              Mission #{mission.id}
            </p>
          </div>
        </div>

        <MissionStatus status={mission.status} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm text-white/45">
          <MapPin className="h-4 w-4" />
          {mission.field}
        </div>

        <div className="flex items-center gap-2 text-sm text-white/45">
          <CalendarDays className="h-4 w-4" />
          {mission.date}
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/35">
            Field coverage
          </span>

          <span className="text-white/60">
            {mission.coverage}
          </span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{
              width: mission.coverage,
            }}
          />
        </div>
      </div>
    </div>
  );
}