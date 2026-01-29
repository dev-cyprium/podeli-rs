"use client";

import { Menu } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { DashboardBreadcrumbs } from "@/components/kontrolna-tabla/DashboardBreadcrumbs";
import { Button } from "@/components/ui/button";

interface SuperAdminHeaderProps {
  onMenuClick?: () => void;
}

export function SuperAdminHeader({ onMenuClick }: SuperAdminHeaderProps) {
  const breadcrumbs = ["Super admin", "Kuponi"];

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-podeli-light/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
      {onMenuClick && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="-m-2.5 p-2.5 text-muted-foreground hover:text-podeli-dark lg:hidden"
          >
            <span className="sr-only">Otvori meni</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>
          <div
            aria-hidden="true"
            className="h-6 w-px bg-border lg:hidden"
          />
        </>
      )}
      <div className="flex flex-1 items-center justify-between gap-x-4 self-stretch lg:gap-x-6">
        <DashboardBreadcrumbs items={breadcrumbs} />
        <UserMenu />
      </div>
    </header>
  );
}
