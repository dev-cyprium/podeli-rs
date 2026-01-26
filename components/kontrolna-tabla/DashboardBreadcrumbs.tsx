"use client";

import { ChevronRight } from "lucide-react";

interface DashboardBreadcrumbsProps {
  items: string[];
}

export function DashboardBreadcrumbs({ items }: DashboardBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center gap-2">
          <span className={index === items.length - 1 ? "text-slate-900" : ""}>
            {item}
          </span>
          {index < items.length - 1 ? (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          ) : null}
        </span>
      ))}
    </nav>
  );
}
