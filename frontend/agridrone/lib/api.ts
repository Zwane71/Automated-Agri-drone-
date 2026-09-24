import type {
  AnalysisResult,
  CropDetection,
  DiseaseDetection,
} from "@/components/analysis/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

async function postImage<T>(
  path: string,
  file: Blob
): Promise<T> {
  const formData = new FormData();

  formData.append(
    "file",
    file,
    file instanceof File ? file.name : "drone-image.jpg"
  );

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "Request failed";

    try {
      const data = await response.json();

      message =
        data?.detail ||
        data?.message ||
        JSON.stringify(data);
    } catch {
      const text = await response.text();

      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  return response.json();
}

/* =========================
   CROP DETECTION
========================= */

export interface CropDetectionResponse {
  image_width: number;
  image_height: number;
  crop_count: number;
  crops: CropDetection[];
  timing?: {
    image_read_seconds: number;
    model_seconds: number;
    total_seconds: number;
  };
}

export async function detectCrops(
  file: Blob
): Promise<CropDetectionResponse> {
  return postImage<CropDetectionResponse>(
    "/api/v1/crops/detect",
    file
  );
}

/* =========================
   DISEASE SEGMENTATION
========================= */

export interface DiseaseSegmentationResponse {
  image_width: number;
  image_height: number;
  disease_count: number;
  diseases: DiseaseDetection[];
  timing?: {
    image_read_seconds?: number;
    model_seconds?: number;
    total_seconds?: number;
  };
}

export async function segmentDisease(
  file: Blob
): Promise<DiseaseSegmentationResponse> {
  return postImage<DiseaseSegmentationResponse>(
    "/api/v1/disease/segment",
    file
  );
}

/* =========================
   FULL ANALYSIS
========================= */

export async function analyzeFull(
  file: Blob
): Promise<AnalysisResult> {
  return postImage<AnalysisResult>(
    "/api/v1/analysis/full",
    file
  );
}

/*
  Keep this name because your current dashboard
  already uses analyzeImage().
*/

export async function analyzeImage(
  file: Blob
): Promise<AnalysisResult> {
  return analyzeFull(file);
}

/* =========================
   CENSUS
========================= */

export interface CensusResponse {
  image_width: number;
  image_height: number;
  crop_count: number;
  crops: CropDetection[];
  note?: string;
  timing?: {
    image_read_seconds?: number;
    model_seconds?: number;
    total_seconds?: number;
  };
}

export async function getCensus(
  file: Blob
): Promise<CensusResponse> {
  return postImage<CensusResponse>(
    "/api/v1/census",
    file
  );
}

/* =========================
   LEGACY API
========================= */

export interface LegacyDetectResponse {
  image_width: number;
  image_height: number;
  cabbage_count: number;
  cabbage_detections: CropDetection[];
  disease_count: number;
  diseases: DiseaseDetection[];
}

export async function detectLegacy(
  file: Blob
): Promise<LegacyDetectResponse> {
  return postImage<LegacyDetectResponse>(
    "/detect",
    file
  );
}