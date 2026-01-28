import { Crown } from "lucide-react";

interface DomacinBadgeProps {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px] gap-0.5",
  md: "px-2 py-1 text-xs gap-1",
  lg: "px-3 py-1.5 text-sm gap-1.5",
};

const iconSizes = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function DomacinBadge({ size = "md" }: DomacinBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-[#f0a202] to-[#f0a202]/80 font-bold text-white ${sizeClasses[size]}`}
    >
      <Crown className={iconSizes[size]} />
      DOMACIN
    </span>
  );
}
