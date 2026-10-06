import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { PonudaLink } from "./PonudaLink";
import { NavAuthActions } from "./NavAuthActions";
import { Logo } from "./Logo";

export function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-podeli-light/80 backdrop-blur-md">
      {/* Desktop layout */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-4 md:flex lg:px-8">
        <Logo href="/" height={32} />
        <div className="flex items-center gap-8">
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
          <Link
            href="/cesto-postavljana-pitanja"
            className="text-sm font-semibold text-muted-foreground hover:text-podeli-accent"
          >
            Česta pitanja
          </Link>
          <PonudaLink />
          <div className="flex items-center gap-2">
            <NavAuthActions />
          </div>
        </div>
      </div>

      {/* Mobile layout: hamburger left, logo center, actions right */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <NavLinks />
        <Logo
          href="/"
          height={28}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        />
        <div className="flex items-center gap-2">
          <NavAuthActions />
        </div>
      </div>
    </nav>
  );
}
