"use client";

import { useRouter } from "next/navigation";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardShellProps {
  mode: "podeli" | "zakupi";
  children: React.ReactNode;
}

export function DashboardShell({ mode, children }: DashboardShellProps) {
  const router = useRouter();

  function handleModeChange(nextMode: "podeli" | "zakupi") {
    if (nextMode === "podeli") {
      router.push("/kontrolna-tabla/predmeti");
      return;
    }
    router.push("/kontrolna-tabla/zakupi");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="flex">
        <DashboardSidebar
          mode={mode}
          onModeChange={handleModeChange}
          onResetMode={() => router.push("/kontrolna-tabla")}
        />
        <div className="flex-1">
          <DashboardHeader mode={mode} onModeChange={handleModeChange} />
          <main className="px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
