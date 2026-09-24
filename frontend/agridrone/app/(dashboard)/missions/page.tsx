"use client";

import { useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileImage,
  Loader2,
  MapPin,
  Plane,
  Sprout,
  Upload,
} from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";

import { analyzeFull } from "@/lib/api";
import type { AnalysisResult } from "@/components/analysis/types";

interface MissionRecord {
  id: number;
  fileName: string;
  createdAt: string;
  result: AnalysisResult;
}

export default function MissionsPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [missions, setMissions] = useState<MissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleMissionUpload = async (
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

      const mission: MissionRecord = {
        id: Date.now(),
        fileName: file.name,
        createdAt: new Date().toLocaleString(),
        result: analysis,
      };

      setMissions((current) => [
        mission,
        ...current,
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze the mission image."
      );
    } finally {
      setLoading(false);

      event.target.value = "";
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        {/* Header */}
        <PageHeader
          title="Missions"
          description="Run AI field analysis missions using images captured from your agricultural operation."
        />

        {/* Mission information */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
              <Plane className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-lg font-medium">
                AI Field Mission
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/40">
                Upload an image from a field mission and
                the AI will detect crops and analyze them
                for disease.
              </p>
            </div>
          </div>
        </div>

        {/* Mission upload */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4 text-white/50" />

                <h2 className="text-base font-medium">
                  Mission Image
                </h2>
              </div>

              <p className="mt-1 text-sm text-white/40">
                Upload an image captured during a field
                mission.
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
                  Running Mission...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Start Mission
                </>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleMissionUpload}
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
                  Mission failed
                </p>

                <p className="mt-1 text-red-300/70">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Current mission */}
        {result && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Crops Detected"
                value={result.crop_count}
                change="From mission image"
                icon={<Sprout className="h-5 w-5" />}
              />

              <StatCard
                label="Diseased Crops"
                value={result.diseased_crop_count}
                change="Crops with detections"
                icon={
                  <AlertCircle className="h-5 w-5" />
                }
              />

              <StatCard
                label="Disease Findings"
                value={result.disease_count}
                change="Detected disease regions"
                icon={
                  <CheckCircle2 className="h-5 w-5" />
                }
              />

              <StatCard
                label="GPS Status"
                value="Not available"
                change="Drone GPS integration later"
                icon={<MapPin className="h-5 w-5" />}
              />
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                <div>
                  <p className="text-sm font-medium text-emerald-300">
                    Mission completed
                  </p>

                  <p className="mt-1 text-sm text-white/40">
                    The uploaded mission image was
                    successfully analyzed by the AI.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mission history */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-medium">
              Mission History
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Analysis missions completed during this
              session.
            </p>
          </div>

          {missions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <Clock3 className="mx-auto mb-3 h-8 w-8 text-white/20" />

              <p className="text-sm text-white/50">
                No missions yet
              </p>

              <p className="mt-1 text-xs text-white/30">
                Upload a mission image above to create your
                first analysis.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10">
                        <Plane className="h-4 w-4 text-emerald-400" />
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          {mission.fileName}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          {mission.createdAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 text-xs text-white/40">
                      <span>
                        {mission.result.crop_count} crops
                      </span>

                      <span>
                        {mission.result.disease_count} disease
                        {mission.result.disease_count === 1
                          ? ""
                          : "s"}
                      </span>

                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current limitations */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />

            <div>
              <p className="text-sm font-medium text-white/60">
                Mission capabilities
              </p>

              <p className="mt-1 text-sm leading-6 text-white/40">
                Missions currently use uploaded images and
                the existing AI analysis API. Live drone
                control, GPS flight paths, field boundaries,
                multi-image missions, and persistent mission
                history will be connected when those backend
                capabilities are available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}