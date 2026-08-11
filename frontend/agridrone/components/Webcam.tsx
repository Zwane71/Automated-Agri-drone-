"use client";

import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

interface Detection {
  class: string;
  confidence: number;
  box: number[];
}

interface DetectionResult {
  count: number;
  detections: Detection[];
}

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);

  const [result, setResult] = useState<DetectionResult | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function detectObjects() {
    // Prevent overlapping requests
    if (detecting) return;

    if (!webcamRef.current) return;

    try {
      setDetecting(true);
      setError(null);

      const image = webcamRef.current.getScreenshot();

      if (!image) return;

      const blob = await fetch(image).then((res) => res.blob());

      const formData = new FormData();

      formData.append("file", blob, "frame.jpg");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/detect`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`AI server returned ${response.status}`);
      }

      const data: DetectionResult = await response.json();

      setResult(data);
    } catch (err) {
      console.error("Detection error:", err);

      setError("Unable to connect to AI backend");
    } finally {
      setDetecting(false);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      detectObjects();
    }, 1500);

    return () => clearInterval(interval);
  }, [detecting]);

  return (
    <div className="flex flex-col gap-4">

      {/* Camera */}
      <div className="relative">

        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "environment",
            width: 640,
            height: 640,
          }}
          className="rounded-xl"
        />

        {/* AI Status */}
        <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded">
          {detecting ? "AI scanning..." : "Live AI"}
        </div>

      </div>


      {/* Detection Results */}
      {result && (
        <div className="bg-black text-white p-4 rounded-xl">

          <h2 className="font-bold text-lg mb-2">
            Detection Results
          </h2>

          {/* Total quantity */}
          <p className="mb-3">
            Objects detected:{" "}
            <span className="font-bold">
              {result.count}
            </span>
          </p>


          {/* Individual detections */}
          <div className="flex flex-col gap-2">

            {result.detections.map((item, index) => (
              <div
                key={index}
                className="bg-gray-800 p-2 rounded"
              >

                <div className="flex justify-between">

                  <span className="font-medium capitalize">
                    {item.class}
                  </span>

                  <span>
                    {(item.confidence * 100).toFixed(1)}%
                  </span>

                </div>

              </div>
            ))}

          </div>

        </div>
      )}


      {/* Error */}
      {error && (
        <div className="bg-red-600 text-white p-3 rounded">
          {error}
        </div>
      )}

    </div>
  );
}
