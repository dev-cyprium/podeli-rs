"use client";

import { Menu } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";
import { DashboardBreadcrumbs } from "./DashboardBreadcrumbs";

interface DashboardHeaderProps {
  mode: "podeli" | "zakupi";
  onModeChange: (mode: "podeli" | "zakupi") => void;
  onMenuClick?: () => void;
}

export function DashboardHeader({
  mode,
  onModeChange,
  onMenuClick,
}: DashboardHeaderProps) {
  const breadcrumbs = [
    "Kontrolna tabla",
    mode === "podeli" ? "Predmeti" : "Zakupi",
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      {onMenuClick && (
        <>
          <button
            type="button"
            onClick={onMenuClick}
            className="-m-2.5 p-2.5 text-slate-700 hover:text-slate-900 lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          {/* Separator */}
          <div
            aria-hidden="true"
            className="h-6 w-px bg-slate-200 lg:hidden"
          />
        </>
      )}

      <div className="flex flex-1 items-center justify-between gap-x-4 self-stretch lg:gap-x-6">
        <DashboardBreadcrumbs items={breadcrumbs} />

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="rounded-full bg-slate-100 p-1">
            <div className="flex">
              <button
                onClick={() => onModeChange("podeli")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm",
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
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm",
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
