"use client";

import { SignedOut, SignIn } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SignInModal() {
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
            <SignIn routing="hash" />
          </div>
        </DialogContent>
      </Dialog>
    </SignedOut>
  );
}
