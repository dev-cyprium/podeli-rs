"use client";

import { SignedOut, SignIn, useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SignInModal() {
  const { isLoaded } = useAuth();

  // Don't render anything while Clerk is loading to prevent
  // showing the sign-in button during OAuth redirect hydration
  if (!isLoaded) return null;

  return (
    <SignedOut>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800">
            Prijavi se
          </Button>
        </DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="max-w-[440px] border-0 bg-transparent p-0 shadow-none"
        >
          <DialogTitle className="sr-only">Prijavi se</DialogTitle>
          <div className="flex justify-center">
            <SignIn forceRedirectUrl="/" signUpForceRedirectUrl="/" />
          </div>
        </DialogContent>
      </Dialog>
    </SignedOut>
  );
}
