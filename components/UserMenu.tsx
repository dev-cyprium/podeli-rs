"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "?";
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-podeli-accent",
    "bg-podeli-blue",
    "bg-podeli-red",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function UserMenu() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  // Server already determined user is signed in, but we need user data to load
  // Show skeleton while loading user details
  if (!isLoaded || !user) {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
    );
  }

  const initials = getInitials(user.firstName, user.lastName);
  const colorClass = getColorFromName(user.id || user.firstName || "user");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass} text-sm font-semibold text-podeli-light transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-podeli-accent focus:ring-offset-2`}
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-podeli-dark">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user.primaryEmailAddress?.emailAddress}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/kontrolna-tabla" className="flex items-center gap-2 cursor-pointer">
            <LayoutDashboard className="h-4 w-4" />
            <span>Kontrolna tabla</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="flex items-center gap-2 text-podeli-red focus:text-podeli-red focus:bg-podeli-red/10 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Odjavi se</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
