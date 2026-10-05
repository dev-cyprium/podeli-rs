"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useEnsureProfile() {
  const { userId } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.profiles.getMyProfile,
    isAuthenticated ? {} : "skip",
  );
  const ensureProfile = useMutation(api.profiles.ensureProfile);
  const calledForUser = useRef<string | null>(null);

  useEffect(() => {
    if (
      isAuthenticated &&
      userId &&
      profile === null &&
      calledForUser.current !== userId
    ) {
      calledForUser.current = userId;
      ensureProfile().catch(() => {
        calledForUser.current = null;
      });
    }
  }, [isAuthenticated, userId, profile, ensureProfile]);
}
