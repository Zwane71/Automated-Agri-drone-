"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  CircleAlert,
  Play,
  Square,
  Wifi,
} from "lucide-react";

import {
  analyzeCameraFrame,
  analyzeFull,
  getCameraStreamUrl,
} from "@/lib/api";

import CameraOverlay from "./CameraOverlay";

import type {
  AnalysisResult,
  CropDetection,
  DiseaseDetection,
} from "./types";

interface CameraDevice {
  id: string;
  name: string;
  type: "browser" | "ip";
  deviceId?: string;
  streamUrl?: string;
}

interface LiveCropCameraProps {
  camera: CameraDevice | null;
  onDetection?: (
    crops: CropDetection[],
    diseases: DiseaseDetection[]
  ) => void;
}

export default function LiveCropCamera({
  camera,
  onDetection,
}: LiveCropCameraProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const intervalRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const analyzingRef = useRef(false);

  const [running, setRunning] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [status, setStatus] =
    useState("Ready");

  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResult | null>(null);

  /*
   * Stop the browser camera stream.
   */
  const stopBrowserStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  /*
   * Stop the AI analysis loop.
   */
  const stopAnalysisLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    analyzingRef.current = false;
  }, []);

  /*
   * Completely stop the selected camera.
   */
  const stopCamera = useCallback(() => {
    stopAnalysisLoop();
    stopBrowserStream();

    setRunning(false);
    setLoading(false);
    setStatus("Camera stopped");
    setAnalysisResult(null);
  }, [
    stopAnalysisLoop,
    stopBrowserStream,
  ]);

  /*
   * Handle the result returned by the AI.
   */
  const handleAnalysisResult = useCallback(
    (result: AnalysisResult) => {
      setAnalysisResult(result);

      const detectedCrops =
        result.crops || [];

      const detectedDiseases =
        detectedCrops.flatMap(
          (crop) => crop.diseases || []
        );

      onDetection?.(
        detectedCrops,
        detectedDiseases
      );

      setStatus(
        `${detectedCrops.length} crops detected`
      );
    },
    [onDetection]
  );

  /*
   * Analyze one frame from a browser camera.
   */
  const analyzeBrowserFrame =
    useCallback(async () => {
      if (
        !camera ||
        camera.type !== "browser" ||
        !videoRef.current ||
        !canvasRef.current
      ) {
        return;
      }

      if (analyzingRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        video.readyState <
        HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        return;
      }

      if (
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return;
      }

      analyzingRef.current = true;

      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context =
          canvas.getContext("2d");

        if (!context) {
          return;
        }

        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const blob =
          await new Promise<Blob | null>(
            (resolve) => {
              canvas.toBlob(
                resolve,
                "image/jpeg",
                0.85
              );
            }
          );

        if (!blob) {
          return;
        }

        const file = new File(
          [blob],
          "camera-frame.jpg",
          {
            type: "image/jpeg",
          }
        );

        setStatus("Analyzing frame...");

        const result =
          await analyzeFull(file);

        handleAnalysisResult(result);
      } catch (err) {
        console.error(
          "Browser camera analysis error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to analyze camera frame."
        );
      } finally {
        analyzingRef.current = false;
      }
    }, [
      camera,
      handleAnalysisResult,
    ]);

  /*
   * Analyze one frame from an IP camera.
   */
  const analyzeIpFrame =
    useCallback(async () => {
      if (
        !camera ||
        camera.type !== "ip" ||
        !camera.streamUrl
      ) {
        return;
      }

      if (analyzingRef.current) {
        return;
      }

      analyzingRef.current = true;

      try {
        setStatus(
          "Analyzing IP camera..."
        );

        const result =
          await analyzeCameraFrame(
            camera.streamUrl
          );

        handleAnalysisResult(result);
      } catch (err) {
        console.error(
          "IP camera analysis error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to analyze IP camera."
        );
      } finally {
        analyzingRef.current = false;
      }
    }, [
      camera,
      handleAnalysisResult,
    ]);

  /*
   * Start the selected browser camera.
   */
  const startBrowserCamera =
    useCallback(async () => {
      if (
        !camera ||
        camera.type !== "browser"
      ) {
        return;
      }

      if (!camera.deviceId) {
        setError(
          "The selected browser camera does not have a device ID."
        );
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setAnalysisResult(null);
        setStatus(
          "Connecting to camera..."
        );

        stopBrowserStream();

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                deviceId: {
                  exact: camera.deviceId,
                },
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
              },
              audio: false,
            }
          );

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play();
        }

        setRunning(true);
        setStatus("Camera running");

        /*
         * Give the video time to initialize
         * before the first analysis.
         */
        setTimeout(() => {
          analyzeBrowserFrame();
        }, 1000);

        intervalRef.current =
          setInterval(() => {
            analyzeBrowserFrame();
          }, 3000);
      } catch (err) {
        console.error(
          "Could not start browser camera:",
          err
        );

        setRunning(false);

        setError(
          err instanceof Error
            ? err.message
            : "Could not access the selected camera."
        );

        setStatus(
          "Camera unavailable"
        );
      } finally {
        setLoading(false);
      }
    }, [
      camera,
      analyzeBrowserFrame,
      stopBrowserStream,
    ]);

  /*
   * Start the selected IP camera.
   */
  const startIpCamera =
    useCallback(async () => {
      if (
        !camera ||
        camera.type !== "ip" ||
        !camera.streamUrl
      ) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setAnalysisResult(null);

        setStatus(
          "Connecting to IP camera..."
        );

        /*
         * Do not use HEAD here.
         *
         * Some MJPEG camera streams do not
         * support HEAD requests.
         */
        setRunning(true);
        setStatus("IP camera running");

        setTimeout(() => {
          analyzeIpFrame();
        }, 1000);

        intervalRef.current =
          setInterval(() => {
            analyzeIpFrame();
          }, 3000);
      } catch (err) {
        console.error(
          "Could not start IP camera:",
          err
        );

        setRunning(false);

        setError(
          err instanceof Error
            ? err.message
            : "Could not access the IP camera."
        );

        setStatus(
          "Camera unavailable"
        );
      } finally {
        setLoading(false);
      }
    }, [
      camera,
      analyzeIpFrame,
    ]);

  /*
   * Start whichever camera was selected
   * on the Camera page.
   */
  const startCamera = useCallback(() => {
    if (!camera) {
      setError(
        "No camera is selected. Go to the Camera page and select an input."
      );
      return;
    }

    setError(null);

    if (camera.type === "browser") {
      startBrowserCamera();
      return;
    }

    if (camera.type === "ip") {
      startIpCamera();
    }
  }, [
    camera,
    startBrowserCamera,
    startIpCamera,
  ]);

  /*
   * If the selected camera changes while
   * this component is mounted, stop the
   * previous input.
   */
  useEffect(() => {
    stopCamera();
    setError(null);

    if (!camera) {
      setStatus("No camera selected");
      return;
    }

    setStatus(
      `${camera.name} ready`
    );
  }, [
    camera,
    stopCamera,
  ]);

  /*
   * Cleanup when leaving the page.
   */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  /*
   * No camera selected.
   */
  if (!camera) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-center">
        <Camera className="mx-auto mb-4 h-10 w-10 text-white/20" />

        <h3 className="text-sm font-medium">
          No Camera Selected
        </h3>

        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/40">
          Go to the Camera page, select a camera
          input, and return here to start AI
          analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Camera information */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {camera.type === "ip" ? (
            <Wifi className="h-5 w-5 text-white/50" />
          ) : (
            <Camera className="h-5 w-5 text-white/50" />
          )}

          <div>
            <p className="text-sm font-medium">
              {camera.name}
            </p>

            <p className="mt-0.5 text-xs text-white/40">
              {camera.type === "ip"
                ? "Wireless / IP camera"
                : "Browser camera"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              running
                ? "bg-green-400"
                : "bg-white/20"
            }`}
          />

          <span className="text-xs text-white/40">
            {status}
          </span>
        </div>
      </div>

      {/* Camera feed */}
      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">

        {camera.type === "browser" ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <img
            src={
              running
                ? getCameraStreamUrl(
                    camera.streamUrl || ""
                  )
                : undefined
            }
            alt={`Live feed from ${camera.name}`}
            className="h-full w-full object-contain"
          />
        )}

        {/* AI detection overlays */}
        {running && analysisResult && (
          <CameraOverlay
            result={analysisResult}
          />
        )}

        {/* Stopped overlay */}
        {!running && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center">
              <Camera className="mx-auto mb-3 h-8 w-8 text-white/30" />

              <p className="text-sm text-white/50">
                Camera is stopped
              </p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />

              <p className="text-xs text-white/50">
                Connecting...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detection legend */}
      {running && analysisResult && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border-2 border-green-500" />
            <span>Crop detected</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border-2 border-red-500" />
            <span>Disease detected</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

          <div>
            <p className="text-sm text-red-300">
              Camera error
            </p>

            <p className="mt-1 text-xs leading-5 text-red-300/70">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/30">
            AI analysis runs automatically every
            3 seconds while the camera is running.
          </p>
        </div>

        {!running ? (
          <button
            type="button"
            onClick={startCamera}
            disabled={loading}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" />

            {loading
              ? "Starting..."
              : "Start AI Camera"}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
          >
            <Square className="h-4 w-4" />

            Stop AI Camera
          </button>
        )}
      </div>

      {/* Hidden canvas */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
}