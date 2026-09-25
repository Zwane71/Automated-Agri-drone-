"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";

export default function SettingsPage() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(true);
  const [emailNotifications, setEmailNotifications] =
    useState(true);
  const [analysisNotifications, setAnalysisNotifications] =
    useState(true);

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
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-medium">
                Camera Management
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-white/40">
                Manage connected cameras, select the active
                input, test connections, and monitor live
                camera feeds.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/camera")}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Manage Cameras
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-green-400" />

              <div>
                <p className="text-sm font-medium">
                  Camera settings are managed from the
                  Camera page.
                </p>

                <p className="mt-1 text-xs leading-5 text-white/40">
                  Use the Camera page to add cameras,
                  select the active input, test connections,
                  start or stop monitoring, and view the
                  live feed.
                </p>
              </div>
            </div>
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
              onClick={() => setDarkMode(!darkMode)}
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