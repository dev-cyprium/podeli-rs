"use client";

import { Ticket, X, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

interface SuperAdminSidebarProps {
  onClose?: () => void;
}

export function SuperAdminSidebar({ onClose }: SuperAdminSidebarProps) {
  const pathname = usePathname();

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
            <span className="sr-only">Zatvori meni</span>
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>
      <nav className="space-y-1">
        <Link
          href="/super-admin"
          onClick={onClose}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
            pathname === "/super-admin"
              ? "bg-podeli-accent/10 text-podeli-accent"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Ticket className="h-4 w-4" />
          <span>Kuponi</span>
        </Link>
        <Link
          href="/super-admin/funkcije"
          onClick={onClose}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
            pathname === "/super-admin/funkcije"
              ? "bg-podeli-accent/10 text-podeli-accent"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Zap className="h-4 w-4" />
          <span>Funkcije</span>
        </Link>
      </nav>
    </aside>
  );
}
