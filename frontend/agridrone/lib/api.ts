
import type {
  AnalysisResult,
  CropDetection,
  DiseaseDetection,
} from "@/components/analysis/types";


const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");


async function postImage<T>(
  path: string,
  file: Blob,
  extraFields?: Record<string, string>
): Promise<T> {
  const formData = new FormData();

  formData.append(
    "file",
    file,
    file instanceof File ? file.name : "drone-image.jpg"
  );

  if (extraFields) {
    Object.entries(extraFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
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
      message = `Request failed with status ${response.status}`;
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
  file: Blob,
  fieldId?: number | null
): Promise<AnalysisResult> {


  const result = await postImage<AnalysisResult>(
    "/api/v1/analysis/full",
    file,
    fieldId != null
      ? { field_id: String(fieldId) }
      : undefined
  );

  return result;
}


/* Keep this name because the dashboard uses analyzeImage(). */
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

/* =========================
   CAMERA
========================= */

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
      message = data?.detail || data?.message || message;
    } catch {
      // Keep the default message.
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

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const response = await fetch(
    `${API_URL}/api/v1/camera/analyze?${params.toString()}`,
    {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    }
  );

  if (!response.ok) {
    let message = "Camera AI analysis failed.";

    try {
      const data = await response.json();
      message = data?.detail || data?.message || message;
    } catch {
      // Keep the default message.
    }

    throw new Error(message);
  }

  return response.json();
}


/* =========================
   SAVED ANALYSIS HISTORY
========================= */

export interface AnalysisHistoryRecord {
  id: number;
  field_id: number | null;
  crop_count: number;
  diseased_crop_count: number;
  disease_count: number;
  results: AnalysisResult;
  created_at: string;
}

export async function getAnalysisHistory(): Promise<
  AnalysisHistoryRecord[]
> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  if (!token) {
    throw new Error("Please log in to view analysis history.");
  }

  const response = await fetch(
    `${API_URL}/api/v1/analysis/history`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = "Could not load analysis history.";

    try {
      const data = await response.json();
      message = data?.detail || data?.message || message;
    } catch {
      // Keep the default message.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function getAnalysisHistoryImage(
  recordId: number
): Promise<Blob> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  if (!token) {
    throw new Error("Please log in to view this image.");
  }

  const response = await fetch(
    `${API_URL}/api/v1/analysis/history/${recordId}/image`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Could not load the saved analysis image.");
  }

  return response.blob();
}

/* =========================
   FARM AND FIELD MANAGEMENT
========================= */

export interface FarmField {
  id: number;
  farm_id: number;
  name: string;
  area_hectares: number | null;
  crop_type: string | null;
  created_at: string;
}

export interface Farm {
  id: number;
  name: string;
  location: string | null;
  description: string | null;
  created_at: string;
  fields: FarmField[];
}

export interface FarmInput {
  name: string;
  location?: string | null;
  description?: string | null;
}

export interface FieldInput {
  name: string;
  area_hectares?: number | null;
  crop_type?: string | null;
}

async function managementRequest<T>(
  path: string,
  method: string = "GET",
  body?: unknown
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  if (!token) {
    throw new Error("Please log in to manage farms and fields.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      "ngrok-skip-browser-warning": "true",
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;

    try {
      const data = await response.json();
      message =
        typeof data?.detail === "string"
          ? data.detail
          : data?.message || message;
    } catch {
      // Keep the fallback error.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/* Farms */

export function getFarms(): Promise<Farm[]> {
  return managementRequest<Farm[]>("/api/v1/farms");
}

export function createFarm(data: FarmInput): Promise<Farm> {
  return managementRequest<Farm>("/api/v1/farms", "POST", data);
}

export function updateFarm(
  farmId: number,
  data: Partial<FarmInput>
): Promise<Farm> {
  return managementRequest<Farm>(
    `/api/v1/farms/${farmId}`,
    "PATCH",
    data
  );
}

export function deleteFarm(farmId: number): Promise<void> {
  return managementRequest<void>(
    `/api/v1/farms/${farmId}`,
    "DELETE"
  );
}

/* Fields */

export function getFields(farmId: number): Promise<FarmField[]> {
  return managementRequest<FarmField[]>(
    `/api/v1/farms/${farmId}/fields`
  );
}

export function createField(
  farmId: number,
  data: FieldInput
): Promise<FarmField> {
  return managementRequest<FarmField>(
    `/api/v1/farms/${farmId}/fields`,
    "POST",
    data
  );
}

export function getField(fieldId: number): Promise<FarmField> {
  return managementRequest<FarmField>(
    `/api/v1/fields/${fieldId}`
  );
}

export function updateField(
  fieldId: number,
  data: Partial<FieldInput>
): Promise<FarmField> {
  return managementRequest<FarmField>(
    `/api/v1/fields/${fieldId}`,
    "PATCH",
    data
  );
}

export function deleteField(fieldId: number): Promise<void> {
  return managementRequest<void>(
    `/api/v1/fields/${fieldId}`,
    "DELETE"
  );
}


export interface Mission {
  id: number;
  owner_id: number;
  field_id: number;
  title: string;
  notes: string | null;
  starts_at: string;
  ends_at: string | null;
  recurrence_type: string;
  interval_value: number;
  interval_unit: string | null;
  timezone_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MissionOccurrence {
  id: number;
  mission_id: number;
  occurrence_key: string;
  scheduled_at: string;
  status: string;
  completed_at: string | null;
  analysis_record_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface MissionCreateInput {
  field_id: number;
  title: string;
  notes?: string | null;
  starts_at: string;
  ends_at?: string | null;
  recurrence_type:
    | "once"
    | "daily"
    | "weekly"
    | "fortnightly"
    | "monthly"
    | "custom";
  interval_value?: number;
  interval_unit?: "day" | "week" | "month" | null;
  timezone_name?: string;
}

export interface MissionOccurrenceUpdate {
  scheduled_at?: string;
  status?: "pending" | "skipped";
}

export async function getMissions(
  includeCancelled = false,
): Promise<Mission[]> {
  const query = includeCancelled ? "?include_cancelled=true" : "";
  return managementRequest<Mission[]>(`/api/v1/missions${query}`);
}

export async function createMission(
  data: MissionCreateInput,
): Promise<Mission> {
  return managementRequest<Mission>("/api/v1/missions", "POST", data);
}

export async function cancelMission(
  missionId: number,
): Promise<Mission> {
  return managementRequest<Mission>(
    `/api/v1/missions/${missionId}/cancel`,
    "PATCH",
  );
}

export async function getMissionOccurrences(
  windowDays = 90,
  includeCompleted = false,
): Promise<MissionOccurrence[]> {
  const params = new URLSearchParams({
    window_days: String(windowDays),
    include_completed: String(includeCompleted),
  });

  return managementRequest<MissionOccurrence[]>(
    `/api/v1/missions/occurrences?${params.toString()}`,
  );
}

export async function updateMissionOccurrence(
  occurrenceId: number,
  data: MissionOccurrenceUpdate,
): Promise<MissionOccurrence> {
  return managementRequest<MissionOccurrence>(
    `/api/v1/missions/occurrences/${occurrenceId}`,
    "PATCH",
    data,
  );
}

export async function completeMissionOccurrence(
  occurrenceId: number,
  analysisRecordId: number,
): Promise<MissionOccurrence> {
  return managementRequest<MissionOccurrence>(
    `/api/v1/missions/occurrences/${occurrenceId}/complete`,
    "POST",
    { analysis_record_id: analysisRecordId },
  );
}

