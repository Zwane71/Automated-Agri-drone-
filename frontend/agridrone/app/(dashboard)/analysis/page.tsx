import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";

export default function MissionsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <PageHeader
          title="Missions"
          description="Plan and monitor drone field missions."
        />

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-lg font-medium">
            No missions yet
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Create a drone mission to begin collecting
            agricultural data.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}