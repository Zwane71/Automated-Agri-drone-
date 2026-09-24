
"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  Loader2,
  MapPin,
  Sprout,
   ArrowRight,
  Camera,
} from "lucide-react";

import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";

import { analyzeFull } from "@/lib/api";

import type {
  AnalysisResult,
  CropDetection,
  DiseaseDetection,
} from "@/components/analysis/types";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DashboardCamera from "@/components/dashboard/DashboardCamera";

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResult | null>(
    null
  );
  const [cameraCount, setCameraCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const diseaseSummary = useMemo(() => {
    if (!result) return {};

    const summary: Record<string, number> = {};

    result.crops.forEach((crop) => {
      crop.diseases.forEach((disease) => {
        summary[disease.disease] =
          (summary[disease.disease] || 0) + 1;
      });
    });

    return summary;
  }, [result]);

  const averageCropConfidence = useMemo(() => {
    if (!result || result.crops.length === 0) return 0;

    const total = result.crops.reduce(
      (sum, crop) => sum + crop.confidence,
      0
    );

    return total / result.crops.length;
  }, [result]);

  const averageDiseaseConfidence = useMemo(() => {
    if (!result || result.disease_count === 0) return 0;

    const diseases: DiseaseDetection[] = result.crops.flatMap(
      (crop) => crop.diseases
    );

    if (diseases.length === 0) return 0;

    const total = diseases.reduce(
      (sum, disease) => sum + disease.confidence,
      0
    );

    return total / diseases.length;
  }, [result]);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);

    try {
      const analysis = await analyzeFull(file);

      setResult(analysis);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze the image."
      );
    } finally {
      setLoading(false);

      event.target.value = "";
    }
  };

  useEffect(() => {
  try {
    const savedCameras =
      localStorage.getItem(
        "agri-drone-cameras"
      );

    if (!savedCameras) {
      setCameraCount(0);
      return;
    }

    const cameras = JSON.parse(
      savedCameras
    );

    if (Array.isArray(cameras)) {
      setCameraCount(cameras.length);
    }
  } catch {
    setCameraCount(0);
  }
}, []);
  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <PageHeader
          title="Dashboard"
          description="Monitor crops, disease detection, and agricultural field activity."
        />

        {/* Overview */}
        <DashboardOverview
          cropCount={result?.crop_count ?? 0}
          diseasedCropCount={
            result?.diseased_crop_count ?? 0
          }
          diseaseCount={
            result?.disease_count ?? 0
          }
          cameraCount={cameraCount}
        />
        <DashboardCamera
          cameraCount={cameraCount}
        />

        {/* AI Analysis */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-white/50" />

                <h2 className="text-lg font-medium">
                  AI Field Analysis
                </h2>
              </div>

              <p className="mt-1 text-sm text-white/40">
                Upload a field image to detect crops and
                analyze them for disease.
              </p>

              {fileName && (
                <p className="mt-2 text-xs text-white/30">
                  Latest image: {fileName}
                </p>
              )}
            </div>

            <label
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition ${
                loading
                  ? "cursor-not-allowed bg-white/10 text-white/40"
                  : "cursor-pointer bg-emerald-500 text-black hover:bg-emerald-400"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileImage className="h-4 w-4" />
                  Analyze Image
                </>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

              <div>
                <p className="text-sm font-medium text-red-300">
                  Analysis failed
                </p>

                <p className="mt-1 text-sm text-red-300/70">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Analysis results */}
        {result && (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm text-white/40">
                  Image Size
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {result.image_width} ×{" "}
                  {result.image_height}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm text-white/40">
                  Crop Confidence
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {(averageCropConfidence * 100).toFixed(1)}%
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm text-white/40">
                  Disease Confidence
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {result.disease_count > 0
                    ? `${(
                        averageDiseaseConfidence * 100
                      ).toFixed(1)}%`
                    : "—"}
                </p>
              </div>
            </div>

            {/* Disease summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-medium">
                Disease Summary
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Disease findings returned by the AI model.
              </p>

              {Object.keys(diseaseSummary).length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center">
                  <p className="text-sm text-white/40">
                    No disease findings were returned.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(diseaseSummary).map(
                    ([disease, count]) => (
                      <div
                        key={disease}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                      >
                        <p className="text-sm font-medium">
                          {disease.replaceAll("_", " ")}
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                          {count}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          finding{count === 1 ? "" : "s"}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Crop analysis */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-medium">
                Crop Analysis
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Individual crop detections and associated
                disease findings.
              </p>

              <div className="mt-5 space-y-3">
                {result.crops.map(
                  (crop: CropDetection) => (
                    <div
                      key={crop.crop_id}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium capitalize">
                            {crop.crop}
                          </p>

                          <p className="mt-1 text-xs text-white/30">
                            Crop #{crop.crop_id} ·{" "}
                            {(
                              crop.confidence * 100
                            ).toFixed(1)}
                            % confidence
                          </p>
                        </div>

                        <div className="text-sm text-white/40">
                          {crop.disease_count} disease{" "}
                          {crop.disease_count === 1
                            ? "finding"
                            : "findings"}
                        </div>
                      </div>

                      {crop.diseases.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {crop.diseases.map(
                            (
                              disease,
                              index
                            ) => (
                              <div
                                key={`${crop.crop_id}-${disease.disease}-${index}`}
                                className="flex flex-col gap-2 rounded-lg border border-red-400/10 bg-red-400/[0.03] p-3 md:flex-row md:items-center md:justify-between"
                              >
                                <div>
                                  <p className="text-sm capitalize">
                                    {disease.disease.replaceAll(
                                      "_",
                                      " "
                                    )}
                                  </p>

                                  {disease.affected_area_percent !==
                                    undefined && (
                                    <p className="mt-1 text-xs text-white/30">
                                      Affected area:{" "}
                                      {disease.affected_area_percent.toFixed(
                                        2
                                      )}
                                      %
                                    </p>
                                  )}
                                </div>

                                <span className="text-xs text-white/40">
                                  {(
                                    disease.confidence *
                                    100
                                  ).toFixed(1)}
                                  % confidence
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <Sprout className="mx-auto h-10 w-10 text-white/20" />

            <h2 className="mt-4 text-lg font-medium">
              No analysis yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Upload an agricultural field image above to
              start detecting crops and analyzing disease.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
