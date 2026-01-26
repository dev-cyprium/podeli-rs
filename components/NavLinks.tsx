"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";

interface NavLinksProps {
  isSignedIn: boolean;
}

export function NavLinks({ isSignedIn }: NavLinksProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="p-2 text-slate-600 touch-manipulation"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {isMobileMenuOpen && (
        <div className="absolute left-0 right-0 top-full border-t border-stone-200 bg-white">
          <div className="flex flex-col gap-4 px-6 py-4">
            <Link
              href="/kako-funkcionise"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 hover:text-amber-600"
            >
              Kako funkcioniše
            </Link>
            <a
              href="#zasto-deljenje"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 hover:text-amber-600"
            >
              Zašto deljenje
            </a>
            <a
              href="#ponuda"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-600 hover:text-amber-600"
            >
              Ponuda
            </a>
            <div className="pt-2">
              {isSignedIn ? <UserMenu /> : <SignInButton />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
