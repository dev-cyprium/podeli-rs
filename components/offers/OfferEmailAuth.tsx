"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export function OfferEmailAuth({ recipientHint }: { recipientHint: string }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendAt, setResendAt] = useState(0);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(
        isClerkAPIResponseError(err)
          ? (err.errors[0]?.longMessage ??
              "Prijava nije uspela. Pokušajte ponovo.")
          : err instanceof Error
            ? err.message
            : "Prijava nije uspela. Pokušajte ponovo.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    await run(async () => {
      if (!consent) throw new Error("Prihvatite uslove korišćenja.");
      const result = await signIn.create({
        identifier: email.trim(),
        signUpIfMissing: true,
      });
      if (result.error) throw result.error;
      const sent = await signIn.emailCode.sendCode();
      if (sent.error) throw sent.error;
      setVerifying(true);
      setResendAt(Date.now() + 30_000);
    });
  }
  async function verify() {
    await run(async () => {
      const result = await signIn.emailCode.verifyCode({ code });
      const transfer =
        isClerkAPIResponseError(result.error) &&
        result.error.errors.some(
          (e) => e.code === "sign_up_if_missing_transfer",
        );
      if (transfer) {
        const created = await signUp.create({
          transfer: true,
          legalAccepted: consent,
        });
        if (created.error) throw created.error;
        if (signUp.status !== "complete")
          throw new Error(
            "Nalog zahteva dodatne podatke. Obratite se Podeliju; vaše izmene su i dalje na ovoj stranici.",
          );
        const done = await signUp.finalize({
          navigate: ({ session }) => {
            if (session?.currentTask)
              throw new Error("Dovršite proveru naloga pre objavljivanja.");
          },
        });
        if (done.error) throw done.error;
      } else {
        if (result.error) throw result.error;
        if (signIn.status !== "complete")
          throw new Error(
            "Potrebna je dodatna provera naloga pre objavljivanja.",
          );
        const done = await signIn.finalize({
          navigate: ({ session }) => {
            if (session?.currentTask)
              throw new Error("Dovršite proveru naloga pre objavljivanja.");
          },
        });
        if (done.error) throw done.error;
      }
    });
  }
  return (
    <div className="space-y-4">
      <p>
        Potvrdite mejl {recipientHint}. Ako još nemate nalog, napravićemo ga
        nakon potvrde. Lozinka nije potrebna.
      </p>
      {!verifying ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label className="block space-y-2">
            Vaša mejl adresa
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              Prihvatam{" "}
              <Link
                className="underline"
                href="/terms-of-service"
                target="_blank"
              >
                uslove korišćenja
              </Link>{" "}
              i{" "}
              <Link
                className="underline"
                href="/privacy-policy"
                target="_blank"
              >
                politiku privatnosti
              </Link>
              .
            </span>
          </label>
          <Button disabled={busy || !consent}>Pošalji mi kod za prijavu</Button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <p className="text-sm">
            Kod je poslat na {email}. Izmene ponude ostaju na ovoj stranici.
          </p>
          <label className="block space-y-2">
            Kod iz mejla
            <Input
              autoComplete="one-time-code"
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <Button disabled={busy}>Potvrdi mejl</Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                if (Date.now() < resendAt)
                  throw new Error("Sačekajte 30 sekundi pre ponovnog slanja.");
                const result = await signIn.emailCode.sendCode();
                if (result.error) throw result.error;
                setResendAt(Date.now() + 30_000);
              })
            }
          >
            Pošalji novi kod
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setVerifying(false);
              setCode("");
            }}
          >
            Promeni mejl
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div id="clerk-captcha" />
    </div>
  );
}
