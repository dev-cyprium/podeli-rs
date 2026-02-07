"use client";

import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";
import { DashboardBreadcrumbs } from "./DashboardBreadcrumbs";
import { Button } from "@/components/ui/button";

// Context: podeli (owner/sharing) or zakupi (renter)
type Context = "podeli" | "zakupi";

// Section within each context
type Section = "main" | "poruke" | "ocene" | "omiljeno";

interface DashboardHeaderProps {
  context: Context;
  section: Section;
  onContextChange: (context: Context) => void;
  onMenuClick?: () => void;
}

const sectionLabels: Record<Section, Record<Context, string>> = {
  main: { podeli: "Predmeti", zakupi: "Zakupi" },
  poruke: { podeli: "Poruke", zakupi: "Poruke" },
  ocene: { podeli: "Ocene predmeta", zakupi: "Moje ocene" },
  omiljeno: { podeli: "Omiljeno", zakupi: "Omiljeno" },
};

export function DashboardHeader({
  context,
  section,
  onContextChange,
  onMenuClick,
}: DashboardHeaderProps) {
  const breadcrumbs = [
    "Kontrolna tabla",
    sectionLabels[section][context],
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-border bg-podeli-light/80 px-4 shadow-sm backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left section: menu button + breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="-ml-2 text-muted-foreground hover:text-podeli-dark lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>
        )}
        <DashboardBreadcrumbs items={breadcrumbs} />
      </div>

      {/* Center section: context toggle */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <div className="rounded-full bg-muted p-1">
          <div className="flex">
            <Button
              variant="ghost"
              onClick={() => onContextChange("podeli")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm",
                context === "podeli"
                  ? "bg-podeli-accent text-white shadow-sm hover:bg-podeli-accent"
                  : "text-muted-foreground hover:text-podeli-dark"
              )}
            >
              Podeli
            </Button>
            <Button
              variant="ghost"
              onClick={() => onContextChange("zakupi")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm",
                context === "zakupi"
                  ? "bg-podeli-accent text-white shadow-sm hover:bg-podeli-accent"
                  : "text-muted-foreground hover:text-podeli-dark"
              )}
            >
              Zakupi
            </Button>
          </div>
        </div>
      </div>

      {/* Right section: notifications + user menu */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
