"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type ContactType = "chat" | "email" | "phone";

const CONTACT_OPTIONS: { value: ContactType; label: string }[] = [
  { value: "chat", label: "Chat" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telefon" },
];

interface PreferredContactFormProps {
  preferredContactTypes: string[];
  onSave?: () => void;
  compact?: boolean;
  /** When true, render without outer Card (for use inside ContactPreferencesPanel) */
  embedded?: boolean;
  /** When true, start expanded (for modal use) */
  initialExpanded?: boolean;
}

export function PreferredContactForm({
  preferredContactTypes,
  onSave,
  compact = false,
  embedded = false,
  initialExpanded,
}: PreferredContactFormProps) {
  const updatePrefs = useMutation(api.profiles.updatePreferredContactTypes);
  const [selected, setSelected] = useState<ContactType[]>(
    preferredContactTypes.filter((t): t is ContactType =>
      ["chat", "email", "phone"].includes(t)
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(
    initialExpanded ?? !compact
  );

  const hasExistingPrefs = preferredContactTypes.length > 0;
  const isLastOption = (value: ContactType) =>
    selected.length === 1 && selected.includes(value);
  const cannotToggleOff = (value: ContactType) =>
    hasExistingPrefs && isLastOption(value);

  function toggle(value: ContactType) {
    if (cannotToggleOff(value)) return;

    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((t) => t !== value)
        : [...prev, value]
    );
    setError(null);
  }

  async function handleSave() {
    if (selected.length === 0) {
      setError("Odaberite bar jednu opciju kontakta.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await updatePrefs({ preferredContactTypes: selected });
      if (compact) {
        setIsExpanded(false);
      }
      onSave?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Čuvanje nije uspelo. Pokušajte ponovo."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (compact && !isExpanded) {
    const labels = CONTACT_OPTIONS.filter((o) =>
      selected.includes(o.value)
    ).map((o) => o.label);

    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-podeli-dark">
              Kontaktiraće vas putem:{" "}
            </span>
            {labels.length > 0 ? labels.join(", ") : "—"}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-podeli-blue hover:text-podeli-blue/90"
          >
            Izmeni
          </Button>
        </div>
      </div>
    );
  }

  const formContent = (
    <div className="space-y-4">
      {!embedded && (
        <div>
          <h3 className="font-semibold text-podeli-dark">
            Način kontakta
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Kako želite da vas ljudi kontaktiraju?
          </p>
        </div>
      )}

      <div className="space-y-3">
        {CONTACT_OPTIONS.map((option) => {
          const isChecked = selected.includes(option.value);
          const disabled = cannotToggleOff(option.value);

          return (
            <div
              key={option.value}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Switch
                  id={`contact-${option.value}`}
                  checked={isChecked}
                  onCheckedChange={() => toggle(option.value)}
                  disabled={disabled}
                  className="data-[state=checked]:bg-podeli-accent"
                />
                <Label
                  htmlFor={`contact-${option.value}`}
                  className="cursor-pointer font-medium"
                >
                  {option.label}
                </Label>
              </div>
            </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-lg border border-podeli-red/30 bg-podeli-red/10 px-3 py-2 text-sm text-podeli-red">
            {error}
          </div>
        )}

      <div className="flex gap-3">
        <Button
          type="button"
          className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
          onClick={handleSave}
          disabled={isSubmitting || selected.length === 0}
        >
          {compact ? "Sačuvaj" : "Sačuvaj i nastavi"}
        </Button>
        {compact && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExpanded(false)}
          >
            Otkaži
          </Button>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {formContent}
      </CardContent>
    </Card>
  );
}
