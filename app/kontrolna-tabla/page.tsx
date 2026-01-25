import { Suspense } from "react";
import { ModeSelector } from "./_components/ModeSelector";

import { BackgroundPattern } from "./_components/BackgroundPattern";

export default function KontrolnaTablaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <BackgroundPattern />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      }
    >
      <div className="min-h-screen">
        <BackgroundPattern />
        <ModeSelector />
      </div>
    </Suspense>
  );
}
