"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { BackgroundPattern } from "./BackgroundPattern";

// Context: podeli (owner/sharing) or zakupi (renter)
type Context = "podeli" | "zakupi";

// Section within each context
type Section = "main" | "poruke" | "ocene" | "istorija";

interface DashboardShellProps {
  context: Context;
  section: Section;
  children: React.ReactNode;
}

export function DashboardShell({ context, section, children }: DashboardShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleContextChange(nextContext: Context) {
    if (nextContext === "podeli") {
      router.push("/kontrolna-tabla/predmeti");
    } else {
      router.push("/kontrolna-tabla/zakupi");
    }
  }

  return (
    <div className="min-h-screen">
      <BackgroundPattern />
      {/* Mobile sidebar - slides in from left */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          accessibleTitle="Navigacija"
          className="w-64 border-r p-0"
        >
          <DashboardSidebar
            context={context}
            section={section}
            onResetMode={() => {
              router.push("/kontrolna-tabla");
              setSidebarOpen(false);
            }}
            onClose={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop static sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <DashboardSidebar
          context={context}
          section={section}
          onResetMode={() => router.push("/kontrolna-tabla")}
        />
      </div>

      {/* Main content area */}
      <div className="lg:pl-64">
        <DashboardHeader
          context={context}
          section={section}
          onContextChange={handleContextChange}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
