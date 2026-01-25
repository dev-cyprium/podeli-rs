import * as React from "react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type ?? "checkbox"}
        className={cn(
          "h-4 w-4 rounded border border-slate-300 text-amber-600 shadow-sm focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
          className
        )}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
