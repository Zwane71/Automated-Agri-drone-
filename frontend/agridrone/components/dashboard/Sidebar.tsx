"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FileText,
  LayoutDashboard,
  Map,
  Plane,
  ScanLine,
  Settings,
  Sprout,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileMenu: boolean;
  setMobileMenu: (value: boolean) => void;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/home",
    icon: LayoutDashboard,
  },
  {
    name: "Missions",
    href: "/missions",
    icon: Plane,
  },
  {
    name: "AI Analysis",
    href: "/analysis",
    icon: ScanLine,
  },
  {
    name: "Fields",
    href: "/fields",
    icon: Map,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar({
  mobileMenu,
  setMobileMenu,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-64
          border-r border-white/10
          bg-[#081510]
          transition-transform duration-300
          ${mobileMenu ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Sprout className="h-5 w-5 text-emerald-400" />
              </div>

              <div>
                <p className="font-semibold">AgriDrone</p>
                <p className="text-xs text-white/35">
                  AI Agriculture
                </p>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenu(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5 text-white/50" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className={`
                    flex items-center gap-3 rounded-xl px-4 py-3
                    text-sm transition
                    ${
                      active
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Connection */}
          <div className="border-t border-white/10 p-4">
            <div className="rounded-xl bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-xs text-white/50">
                  AI System Online
                </span>
              </div>

              <p className="mt-2 text-xs text-white/25">
                AgriDrone AI Engine
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}