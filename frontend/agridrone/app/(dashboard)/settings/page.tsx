import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <PageHeader
          title="Settings"
          description="Manage your AgriDrone application settings."
        />

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-medium">
              AI Configuration
            </h2>

            <p className="mt-2 text-sm text-white/40">
              AI models are managed by the AgriDrone backend.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-medium">
              API Connection
            </h2>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-white/50">
                Backend connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}