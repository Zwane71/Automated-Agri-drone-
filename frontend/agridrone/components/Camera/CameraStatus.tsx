interface CameraStatusProps {
  connected: boolean;
  message?: string;
}

export default function CameraStatus({
  connected,
  message,
}: CameraStatusProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          connected
            ? "bg-green-400"
            : "bg-red-400"
        }`}
      />

      <div>
        <p className="text-sm font-medium">
          {connected ? "Camera Connected" : "Camera Offline"}
        </p>

        {message && (
          <p className="mt-0.5 text-xs text-white/40">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}