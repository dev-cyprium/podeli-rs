"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { SignInButton } from "@/components/SignInButton";

export function ItemDetailHeader() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-amber-200">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            PODELI.rs
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {!isLoaded ? (
            <div className="h-10 w-[100px] animate-pulse rounded-full bg-slate-200" />
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
