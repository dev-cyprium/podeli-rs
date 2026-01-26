"use client";

import {
  HeartHandshake,
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
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 lg:h-screen lg:w-64">
      <div className="mb-8 flex items-center justify-between px-2">
        <Link href="/" className="flex items-center gap-3" onClick={onClose}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-amber-200">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <span className="text-lg font-semibold text-slate-900">
            PODELI.rs
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                    ? "bg-amber-50 text-amber-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  isDisabled && "cursor-not-allowed opacity-50",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {isDisabled ? (
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
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
