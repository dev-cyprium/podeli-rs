import { cn } from "@/lib/utils";

interface BrandNameProps {
  /** Optional suffix, e.g. ".rs" for "podeli.rs" */
  suffix?: string;
  className?: string;
}

/**
 * Renders the platform name "podeli" (optionally with suffix like ".rs")
 * in bold with the primary accent orange color.
 */
export function BrandName({ suffix = "", className }: BrandNameProps) {
  return (
    <span className={cn("font-bold text-[#f0a202]", className)}>
      podeli{suffix}
    </span>
  );
}
