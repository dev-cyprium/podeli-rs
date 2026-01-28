"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useEnsureProfile() {
  const { isSignedIn } = useAuth();
  const profile = useQuery(api.profiles.getMyProfile);
  const ensureProfile = useMutation(api.profiles.ensureProfile);
  const calledRef = useRef(false);

  useEffect(() => {
    if (isSignedIn && profile === null && !calledRef.current) {
      calledRef.current = true;
      ensureProfile().catch(() => {
        calledRef.current = false;
      });
    }
  }, [isSignedIn, profile, ensureProfile]);
}
