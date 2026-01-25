"use client";

import { Suspense } from "react";
import { useDashboardMode } from "@/lib/hooks/useDashboardMode";
import { ModeSelector } from "./_components/ModeSelector";
import { DashboardHeader } from "./_components/DashboardHeader";
import { PodeliEmptyState } from "./_components/PodeliEmptyState";
import { ZakupiEmptyState } from "./_components/ZakupiEmptyState";

function DashboardContent() {
  const { mode, selectMode } = useDashboardMode();

  // No mode selected - show selector
  if (mode === null) {
    return (
      <div className="min-h-screen bg-stone-50">
        <ModeSelector onSelectMode={selectMode} />
      </div>
    );
  }

  // Mode selected - show header + content
  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardHeader mode={mode} onModeChange={selectMode} />
      {mode === "podeli" ? <PodeliEmptyState /> : <ZakupiEmptyState />}
    </div>
  );
}

export default function KontrolnaTablaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stone-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
