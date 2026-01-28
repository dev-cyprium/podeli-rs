"use client";

import { SignIn } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-podeli-dark px-5 py-2.5 text-sm font-medium text-podeli-light transition-colors hover:bg-podeli-dark/90">
          Prijavi se
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-[440px] border-0 bg-transparent p-0 shadow-none"
      >
        <DialogTitle className="sr-only">Prijavi se</DialogTitle>
        <div className="flex justify-center">
          <SignIn routing="hash" forceRedirectUrl="/" signUpForceRedirectUrl="/" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
