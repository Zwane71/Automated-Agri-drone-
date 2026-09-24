"use client";

import { useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  Loader2,
  Printer,
  Sprout,
} from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";

import { analyzeFull } from "@/lib/api";

import type {
  AnalysisResult,
  DiseaseDetection,
} from "@/components/analysis/types";

export default function ReportsPage() {
  const [result, setResult] = useState<AnalysisResult | null>(
    null
  );

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

  const allDiseases = useMemo(() => {
    if (!result) return [];

    return result.crops.flatMap(
      (crop) => crop.diseases
    );
  }, [result]);

  const averageCropConfidence = useMemo(() => {
    if (!result || result.crops.length === 0) {
      return 0;
    }

    return (
      result.crops.reduce(
        (sum, crop) => sum + crop.confidence,
        0
      ) / result.crops.length
    );
  }, [result]);

  const averageDiseaseConfidence = useMemo(() => {
    if (allDiseases.length === 0) {
      return 0;
    }

    return (
      allDiseases.reduce(
        (sum, disease) => sum + disease.confidence,
        0
      ) / allDiseases.length
    );
  }, [allDiseases]);

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
          : "Failed to generate the report."
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <PageHeader
          title="Reports"
          description="Review detailed crop and disease analysis reports."
        />

        {/* Report generator */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-white/50" />

                <h2 className="text-lg font-medium">
                  Generate Report
                </h2>
              </div>

              <p className="mt-1 text-sm text-white/40">
                Upload a field image to generate a detailed
                AI analysis report.
              </p>

              {fileName && (
                <p className="mt-2 text-xs text-white/30">
                  Report image: {fileName}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {result && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium transition hover:bg-white/[0.08]"
                >
                  <Printer className="h-4 w-4" />
                  Print Report
                </button>
              )}

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
                    Generating...
                  </>
                ) : (
                  <>
                    <FileImage className="h-4 w-4" />
                    Generate Report
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
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

              <div>
                <p className="text-sm font-medium text-red-300">
                  Report generation failed
                </p>

                <p className="mt-1 text-sm text-red-300/70">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Report */}
        {result && (
          <div id="report-content" className="space-y-6">
            {/* Report header */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-400">
                    AI Analysis Report
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Agricultural Field Report
                  </h2>

                  <p className="mt-2 text-sm text-white/40">
                    Generated from the uploaded field image.
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-xs text-white/30">
                    Report date
                  </p>

                  <p className="mt-1 text-sm text-white/60">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Crops"
                value={result.crop_count}
                change="Detected in image"
                icon={<Sprout className="h-5 w-5" />}
              />

              <StatCard
                label="Diseased Crops"
                value={result.diseased_crop_count}
                change="Crops with findings"
                icon={
                  <AlertCircle className="h-5 w-5" />
                }
              />

              <StatCard
                label="Disease Findings"
                value={result.disease_count}
                change="Detected regions"
                icon={
                  <CheckCircle2 className="h-5 w-5" />
                }
              />

              <StatCard
                label="Crop Confidence"
                value={`${(
                  averageCropConfidence * 100
                ).toFixed(1)}%`}
                change="Average detection confidence"
                icon={<Sprout className="h-5 w-5" />}
              />
            </div>

            {/* Image information */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-medium">
                Image Information
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-white/30">
                    File
                  </p>

                  <p className="mt-1 text-sm">
                    {fileName || "Uploaded image"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/30">
                    Dimensions
                  </p>

                  <p className="mt-1 text-sm">
                    {result.image_width} ×{" "}
                    {result.image_height}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/30">
                    Location
                  </p>

                  <p className="mt-1 text-sm text-white/40">
                    Not available
                  </p>
                </div>
              </div>
            </div>

            {/* Disease summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-medium">
                Disease Summary
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Summary of disease detections returned by the
                AI model.
              </p>

              {Object.keys(diseaseSummary).length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400/60" />

                  <p className="mt-3 text-sm text-white/50">
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
                        <p className="text-sm font-medium capitalize">
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

            {/* Confidence information */}
            {allDiseases.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-lg font-medium">
                  Detection Confidence
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-sm text-white/40">
                      Average Crop Confidence
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {(
                        averageCropConfidence * 100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-sm text-white/40">
                      Average Disease Confidence
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {(
                        averageDiseaseConfidence * 100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed findings */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-medium">
                Detailed Crop Findings
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Individual crop detections and associated
                disease findings.
              </p>

              <div className="mt-5 space-y-4">
                {result.crops.map((crop) => (
                  <div
                    key={crop.crop_id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium capitalize">
                          {crop.crop}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          Crop #{crop.crop_id}
                        </p>
                      </div>

                      <div className="text-sm text-white/40">
                        Confidence:{" "}
                        {(crop.confidence * 100).toFixed(1)}%
                      </div>
                    </div>

                    {crop.diseases.length === 0 ? (
                      <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />

                        <span className="text-sm text-white/40">
                          No disease findings returned for
                          this crop.
                        </span>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {crop.diseases.map(
                          (
                            disease: DiseaseDetection,
                            index
                          ) => (
                            <div
                              key={`${crop.crop_id}-${disease.disease}-${index}`}
                              className="rounded-lg border border-red-400/10 bg-red-400/[0.03] p-4"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-sm font-medium capitalize">
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
                                  Confidence:{" "}
                                  {(
                                    disease.confidence *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Report notes */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-medium">
                Report Notes
              </h2>

              <div className="mt-4 space-y-2 text-sm leading-6 text-white/40">
                <p>
                  • This report is generated from the
                  current AI crop and disease analysis.
                </p>

                <p>
                  • Disease findings represent model
                  detections and should be reviewed before
                  making agricultural decisions.
                </p>

                <p>
                  • GPS coordinates, field boundaries,
                  historical reports, and multi-image field
                  reports are not currently available from
                  the backend.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <FileImage className="mx-auto h-10 w-10 text-white/20" />

            <h2 className="mt-4 text-lg font-medium">
              No report generated
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Upload a field image above to generate your
              first AI analysis report.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}