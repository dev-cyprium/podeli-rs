"use client";

import { useAuth } from "@clerk/nextjs";
import { NotificationBell } from "./NotificationBell";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";

export function NavAuthActions() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <span
        role="status"
        aria-label="Učitavanje naloga"
        className="h-9 w-24 animate-pulse rounded-xl bg-muted"
      />
    );
  }

  return isSignedIn ? (
    <>
      <NotificationBell />
      <UserMenu />
    </>
  ) : (
    <SignInButton />
  );
}
