import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";

export default function FieldsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <PageHeader
          title="Fields"
          description="Manage agricultural fields and monitoring areas."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-white/40">
              Fields
            </p>

            <p className="mt-2 text-3xl font-semibold">
              0
            </p>

            <p className="mt-2 text-xs text-white/30">
              No fields registered
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}