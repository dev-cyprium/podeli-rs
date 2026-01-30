import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { NotificationBell } from "./NotificationBell";
import { PonudaLink } from "./PonudaLink";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";
import { Logo } from "./Logo";

export async function NavBar() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-podeli-light/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Logo href="/" height={32} />
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/kako-funkcionise"
            className="text-sm font-semibold text-muted-foreground hover:text-podeli-accent"
          >
            Kako funkcioniše
          </Link>
          <Link
            href="/blog"
            className="text-sm font-semibold text-muted-foreground hover:text-podeli-accent"
          >
            Blog
          </Link>
          <PonudaLink />
          {isSignedIn ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <UserMenu />
            </div>
          ) : (
            <SignInButton />
          )}
        </div>
        <NavLinks isSignedIn={isSignedIn} />
      </div>
    </nav>
  );
}
