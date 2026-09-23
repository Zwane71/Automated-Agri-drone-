import type { AnalysisResult } from "./types";

interface DetectionSummaryProps {
  result: AnalysisResult;
}

export default function DetectionSummary({
  result,
}: DetectionSummaryProps) {
  return (
    <div
      className="
        mb-4
        grid
        grid-cols-1
        gap-2
        sm:grid-cols-3
      "
    >
      <div
        className="
          rounded-lg
          bg-gray-800
          p-3
        "
      >
        <p className="text-sm text-gray-400">
          Crops detected
        </p>

        <p className="text-2xl font-bold">
          {result.crop_count}
        </p>
      </div>

      <div
        className="
          rounded-lg
          bg-gray-800
          p-3
        "
      >
        <p className="text-sm text-gray-400">
          Diseased crops
        </p>

        <p className="text-2xl font-bold">
          {result.diseased_crop_count}
        </p>
      </div>

      <div
        className="
          rounded-lg
          bg-gray-800
          p-3
        "
      >
        <p className="text-sm text-gray-400">
          Disease findings
        </p>

        <p className="text-2xl font-bold">
          {result.disease_count}
        </p>
      </div>
    </div>
  );
}