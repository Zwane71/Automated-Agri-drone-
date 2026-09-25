"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Camera,
  CircleAlert,
  Play,
  RefreshCw,
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

const CAMERAS_STORAGE_KEY =
  "agri-drone-cameras";

const ACTIVE_CAMERA_STORAGE_KEY =
  "agri-drone-active-camera";

export default function CameraMonitor() {
  const [cameras, setCameras] = useState<
    CameraDevice[]
  >([]);

  const [activeCameraId, setActiveCameraId] =
    useState("");

  const [testing, setTesting] =
    useState(false);

  const [detecting, setDetecting] =
    useState(false);

  const [connected, setConnected] =
    useState(false);

  const [monitoring, setMonitoring] =
    useState(false);

  const [message, setMessage] = useState(
    "Detecting available cameras..."
  );

  const browserVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const browserStreamRef =
    useRef<MediaStream | null>(null);

  const activeCamera = useMemo(() => {
    return cameras.find(
      (camera) =>
        camera.id === activeCameraId
    );
  }, [cameras, activeCameraId]);

  const [showIpForm, setShowIpForm] =
  useState(false);

const [ipCameraName, setIpCameraName] =
  useState("");

const [ipCameraUrl, setIpCameraUrl] =
  useState("");

  /*
   * Detect cameras available to the browser.
   */
  async function detectBrowserCameras(): Promise<
    CameraDevice[]
  > {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices
    ) {
      return [];
    }

    let temporaryStream:
      | MediaStream
      | null = null;

    /*
     * Request permission first.
     *
     * This allows the browser to expose
     * camera names when enumerateDevices()
     * is called.
     */
    try {
      temporaryStream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: false,
          }
        );
    } catch (error) {
      console.warn(
        "Camera permission was not granted:",
        error
      );
    }

    try {
      const devices =
        await navigator.mediaDevices.enumerateDevices();

      const videoDevices =
        devices.filter(
          (device) =>
            device.kind === "videoinput"
        );

      return videoDevices.map(
        (device, index) => ({
          id: `browser-${device.deviceId}`,
          name:
            device.label ||
            `Browser Camera ${index + 1}`,
          type: "browser" as const,
          deviceId: device.deviceId,
        })
      );
    } finally {
      /*
       * Stop the temporary permission stream.
       */
      temporaryStream
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });
    }
  }

  /*
   * Load browser cameras and saved IP cameras.
   */
  async function loadCameras() {
    setDetecting(true);

    try {
      let savedCameras: CameraDevice[] =
        [];

      const saved =
        localStorage.getItem(
          CAMERAS_STORAGE_KEY
        );

      if (saved) {
        try {
          const parsed = JSON.parse(saved);

          if (Array.isArray(parsed)) {
            savedCameras = parsed.filter(
              (camera: CameraDevice) =>
                camera.type === "ip"
            );
          }
        } catch (error) {
          console.error(
            "Could not read saved cameras:",
            error
          );
        }
      }

      const browserCameras =
        await detectBrowserCameras();

      const allCameras = [
        ...browserCameras,
        ...savedCameras,
      ];

      setCameras(allCameras);

      /*
       * Restore the previously selected camera.
       */
      const savedActiveCamera =
        localStorage.getItem(
          ACTIVE_CAMERA_STORAGE_KEY
        );

      const savedCameraStillExists =
        !!savedActiveCamera &&
        allCameras.some(
          (camera) =>
            camera.id === savedActiveCamera
        );

      if (savedCameraStillExists) {
        setActiveCameraId(
          savedActiveCamera!
        );

        const selected =
          allCameras.find(
            (camera) =>
              camera.id ===
              savedActiveCamera
          );

        setMessage(
          selected
            ? `${selected.name} selected.`
            : "Select a camera to begin."
        );
      } else if (allCameras.length > 0) {
        /*
         * Automatically select the first
         * available camera.
         */
        const firstCamera =
          allCameras[0];

        setActiveCameraId(
          firstCamera.id
        );

        localStorage.setItem(
          ACTIVE_CAMERA_STORAGE_KEY,
          firstCamera.id
        );

        setMessage(
          `${firstCamera.name} selected.`
        );
      } else {
        setActiveCameraId("");

        setMessage(
          "No cameras were detected."
        );
      }
    } catch (error) {
      console.error(
        "Camera detection failed:",
        error
      );

      setMessage(
        "Could not detect available cameras."
      );
    } finally {
      setDetecting(false);
    }
  }

  /*
   * Detect cameras when the page opens.
   */
  useEffect(() => {
    loadCameras();
  }, []);

  /*
   * Stop browser camera.
   */
  function stopBrowserCamera() {
    if (browserStreamRef.current) {
      browserStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });
    }

    browserStreamRef.current = null;

    if (browserVideoRef.current) {
      browserVideoRef.current.pause();
      browserVideoRef.current.srcObject = null;
    }
  }

  /*
   * Stop monitoring.
   */
  function stopMonitoring() {
    stopBrowserCamera();

    setMonitoring(false);
    setConnected(false);
  }

  /*
   * Start the selected browser camera.
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

      /*
       * Stop any previous camera.
       */
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

      /*
       * Attach stream to video.
       */
      const video =
        browserVideoRef.current;

      if (!video) {
        throw new Error(
          "Camera video element is not ready."
        );
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      /*
       * Wait for the browser to receive
       * the video metadata before playing.
       */
      await new Promise<void>(
        (resolve) => {
          if (video.readyState >= 1) {
            resolve();
            return;
          }

          video.onloadedmetadata = () => {
            resolve();
          };
        }
      );

      await video.play();

      setConnected(true);
      setMonitoring(true);

      setMessage(
        `${activeCamera.name} is live.`
      );
    } catch (error) {
      console.error(
        "Could not start camera:",
        error
      );

      stopBrowserCamera();

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
   * Test selected IP camera.
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
   * Select camera.
   */
  function selectCamera(
    camera: CameraDevice
  ) {
    stopMonitoring();

    setActiveCameraId(camera.id);

    localStorage.setItem(
      ACTIVE_CAMERA_STORAGE_KEY,
      camera.id
    );

    setMessage(
      `${camera.name} selected.`
    );
  }

  /*
   * Start or stop monitoring.
   */
  async function toggleMonitoring() {
    if (!activeCamera) {
      setMessage(
        "Select a camera first."
      );
      return;
    }

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
   * Clean up when leaving the page.
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
              Select and manage the camera input
              used by the system.
            </p>
          </div>

          <CameraStatus
            connected={
              connected && monitoring
            }
            message={message}
          />
        </div>

        {/* Refresh cameras */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={loadCameras}
            disabled={detecting}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                detecting
                  ? "animate-spin"
                  : ""
              }`}
            />

            {detecting
              ? "Detecting..."
              : "Refresh Cameras"}
          </button>
        </div>

        {/* Camera list */}
        {cameras.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center">
            <Camera className="mx-auto mb-3 h-8 w-8 text-white/20" />

            <p className="text-sm text-white/50">
              No camera inputs detected.
            </p>

            <p className="mt-2 text-xs text-white/30">
              Make sure your camera is connected
              and allow camera access when your
              browser asks for permission.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
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
                      {activeCamera.type ===
                      "ip"
                        ? "IP / Wireless Camera"
                        : "Browser Camera"}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/50">
                    {activeCamera.type ===
                    "ip"
                      ? "IP"
                      : "Browser"}
                  </span>
                </div>

                {activeCamera.type ===
                  "ip" &&
                  activeCamera.streamUrl && (
                    <p className="mt-3 truncate text-xs text-white/30">
                      {
                        activeCamera.streamUrl
                      }
                    </p>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Add IP / Wireless Camera */}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium">
                  IP / Wireless Camera
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Add a network camera using its stream URL.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowIpForm((value) => !value)
                }
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:bg-white/10"
              >
                {showIpForm
                  ? "Cancel"
                  : "Add IP Camera"}
              </button>
            </div>

            {showIpForm && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs text-white/40">
                    Camera Name
                  </label>

                  <input
                    type="text"
                    value={ipCameraName}
                    onChange={(event) =>
                      setIpCameraName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Field Camera"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40">
                    Stream URL
                  </label>

                  <input
                    type="text"
                    value={ipCameraUrl}
                    onChange={(event) =>
                      setIpCameraUrl(
                        event.target.value
                      )
                    }
                    placeholder="rtsp://192.168.1.100:554/..."
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const name =
                      ipCameraName.trim() ||
                      "IP Camera";

                    const url =
                      ipCameraUrl.trim();

                    if (!url) {
                      setMessage(
                        "Enter the camera stream URL."
                      );
                      return;
                    }

                    const newCamera: CameraDevice = {
                      id: `ip-${Date.now()}`,
                      name,
                      type: "ip",
                      streamUrl: url,
                    };

                    const existing =
                      localStorage.getItem(
                        CAMERAS_STORAGE_KEY
                      );

                    let savedCameras: CameraDevice[] =
                      [];

                    if (existing) {
                      try {
                        const parsed =
                          JSON.parse(existing);

                        if (Array.isArray(parsed)) {
                          savedCameras =
                            parsed.filter(
                              (camera: CameraDevice) =>
                                camera.type === "ip"
                            );
                        }
                      } catch {
                        savedCameras = [];
                      }
                    }

                    const updatedCameras = [
                      ...savedCameras,
                      newCamera,
                    ];

                    localStorage.setItem(
                      CAMERAS_STORAGE_KEY,
                      JSON.stringify(
                        updatedCameras
                      )
                    );

                    setCameras((current) => [
                      ...current,
                      newCamera,
                    ]);

                    setActiveCameraId(
                      newCamera.id
                    );

                    localStorage.setItem(
                      ACTIVE_CAMERA_STORAGE_KEY,
                      newCamera.id
                    );

                    setIpCameraName("");
                    setIpCameraUrl("");
                    setShowIpForm(false);

                    setConnected(false);
                    setMonitoring(false);

                    setMessage(
                      `${name} added and selected.`
                    );
                  }}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
                >
                  Add Camera
                </button>
              </div>
            )}
          </div>

        {/* Controls */}
        {activeCamera && (
          <div className="mt-5 flex flex-wrap gap-3">
            {activeCamera.type ===
              "ip" && (
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

          {activeCamera?.type ===
            "browser" && (
            <video
              ref={browserVideoRef}
              autoPlay
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

          {/* No camera selected */}

          {!activeCamera && (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <Camera className="h-6 w-6 text-white/20" />
              </div>

              <p className="mt-4 text-sm text-white/50">
                No camera selected.
              </p>

              <p className="mt-1 text-xs text-white/30">
                Select a camera input to begin.
              </p>
            </div>
          )}

          {/* Camera selected but not running */}

          {activeCamera &&
            !monitoring && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                    <Camera className="h-6 w-6 text-white/20" />
                  </div>

                  <p className="mt-4 text-sm text-white/50">
                    Camera feed is not active.
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Click Start Monitoring.
                  </p>
                </div>
              </div>
            )}
        </div>
      </section>

      {/* Camera information */}

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
              ? activeCamera.type ===
                "ip"
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