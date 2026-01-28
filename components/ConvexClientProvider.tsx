"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { useEnsureProfile } from "@/hooks/useEnsureProfile";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ProfileEnsurer({ children }: { children: React.ReactNode }) {
  useEnsureProfile();
  return <>{children}</>;
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <ProfileEnsurer>{children}</ProfileEnsurer>
    </ConvexProviderWithClerk>
  );
}
