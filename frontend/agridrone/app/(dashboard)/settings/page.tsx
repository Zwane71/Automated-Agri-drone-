"use client";

import { useEffect, useState } from "react";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import CameraTest from "@/components/Camera/CameraTest";
import { testCamera } from "@/lib/api";

interface CameraDevice {
  id: string;
  name: string;
  type: "browser" | "ip";
  deviceId?: string;
  streamUrl?: string;
}

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [analysisNotifications, setAnalysisNotifications] =
    useState(true);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState("");

  const [showAddCamera, setShowAddCamera] = useState(false);
  const [cameraName, setCameraName] = useState("");
  const [streamUrl, setStreamUrl] = useState("");

  const [cameraError, setCameraError] = useState("");
  const [cameraMessage, setCameraMessage] = useState("");
  const [loadingCameras, setLoadingCameras] = useState(false);

  useEffect(() => {
    loadConnectedCameras();
  }, []);
  useEffect(() => {
  loadConnectedCameras();

  const savedCameras = localStorage.getItem("agri-drone-cameras");
  const savedActiveCamera = localStorage.getItem(
    "agri-drone-active-camera"
  );

  if (savedCameras) {
    try {
      setCameras(JSON.parse(savedCameras));
    } catch {
      localStorage.removeItem("agri-drone-cameras");
    }
  }

  if (savedActiveCamera) {
    setActiveCameraId(savedActiveCamera);
  }
}, []);
useEffect(() => {
  localStorage.setItem(
    "agri-drone-cameras",
    JSON.stringify(cameras)
  );
}, [cameras]);

useEffect(() => {
  if (activeCameraId) {
    localStorage.setItem(
      "agri-drone-active-camera",
      activeCameraId
    );
  } else {
    localStorage.removeItem("agri-drone-active-camera");
  }
}, [activeCameraId]);

  async function loadConnectedCameras() {
    setLoadingCameras(true);
    setCameraError("");

    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        throw new Error(
          "Camera detection is not supported by this browser."
        );
      }

      const devices =
        await navigator.mediaDevices.enumerateDevices();

      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      const browserCameras: CameraDevice[] =
        videoDevices.map((device, index) => ({
          id: `browser-${device.deviceId}`,
          name: device.label || `Camera ${index + 1}`,
          type: "browser",
          deviceId: device.deviceId,
        }));

      setCameras((current) => {
        const ipCameras = current.filter(
          (camera) => camera.type === "ip"
        );

        return [...browserCameras, ...ipCameras];
      });

      if (!activeCameraId && browserCameras.length > 0) {
        setActiveCameraId(browserCameras[0].id);
      }
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : "Could not load cameras."
      );
    } finally {
      setLoadingCameras(false);
    }
  }

  async function requestCameraPermission() {
    setCameraError("");
    setCameraMessage("");

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
        });

      stream.getTracks().forEach((track) => {
        track.stop();
      });

      await loadConnectedCameras();

      setCameraMessage(
        "Camera permission granted. Connected cameras refreshed."
      );
    } catch {
      setCameraError(
        "Camera permission was denied or no camera is available."
      );
    }
  }

  async function addIpCamera() {
    setCameraError("");
    setCameraMessage("");

    if (!cameraName.trim()) {
      setCameraError("Enter a camera name.");
      return;
    }

    if (!streamUrl.trim()) {
      setCameraError("Enter the camera stream URL.");
      return;
    }

    setLoadingCameras(true);

    try {
      const result = await testCamera(streamUrl.trim());

      if (!result.connected) {
        setCameraError(
          result.message ||
            "Could not connect to the camera."
        );
        return;
      }

      const newCamera: CameraDevice = {
        id: `ip-${Date.now()}`,
        name: cameraName.trim(),
        type: "ip",
        streamUrl: streamUrl.trim(),
      };

      setCameras((current) => [
        ...current,
        newCamera,
      ]);

      setActiveCameraId(newCamera.id);

      setCameraName("");
      setStreamUrl("");
      setShowAddCamera(false);

      setCameraMessage(
        `${newCamera.name} connected successfully.`
      );
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : "Could not connect to the camera."
      );
    } finally {
      setLoadingCameras(false);
    }
  }

  function removeCamera(cameraId: string) {
    const camera = cameras.find(
      (item) => item.id === cameraId
    );

    if (!camera || camera.type !== "ip") {
      return;
    }

    const remaining = cameras.filter(
      (item) => item.id !== cameraId
    );

    setCameras(remaining);

    if (activeCameraId === cameraId) {
      setActiveCameraId(
        remaining[0]?.id || ""
      );
    }

    setCameraMessage(
      `${camera.name} removed.`
    );
  }

  async function testBrowserCamera(
    camera: CameraDevice
  ) {
    if (
      camera.type !== "browser" ||
      !camera.deviceId
    ) {
      return;
    }

    setCameraError("");
    setCameraMessage("");

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: {
              exact: camera.deviceId,
            },
          },
        });

      const track = stream.getVideoTracks()[0];

      setCameraMessage(
        `${camera.name} is working.`
      );

      track.stop();
    } catch {
      setCameraError(
        `Could not access ${camera.name}.`
      );
    }
  }

  const activeCamera = cameras.find(
    (camera) => camera.id === activeCameraId
  );

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <PageHeader
          title="Settings"
          description="Manage your Agri-Drone system preferences."
        />

        {/* Profile */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-medium">
              Profile
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Your account information.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-white/40">
                Name
              </label>

              <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                Agri-Drone User
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40">
                Role
              </label>

              <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                Agricultural Analyst
              </div>
            </div>
          </div>
        </section>

        {/* Camera Management */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-medium">
                Camera Management
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Connect cameras used for crop monitoring
                and AI analysis.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={requestCameraPermission}
                disabled={loadingCameras}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10 disabled:opacity-50"
              >
                {loadingCameras
                  ? "Refreshing..."
                  : "Refresh Cameras"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowAddCamera(!showAddCamera)
                }
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
              >
                {showAddCamera
                  ? "Cancel"
                  : "Add Camera"}
              </button>
            </div>
          </div>

          {cameraError && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {cameraError}
            </div>
          )}

          {cameraMessage && (
            <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {cameraMessage}
            </div>
          )}

          {/* Add IP Camera */}
          {showAddCamera && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <h3 className="font-medium">
                Add Wireless / IP Camera
              </h3>

              <p className="mt-1 text-sm text-white/40">
                Connect a wireless or IP camera using its
                RTSP, HTTP, or network stream URL. FastAPI
                handles the camera connection and converts
                the stream for the dashboard.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-white/40">
                    Camera Name
                  </label>

                  <input
                    value={cameraName}
                    onChange={(event) =>
                      setCameraName(
                        event.target.value
                      )
                    }
                    placeholder="Drone Camera 1"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40">
                    Stream URL
                  </label>

                  <input
                    value={streamUrl}
                    onChange={(event) =>
                      setStreamUrl(
                        event.target.value
                      )
                    }
                    placeholder="rtsp://192.168.1.50:554/stream"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition focus:border-white/30"
                  />
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-200">
                <strong>How it works:</strong>{" "}
                The camera stream is handled by the
                Agri-Drone FastAPI backend and converted
                into a browser-compatible live stream.
              </div>

              <button
                type="button"
                onClick={addIpCamera}
                disabled={loadingCameras}
                className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
              >
                {loadingCameras
                  ? "Connecting..."
                  : "Add Wireless Camera"}
              </button>
            </div>
          )}

          {/* Camera List */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Available Cameras
              </h3>

              <span className="text-xs text-white/30">
                {cameras.length} camera
                {cameras.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            {cameras.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                <p className="text-sm text-white/50">
                  No cameras detected.
                </p>

                <button
                  type="button"
                  onClick={
                    requestCameraPermission
                  }
                  className="mt-3 text-sm underline underline-offset-4"
                >
                  Allow camera access
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cameras.map((camera) => {
                  const isActive =
                    activeCameraId ===
                    camera.id;

                  return (
                    <div
                      key={camera.id}
                      className={`rounded-2xl border p-4 transition ${
                        isActive
                          ? "border-white/30 bg-white/[0.06]"
                          : "border-white/10 bg-black/10"
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              camera.type === "ip"
                                ? "bg-blue-500/10"
                                : "bg-green-500/10"
                            }`}
                          >
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                camera.type === "ip"
                                  ? "bg-blue-400"
                                  : "bg-green-400"
                              }`}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium">
                                {camera.name}
                              </h4>

                              {isActive && (
                                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] text-green-300">
                                  Active
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-white/40">
                              {camera.type === "ip"
                                ? "Wireless / IP Camera"
                                : "Connected Browser Camera"}
                            </p>

                            {camera.streamUrl && (
                              <p className="mt-1 max-w-md truncate text-xs text-white/30">
                                {camera.streamUrl}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCameraId(
                                  camera.id
                                );

                                setCameraMessage(
                                  `${camera.name} selected.`
                                );
                              }}
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
                            >
                              Use Camera
                            </button>
                          )}

                          {camera.type ===
                            "browser" && (
                            <button
                              type="button"
                              onClick={() =>
                                testBrowserCamera(
                                  camera
                                )
                              }
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
                            >
                              Test
                            </button>
                          )}

                          {camera.type === "ip" &&
                            camera.streamUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCameraId(
                                    camera.id
                                  );

                                  setCameraMessage(
                                    `${camera.name} selected.`
                                  );
                                }}
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
                              >
                                View
                              </button>
                            )}

                          {camera.type === "ip" && (
                            <button
                              type="button"
                              onClick={() =>
                                removeCamera(
                                  camera.id
                                )
                              }
                              className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active IP Camera Stream */}
          {activeCamera &&
            activeCamera.type === "ip" &&
            activeCamera.streamUrl && (
              <div className="mt-6">
                <CameraTest
                  cameraUrl={
                    activeCamera.streamUrl
                  }
                />
              </div>
            )}

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-5 text-white/40">
            <strong className="text-white/60">
              Current status:
            </strong>{" "}
            Browser cameras can be detected and tested.
            Wireless/IP cameras are connected through
            the FastAPI camera service and can be streamed
            through the dashboard.
          </div>
        </section>

        {/* Appearance */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-medium">
              Appearance
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Customize how the dashboard looks.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
            <div>
              <p className="text-sm font-medium">
                Dark mode
              </p>

              <p className="mt-1 text-xs text-white/40">
                Use the dark dashboard interface.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setDarkMode(!darkMode)
              }
              className={`relative h-6 w-11 rounded-full transition ${
                darkMode
                  ? "bg-white"
                  : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full transition ${
                  darkMode
                    ? "left-6 bg-black"
                    : "left-1 bg-white"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-medium">
              Notifications
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Choose which system notifications you want
              to receive.
            </p>
          </div>

          <div className="space-y-3">
            <ToggleRow
              title="Email notifications"
              description="Receive important system notifications."
              enabled={emailNotifications}
              onChange={() =>
                setEmailNotifications(
                  !emailNotifications
                )
              }
            />

            <ToggleRow
              title="Analysis notifications"
              description="Receive notifications when AI analysis is completed."
              enabled={analysisNotifications}
              onChange={() =>
                setAnalysisNotifications(
                  !analysisNotifications
                )
              }
            />
          </div>
        </section>

        {/* AI System */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-medium">
              AI System
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Current AI services connected to the
              dashboard.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <InfoRow
              label="Crop Detection"
              value="mangethev1"
            />

            <InfoRow
              label="Disease Segmentation"
              value="cabbage_seg_v2"
            />

            <InfoRow
              label="Processing"
              value="FastAPI + YOLO"
            />

            <InfoRow
              label="API Status"
              value="Connected"
            />
          </div>
        </section>

        {/* Security */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-medium">
              Security
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Security and account settings.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-sm font-medium">
              Authentication
            </p>

            <p className="mt-1 text-xs text-white/40">
              Persistent authentication will be connected
              to the backend when user accounts are
              implemented.
            </p>
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              setCameraMessage(
                "Settings saved for this session."
              )
            }
            className="rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}

interface ToggleRowProps {
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}

function ToggleRow({
  title,
  description,
  enabled,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 text-xs text-white/40">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onChange}
        className={`relative h-6 w-11 rounded-full transition ${
          enabled
            ? "bg-white"
            : "bg-white/20"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full transition ${
            enabled
              ? "left-6 bg-black"
              : "left-1 bg-white"
          }`}
        />
      </button>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({
  label,
  value,
}: InfoRowProps) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <p className="text-xs text-white/40">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}