"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  nextSteps,
  statuses,
  type OutreachStep,
  type OutreachStatus,
} from "@/lib/outreach";
import { toast } from "sonner";

export function editableProspect(p: Doc<"prospects">) {
  return {
    name: p.name,
    category: p.category,
    phone: p.phone,
    email: p.email ?? "",
    contactFormUrl: p.contactFormUrl ?? "",
    preferredChannel: p.preferredChannel,
    website: p.website,
    contactPerson: p.contactPerson,
    status: p.status,
    nextAction: p.nextAction,
    nextStep: p.nextStep,
    followUpDate: p.followUpDate,
    supplierProfileId: p.supplierProfileId,
  };
}

const blank = {
  name: "",
  category: "",
  phone: "",
  email: "",
  contactFormUrl: "",
  website: "",
  contactPerson: "",
  status: "new" as OutreachStatus,
  nextAction: "",
  nextStep: "prepare_offer" as OutreachStep,
  followUpDate: "",
};

export function ProspectDialog({
  prospect,
  onClose,
}: {
  prospect: Doc<"prospects"> | null;
  onClose: () => void;
}) {
  const save = useMutation(api.outreach.save);
  const [form, setForm] = useState(
    prospect
      ? {
          ...editableProspect(prospect),
          nextStep: prospect.nextStep ?? ("prepare_offer" as OutreachStep),
        }
      : blank,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function field<K extends keyof typeof blank>(
    key: K,
    value: (typeof blank)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await save({
        id: prospect?._id,
        prospect: {
          ...form,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          website: form.website.trim(),
          contactFormUrl: form.contactFormUrl.trim(),
        },
        note: "",
      });
      toast.success("Podaci firme su sačuvani.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Čuvanje nije uspelo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {prospect ? `Izmeni firmu: ${prospect.name}` : "Dodaj firmu"}
          </DialogTitle>
          <DialogDescription>
            Izmeni podatke i izaberi sledeći zadatak. Mejl je potreban za
            preuzimanje ponude. Promena mejla pre preuzimanja poništava
            prethodni link.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["name", "Firma"],
                  ["category", "Kategorija"],
                  ["email", "Mejl ponuđača"],
                  ["phone", "Telefon"],
                  ["website", "Sajt"],
                  ["contactFormUrl", "Kontakt forma (URL)"],
                  ["contactPerson", "Kontakt osoba"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`prospect-${key}`}>{label}</Label>
                  <Input
                    id={`prospect-${key}`}
                    type={
                      key === "email"
                        ? "email"
                        : key === "phone"
                          ? "tel"
                          : ["website", "contactFormUrl"].includes(key)
                            ? "url"
                            : "text"
                    }
                    maxLength={500}
                    required={key === "name" || key === "category"}
                    value={form[key]}
                    onChange={(e) => field(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor="prospect-step">Sledeći zadatak</Label>
              <select
                id="prospect-step"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.nextStep}
                onChange={(e) =>
                  field("nextStep", e.target.value as OutreachStep)
                }
              >
                {Object.entries(nextSteps).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="prospect-action">
                Dodatna napomena za sledeći zadatak
              </Label>
              <Input
                id="prospect-action"
                value={form.nextAction}
                maxLength={500}
                placeholder="Npr. proveriti cenu PS5 i dopuniti mejl"
                onChange={(e) => field("nextAction", e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="prospect-status">Status saradnje</Label>
                <select
                  id="prospect-status"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(e) =>
                    field("status", e.target.value as OutreachStatus)
                  }
                >
                  {Object.entries(statuses).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="prospect-date">Podsetnik za zadatak</Label>
                <Input
                  id="prospect-date"
                  type="date"
                  required={form.status === "follow_up"}
                  value={form.followUpDate}
                  onChange={(e) => field("followUpDate", e.target.value)}
                />
              </div>
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Otkaži
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Čuvanje…" : "Sačuvaj podatke firme"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
