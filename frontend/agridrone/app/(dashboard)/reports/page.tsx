import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";

export default function ReportsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <PageHeader
          title="Reports"
          description="Review AI analysis and agricultural field reports."
        />

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-lg font-medium">
            No reports available
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Reports will appear here after field analysis.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}