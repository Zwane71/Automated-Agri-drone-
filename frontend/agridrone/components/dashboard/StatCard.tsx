export default function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>

        <span className="text-xs text-emerald-400">
          {value !== "0" && value !== "—"
            ? "Live"
            : "Waiting"}
        </span>
      </div>

      <p className="mt-5 text-sm text-white/40">
        {label}
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-xs text-white/35">
        {change}
      </p>
    </div>
  );
}