
"use client";

import type { AnalysisResult } from "./types";
import CameraOverlay from "./CameraOverlay";

interface AnnotatedImageProps {
  imageUrl: string;
  result: AnalysisResult;
}

export default function AnnotatedImage({
  imageUrl,
  result,
}: AnnotatedImageProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border bg-black">
      <div className="relative w-full">
        <img
          src={imageUrl}
          alt="Crop analysis with AI detection highlights"
          className="block h-auto w-full"
        />

        <CameraOverlay result={result} />
      </div>

      <div className="flex flex-wrap gap-4 border-t bg-white px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-gray-700">
          <span className="h-3 w-3 rounded-sm bg-green-500" />
          Detected crops
        </span>

        <span className="flex items-center gap-2 text-gray-700">
          <span className="h-3 w-3 rounded-sm bg-red-500" />
          Detected diseases
        </span>
      </div>
    </div>
  );
}
