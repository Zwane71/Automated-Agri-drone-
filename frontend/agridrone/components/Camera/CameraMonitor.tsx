"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Camera,
  CircleAlert,
  Play,
  Square,
} from "lucide-react";

import {
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

export default function CameraMonitor() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState("");
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [message, setMessage] = useState(
    "Select an input to begin."
  );

  const browserVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const browserStreamRef =
    useRef<MediaStream | null>(null);

  useEffect(() => {
    loadSavedCameras();
  }, []);

  const activeCamera = useMemo(() => {
    return cameras.find(
      (camera) => camera.id === activeCameraId
    );
  }, [cameras, activeCameraId]);

  /*
   * Load cameras saved from Settings.
   */
  function loadSavedCameras() {
    try {
      const savedCameras =
        localStorage.getItem(
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
        setActiveCameraId(
          savedActiveCamera
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Could not load saved camera settings."
      );
    }
  }

  /*
   * Stop browser camera if one is running.
   */
  function stopBrowserCamera() {
    browserStreamRef.current
      ?.getTracks()
      .forEach((track) => {
        track.stop();
      });

    browserStreamRef.current = null;

    if (browserVideoRef.current) {
      browserVideoRef.current.srcObject =
        null;
    }
  }

  /*
   * Stop the currently active input.
   */
  function stopMonitoring() {
    stopBrowserCamera();

    setMonitoring(false);
    setConnected(false);
  }

  /*
   * Start a browser camera.
   */
  async function startBrowserCamera() {
    if (!activeCamera?.deviceId) {
      setMessage(
        "Browser camera device is not available."
      );
      return;
    }

    try {
      setMessage(
        "Starting browser camera..."
      );

      stopBrowserCamera();

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              deviceId: {
                exact:
                  activeCamera.deviceId,
              },
              width: {
                ideal: 640,
              },
              height: {
                ideal: 480,
              },
            },
            audio: false,
          }
        );

      browserStreamRef.current = stream;

      if (browserVideoRef.current) {
        browserVideoRef.current.srcObject =
          stream;

        await browserVideoRef.current.play();
      }

      setConnected(true);
      setMonitoring(true);

      setMessage(
        `${activeCamera.name} is live.`
      );
    } catch (error) {
      console.error(error);

      setConnected(false);
      setMonitoring(false);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not access the browser camera."
      );
    }
  }

  /*
   * Test an IP camera.
   */
  async function handleTestCamera() {
    if (
      !activeCamera ||
      activeCamera.type !== "ip" ||
      !activeCamera.streamUrl
    ) {
      setConnected(false);

      setMessage(
        "Select an IP camera first."
      );

      return;
    }

    setTesting(true);
    setConnected(false);

    setMessage(
      "Testing camera connection..."
    );

    try {
      const result =
        await testCamera(
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
      console.error(error);

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

  /*
   * Select an input.
   */
  function selectCamera(
    camera: CameraDevice
  ) {
    stopMonitoring();

    setActiveCameraId(camera.id);

    localStorage.setItem(
      "agri-drone-active-camera",
      camera.id
    );

    setMessage(
      `${camera.name} selected.`
    );
  }

  /*
   * Start/stop the selected input.
   */
  async function toggleMonitoring() {
    if (!activeCamera) {
      setMessage(
        "Select a camera first."
      );

      return;
    }

    /*
     * Stop current input.
     */
    if (monitoring) {
      stopMonitoring();

      setMessage(
        `${activeCamera.name} stopped.`
      );

      return;
    }

    /*
     * Browser camera.
     */
    if (
      activeCamera.type === "browser"
    ) {
      await startBrowserCamera();
      return;
    }

    /*
     * IP camera.
     */
    if (
      activeCamera.type === "ip"
    ) {
      if (!activeCamera.streamUrl) {
        setMessage(
          "This IP camera has no stream URL."
        );

        return;
      }

      if (!connected) {
        setMessage(
          "Test the IP camera connection first."
        );

        return;
      }

      setMonitoring(true);

      setMessage(
        `${activeCamera.name} is live.`
      );
    }
  }

  /*
   * Clean up browser camera when leaving page.
   */
  useEffect(() => {
    return () => {
      stopBrowserCamera();
    };
  }, []);

  return (
    <div className="space-y-6">

      {/* Camera selector */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="text-lg font-medium">
              Camera Input
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Select and manage the camera input used by the system.
            </p>
          </div>

          <CameraStatus
            connected={
              connected && monitoring
            }
            message={message}
          />

        </div>

        {/* Camera list */}

        {cameras.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">

            <Camera className="mx-auto mb-3 h-8 w-8 text-white/20" />

            <p className="text-sm text-white/50">
              No camera inputs are configured.
            </p>

            <p className="mt-2 text-xs text-white/30">
              Add an IP camera or configure a browser camera from Settings.
            </p>

          </div>
        ) : (
          <div className="mt-6 space-y-3">

            <label className="text-xs text-white/40">
              Active Input
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

              {cameras.map((camera) => (
                <option
                  key={camera.id}
                  value={camera.id}
                  className="bg-black"
                >
                  {camera.name} —{" "}
                  {camera.type === "ip"
                    ? "IP Camera"
                    : "Browser Camera"}
                </option>
              ))}
            </select>

            {activeCamera && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium">
                      {activeCamera.name}
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      {activeCamera.type === "ip"
                        ? "IP / Wireless Camera"
                        : "Browser Camera"}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/50">
                    {activeCamera.type === "ip"
                      ? "IP"
                      : "Browser"}
                  </span>

                </div>

                {activeCamera.type === "ip" &&
                  activeCamera.streamUrl && (
                    <p className="mt-3 truncate text-xs text-white/30">
                      {activeCamera.streamUrl}
                    </p>
                  )}

              </div>
            )}

          </div>
        )}

        {/* Controls */}

        {activeCamera && (
          <div className="mt-5 flex flex-wrap gap-3">

            {activeCamera.type === "ip" && (
              <button
                type="button"
                onClick={
                  handleTestCamera
                }
                disabled={testing}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:bg-white/10 disabled:opacity-50"
              >
                {testing
                  ? "Testing..."
                  : "Test Camera"}
              </button>
            )}

            <button
              type="button"
              onClick={
                toggleMonitoring
              }
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
            >
              {monitoring ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Monitoring
                </>
              )}
            </button>

          </div>
        )}

      </section>

      {/* Live feed */}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-black">

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

          <div>
            <h2 className="text-sm font-medium">
              Live Input
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

          {/* Browser camera */}

          {monitoring &&
            activeCamera?.type ===
              "browser" && (
              <video
                ref={browserVideoRef}
                muted
                playsInline
                className="h-full w-full object-contain"
              />
            )}

          {/* IP camera */}

          {monitoring &&
            activeCamera?.type === "ip" &&
            activeCamera.streamUrl && (
              <img
                src={getCameraStreamUrl(
                  activeCamera.streamUrl
                )}
                alt={`Live feed from ${activeCamera.name}`}
                className="h-full w-full object-contain"
              />
            )}

          {/* No active feed */}

          {!monitoring && (
            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">

                <Camera className="h-6 w-6 text-white/20" />

              </div>

              <p className="mt-4 text-sm text-white/50">
                Camera feed is not active.
              </p>

              <p className="mt-1 text-xs text-white/30">
                Select an input and start monitoring.
              </p>

            </div>
          )}

        </div>

      </section>

      {/* Input information */}

      <section className="grid gap-4 md:grid-cols-3">

        <InfoCard
          label="Active Input"
          value={
            activeCamera?.name ||
            "Not selected"
          }
        />

        <InfoCard
          label="Type"
          value={
            activeCamera
              ? activeCamera.type === "ip"
                ? "IP / Wireless"
                : "Browser Camera"
              : "—"
          }
        />

        <InfoCard
          label="Status"
          value={
            monitoring && connected
              ? "Live"
              : monitoring
              ? "Starting"
              : "Offline"
          }
        />

      </section>

      {/* Information */}

      {!activeCamera && (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">

          <CircleAlert className="h-4 w-4 text-white/30" />

          <p className="text-sm text-white/40">
            Select a camera input to begin.
          </p>

        </div>
      )}

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