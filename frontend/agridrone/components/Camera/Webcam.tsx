"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

import type { AnalysisResult } from "../analysis/types";
import CameraOverlay from "../analysis/CameraOverlay";
import AIStatus from "../analysis/AIStatus";
import DetectionSummary from "../analysis/DetectionSummary";
import CropAnalysis from "../analysis/CropAnalysis";



export default function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const detectingRef = useRef(false);

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [detecting, setDetecting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function detectObjects() {
    if (detectingRef.current) return;

    if (!webcamRef.current) return;

    try {
      detectingRef.current = true;
      setDetecting(true);
      setError(null);

      const image =
        webcamRef.current.getScreenshot();

      if (!image) return;

      const blob = await fetch(image).then(
        (res) => res.blob()
      );

      const formData = new FormData();

      formData.append(
        "file",
        blob,
        "frame.jpg"
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analysis/full`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `AI server returned ${response.status}`
        );
      }

      const data: AnalysisResult =
        await response.json();

      setResult(data);
    } catch (err) {
      console.error(
        "Detection error:",
        err
      );

      setError(
        "Unable to connect to AI backend"
      );
    } finally {
      detectingRef.current = false;
      setDetecting(false);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      detectObjects();
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">

      {/* CAMERA */}
      <div
        className="
          relative
          w-full
          max-w-2xl
          overflow-hidden
          rounded-xl
        "
      >
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "environment",
            width: 640,
            height: 640,
          }}
          className="
            w-full
            rounded-xl
          "
        />

        {/* AI BOXES */}
        <CameraOverlay result={result} />

        {/* AI STATUS */}
        <AIStatus detecting={detecting} />

        {/* CROP COUNT */}
        {result && (
          <div
            className="
              absolute
              bottom-3
              left-3
              rounded-lg
              bg-black/70
              px-3
              py-2
              text-white
            "
          >
            Crops detected:{" "}
            <span className="font-bold">
              {result.crop_count}
            </span>
          </div>
        )}
      </div>

      {/* RESULTS */}
      {result && (
        <div
          className="
            rounded-xl
            bg-black
            p-4
            text-white
          "
        >
          <h2
            className="
              mb-4
              text-lg
              font-bold
            "
          >
            AI Analysis
          </h2>

          {/* SUMMARY */}
          <DetectionSummary
            result={result}
          />

          {/* CROPS */}
          <CropAnalysis
            result={result}
          />
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div
          className="
            rounded
            bg-red-600
            p-3
            text-white
          "
        >
          {error}
        </div>
      )}
    </div>
  );
}