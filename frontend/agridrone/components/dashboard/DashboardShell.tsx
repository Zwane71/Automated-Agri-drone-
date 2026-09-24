"use client";

import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#07120e] text-white">
      <Sidebar
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
      />

      <MobileHeader
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
      />

      <main className="lg:ml-64">
        <div className="min-h-screen pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}