import type { CropDetection } from "./types";
import DiseaseResult from "./DiseaseResult";

interface CropResultProps {
  crop: CropDetection;
}

export default function CropResult({
  crop,
}: CropResultProps) {
  return (
    <div
      className="
        rounded-lg
        bg-gray-800
        p-3
      "
    >
      {/* CROP HEADER */}
      <div
        className="
          flex
          items-center
          justify-between
        "
      >
        <div>
          <span className="font-medium">
            Crop #{crop.crop_id}
          </span>

          <span className="ml-2 text-gray-400">
            {crop.crop}
          </span>
        </div>

        <span>
          {(crop.confidence * 100).toFixed(1)}%
        </span>
      </div>

      {/* NO DISEASE */}
      {crop.disease_count === 0 && (
        <p
          className="
            mt-2
            text-sm
            text-gray-400
          "
        >
          No detected disease
        </p>
      )}

      {/* DISEASES */}
      {crop.diseases.length > 0 && (
        <div
          className="
            mt-3
            flex
            flex-col
            gap-2
          "
        >
          {crop.diseases.map(
            (disease, index) => (
              <DiseaseResult
                key={index}
                disease={disease}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}