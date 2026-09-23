interface AIStatusProps {
  detecting: boolean;
}

export default function AIStatus({
  detecting,
}: AIStatusProps) {
  return (
    <div
      className="
        absolute
        top-3
        left-3
        rounded
        bg-black/70
        px-3
        py-1
        text-sm
        text-white
      "
    >
      {detecting
        ? "AI scanning..."
        : "Live AI"}
    </div>
  );
}