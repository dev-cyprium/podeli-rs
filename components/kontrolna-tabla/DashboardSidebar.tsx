"use client";

import {
  Package,
  MessageSquare,
  Star,
  History,
  ChevronLeft,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

interface DashboardSidebarProps {
  mode: "podeli" | "zakupi";
  onModeChange: (mode: "podeli" | "zakupi") => void;
  onResetMode: () => void;
  onClose?: () => void;
}

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  mode?: "podeli" | "zakupi";
};

const baseItems: NavItem[] = [
  { id: "poruke", label: "Poruke", icon: MessageSquare, disabled: true },
  { id: "ocene", label: "Ocene", icon: Star, disabled: true },
  { id: "istorija", label: "Istorija", icon: History, disabled: true },
];

export function DashboardSidebar({
  mode,
  onModeChange,
  onResetMode,
  onClose,
}: DashboardSidebarProps) {
  const navItems: NavItem[] =
    mode === "podeli"
      ? [
          {
            id: "predmeti",
            label: "Predmeti",
            icon: Package,
            mode: "podeli",
          },
          ...baseItems,
        ]
      : [
          {
            id: "zakupi",
            label: "Zakupi",
            icon: Package,
            mode: "zakupi",
          },
          ...baseItems,
        ];

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-border bg-card px-4 py-6 lg:h-screen lg:w-64">
      <div className="mb-8 flex items-center justify-between px-2">
        <Logo href="/" height={28} onClick={onClose} />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-podeli-dark lg:hidden"
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Navigacija
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.mode === mode;
            const isDisabled = item.disabled ?? false;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.mode) {
                    onModeChange(item.mode);
                  }
                }}
                disabled={isDisabled}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-podeli-accent/10 text-podeli-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-podeli-dark",
                  isDisabled && "cursor-not-allowed opacity-50",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {isDisabled ? (
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Uskoro
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto px-2 pt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onResetMode}
          className="w-full justify-start gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Promeni režim
        </Button>
      </div>
    </aside>
  );
}
