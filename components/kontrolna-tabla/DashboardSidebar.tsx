"use client";

import {
  Package,
  MessageSquare,
  Star,
  History,
  ChevronLeft,
  X,
  Crown,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Context: podeli (owner/sharing) or zakupi (renter)
type Context = "podeli" | "zakupi";

// Section within each context
type Section = "main" | "poruke" | "ocene" | "istorija";

interface DashboardSidebarProps {
  context: Context;
  section: Section;
  onResetMode: () => void;
  onClose?: () => void;
}

type NavItem = {
  id: Section;
  label: string;
  icon: LucideIcon;
  href: string;
  disabled?: boolean;
  showBadge?: boolean;
};

function PlanIndicator() {
  const limits = useQuery(api.profiles.getMyPlanLimits);

  if (!limits) return null;

  const isLifetime = limits.planSlug === "lifetime";

  return (
    <div className="mt-6 px-2">
      <Link
        href="/planovi"
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
      >
        {isLifetime ? (
          <Crown className="h-4 w-4 text-[#f0a202]" />
        ) : (
          <div className="h-4 w-4 rounded-full bg-muted" />
        )}
        <div className="flex-1">
          <p className="text-xs font-semibold text-[#02020a]">{limits.planName}</p>
          {limits.hasBadge && limits.badgeLabel && (
            <p className="text-[10px] font-bold text-[#f0a202]">{limits.badgeLabel}</p>
          )}
        </div>
      </Link>
    </div>
  );
}

function UnreadMessagesBadge() {
  const unreadCount = useQuery(api.messages.getUnreadCount);

  if (!unreadCount || unreadCount === 0) return null;

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-podeli-accent px-1.5 text-[10px] font-semibold text-podeli-dark">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}

export function DashboardSidebar({
  context,
  section,
  onResetMode,
  onClose,
}: DashboardSidebarProps) {
  // Define nav items for each context
  const podeliItems: NavItem[] = [
    { id: "main", label: "Predmeti", icon: Package, href: "/kontrolna-tabla/predmeti" },
    { id: "poruke", label: "Poruke", icon: MessageSquare, href: "/kontrolna-tabla/predmeti/poruke", showBadge: true },
    { id: "ocene", label: "Ocene", icon: Star, href: "/kontrolna-tabla/predmeti/ocene", disabled: true },
    { id: "istorija", label: "Istorija", icon: History, href: "/kontrolna-tabla/predmeti/istorija", disabled: true },
  ];

  const zakupiItems: NavItem[] = [
    { id: "main", label: "Zakupi", icon: ShoppingBag, href: "/kontrolna-tabla/zakupi" },
    { id: "poruke", label: "Poruke", icon: MessageSquare, href: "/kontrolna-tabla/zakupi/poruke", showBadge: true },
    { id: "ocene", label: "Ocene", icon: Star, href: "/kontrolna-tabla/zakupi/ocene" },
    { id: "istorija", label: "Istorija", icon: History, href: "/kontrolna-tabla/zakupi/istorija", disabled: true },
  ];

  const navItems = context === "podeli" ? podeliItems : zakupiItems;

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-border bg-card px-4 py-6 lg:h-screen lg:w-64">
      <div className="mb-8 flex items-center justify-between px-2">
        <Logo href="/" height={28} onClick={onClose} />
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-podeli-dark lg:hidden"
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {context === "podeli" ? "Podeli" : "Zakupi"}
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.id === section;
            const isDisabled = item.disabled ?? false;
            const Icon = item.icon;

            if (isDisabled) {
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  disabled
                  className="flex h-auto w-full cursor-not-allowed items-center justify-start gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground opacity-50"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Uskoro
                  </span>
                </Button>
              );
            }

            return (
              <Button
                key={item.id}
                variant="ghost"
                asChild
                className={cn(
                  "flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-podeli-accent/10 text-podeli-accent hover:bg-podeli-accent/10"
                    : "text-muted-foreground hover:bg-muted hover:text-podeli-dark"
                )}
              >
                <Link href={item.href} onClick={onClose}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.showBadge && <UnreadMessagesBadge />}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>

      {context === "podeli" && <PlanIndicator />}

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
