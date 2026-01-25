"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

export type DashboardMode = "podeli" | "zakupi" | null;

const STORAGE_KEY = "podeli-dashboard-mode";

export function useDashboardMode() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasInitialized = useRef(false);

  const urlMode = searchParams.get("mode") as DashboardMode;

  // Initialize mode from localStorage on first render (only runs once)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // If URL already has a mode, save it to localStorage
    if (urlMode === "podeli" || urlMode === "zakupi") {
      localStorage.setItem(STORAGE_KEY, urlMode);
      return;
    }

    // Check localStorage for saved mode and redirect if found
    const savedMode = localStorage.getItem(STORAGE_KEY) as DashboardMode;
    if (savedMode === "podeli" || savedMode === "zakupi") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", savedMode);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [urlMode, searchParams, router, pathname]);

  const mode: DashboardMode =
    urlMode === "podeli" || urlMode === "zakupi" ? urlMode : null;

  const selectMode = useCallback(
    (newMode: "podeli" | "zakupi") => {
      localStorage.setItem(STORAGE_KEY, newMode);
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", newMode);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const clearMode = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    router.push(pathname);
  }, [router, pathname]);

  return { mode, selectMode, clearMode };
}
