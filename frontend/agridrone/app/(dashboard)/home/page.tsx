"use client";

import { useState } from "react";
import {
  Activity,
  CircleAlert,
  Crosshair,
  Sprout,
} from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";

import { analyzeFull } from "@/lib/api";
import type { AnalysisResult } from "@/components/analysis/types";

export default function DashboardPage() {
  const [analysis, setAnalysis] =
    useState<AnalysisResult | null>(null);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const cropCount =
    analysis?.crop_count ?? 0;

  const diseasedCropCount =
    analysis?.diseased_crop_count ?? 0;

  const diseaseCount =
    analysis?.disease_count ?? 0;

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

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
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">

        <PageHeader
          title="Field Monitoring"
          description="Monitor your agricultural operations and AI analysis."
        />

        {/* Upload */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-lg font-medium">
                AI Field Analysis
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Upload a field image to detect crops and diseases.
              </p>
            </div>

            <label className="cursor-pointer rounded-xl bg-emerald-500 px-5 py-3 text-sm font-medium text-black transition hover:bg-emerald-400">
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
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <StatCard
            label="Crops Detected"
            value={cropCount}
            change={
              analysis
                ? "Detected by AI"
                : "Waiting for analysis"
            }
            icon={
              <Sprout className="h-5 w-5" />
            }
          />

          <StatCard
            label="Diseased Crops"
            value={diseasedCropCount}
            change={
              analysis
                ? `${diseaseCount} disease detections`
                : "Waiting for analysis"
            }
            icon={
              <CircleAlert className="h-5 w-5" />
            }
          />

          <StatCard
            label="Active Missions"
            value="0"
            change="No active missions"
            icon={
              <Crosshair className="h-5 w-5" />
            }
          />

          <StatCard
            label="AI Status"
            value={
              analyzing
                ? "Running"
                : "Online"
            }
            change={
              analyzing
                ? "AI analysis in progress"
                : "AI engine connected"
            }
            icon={
              <Activity className="h-5 w-5" />
            }
          />

        </div>

        {/* Analysis result */}
        {analysis && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <div className="mb-5">
              <h2 className="text-lg font-medium">
                Latest Analysis
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Results returned from the AgriDrone AI backend.
              </p>
            </div>

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

          </div>
        )}

      </div>
    </DashboardShell>
  );
}