"use client";

import CameraMonitor from "@/components/Camera/CameraMonitor";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";


export default function CameraPage() {
  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <PageHeader
          title="Camera"
          description="Monitor your field camera and prepare the live feed for AI analysis."
        />

        <CameraMonitor />
      </div>
    </DashboardShell>
  );
}