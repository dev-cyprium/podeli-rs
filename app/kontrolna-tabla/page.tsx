import { Suspense } from "react";
import { ModeSelector } from "./_components/ModeSelector";

export default function KontrolnaTablaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stone-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
        </div>
      }
    >
      <div className="min-h-screen bg-stone-50">
        <ModeSelector />
      </div>
    </Suspense>
  );
}
