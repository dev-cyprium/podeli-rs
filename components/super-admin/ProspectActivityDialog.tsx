"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { editableProspect } from "./ProspectDialog";
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
  channels,
  nextSteps,
  statuses,
  type OutreachChannel,
  type OutreachStep,
  type OutreachStatus,
} from "@/lib/outreach";
import { toast } from "sonner";

export function ProspectActivityDialog({
  prospect,
  onClose,
}: {
  prospect: Doc<"prospects">;
  onClose: () => void;
}) {
  const save = useMutation(api.outreach.save);
  const history = useQuery(api.outreach.history, { id: prospect._id });
  const [status, setStatus] = useState<OutreachStatus>(prospect.status);
  const [step, setStep] = useState<OutreachStep>(
    prospect.nextStep ?? "prepare_offer",
  );
  const [channel, setChannel] = useState<OutreachChannel | "">("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(prospect.followUpDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await save({
        id: prospect._id,
        prospect: {
          ...editableProspect(prospect),
          status,
          nextStep: step,
          followUpDate: ["not_interested", "onboarded"].includes(status)
            ? ""
            : date,
        },
        note,
        outcome: status,
        channel: channel || undefined,
      });
      toast.success("Odgovor i sledeći zadatak su zabeleženi.");
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
          <DialogTitle>Odgovor i istorija: {prospect.name}</DialogTitle>
          <DialogDescription>
            Zabeleži šta se desilo i sledeći zadatak. Kanal označava kako ste
            komunicirali.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={busy} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="activity-status">Ishod / status saradnje</Label>
              <select
                id="activity-status"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as OutreachStatus)}
              >
                {Object.entries(statuses).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="activity-channel">Način komunikacije</Label>
              <select
                id="activity-channel"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={channel}
                onChange={(e) =>
                  setChannel(e.target.value as OutreachChannel | "")
                }
              >
                <option value="">Interna beleška</option>
                {Object.entries(channels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="activity-note">Šta se desilo?</Label>
              <textarea
                id="activity-note"
                className="min-h-24 w-full rounded-md border p-3 text-sm"
                maxLength={5000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Npr. traže da korigujemo cenu pre preuzimanja ponude"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="activity-step">Sledeći zadatak</Label>
                <select
                  id="activity-step"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={step}
                  onChange={(e) => setStep(e.target.value as OutreachStep)}
                >
                  {Object.entries(nextSteps).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="activity-date">Podsetnik</Label>
                <Input
                  id="activity-date"
                  type="date"
                  required={status === "follow_up"}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
              {busy ? "Čuvanje…" : "Zabeleži odgovor"}
            </Button>
          </div>
        </form>
        <section className="space-y-3 border-t pt-4">
          <h2 className="font-semibold">Istorija saradnje</h2>
          {history === undefined ? (
            <p role="status">Učitavanje…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Još nema aktivnosti.
            </p>
          ) : (
            history.map((entry) => (
              <div key={entry._id} className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("sr-Latn-RS", {
                    timeZone: "Europe/Belgrade",
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(entry.createdAt)}{" "}
                  · {statuses[entry.outcome]}
                  {entry.channel && ` · ${channels[entry.channel]}`}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{entry.note}</p>
              </div>
            ))
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
