"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ModeSelector } from "./ModeSelector";

export function KontrolnaTablaContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(
    api.profiles.getMyProfile,
    isAuthenticated ? {} : "skip",
  );

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (profile === undefined) return; // still loading

    const mode = profile?.defaultDashboardMode;
    if (mode === "podeli") {
      router.replace("/kontrolna-tabla/predmeti");
    } else if (mode === "zakupi") {
      router.replace("/kontrolna-tabla/zakupi");
    }
  }, [isLoading, isAuthenticated, profile, router]);

  // Show spinner while checking for redirect
  if (isLoading || (isAuthenticated && profile === undefined)) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-podeli-accent border-t-transparent" />
      </div>
    );
  }

  // If authenticated and has preference, keep showing spinner (redirect is in progress)
  if (isAuthenticated && profile?.defaultDashboardMode) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-podeli-accent border-t-transparent" />
      </div>
    );
  }

  return <ModeSelector />;
}
