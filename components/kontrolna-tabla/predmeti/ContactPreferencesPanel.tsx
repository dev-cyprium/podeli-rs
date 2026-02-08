"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PreferredContactForm } from "./PreferredContactForm";

export function ContactPreferencesPanel() {
  const profile = useQuery(api.profiles.getMyProfile);

  if (profile === undefined) {
    return (
      <Card id="contact-prefs">
        <CardContent className="py-4">
          <div className="h-20 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const preferredContactTypes = profile?.preferredContactTypes ?? [];
  const isConfigured = preferredContactTypes.length > 0;

  return (
    <Card id="contact-prefs">
      <CardHeader>
        <CardTitle className="text-base">Način kontakta</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isConfigured
            ? "Kako će vas zainteresovani korisnici kontaktirati kada objavite predmet."
            : "Postavite način kontakta da biste mogli da objavljujete predmete."}
        </p>
      </CardHeader>
      <CardContent>
        <PreferredContactForm
          preferredContactTypes={preferredContactTypes}
          phoneNumber={profile?.phoneNumber}
          compact={isConfigured}
          embedded
        />
      </CardContent>
    </Card>
  );
}
