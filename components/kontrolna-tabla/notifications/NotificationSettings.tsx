"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { EmailNotificationsSection } from "./EmailNotificationsSection";
import { useEffect } from "react";

export function NotificationSettings() {
  const { user, isLoaded } = useUser();
  const ensurePreferences = useMutation(api.notificationPreferences.ensurePreferences);

  useEffect(() => {
    if (isLoaded && user) {
      ensurePreferences();
    }
  }, [isLoaded, user, ensurePreferences]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-podeli-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Morate biti prijavljeni da pristupite ovoj stranici.</p>
        <Button asChild>
          <Link href="/sign-in">Prijavi se</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Logo */}
      <div className="mb-2">
        <Logo href="/" height={28} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/kontrolna-tabla">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-podeli-dark">Podešavanja obaveštenja</h1>
          <p className="text-sm text-muted-foreground">
            Izaberite koja obaveštenja želite da primate putem emaila
          </p>
        </div>
      </div>

      {/* Email Notifications Section */}
      <EmailNotificationsSection />
    </div>
  );
}
