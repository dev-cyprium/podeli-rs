import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { NavLinks } from "./NavLinks";
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
            className="text-sm font-medium text-muted-foreground hover:text-podeli-accent"
          >
            Kako funkcioniše
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-muted-foreground hover:text-podeli-accent"
          >
            Blog
          </Link>
          <a
            href="#ponuda"
            className="text-sm font-medium text-muted-foreground hover:text-podeli-accent"
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
