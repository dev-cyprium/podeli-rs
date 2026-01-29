"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";

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

  return <SignIn />;
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-podeli-light">
      <Suspense fallback={<div className="h-[400px] w-[400px]" />}>
        <SignInContent />
      </Suspense>
    </div>
  );
}
