"use client";

import type { AnalysisResult } from "./types";

interface CameraOverlayProps {
  result: AnalysisResult | null;
}

export default function CameraOverlay({
  result,
}: CameraOverlayProps) {
  if (!result) return null;

  const allDiseases = result.crops.flatMap(
    (crop) => crop.diseases
  );

  return (
    <>
      {/* Crop bounding boxes */}
      {result.crops.map((crop) => {
        const [x1, y1, x2, y2] = crop.box;

        const left = (x1 / result.image_width) * 100;
        const top = (y1 / result.image_height) * 100;
        const width =
          ((x2 - x1) / result.image_width) * 100;
        const height =
          ((y2 - y1) / result.image_height) * 100;

        return (
          <div
            key={`crop-${crop.crop_id}`}
            className="
              absolute
              border-2
              border-green-500
              pointer-events-none
            "
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
          >
            <div
              className="
                absolute
                -top-7
                left-0
                whitespace-nowrap
                rounded
                bg-green-500
                px-2
                py-1
                text-xs
                font-bold
                text-black
              "
            >
              {crop.crop}{" "}
              {(crop.confidence * 100).toFixed(1)}%
            </div>
          </div>
        );
      })}

      {/* Disease bounding boxes */}
      {allDiseases.map((disease, index) => {
        const [x1, y1, x2, y2] = disease.box;

        const left = (x1 / result.image_width) * 100;
        const top = (y1 / result.image_height) * 100;
        const width =
          ((x2 - x1) / result.image_width) * 100;
        const height =
          ((y2 - y1) / result.image_height) * 100;

        return (
          <div
            key={`disease-${index}`}
            className="
              absolute
              border-2
              border-red-500
              pointer-events-none
            "
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
          >
            <div
              className="
                absolute
                -top-7
                left-0
                whitespace-nowrap
                rounded
                bg-red-500
                px-2
                py-1
                text-xs
                font-bold
                text-white
              "
            >
              {disease.disease}{" "}
              {(disease.confidence * 100).toFixed(1)}%
            </div>
          </div>
        );
      })}
    </>
  );
}