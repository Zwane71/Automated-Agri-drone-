"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  CircleAlert,
  Crosshair,
  Sprout,
} from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import LiveCropCamera from "@/components/analysis/LiveCropCamera";

import { analyzeFull } from "@/lib/api";

import type {
  AnalysisResult,
  CropDetection,
  DiseaseDetection,
} from "@/components/analysis/types";

interface CameraDevice {
  id: string;
  name: string;
  type: "browser" | "ip";
  deviceId?: string;
  streamUrl?: string;
}

export default function AnalysisPage() {
  const [analysis, setAnalysis] =
    useState<AnalysisResult | null>(null);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [liveCrops, setLiveCrops] =
    useState<CropDetection[]>([]);

  const [liveDiseases, setLiveDiseases] =
    useState<DiseaseDetection[]>([]);

  const [selectedCamera, setSelectedCamera] =
    useState<CameraDevice | null>(null);

  /*
   * Load the camera selected on the Camera page.
   */
  useEffect(() => {
    function loadSelectedCamera() {
      const savedCameras =
        localStorage.getItem("agri-drone-cameras");

      const savedActiveCamera =
        localStorage.getItem(
          "agri-drone-active-camera"
        );

      if (!savedCameras || !savedActiveCamera) {
        setSelectedCamera(null);
        return;
      }

      try {
        const cameras: CameraDevice[] =
          JSON.parse(savedCameras);

        const activeCamera = cameras.find(
          (camera) =>
            camera.id === savedActiveCamera
        );

        setSelectedCamera(
          activeCamera || null
        );
      } catch (error) {
        console.error(
          "Could not load selected camera:",
          error
        );

        setSelectedCamera(null);
      }
    }

    loadSelectedCamera();

    /*
     * Check again when the page becomes visible.
     * This helps when the user selects a different
     * camera on the Camera page and returns here.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadSelectedCamera();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "focus",
      loadSelectedCamera
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        loadSelectedCamera
      );
    };
  }, []);

  /*
   * Average confidence of the current live
   * disease detections.
   */
  const averageLiveConfidence =
    liveDiseases.length > 0
      ? Math.round(
          (liveDiseases.reduce(
            (sum, disease) =>
              sum + disease.confidence,
            0
          ) /
            liveDiseases.length) *
            100
        )
      : 0;

  /*
   * Group live diseases by disease name.
   */
  const liveDiseaseSummary = useMemo(() => {
    const summary: Record<string, number> = {};

    liveDiseases.forEach((disease) => {
      summary[disease.disease] =
        (summary[disease.disease] || 0) + 1;
    });

    return Object.entries(summary).sort(
      ([, countA], [, countB]) =>
        countB - countA
    );
  }, [liveDiseases]);

  /*
   * Upload image for detailed analysis.
   */
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeFull(file);

      setAnalysis(result);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze image."
      );
    } finally {
      setAnalyzing(false);

      /*
       * Allow selecting the same image again.
       */
      event.target.value = "";
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">

        {/* Page header */}

        <PageHeader
          title="Field Monitoring"
          description="Monitor your agricultural operations and AI analysis."
        />

        {/* Selected camera information */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs text-white/40">
                AI Analysis Input
              </p>

              <h2 className="mt-1 text-sm font-medium">
                {selectedCamera
                  ? selectedCamera.name
                  : "No camera selected"}
              </h2>

              <p className="mt-1 text-xs text-white/30">
                {selectedCamera
                  ? selectedCamera.type === "ip"
                    ? "Wireless / IP camera"
                    : "Browser camera"
                  : "Select a camera from the Camera page."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  selectedCamera
                    ? "bg-green-400"
                    : "bg-red-400"
                }`}
              />

              <span className="text-xs text-white/50">
                {selectedCamera
                  ? "Input selected"
                  : "No input"}
              </span>
            </div>
          </div>
        </div>

        {/* Live AI Camera */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Live AI Camera
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Real-time crop and disease detection
              from the selected camera input.
            </p>
          </div>

          <LiveCropCamera
            camera={selectedCamera}
            onDetection={(crops, diseases) => {
              setLiveCrops(crops);
              setLiveDiseases(diseases);
            }}
          />
        </div>

        {/* Live statistics */}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Live Crops"
            value={liveCrops.length}
            change={
              liveCrops.length > 0
                ? "Detected by AI"
                : selectedCamera
                ? "Waiting for camera"
                : "No camera selected"
            }
            icon={
              <Sprout className="h-5 w-5" />
            }
          />

          <StatCard
            label="Live Diseases"
            value={liveDiseases.length}
            change={
              liveDiseases.length > 0
                ? "Current detections"
                : "No detections"
            }
            icon={
              <CircleAlert className="h-5 w-5" />
            }
          />

          <StatCard
            label="AI Confidence"
            value={`${averageLiveConfidence}%`}
            change={
              liveDiseases.length > 0
                ? "Average disease confidence"
                : "Waiting for detection"
            }
            icon={
              <Activity className="h-5 w-5" />
            }
          />

          <StatCard
            label="AI Status"
            value={
              analyzing
                ? "Running"
                : selectedCamera
                ? "Ready"
                : "Waiting"
            }
            change={
              analyzing
                ? "AI analysis in progress"
                : selectedCamera
                ? "AI engine connected"
                : "Select a camera first"
            }
            icon={
              <Crosshair className="h-5 w-5" />
            }
          />
        </div>

        {/* Live disease breakdown */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-medium">
              Live Disease Detection
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Diseases currently detected by the
              selected AI camera.
            </p>
          </div>

          {liveDiseases.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <CircleAlert className="mx-auto mb-3 h-8 w-8 text-white/20" />

              <p className="text-sm text-white/50">
                No diseases detected
              </p>

              <p className="mt-1 text-xs text-white/30">
                Start the selected camera and point
                it at crops.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveDiseaseSummary.map(
                ([disease, count]) => (
                  <div
                    key={disease}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-400/10">
                        <CircleAlert className="h-4 w-4 text-red-400" />
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          {disease}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          Current AI detections
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {count}
                      </p>

                      <p className="text-xs text-white/30">
                        detections
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Upload analysis */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-medium">
                AI Field Analysis
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Upload a field image for detailed
                crop and disease analysis.
              </p>
            </div>

            <label className="cursor-pointer rounded-xl bg-emerald-500 px-5 py-3 text-center text-sm font-medium text-black transition hover:bg-emerald-400">
              {analyzing
                ? "Analyzing..."
                : "Upload Image"}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={analyzing}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              <CircleAlert className="h-4 w-4 shrink-0" />

              {error}
            </div>
          )}
        </div>

        {/* Latest analysis */}

        {analysis && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5">
              <h2 className="text-lg font-medium">
                Latest Analysis
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Detailed results returned from the
                AgriDrone AI backend.
              </p>
            </div>

            {/* Analysis summary */}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-xs text-white/40">
                  Total Crops
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {analysis.crop_count}
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-xs text-white/40">
                  Diseased Crops
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {analysis.diseased_crop_count}
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-4">
                <p className="text-xs text-white/40">
                  Disease Detections
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {analysis.disease_count}
                </p>
              </div>
            </div>

            {/* Individual crop results */}

            <div className="mt-6">
              <h3 className="mb-3 text-sm font-medium text-white/70">
                Crop Analysis
              </h3>

              <div className="space-y-3">
                {analysis.crops.map((crop) => (
                  <div
                    key={crop.crop_id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-400">
                            Crop #{crop.crop_id}
                          </span>

                          <span className="text-sm font-medium">
                            {crop.crop}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-white/40">
                          Crop confidence:{" "}
                          {(
                            crop.confidence * 100
                          ).toFixed(0)}
                          %
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-sm font-medium">
                          {crop.disease_count}{" "}
                          disease{" "}
                          {crop.disease_count === 1
                            ? "detection"
                            : "detections"}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          {crop.disease_count > 0
                            ? "Disease detected"
                            : "No disease detected"}
                        </p>
                      </div>
                    </div>

                    {/* Diseases for this crop */}

                    {crop.diseases.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {crop.diseases.map(
                          (disease, index) => (
                            <div
                              key={`${crop.crop_id}-${index}`}
                              className="flex flex-col gap-2 rounded-lg bg-red-400/[0.05] p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-sm text-red-300">
                                  {disease.disease}
                                </p>

                                {disease.affected_area_percent !==
                                  undefined && (
                                  <p className="mt-1 text-xs text-white/40">
                                    Affected area:{" "}
                                    {disease.affected_area_percent.toFixed(
                                      1
                                    )}
                                    %
                                  </p>
                                )}
                              </div>

                              <div className="text-left sm:text-right">
                                <p className="text-sm font-semibold">
                                  {(
                                    disease.confidence *
                                    100
                                  ).toFixed(0)}
                                  %
                                </p>

                                <p className="text-xs text-white/30">
                                  confidence
                                </p>
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
          </div>
        )}
      </div>
    </DashboardShell>
  );
}