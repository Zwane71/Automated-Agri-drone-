
"use client";

import { useState } from "react";

import {
  CheckCircle2,
  CircleAlert,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Sprout,
  Upload,
} from "lucide-react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";

import { getCensus,
    type CensusResponse
 } from "@/lib/api";

export default function CensusPage() {
  const [result, setResult] =
    useState<CensusResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [fileName, setFileName] =
    useState<string | null>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);

    try {
      const census =
        await getCensus(file);

      setResult(census);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to perform census."
      );
    } finally {
      setLoading(false);

      // Allow the same image to be selected again.
      event.target.value = "";
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">

        {/* Header */}

        <PageHeader
          title="Crop Census"
          description="Count and inspect crops detected from a field image."
        />

        {/* Census information */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
              <Sprout className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-lg font-medium">
                Field Crop Census
              </h2>

              <p className="mt-1 text-sm leading-6 text-white/40">
                Upload a field image and the AI will detect
                and count the crops visible in the image.
              </p>
            </div>

          </div>

        </div>

        {/* Upload */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <ImageIcon className="h-4 w-4 text-white/50" />

                <h2 className="text-base font-medium">
                  Field Image
                </h2>

              </div>

              <p className="mt-1 text-sm text-white/40">
                Upload a clear image of the field.
              </p>

              {fileName && (
                <p className="mt-2 text-xs text-white/30">
                  Selected: {fileName}
                </p>
              )}

            </div>

            <label
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition ${
                loading
                  ? "cursor-not-allowed bg-white/10 text-white/40"
                  : "bg-emerald-500 text-black hover:bg-emerald-400"
              }`}
            >

              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Counting Crops...
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

              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />

              <div>
                <p className="font-medium">
                  Census failed
                </p>

                <p className="mt-1 text-red-300/70">
                  {error}
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Results */}

        {result && (
          <>
            {/* Statistics */}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

              <StatCard
                label="Total Crops"
                value={result.crop_count}
                change="Detected in image"
                icon={
                  <Sprout className="h-5 w-5" />
                }
              />

              <StatCard
                label="Field Image"
                value={`${result.image_width} × ${result.image_height}`}
                change="Image dimensions"
                icon={
                  <ImageIcon className="h-5 w-5" />
                }
              />

              <StatCard
                label="AI Processing"
                value={
                  result.timing?.total_seconds !==
                  undefined
                    ? `${result.timing.total_seconds.toFixed(
                        1
                      )}s`
                    : "—"
                }
                change="Total processing time"
                icon={
                  <CheckCircle2 className="h-5 w-5" />
                }
              />

              <StatCard
                label="Location"
                value="Not available"
                change="GPS will be added later"
                icon={
                  <MapPin className="h-5 w-5" />
                }
              />

            </div>

            {/* Census status */}

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">

              <div className="flex items-start gap-3">

                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                <div>

                  <p className="text-sm font-medium text-emerald-300">
                    Census completed
                  </p>

                  <p className="mt-1 text-sm text-white/40">
                    The AI detected{" "}
                    <span className="font-medium text-white/70">
                      {result.crop_count}
                    </span>{" "}
                    crop
                    {result.crop_count === 1
                      ? ""
                      : "s"} in this image.
                  </p>

                </div>

              </div>

            </div>

            {/* Detection list */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <div className="mb-5">

                <h2 className="text-lg font-medium">
                  Detected Crops
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Individual crop detections returned by
                  the AI model.
                </p>

              </div>

              {result.crops.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">

                  <CircleAlert className="mx-auto mb-3 h-8 w-8 text-white/20" />

                  <p className="text-sm text-white/50">
                    No crops detected
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Try uploading a clearer field image.
                  </p>

                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">

                  {result.crops.map(
                    (crop) => (
                      <div
                        key={crop.crop_id}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                      >

                        <div className="flex items-center justify-between gap-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10">
                              <Sprout className="h-4 w-4 text-emerald-400" />
                            </div>

                            <div>

                              <p className="text-sm font-medium">
                                Crop #{crop.crop_id}
                              </p>

                              <p className="mt-1 text-xs text-white/40">
                                {crop.crop}
                              </p>

                            </div>

                          </div>

                          <div className="text-right">

                            <p className="text-sm font-semibold">
                              {(
                                crop.confidence *
                                100
                              ).toFixed(0)}
                              %
                            </p>

                            <p className="text-xs text-white/30">
                              confidence
                            </p>

                          </div>

                        </div>

                        <div className="mt-4">

                          <div className="mb-1 flex justify-between text-xs">

                            <span className="text-white/30">
                              Detection confidence
                            </span>

                            <span className="text-white/50">
                              {(
                                crop.confidence *
                                100
                              ).toFixed(0)}
                              %
                            </span>

                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">

                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{
                                width: `${Math.min(
                                  crop.confidence *
                                    100,
                                  100
                                )}%`,
                              }}
                            />

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

            {/* Backend note */}

            {result.note && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                <div className="flex items-start gap-3">

                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />

                  <div>

                    <p className="text-sm font-medium text-white/60">
                      Census information
                    </p>

                    <p className="mt-1 text-sm leading-6 text-white/40">
                      {result.note}
                    </p>

                  </div>

                </div>

              </div>
            )}

          </>
        )}

        {/* Empty state */}

        {!result && !loading && !error && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">

              <Sprout className="h-6 w-6 text-white/20" />

            </div>

            <h2 className="mt-4 text-base font-medium">
              No census yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
              Upload a field image above to let the AI
              detect and count the crops.
            </p>

          </div>
        )}

      </div>
    </DashboardShell>
  );
}
