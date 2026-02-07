import { Suspense } from "react";
import { BackgroundPattern } from "@/components/kontrolna-tabla/BackgroundPattern";
import { KontrolnaTablaContent } from "@/components/kontrolna-tabla/KontrolnaTablaContent";

export default function KontrolnaTablaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <BackgroundPattern />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-podeli-accent border-t-transparent"></div>
        </div>
      }
    >
      <div className="min-h-screen">
        <BackgroundPattern />
        <KontrolnaTablaContent />
      </div>
    </Suspense>
  );
}
