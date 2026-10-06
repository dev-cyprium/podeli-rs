"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import { SignInStatus } from "@/components/SignInStatus";

function SignInContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for Clerk error in URL (bot protection or other auth failures)
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error || errorDescription) {
      toast.error("Greška pri prijavi", {
        description:
          "Došlo je do problema. Molimo pokušajte ponovo. Ako se problem nastavi, možda ćete morati da potvrdite da niste robot.",
        duration: 8000,
      });
    }
  }, [searchParams]);

  return (
    <>
      <SignInStatus />
      <SignIn />
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-podeli-light">
      <Suspense fallback={<p role="status">Učitavanje prijave…</p>}>
        <SignInContent />
      </Suspense>
    </div>
  );
}
