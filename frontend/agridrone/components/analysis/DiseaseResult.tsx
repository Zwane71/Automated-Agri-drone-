import type { DiseaseDetection } from "./types";

interface DiseaseResultProps {
  disease: DiseaseDetection;
}

export default function DiseaseResult({
  disease,
}: DiseaseResultProps) {
  return (
    <div
      className="
        rounded
        border
        border-red-500/30
        bg-gray-900
        p-2
      "
    >
      <div
        className="
          flex
          justify-between
          gap-2
        "
      >
        <span
          className="
            font-medium
            text-red-400
          "
        >
          {disease.disease}
        </span>

        <span>
          {(disease.confidence * 100).toFixed(1)}%
        </span>
      </div>

      {disease.affected_area_percent !==
        undefined && (
        <p
          className="
            mt-1
            text-sm
            text-gray-400
          "
        >
          Affected area:{" "}
          {disease.affected_area_percent.toFixed(2)}%
        </p>
      )}
    </div>
  );
}
