"use client";

import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { TimeTravelWidget } from "@/components/debug/TimeTravelWidget";
import { cn } from "@/lib/utils";
import { DashboardBreadcrumbs } from "./DashboardBreadcrumbs";
import { Button } from "@/components/ui/button";

// Context: podeli (owner/sharing) or zakupi (renter)
type Context = "podeli" | "zakupi";

// Section within each context
type Section = "main" | "poruke" | "ocene" | "istorija";

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
  istorija: { podeli: "Istorija", zakupi: "Istorija" },
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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-podeli-light/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      {onMenuClick && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="-m-2.5 p-2.5 text-muted-foreground hover:text-podeli-dark lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>
          {/* Separator */}
          <div
            aria-hidden="true"
            className="h-6 w-px bg-border lg:hidden"
          />
        </>
      )}

      <div className="flex flex-1 items-center justify-between gap-x-4 self-stretch lg:gap-x-6">
        <DashboardBreadcrumbs items={breadcrumbs} />

        <div className="flex items-center gap-2 sm:gap-4">
          <TimeTravelWidget />
          <div className="rounded-full bg-muted p-1">
            <div className="flex">
              <Button
                variant="ghost"
                onClick={() => onContextChange("podeli")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm",
                  context === "podeli"
                    ? "bg-podeli-accent text-podeli-dark shadow-sm hover:bg-podeli-accent"
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
                    ? "bg-podeli-accent text-podeli-dark shadow-sm hover:bg-podeli-accent"
                    : "text-muted-foreground hover:text-podeli-dark"
                )}
              >
                Zakupi
              </Button>
            </div>
          </div>
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
