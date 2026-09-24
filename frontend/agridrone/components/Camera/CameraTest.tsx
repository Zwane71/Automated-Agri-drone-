"use client";

import { useState } from "react";

import {
  getCameraStreamUrl,
  testCamera,
} from "@/lib/api";


interface CameraTestProps {
  cameraUrl: string;
}


export default function CameraTest({
  cameraUrl,
}: CameraTestProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] =
    useState<Awaited<
      ReturnType<typeof testCamera>
    > | null>(null);

  const handleTest = async () => {
    if (!cameraUrl.trim()) {
      setResult({
        connected: false,
        message: "Enter a camera URL first.",
      });

      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const data = await testCamera(cameraUrl);

      setResult(data);
    } catch (error) {
      setResult({
        connected: false,
        message:
          error instanceof Error
            ? error.message
            : "Camera test failed.",
      });
    } finally {
      setTesting(false);
    }
  };


  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleTest}
        disabled={testing}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {testing ? "Testing..." : "Test Camera"}
      </button>


      {result && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p
            className={
              result.connected
                ? "text-green-400"
                : "text-red-400"
            }
          >
            {result.connected
              ? "Camera connected"
              : "Camera connection failed"}
          </p>

          <p className="mt-1 text-sm text-white/50">
            {result.message}
          </p>

          {result.image_width &&
            result.image_height && (
              <p className="mt-2 text-xs text-white/40">
                Resolution:{" "}
                {result.image_width} ×{" "}
                {result.image_height}
              </p>
            )}
        </div>
      )}

      {result?.connected && (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <img
            src={getCameraStreamUrl(cameraUrl)}
            alt="Live camera stream"
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}