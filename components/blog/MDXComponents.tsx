import { ReactNode } from "react";
import Link from "next/link";
import { Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BrandName } from "@/components/BrandName";

interface StepProps {
  number: number;
  title: string;
  children: ReactNode;
}

interface CalloutProps {
  children: ReactNode;
}

// Custom Step component for guides
function Step({ number, title, children }: StepProps) {
  return (
    <div className="not-prose my-10 flex gap-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-podeli-accent text-xl font-bold text-podeli-dark shadow-sm">
        {number}
      </div>
      <div className="flex-1 pt-1">
        <h3 className="mb-3 text-xl font-semibold text-podeli-dark">{title}</h3>
        <div className="text-base leading-relaxed text-muted-foreground [&>p]:mb-3 [&>ul]:mt-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// Tip callout - more prominent and readable
function Tip({ children }: CalloutProps) {
  return (
    <div className="not-prose my-8 rounded-2xl border-2 border-podeli-accent/20 bg-podeli-accent/5 p-5">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-podeli-accent/20">
          <Lightbulb className="h-5 w-5 text-podeli-accent" />
        </div>
        <div className="flex-1 pt-1">
          <p className="font-medium text-podeli-dark">Savet</p>
          <div className="mt-1 text-base leading-relaxed text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Warning callout
function Warning({ children }: CalloutProps) {
  return (
    <div className="not-prose my-8 rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-5">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 pt-1">
          <p className="font-medium text-podeli-dark">Upozorenje</p>
          <div className="mt-1 text-base leading-relaxed text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Success callout
function Success({ children }: CalloutProps) {
  return (
    <div className="not-prose my-8 rounded-2xl border-2 border-podeli-green/20 bg-podeli-green/5 p-5">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-podeli-green/20">
          <CheckCircle2 className="h-5 w-5 text-podeli-green" />
        </div>
        <div className="flex-1 pt-1">
          <p className="font-medium text-podeli-dark">Uspeh</p>
          <div className="mt-1 text-base leading-relaxed text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// MDX component overrides - mostly let prose handle it, override where needed
export const mdxComponents = {
  // Custom components
  Step,
  Tip,
  Warning,
  Success,
  BrandName,

  // Links - handle internal vs external
  a: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isExternal = href?.startsWith("http");
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href || "#"} {...props}>
        {children}
      </Link>
    );
  },
};
