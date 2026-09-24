"use client";

import { useEffect, useMemo, useState } from "react";

import {
  analyzeCameraFrame,
  getCameraStreamUrl,
  testCamera,
} from "@/lib/api";

import CameraStatus from "./CameraStatus";

interface CameraDevice {
  id: string;
  name: string;
  type: "browser" | "ip";
  deviceId?: string;
  streamUrl?: string;
}

interface DiseaseResult {
  disease: string;
  confidence: number;
  box?: [number, number, number, number];
  mask_pixels?: number;
  affected_area_percent?: number;
}

interface CropResult {
  crop_id: number;
  crop: string;
  confidence: number;
  box: [number, number, number, number];
  disease_count: number;
  diseases: DiseaseResult[];
}

interface AnalysisResult {
  image_width: number;
  image_height: number;
  crop_count: number;
  diseased_crop_count: number;
  disease_count: number;
  crops: CropResult[];
}

export default function CameraMonitor() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState("");

  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [analysis, setAnalysis] =
    useState<AnalysisResult | null>(null);

  const [message, setMessage] = useState(
    "Select a camera to begin."
  );

  useEffect(() => {
    loadSavedCameras();
  }, []);

  function loadSavedCameras() {
    try {
      const savedCameras = localStorage.getItem(
        "agri-drone-cameras"
      );

      const savedActiveCamera =
        localStorage.getItem(
          "agri-drone-active-camera"
        );

      if (savedCameras) {
        const parsed: CameraDevice[] =
          JSON.parse(savedCameras);

        setCameras(parsed);
      }

      if (savedActiveCamera) {
        setActiveCameraId(savedActiveCamera);
      }
    } catch {
      setMessage(
        "Could not load saved camera settings."
      );
    }
  }

  const activeCamera = useMemo(() => {
    return cameras.find(
      (camera) => camera.id === activeCameraId
    );
  }, [cameras, activeCameraId]);

  const ipCameras = useMemo(() => {
    return cameras.filter(
      (camera) => camera.type === "ip"
    );
  }, [cameras]);

  async function handleTestCamera() {
    if (
      !activeCamera ||
      activeCamera.type !== "ip" ||
      !activeCamera.streamUrl
    ) {
      setConnected(false);
      setMessage(
        "Select a wireless/IP camera first."
      );
      return;
    }

    setTesting(true);
    setConnected(false);
    setMessage("Testing camera connection...");

    try {
      const result = await testCamera(
        activeCamera.streamUrl
      );

      if (!result.connected) {
        setConnected(false);
        setMonitoring(false);

        setMessage(
          result.message ||
            "Camera could not be connected."
        );

        return;
      }

      setConnected(true);

      setMessage(
        result.image_width &&
          result.image_height
          ? `Connected at ${result.image_width} × ${result.image_height}.`
          : result.message
      );
    } catch (error) {
      setConnected(false);
      setMonitoring(false);

      setMessage(
        error instanceof Error
          ? error.message
          : "Camera connection failed."
      );
    } finally {
      setTesting(false);
    }
  }

  function selectCamera(camera: CameraDevice) {
    setActiveCameraId(camera.id);

    localStorage.setItem(
      "agri-drone-active-camera",
      camera.id
    );

    setConnected(false);
    setMonitoring(false);
    setAnalysis(null);

    setMessage(
      `${camera.name} selected.`
    );
  }

  function toggleMonitoring() {
    if (!activeCamera?.streamUrl) {
      setMessage(
        "Select and test an IP camera first."
      );
      return;
    }

    if (!connected) {
      setMessage(
        "Test the camera connection before starting monitoring."
      );
      return;
    }

    setMonitoring((current) => !current);
  }

  async function handleAnalyze() {
    if (
      !activeCamera ||
      activeCamera.type !== "ip" ||
      !activeCamera.streamUrl
    ) {
      setMessage(
        "Select an IP camera first."
      );
      return;
    }

    if (!connected) {
      setMessage(
        "Test the camera connection first."
      );
      return;
    }

    setAnalyzing(true);
    setMessage(
      "Capturing camera frame and running AI analysis..."
    );

    try {
      const result =
        await analyzeCameraFrame(
          activeCamera.streamUrl
        );

      setAnalysis(result);

      setMessage(
        `Analysis complete. ${result.crop_count} crop${
          result.crop_count === 1 ? "" : "s"
        } detected.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "AI analysis failed."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Camera selector */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-medium">
              Camera Monitoring
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Select a connected camera and monitor
              the live field feed.
            </p>
          </div>

          <CameraStatus
            connected={connected}
            message={message}
          />
        </div>

        {ipCameras.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm text-white/50">
              No wireless/IP cameras are configured.
            </p>

            <p className="mt-2 text-xs text-white/30">
              Add a wireless camera from Settings
              first.
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <label className="text-xs text-white/40">
              Active Camera
            </label>

            <select
              value={activeCameraId}
              onChange={(event) => {
                const camera =
                  cameras.find(
                    (item) =>
                      item.id ===
                      event.target.value
                  );

                if (camera) {
                  selectCamera(camera);
                }
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/30"
            >
              <option
                value=""
                className="bg-black"
              >
                Select camera
              </option>

              {ipCameras.map((camera) => (
                <option
                  key={camera.id}
                  value={camera.id}
                  className="bg-black"
                >
                  {camera.name}
                </option>
              ))}
            </select>

            {activeCamera?.streamUrl && (
              <p className="mt-2 truncate text-xs text-white/30">
                {activeCamera.streamUrl}
              </p>
            )}
          </div>
        )}

        {activeCamera?.type === "ip" && (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleTestCamera}
              disabled={testing}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:bg-white/10 disabled:opacity-50"
            >
              {testing
                ? "Testing..."
                : "Test Camera"}
            </button>

            <button
              type="button"
              onClick={toggleMonitoring}
              disabled={!connected}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {monitoring
                ? "Stop Monitoring"
                : "Start Monitoring"}
            </button>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!connected || analyzing}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {analyzing
                ? "Analyzing..."
                : "Analyze Frame"}
            </button>
          </div>
        )}
      </section>

      {/* Live feed + AI overlay */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-medium">
              Live Feed
            </h2>

            <p className="mt-1 text-xs text-white/30">
              {activeCamera?.name ||
                "No camera selected"}
            </p>
          </div>

          {monitoring && (
            <div className="flex items-center gap-2 text-xs text-red-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              LIVE
            </div>
          )}
        </div>

        <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-black">
          {monitoring &&
          connected &&
          activeCamera?.type === "ip" &&
          activeCamera.streamUrl ? (
            <div className="relative h-full w-full">
              <img
                src={getCameraStreamUrl(
                  activeCamera.streamUrl
                )}
                alt={`Live feed from ${activeCamera.name}`}
                className="absolute inset-0 h-full w-full object-contain"
              />

              {/* AI overlay */}
              {analysis && (
                <div className="absolute inset-0">
                  {analysis.crops.map(
                    (crop) => (
                      <CropOverlay
                        key={crop.crop_id}
                        crop={crop}
                        imageWidth={
                          analysis.image_width
                        }
                        imageHeight={
                          analysis.image_height
                        }
                      />
                    )
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <span className="text-xl">
                  📷
                </span>
              </div>

              <p className="mt-4 text-sm text-white/50">
                Camera feed is not active.
              </p>

              <p className="mt-1 text-xs text-white/30">
                Select a camera, test the connection,
                then start monitoring.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* AI statistics */}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Crop Count"
          value={
            analysis
              ? analysis.crop_count.toString()
              : "—"
          }
        />

        <StatCard
          label="Diseased Crops"
          value={
            analysis
              ? analysis.diseased_crop_count.toString()
              : "—"
          }
        />

        <StatCard
          label="Disease Findings"
          value={
            analysis
              ? analysis.disease_count.toString()
              : "—"
          }
        />
      </section>

      {/* AI results */}
      {analysis && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-medium">
              AI Analysis Results
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Results from the latest captured camera
              frame.
            </p>
          </div>

          {analysis.crops.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
              <p className="text-sm text-white/50">
                No crops were detected in this frame.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analysis.crops.map((crop) => (
                <div
                  key={crop.crop_id}
                  className="rounded-xl border border-white/10 bg-black/10 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">
                          {crop.crop}
                        </h3>

                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] text-green-300">
                          {(
                            crop.confidence * 100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-white/30">
                        Crop #{crop.crop_id}
                      </p>
                    </div>

                    <div className="text-xs text-white/40">
                      {crop.disease_count} disease
                      {crop.disease_count === 1
                        ? ""
                        : "s"}
                    </div>
                  </div>

                  {crop.diseases.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {crop.diseases.map(
                        (disease, index) => (
                          <div
                            key={`${crop.crop_id}-${disease.disease}-${index}`}
                            className="rounded-lg border border-red-500/10 bg-red-500/[0.04] p-3"
                          >
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm text-red-200">
                                  {formatDiseaseName(
                                    disease.disease
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-white/30">
                                  Confidence:{" "}
                                  {(
                                    disease.confidence *
                                    100
                                  ).toFixed(1)}
                                  %
                                </p>
                              </div>

                              {typeof disease.affected_area_percent ===
                                "number" && (
                                <span className="text-xs text-white/40">
                                  Affected:{" "}
                                  {disease.affected_area_percent.toFixed(
                                    2
                                  )}
                                  %
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Monitoring information */}
      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          label="Camera"
          value={
            activeCamera?.name ||
            "Not selected"
          }
        />

        <InfoCard
          label="Connection"
          value={
            connected
              ? "Connected"
              : "Offline"
          }
        />

        <InfoCard
          label="AI System"
          value={
            analysis
              ? "Analysis complete"
              : "Ready"
          }
        />
      </section>
    </div>
  );
}

interface CropOverlayProps {
  crop: CropResult;
  imageWidth: number;
  imageHeight: number;
}

function CropOverlay({
  crop,
  imageWidth,
  imageHeight,
}: CropOverlayProps) {
  const [x1, y1, x2, y2] = crop.box;

  const left =
    (x1 / imageWidth) * 100;

  const top =
    (y1 / imageHeight) * 100;

  const width =
    ((x2 - x1) / imageWidth) * 100;

  const height =
    ((y2 - y1) / imageHeight) * 100;

  return (
    <div
      className="absolute border-2 border-green-400"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
    >
      <div className="absolute -top-6 left-0 whitespace-nowrap rounded bg-green-400 px-2 py-1 text-[10px] font-medium text-black">
        {crop.crop}{" "}
        {(crop.confidence * 100).toFixed(1)}%
      </div>

      {crop.diseases.map(
        (disease, index) => (
          <DiseaseOverlay
            key={`${disease.disease}-${index}`}
            disease={disease}
            parentBox={crop.box}
          />
        )
      )}
    </div>
  );
}

interface DiseaseOverlayProps {
  disease: DiseaseResult;
  parentBox: [number, number, number, number];
}

function DiseaseOverlay({
  disease,
  parentBox,
}: DiseaseOverlayProps) {
  if (!disease.box) {
    return null;
  }

  const [
    cropX1,
    cropY1,
    cropX2,
    cropY2,
  ] = parentBox;

  const [
    diseaseX1,
    diseaseY1,
    diseaseX2,
    diseaseY2,
  ] = disease.box;

  const cropWidth =
    cropX2 - cropX1;

  const cropHeight =
    cropY2 - cropY1;

  if (
    cropWidth <= 0 ||
    cropHeight <= 0
  ) {
    return null;
  }

  const left =
    ((diseaseX1 - cropX1) /
      cropWidth) *
    100;

  const top =
    ((diseaseY1 - cropY1) /
      cropHeight) *
    100;

  const width =
    ((diseaseX2 - diseaseX1) /
      cropWidth) *
    100;

  const height =
    ((diseaseY2 - diseaseY1) /
      cropHeight) *
    100;

  return (
    <div
      className="absolute border-2 border-red-400"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
    >
      <div className="absolute -bottom-5 left-0 whitespace-nowrap rounded bg-red-400 px-2 py-1 text-[9px] font-medium text-black">
        {formatDiseaseName(
          disease.disease
        )}{" "}
        {(disease.confidence * 100).toFixed(
          1
        )}
        %
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({
  label,
  value,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs text-white/40">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
}

function InfoCard({
  label,
  value,
}: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs text-white/40">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

function formatDiseaseName(
  disease: string
) {
  return disease
    .replace(/^cabbage_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}