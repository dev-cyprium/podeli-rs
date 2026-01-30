"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClassName =
  "text-sm font-semibold text-muted-foreground hover:text-podeli-accent";

interface PonudaLinkProps {
  className?: string;
  onClick?: () => void;
}

export function PonudaLink({ className = linkClassName, onClick }: PonudaLinkProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  if (isHomePage) {
    return (
      <a
        href="#ponuda"
        className={className}
        onClick={onClick}
      >
        Ponuda
      </a>
    );
  }

  return (
    <Link href="/pretraga" className={className} onClick={onClick}>
      Ponuda
    </Link>
  );
}
