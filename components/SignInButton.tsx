"use client";

import { ClerkLoaded, SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { SignInStatus } from "./SignInStatus";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-podeli-dark px-5 py-2.5 text-sm font-medium text-podeli-light transition-colors hover:bg-podeli-dark/90">
          Prijavi se
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[440px] border-0 bg-card p-6 shadow-lg">
        <DialogTitle className="sr-only">Prijavi se</DialogTitle>
        <DialogDescription className="sr-only">
          Prijavite se putem Google naloga ili email adrese.
        </DialogDescription>
        <SignInStatus />
        <div className="flex justify-center">
          <ClerkLoaded>
            <SignIn
              routing="hash"
              forceRedirectUrl="/"
              signUpForceRedirectUrl="/"
            />
          </ClerkLoaded>
        </div>
        <Link
          href="/sign-in"
          className="text-center text-sm text-podeli-blue underline"
        >
          Otvori prijavu na posebnoj stranici
        </Link>
      </DialogContent>
    </Dialog>
  );
}
