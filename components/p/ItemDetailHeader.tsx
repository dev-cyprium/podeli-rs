"use client";

import { useAuth } from "@clerk/nextjs";
import { UserMenu } from "@/components/UserMenu";
import { SignInButton } from "@/components/SignInButton";
import { Logo } from "@/components/Logo";

export function ItemDetailHeader() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-podeli-light/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Logo href="/" height={32} />
        <div className="flex items-center gap-4">
          {!isLoaded ? (
            <div className="h-10 w-[100px] animate-pulse rounded-full bg-muted" />
          ) : isSignedIn ? (
            <UserMenu />
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </nav>
  );
}
