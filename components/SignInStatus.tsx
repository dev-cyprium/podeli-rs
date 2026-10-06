"use client";

import { ClerkFailed, ClerkLoading } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SignInStatus() {
  return (
    <>
      <ClerkLoading>
        <p
          role="status"
          className="px-4 py-8 text-center text-sm text-muted-foreground"
        >
          Učitavanje prijave…
        </p>
      </ClerkLoading>
      <ClerkFailed>
        <div role="alert" className="space-y-4 px-4 py-8 text-center">
          <p className="text-sm">
            Prijava trenutno ne može da se učita. Pokušajte ponovo.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Pokušaj ponovo
          </Button>
        </div>
      </ClerkFailed>
    </>
  );
}
