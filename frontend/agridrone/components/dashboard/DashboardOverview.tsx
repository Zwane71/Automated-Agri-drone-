"use client";

import {
  Activity,
  AlertCircle,
  Camera,
  Sprout,
} from "lucide-react";

import StatCard from "./StatCard";

interface DashboardOverviewProps {
  cropCount: number;
  diseasedCropCount: number;
  diseaseCount: number;
  cameraCount: number;
}

export default function DashboardOverview({
  cropCount,
  diseasedCropCount,
  diseaseCount,
  cameraCount,
}: DashboardOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Crops Detected"
        value={cropCount}
        change="From latest analysis"
        icon={<Sprout className="h-5 w-5" />}
      />

      <StatCard
        label="Diseased Crops"
        value={diseasedCropCount}
        change="Crops with disease findings"
        icon={
          <AlertCircle className="h-5 w-5" />
        }
      />

      <StatCard
        label="Disease Findings"
        value={diseaseCount}
        change="Detected disease regions"
        icon={
          <Activity className="h-5 w-5" />
        }
      />

      <StatCard
        label="Cameras"
        value={cameraCount}
        change="Configured field cameras"
        icon={
          <Camera className="h-5 w-5" />
        }
      />
    </div>
  );
}