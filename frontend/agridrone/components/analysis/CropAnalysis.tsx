import CropResult from "./CropResult";
import { AnalysisResult } from "./types";


interface CropAnalysisProps {
  result: AnalysisResult;
}

export default function CropAnalysis({
  result,
}: CropAnalysisProps) {
  return (
    <div>
      <h3
        className="
          mb-2
          font-semibold
        "
      >
        Crop Analysis
      </h3>

      <div
        className="
          flex
          flex-col
          gap-2
        "
      >
        {result.crops.map((crop, index) => (
          <CropResult
            key={`${crop.crop}-${crop.box.join("-")}`}
            crop={crop}
          />
        ))}
      </div>
    </div>
  );
}