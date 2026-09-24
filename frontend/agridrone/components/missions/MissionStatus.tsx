interface MissionStatusProps {
  status: "planned" | "active" | "completed";
}

const styles = {
  planned: "bg-yellow-500/10 text-yellow-400",
  active: "bg-emerald-500/10 text-emerald-400",
  completed: "bg-blue-500/10 text-blue-400",
};

const labels = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
};

export default function MissionStatus({
  status,
}: MissionStatusProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}