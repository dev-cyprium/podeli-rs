"use client";

import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";
import { DashboardBreadcrumbs } from "./DashboardBreadcrumbs";

interface DashboardHeaderProps {
  mode: "podeli" | "zakupi";
  onModeChange: (mode: "podeli" | "zakupi") => void;
}

export function DashboardHeader({ mode, onModeChange }: DashboardHeaderProps) {
  const breadcrumbs = [
    "Kontrolna tabla",
    mode === "podeli" ? "Predmeti" : "Zakupi",
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4">
        <DashboardBreadcrumbs items={breadcrumbs} />

        <div className="flex items-center gap-4">
          <div className="rounded-full bg-slate-100 p-1">
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
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
