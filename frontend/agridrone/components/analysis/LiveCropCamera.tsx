"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CircleAlert, Loader2, Play, Square } from "lucide-react";

import { 
    detectCrops,
    segmentDisease
 } from "@/lib/api";
import type { 
    CropDetection,
    DiseaseDetection
 } from "./types";

interface LiveCropCameraProps {
  onDetection?: (crops: CropDetection[]) => void;
}

export default function LiveCropCamera({
  onDetection,
}: LiveCropCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false);

  const [diseases, setDiseases] =
  useState<DiseaseDetection[]>([]);

  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [crops, setCrops] = useState<CropDetection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setRunning(true);
    } catch (err) {
      console.error(err);
      setError("Could not access the camera.");
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setRunning(false);
    setCrops([]);
  };

  const captureAndDetect = async () => {
    if (processingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    if (video.readyState < 2) return;

    processingRef.current = true;
    setLoading(true);

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) return;

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.75);
      });

      if (!blob) return;

     const result = await detectCrops(blob);

        setCrops(result.crops);
        onDetection?.(result.crops);

        const diseaseResult =
        await segmentDisease(blob);

        setDiseases(
        diseaseResult.diseases
        );
      

      setCrops(result.crops);
      onDetection?.(result.crops);
    } catch (err) {
      console.error("Crop detection failed:", err);
      setError("AI crop detection failed.");
    } finally {
      processingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!running) return;

    /*
     * Start with one AI analysis every 3 seconds.
     *
     * Your current CPU backend takes around 2+ seconds
     * for crop detection, so we don't want to overload it.
     */
    intervalRef.current = setInterval(() => {
      captureAndDetect();
    }, 3000);

    captureAndDetect();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          className="aspect-video h-full w-full object-cover"
        />

        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07120e]">
            <Camera className="mb-3 h-10 w-10 text-white/30" />

            <p className="text-sm text-white/50">
              Camera is offline
            </p>

            <button
              onClick={startCamera}
              className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400"
            >
              <Play className="h-4 w-4" />
              Start Camera
            </button>
          </div>
        )}

        {running && (
          <>
            {/* LIVE indicator */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-red-400/20 bg-black/60 px-3 py-1.5 text-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              LIVE
            </div>

            {/* AI status */}
            <div className="absolute right-4 top-4 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs backdrop-blur">
              <div className="flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    <span>AI scanning...</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>AI ready</span>
                  </>
                )}
              </div>
            </div>

            {/* Detection boxes */}
            {videoRef.current &&
              crops.map((crop) => {
                const [x1, y1, x2, y2] = crop.box;

                const videoWidth =
                  videoRef.current?.videoWidth || 1;

                const videoHeight =
                  videoRef.current?.videoHeight || 1;

                const left = (x1 / videoWidth) * 100;
                const top = (y1 / videoHeight) * 100;
                const width =
                  ((x2 - x1) / videoWidth) * 100;
                const height =
                  ((y2 - y1) / videoHeight) * 100;

                return (
                  <div
                    key={crop.crop_id}
                    className="absolute border-2 border-emerald-400"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                    }}
                  >
                    <div className="absolute -top-6 left-0 rounded bg-emerald-400 px-2 py-0.5 text-[10px] font-semibold text-black">
                      {crop.crop}{" "}
                      {(crop.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
          <CircleAlert className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/40">
            Crops detected
          </p>

          <p className="text-2xl font-semibold">
            {crops.length}
          </p>
        </div>

        {running && (
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
          >
            <Square className="h-4 w-4" />
            Stop Camera
          </button>
        )}
      </div>
    </div>
  );
}