import type {
  AnalysisResult,
  CropDetection,
  DiseaseDetection,
} from "@/components/analysis/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

console.log("AI API URL:", API_URL);
async function postImage<T>(
  path: string,
  file: Blob
): Promise<T> {
  console.log("========================================");
  console.log("[API] postImage START");
  console.log("[API] API_URL:", API_URL);
  console.log("[API] path:", path);
  console.log("[API] full URL:", `${API_URL}${path}`);
  console.log("[API] file type:", file.type);
  console.log("[API] file size:", file.size);
  console.log("[API] file instanceof Blob:", file instanceof Blob);
  console.log("[API] file instanceof File:", file instanceof File);

  const formData = new FormData();

  console.log("[API] FormData created");

  formData.append(
    "file",
    file,
    file instanceof File ? file.name : "drone-image.jpg"
  );

  console.log("[API] File appended to FormData");

  // Inspect FormData
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log("[API] FormData file:", {
        key,
        name: value.name,
        type: value.type,
        size: value.size,
      });
    } else {
      console.log("[API] FormData value:", {
        key,
        value,
      });
    }
  }

  console.log("[API] About to call fetch...");

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      body: formData,
    });

    console.log("[API] fetch completed");
    console.log("[API] response:", response);
    console.log("[API] response.ok:", response.ok);
    console.log("[API] response.status:", response.status);
    console.log("[API] response.statusText:", response.statusText);
    console.log(
      "[API] response.url:",
      response.url
    );
    console.log(
      "[API] response.type:",
      response.type
    );

    console.log(
      "[API] response headers:"
    );

    response.headers.forEach((value, key) => {
      console.log(
        `[API] header ${key}:`,
        value
      );
    });

    if (!response.ok) {
      console.log(
        "[API] Response was NOT OK"
      );

      let message = "Request failed";

      try {
        const data = await response.json();

        console.log(
          "[API] Error JSON:",
          data
        );

        message =
          data?.detail ||
          data?.message ||
          JSON.stringify(data);
      } catch (jsonError) {
        console.log(
          "[API] Could not parse error JSON:",
          jsonError
        );

        try {
          const text = await response.text();

          console.log(
            "[API] Error response text:",
            text
          );

          if (text) {
            message = text;
          }
        } catch (textError) {
          console.log(
            "[API] Could not read response text:",
            textError
          );
        }
      }

      console.log(
        "[API] Throwing API error:",
        message
      );

      throw new Error(message);
    }

    console.log(
      "[API] Reading successful JSON response..."
    );

    const data = await response.json();

    console.log(
      "[API] JSON response:",
      data
    );

    console.log("[API] postImage SUCCESS");
    console.log("========================================");

    return data;
  } catch (error) {
    console.error(
      "[API] FETCH ERROR"
    );

    console.error(
      "[API] Error object:",
      error
    );

    console.error(
      "[API] Error name:",
      error instanceof Error
        ? error.name
        : "unknown"
    );

    console.error(
      "[API] Error message:",
      error instanceof Error
        ? error.message
        : String(error)
    );

    console.error(
      "[API] Error stack:",
      error instanceof Error
        ? error.stack
        : "no stack"
    );

    console.error(
      "[API] Failed URL:",
      `${API_URL}${path}`
    );

    console.error(
      "[API] Current browser URL:",
      window.location.href
    );

    console.error(
      "[API] Current origin:",
      window.location.origin
    );

    console.error(
      "[API] navigator.onLine:",
      navigator.onLine
    );

    console.error(
      "[API] userAgent:",
      navigator.userAgent
    );

    console.log("========================================");

    throw error;
  }
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
  console.log("[ANALYZE] analyzeFull called");

  console.log("[ANALYZE] file:", {
    type: file.type,
    size: file.size,
    isBlob: file instanceof Blob,
    isFile: file instanceof File,
  });

  console.log(
    "[ANALYZE] Sending to:",
    `${API_URL}/api/v1/analysis/full`
  );

  try {
    const result = await postImage<AnalysisResult>(
      "/api/v1/analysis/full",
      file
    );

    console.log(
      "[ANALYZE] Analysis successful:",
      result
    );

    return result;
  } catch (error) {
    console.error(
      "[ANALYZE] Analysis failed:",
      error
    );

    throw error;
  }
}

/*
 * Keep this name because the current
 * dashboard already uses analyzeImage().
 */

export async function analyzeImage(
  file: Blob
): Promise<AnalysisResult> {
  return analyzeFull(file);
}

/* =========================
   CENSUS
========================= */

export interface CensusCrop {
  crop: string;
  confidence: number;
  box: [number, number, number, number];
}

export interface CensusResponse {
  image_width: number;
  image_height: number;
  total_crops: number;
  crop_summary: Record<string, number>;
  crops: CensusCrop[];
  census_type: string;
  note?: string;
  timing?: {
    image_read_seconds?: number;
    model_seconds?: number;
    total_seconds?: number;
  };
}

/* =========================
   CENSUS API
========================= */

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

export interface CameraTestResponse {
  connected: boolean;
  message: string;
  image_width?: number;
  image_height?: number;
}


export async function testCamera(
  cameraUrl: string
): Promise<CameraTestResponse> {
  const params = new URLSearchParams({
    camera_url: cameraUrl,
  });

  const response = await fetch(
    `${API_URL}/api/v1/camera/test?${params.toString()}`
  );

  if (!response.ok) {
    let message = "Camera test failed.";

    try {
      const data = await response.json();
      message =
        data?.detail ||
        data?.message ||
        message;
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}


export function getCameraStreamUrl(
  cameraUrl: string
): string {
  const params = new URLSearchParams({
    camera_url: cameraUrl,
  });

  return (
    `${API_URL}/api/v1/camera/stream?` +
    params.toString()
  );
}
export async function analyzeCameraFrame(
  cameraUrl: string
): Promise<AnalysisResult> {
  const params = new URLSearchParams({
    camera_url: cameraUrl,
  });

  const response = await fetch(
    `${API_URL}/api/v1/camera/analyze?${params.toString()}`
  );

  if (!response.ok) {
    let message = "Camera AI analysis failed.";

    try {
      const data = await response.json();

      message =
        data?.detail ||
        data?.message ||
        message;
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}