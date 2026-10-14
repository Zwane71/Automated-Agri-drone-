"use client";

import { useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  Loader2,
  MapPin,
  Sprout,
  Upload,
} from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";

import { analyzeFull } from "@/lib/api";
import type {
  AnalysisResult,
  CropDetection,
  DiseaseDetection,
} from "@/components/analysis/types";

export default function FieldsPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleImageUpload = async (
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
          : "Failed to analyze the field image."
      );
    } finally {
      setLoading(false);

      // Allow the same image to be selected again.
      event.target.value = "";
    }
  };

  const diseaseSummary = result
    ? result.crops.reduce<Record<string, number>>(
        (summary, crop) => {
          crop.diseases.forEach((disease) => {
            summary[disease.disease] =
              (summary[disease.disease] || 0) + 1;
          });

          return summary;
        },
        {}
      )
    : {};

  const allDiseases: DiseaseDetection[] = result
    ? result.crops.flatMap((crop) => crop.diseases)
    : [];

  const averageCropConfidence =
    result && result.crops.length > 0
      ? result.crops.reduce(
          (total, crop) => total + crop.confidence,
          0
        ) / result.crops.length
      : 0;

  const averageDiseaseConfidence =
    allDiseases.length > 0
      ? allDiseases.reduce(
          (total, disease) => total + disease.confidence,
          0
        ) / allDiseases.length
      : 0;

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        {/* Header */}
        <PageHeader
          title="Fields"
          description="Analyze field images using the existing crop and disease AI models."
        />

        {/* Field analysis information */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
              <Sprout className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-lg font-medium">
                Field Analysis
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/40">
                Upload a field image to detect crops and
                analyze the detected crops for disease.
              </p>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4 text-white/50" />

                <h2 className="text-base font-medium">
                  Field Image
                </h2>
              </div>

              <p className="mt-1 text-sm text-white/40">
                Upload an image containing crops from the
                field.
              </p>

              {fileName && (
                <p className="mt-2 text-xs text-white/30">
                  Selected: {fileName}
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
                  Analyzing Field...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Image
                </>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <div>
                <p className="font-medium">
                  Field analysis failed
                </p>

                <p className="mt-1 text-red-300/70">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
              <Sprout className="h-6 w-6 text-white/20" />
            </div>

            <h2 className="mt-4 text-base font-medium">
              No field analysis yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
              Upload a field image above to analyze the
              crops and detected diseases.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Crops"
                value={result.crop_count}
                change="Detected in field image"
                icon={<Sprout className="h-5 w-5" />}
              />

              <StatCard
                label="Diseased Crops"
                value={result.diseased_crop_count}
                change="Crops with disease detections"
                icon={
                  <AlertCircle className="h-5 w-5" />
                }
              />

              <StatCard
                label="Disease Findings"
                value={result.disease_count}
                change="Total detected disease regions"
                icon={
                  <CheckCircle2 className="h-5 w-5" />
                }
              />

              <StatCard
                label="Location"
                value="Not available"
                change="GPS will be added later"
                icon={<MapPin className="h-5 w-5" />}
              />
            </div>

            {/* Field overview */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-5">
                <h2 className="text-lg font-medium">
                  Field Overview
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Summary of the AI analysis for this field
                  image.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs text-white/30">
                    Image Size
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {result.image_width} ×{" "}
                    {result.image_height}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs text-white/30">
                    Crop Confidence
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {(averageCropConfidence * 100).toFixed(0)}%
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs text-white/30">
                    Disease Confidence
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {allDiseases.length > 0
                      ? `${(
                          averageDiseaseConfidence * 100
                        ).toFixed(0)}%`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Disease summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-5">
                <h2 className="text-lg font-medium">
                  Disease Summary
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Disease detections returned by the existing
                  AI model.
                </p>
              </div>

              {Object.keys(diseaseSummary).length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-400/50" />

                  <p className="text-sm text-white/50">
                    No disease detections
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    No disease regions were returned for the
                    detected crops.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(diseaseSummary).map(
                    ([disease, count]) => (
                      <div
                        key={disease}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                      >
                        <p className="text-sm font-medium capitalize">
                          {disease.replaceAll("_", " ")}
                        </p>

                        <p className="mt-2 text-2xl font-bold">
                          {count}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          detection
                          {count === 1 ? "" : "s"}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Crop analysis */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-5">
                <h2 className="text-lg font-medium">
                  Crop Analysis
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Each detected crop and the diseases found
                  inside it.
                </p>
              </div>

              {result.crops.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
                  <AlertCircle className="mx-auto mb-3 h-8 w-8 text-white/20" />

                  <p className="text-sm text-white/50">
                    No crops detected
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {result.crops.map(
                    (crop: CropDetection, index) => (
                      <div
                        key={crop.crop_id}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
                              <Sprout className="h-5 w-5 text-emerald-400" />
                            </div>

                            <div>
                              <p className="text-sm font-medium">
                                Crop {index + 1}
                              </p>

                              <p className="mt-1 text-xs capitalize text-white/40">
                                {crop.crop}
                              </p>
                            </div>
                          </div>

                          <div className="text-left md:text-right">
                            <p className="text-sm font-semibold">
                              {(crop.confidence * 100).toFixed(0)}%
                            </p>

                            <p className="text-xs text-white/30">
                              crop confidence
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-white/30">
                              Crop detection confidence
                            </span>

                            <span className="text-white/50">
                              {(crop.confidence * 100).toFixed(0)}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{
                                width: `${Math.min(
                                  crop.confidence * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {crop.diseases.length > 0 && (
                          <div className="mt-5 border-t border-white/10 pt-4">
                            <p className="mb-3 text-xs font-medium text-white/50">
                              Diseases detected
                            </p>

                            <div className="space-y-2">
                              {crop.diseases.map(
                                (disease, diseaseIndex) => (
                                  <div
                                    key={`${disease.disease}-${diseaseIndex}`}
                                    className="flex items-center justify-between rounded-lg border border-red-400/10 bg-red-400/[0.04] px-3 py-2"
                                  >
                                    <div>
                                      <p className="text-sm capitalize text-white/70">
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

                                    <p className="text-xs font-medium text-red-300">
                                      {(
                                        disease.confidence * 100
                                      ).toFixed(0)}
                                      %
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {crop.diseases.length === 0 && (
                          <div className="mt-5 border-t border-white/10 pt-4">
                            <p className="text-xs text-white/30">
                              No disease detections returned for
                              this crop.
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Current limitations */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />

                <div>
                  <p className="text-sm font-medium text-white/60">
                    Field data
                  </p>

                  <p className="mt-1 text-sm leading-6 text-white/40">
                    This page currently analyzes a single
                    field image using the existing AI API.
                    GPS, field boundaries, multi-image census,
                    and historical field records will be added
                    when those backend capabilities are
                    available.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}