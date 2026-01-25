"use client";

import { HeartHandshake } from "lucide-react";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  mode: "podeli" | "zakupi";
  onModeChange: (mode: "podeli" | "zakupi") => void;
}

export function DashboardHeader({ mode, onModeChange }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-amber-200">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <span className="hidden text-xl font-bold tracking-tight text-slate-900 sm:block">
            PODELI.rs
          </span>
        </Link>

        {/* Mode Toggle */}
        <div className="rounded-full bg-stone-100 p-1">
          <div className="flex">
            <button
              onClick={() => onModeChange("podeli")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                mode === "podeli"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Podeli
            </button>
            <button
              onClick={() => onModeChange("zakupi")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                mode === "zakupi"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Zakupi
            </button>
          </div>
        </div>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}
