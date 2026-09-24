"use client";

import {
  Camera,
  ExternalLink,
} from "lucide-react";

import Link from "next/link";

interface DashboardCameraProps {
  cameraCount: number;
}

export default function DashboardCamera({
  cameraCount,
}: DashboardCameraProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-white/50" />

            <h2 className="text-lg font-medium">
              Field Camera
            </h2>
          </div>

          <p className="mt-1 text-sm text-white/40">
            Monitor your configured field cameras
            and run AI analysis on captured frames.
          </p>
        </div>

        <Link
          href="/camera"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:bg-white/10"
        >
          Open Camera
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <InfoItem
          label="Configured Cameras"
          value={cameraCount.toString()}
        />

        <InfoItem
          label="Monitoring"
          value="Available"
        />

        <InfoItem
          label="AI Analysis"
          value="Ready"
        />
      </div>
    </section>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs text-white/40">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}