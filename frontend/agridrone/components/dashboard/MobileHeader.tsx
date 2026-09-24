"use client";

import { Menu } from "lucide-react";

interface MobileHeaderProps {
  mobileMenu: boolean;
  setMobileMenu: (value: boolean) => void;
}

export default function MobileHeader({
  setMobileMenu,
}: MobileHeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center border-b border-white/10 bg-[#081510]/95 px-5 backdrop-blur lg:hidden">
      <button
        onClick={() => setMobileMenu(true)}
        className="rounded-lg p-2 text-white/60 hover:bg-white/5"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-3">
        <p className="font-semibold">AgriDrone</p>
      </div>
    </header>
  );
}