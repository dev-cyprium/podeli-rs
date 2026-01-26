import { auth } from "@clerk/nextjs/server";
import { HeartHandshake } from "lucide-react";
import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";

export async function NavBar() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

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
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/kako-funkcionise"
            className="text-sm font-medium text-slate-600 hover:text-amber-600"
          >
            Kako funkcioniše
          </Link>
          <a
            href="#zasto-deljenje"
            className="text-sm font-medium text-slate-600 hover:text-amber-600"
          >
            Zašto deljenje
          </a>
          <a
            href="#ponuda"
            className="text-sm font-medium text-slate-600 hover:text-amber-600"
          >
            Ponuda
          </a>
          {isSignedIn ? <UserMenu /> : <SignInButton />}
        </div>
        <NavLinks isSignedIn={isSignedIn} />
      </div>
    </nav>
  );
}
