export interface DiseaseDetection {
  disease: string;
  confidence: number;
  box: [number, number, number, number];
  mask_pixels?: number;
  affected_area_percent?: number;
}

export interface CropDetection {
  crop_id: number;
  crop: string;
  confidence: number;
  box: [number, number, number, number];
  disease_count: number;
  diseases: DiseaseDetection[];
}

export interface AnalysisResult {
  image_width: number;
  image_height: number;
  crop_count: number;
  diseased_crop_count: number;
  disease_count: number;
  crops: CropDetection[];
}