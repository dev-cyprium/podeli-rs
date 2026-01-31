"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { PonudaLink } from "./PonudaLink";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";

interface NavLinksProps {
  isSignedIn: boolean;
}

export function NavLinks({ isSignedIn }: NavLinksProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="p-2 text-muted-foreground touch-manipulation"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {isMobileMenuOpen && (
        <div className="absolute left-0 right-0 top-full border-t border-border bg-card">
          <div className="flex flex-col gap-4 px-6 py-4">
            <Link
              href="/kako-funkcionise"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-muted-foreground hover:text-podeli-accent"
            >
              Kako funkcioniše
            </Link>
            <Link
              href="/blog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-muted-foreground hover:text-podeli-accent"
            >
              Blog
            </Link>
            <Link
              href="/cesto-postavljana-pitanja"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-muted-foreground hover:text-podeli-accent"
            >
              Česta pitanja
            </Link>
            <PonudaLink
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <Link
              href="/planovi"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-muted-foreground hover:text-podeli-accent"
            >
              Planovi
            </Link>
            <div className="flex flex-col gap-2 pt-2">
              {isSignedIn && (
                <div className="flex items-center gap-2">
                  <NotificationBell />
                </div>
              )}
              {isSignedIn ? <UserMenu /> : <SignInButton />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
