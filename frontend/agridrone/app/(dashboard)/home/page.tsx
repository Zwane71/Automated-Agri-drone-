"use client";

import {
  Activity,
  BatteryMedium,
  Camera,
  ChevronRight,
  CircleAlert,
  Crosshair,
  Gauge,
  LayoutDashboard,
  Map,
  Menu,
  Plane,
  ScanLine,
  Settings,
  Sprout,
  X,
} from "lucide-react";
import { useState } from "react";

const stats = [
  {
    label: "Crops Detected",
    value: "247",
    change: "+12 today",
    icon: Sprout,
  },
  {
    label: "Diseased Crops",
    value: "32",
    change: "13.0% of field",
    icon: CircleAlert,
  },
  {
    label: "Field Coverage",
    value: "1.8 ha",
    change: "82% scanned",
    icon: ScanLine,
  },
  {
    label: "Flight Time",
    value: "18:42",
    change: "Current mission",
    icon: Plane,
  },
];

const diseases = [
  {
    name: "Alternaria Leaf Spot",
    count: 14,
    percentage: 44,
  },
  {
    name: "Black Rot",
    count: 10,
    percentage: 31,
  },
  {
    name: "Downy Mildew",
    count: 8,
    percentage: 25,
  },
];

const scans = [
  {
    time: "14:24",
    area: "North Field",
    crops: 84,
    diseases: 11,
    status: "Complete",
  },
  {
    time: "14:11",
    area: "East Field",
    crops: 71,
    diseases: 8,
    status: "Complete",
  },
  {
    time: "13:56",
    area: "South Field",
    crops: 92,
    diseases: 13,
    status: "Complete",
  },
];

export default function DashboardPage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <main className="min-h-screen bg-[#08110d] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10
            bg-[#0b1712] p-5 transition-transform duration-300
            lg:static lg:translate-x-0
            ${mobileMenu ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                <Plane className="h-5 w-5 text-emerald-400" />
              </div>

              <div>
                <h1 className="font-semibold tracking-tight">
                  Agri<span className="text-emerald-400">Drone</span>
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  AI Agriculture
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenu(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5 text-white/60" />
            </button>
          </div>

          <nav className="mt-10 space-y-2">
            <NavItem
              icon={<LayoutDashboard />}
              label="Dashboard"
              active
            />

            <NavItem
              icon={<Plane />}
              label="Missions"
            />

            <NavItem
              icon={<ScanLine />}
              label="AI Analysis"
            />

            <NavItem
              icon={<Map />}
              label="Fields"
            />

            <NavItem
              icon={<Activity />}
              label="Reports"
            />
          </nav>

          <div className="absolute bottom-5 left-5 right-5">
            <NavItem
              icon={<Settings />}
              label="Settings"
            />
          </div>
        </aside>

        {/* Main */}
        <section className="min-w-0 flex-1">
          {/* Header */}
          <header className="flex h-20 items-center justify-between border-b border-white/10 px-5 md:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenu(true)}
                className="lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div>
                <p className="text-sm text-white/40">
                  Wednesday, September 23, 2026
                </p>

                <h2 className="text-xl font-semibold">
                  Field Monitoring
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>

              <span className="hidden text-sm text-emerald-300 sm:block">
                Drone Connected
              </span>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            {/* Mission bar */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center">
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-400">
                  Active Mission
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  Field A — Cabbage Monitoring
                </h3>

                <p className="mt-1 text-sm text-white/40">
                  AI crop detection and disease analysis in progress
                </p>
              </div>

              <button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-medium text-black transition hover:bg-emerald-400">
                <Crosshair className="h-4 w-4" />
                View Mission
              </button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="rounded-xl bg-emerald-500/10 p-2.5">
                        <Icon className="h-5 w-5 text-emerald-400" />
                      </div>

                      <span className="text-xs text-emerald-400">
                        Live
                      </span>
                    </div>

                    <p className="mt-5 text-sm text-white/40">
                      {stat.label}
                    </p>

                    <p className="mt-1 text-3xl font-semibold tracking-tight">
                      {stat.value}
                    </p>

                    <p className="mt-2 text-xs text-white/35">
                      {stat.change}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Map + drone status */}
            <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <div>
                    <h3 className="font-semibold">Live Field Map</h3>
                    <p className="text-xs text-white/40">
                      Real-time drone position
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                    GPS Active
                  </span>
                </div>

                {/* Map */}
                <div className="relative h-[360px] overflow-hidden bg-[#102018]">
                  {/* Field lines */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="grid h-full w-full grid-cols-8 grid-rows-6">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div
                          key={i}
                          className="border border-emerald-400/20"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Field boundary */}
                  <div className="absolute left-[15%] top-[18%] h-[62%] w-[65%] rounded-[30%] border-2 border-emerald-400/60 bg-emerald-500/5" />

                  {/* Flight path */}
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 25 75 C 35 60, 20 45, 35 30 S 65 20, 75 35 S 70 60, 55 70 S 35 80, 25 75"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.6"
                      strokeDasharray="2 2"
                      className="text-emerald-400"
                    />
                  </svg>

                  {/* Crop markers */}
                  {[
                    [30, 35],
                    [42, 28],
                    [55, 40],
                    [65, 30],
                    [35, 55],
                    [50, 60],
                    [68, 55],
                    [58, 72],
                  ].map(([left, top], i) => (
                    <div
                      key={i}
                      className="absolute h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                      }}
                    />
                  ))}

                  {/* Drone */}
                  <div className="absolute left-[53%] top-[48%] flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-300 bg-emerald-400/20 shadow-[0_0_30px_rgba(52,211,153,0.35)]">
                    <Plane className="h-5 w-5 text-emerald-300" />
                  </div>

                  <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/40 px-3 py-2 backdrop-blur">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">
                      Current Position
                    </p>
                    <p className="mt-1 text-xs">
                      -29.3151, 27.4869
                    </p>
                  </div>
                </div>
              </div>

              {/* Drone status */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Drone Status</h3>

                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                    Online
                  </span>
                </div>

                <div className="mt-6 space-y-5">
                  <StatusRow
                    label="Battery"
                    value="82%"
                    icon={<BatteryMedium />}
                  />

                  <StatusRow
                    label="Altitude"
                    value="42 m"
                    icon={<Gauge />}
                  />

                  <StatusRow
                    label="Speed"
                    value="8.4 m/s"
                    icon={<Plane />}
                  />

                  <StatusRow
                    label="Signal"
                    value="Strong"
                    icon={<Activity />}
                  />
                </div>

                <div className="mt-8 rounded-xl bg-black/20 p-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">
                      Battery
                    </span>

                    <span className="text-emerald-400">
                      82%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[82%] rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Camera + disease */}
            <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
              {/* Camera */}
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <div>
                    <h3 className="font-semibold">
                      Live AI Camera
                    </h3>

                    <p className="text-xs text-white/40">
                      Crop and disease detection
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <Camera className="h-4 w-4" />
                    AI Scanning
                  </div>
                </div>

                <div className="relative h-[330px] overflow-hidden bg-[#17251b]">
                  {/* Simulated aerial field */}
                  <div className="absolute inset-0 opacity-80">
                    <div className="grid h-full grid-cols-7 gap-1 p-5">
                      {Array.from({ length: 35 }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full border border-emerald-300/20 bg-emerald-500/10"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Detection boxes */}
                  <DetectionBox
                    className="left-[16%] top-[25%] h-[80px] w-[100px]"
                    label="Cabbage 84%"
                  />

                  <DetectionBox
                    className="left-[47%] top-[35%] h-[95px] w-[110px]"
                    label="Cabbage 79%"
                  />

                  <DetectionBox
                    className="left-[68%] top-[20%] h-[75px] w-[100px]"
                    label="Black Rot 62%"
                    disease
                  />

                  <DetectionBox
                    className="left-[30%] top-[62%] h-[70px] w-[95px]"
                    label="Cabbage 91%"
                  />

                  <div className="absolute bottom-4 left-4 rounded-lg bg-black/50 px-3 py-2 text-xs backdrop-blur">
                    <span className="text-emerald-400">
                      ●
                    </span>{" "}
                    Processing live image
                  </div>
                </div>
              </div>

              {/* Disease */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Disease Analysis
                    </h3>

                    <p className="text-xs text-white/40">
                      Current mission
                    </p>
                  </div>

                  <span className="text-2xl font-semibold">
                    32
                  </span>
                </div>

                <div className="mt-7 space-y-6">
                  {diseases.map((disease) => (
                    <div key={disease.name}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">
                          {disease.name}
                        </span>

                        <span className="text-sm font-medium">
                          {disease.count}
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{
                            width: `${disease.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40">
                      Field health
                    </span>

                    <span className="text-lg font-semibold text-emerald-400">
                      87%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent scans */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <h3 className="font-semibold">
                    Recent AI Scans
                  </h3>

                  <p className="text-xs text-white/40">
                    Latest field analysis
                  </p>
                </div>

                <button className="flex items-center gap-1 text-sm text-emerald-400">
                  View all
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/30">
                      <th className="px-5 py-4">Time</th>
                      <th className="px-5 py-4">Area</th>
                      <th className="px-5 py-4">Crops</th>
                      <th className="px-5 py-4">Diseases</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {scans.map((scan) => (
                      <tr
                        key={scan.time}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-5 py-4 text-sm">
                          {scan.time}
                        </td>

                        <td className="px-5 py-4 text-sm text-white/60">
                          {scan.area}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {scan.crops}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {scan.diseases}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                            {scan.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
        active
          ? "bg-emerald-500/10 text-emerald-400"
          : "text-white/45 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="[&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>

      {label}
    </button>
  );
}

function StatusRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-white/30 [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>

        <span className="text-sm text-white/50">
          {label}
        </span>
      </div>

      <span className="text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

function DetectionBox({
  className,
  label,
  disease = false,
}: {
  className: string;
  label: string;
  disease?: boolean;
}) {
  return (
    <div
      className={`absolute border-2 ${
        disease
          ? "border-red-400"
          : "border-emerald-400"
      } ${className}`}
    >
      <span
        className={`absolute -top-6 left-0 whitespace-nowrap rounded px-2 py-1 text-[10px] ${
          disease
            ? "bg-red-400 text-black"
            : "bg-emerald-400 text-black"
        }`}
      >
        {label}
      </span>
    </div>
  );
}