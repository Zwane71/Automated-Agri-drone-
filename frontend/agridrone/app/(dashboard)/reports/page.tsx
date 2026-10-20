"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  Loader2,
  Printer,
  Sprout,
} from "lucide-react";

import AnnotatedImage from "@/components/analysis/AnnotatedImage";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";

import {
  getAnalysisHistory,
  getAnalysisHistoryImage,
  getFarms,
} from "@/lib/api";

import type {
  AnalysisHistoryRecord,
  Farm
} from "@/lib/api";

import type {
  AnalysisResult,
  DiseaseDetection,
} from "@/components/analysis/types";

export default function ReportsPage() {
  const [result, setResult] = useState<AnalysisResult | null>(
    null
  );
  const [reportDate, setReportDate] = useState<string | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [history, setHistory] = useState<
  AnalysisHistoryRecord[]
>([]);

const [historyLoading, setHistoryLoading] = useState(true);

const [historyError, setHistoryError] = useState<string | null>(
  null
);

const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
const [imageLoading, setImageLoading] = useState(false);
const [imageError, setImageError] = useState<string | null>(null);

const getFieldLabel = (fieldId: number | null) => {
  if (fieldId === null) {
    return "No field linked";
  }

  for (const farm of farms) {
    const field = farm.fields.find(
      (item) => item.id === fieldId
    );

    if (field) {
      return `${farm.name} / ${field.name}`;
    }
  }

  return `Field #${fieldId}`;
};


const handleOpenSavedReport = async (
  record: AnalysisHistoryRecord
) => {
  setResult(record.results);
  setFileName(`Saved analysis #${record.id}`);
  setReportDate(record.created_at);

  setImageLoading(true);
  setImageError(null);

  if (savedImageUrl) {
    URL.revokeObjectURL(savedImageUrl);
    setSavedImageUrl(null);
  }

  try {
    const imageBlob = await getAnalysisHistoryImage(record.id);
    const imageUrl = URL.createObjectURL(imageBlob);

    setSavedImageUrl(imageUrl);
  } catch (err) {
    setImageError(
      err instanceof Error
        ? err.message
        : "Could not load the saved analysis image."
    );
  } finally {
    setImageLoading(false);
  }
};




useEffect(() => {
  let cancelled = false;

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const records = await getAnalysisHistory();

      if (!cancelled) {
        setHistory(records);
      }
    } catch (err) {
      if (!cancelled) {
        setHistoryError(
          err instanceof Error
            ? err.message
            : "Could not load saved reports."
        );
      }
    } finally {
      if (!cancelled) {
        setHistoryLoading(false);
      }
    }
  }

  void loadHistory();

  return () => {
    cancelled = true;
  };
}, []);
useEffect(() => {
  getFarms()
    .then(setFarms)
    .catch((err) => {
      console.error("Failed to load farms:", err);
    });
}, []);
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

        
        {/* Saved report history */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-medium">Saved Reports</h2>
              <p className="mt-1 text-sm text-white/40">
                Reopen previous AI analyses.
              </p>
            </div>

            <span className="text-sm text-white/40">
              {history.length} saved {history.length === 1 ? "report" : "reports"}
            </span>
          </div>

          {historyLoading ? (
            <div className="mt-5 flex items-center gap-2 text-sm text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading saved reports...
            </div>
          ) : historyError ? (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="text-sm text-red-300">{historyError}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-center">
              <FileImage className="mx-auto h-8 w-8 text-white/20" />
              <p className="mt-3 text-sm text-white/50">
                No saved reports yet.
              </p>
              <p className="mt-1 text-xs text-white/30">
                Generate an analysis to create your first saved report.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {getFieldLabel(record.field_id)}
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      {new Date(record.created_at).toLocaleString()}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg bg-white/[0.06] px-3 py-1.5">
                        {record.crop_count} crops
                      </span>

                      <span className="rounded-lg bg-white/[0.06] px-3 py-1.5">
                        {record.diseased_crop_count} diseased
                      </span>

                      <span className="rounded-lg bg-white/[0.06] px-3 py-1.5">
                        {record.disease_count} disease findings
                      </span>

                      <span className="rounded-lg bg-white/[0.06] px-3 py-1.5">
                        {record.field_id != null
                          ? `Field #${record.field_id}`
                          : "No field linked"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenSavedReport(record)}
                    className="shrink-0 rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:bg-white/[0.06]"
                  >
                    View Report
                  </button>
                </div>
              ))}
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
                   {new Date(reportDate ?? Date.now()).toLocaleString()}
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

            
              {/* AI-highlighted image */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-lg font-medium">
                  AI Detection Image
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Green boxes show detected crops. Red boxes show
                  detected disease regions.
                </p>

                {imageLoading ? (
                  <div className="mt-5 flex items-center gap-2 text-sm text-white/50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading analysis image...
                  </div>
                ) : imageError ? (
                  <p className="mt-5 text-sm text-red-300">
                    {imageError}
                  </p>
                ) : savedImageUrl ? (
                  <div className="mt-5">
                    <AnnotatedImage
                      imageUrl={savedImageUrl}
                      result={result}
                    />
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-white/40">
                    No image available for this report.
                  </p>
                )}
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
        {!result &&  (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <FileImage className="mx-auto h-10 w-10 text-white/20" />

            <h2 className="mt-4 text-lg font-medium">
              Select a saved report
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
              Choose a report from Saved Reports above to view its
              image, crop detections, disease findings, and confidence scores.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}