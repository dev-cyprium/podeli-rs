"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Phone,
  Mail,
  Plus,
  Download,
  Upload,
  Search,
  CalendarClock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { initialProspects } from "@/lib/outreach-prospects";
import {
  belgradeToday,
  isActiveProspect,
  isFollowUpDue,
  isToContactToday,
  csvColumns,
  encodeCsv,
  parseProspectCsv,
  channels,
  type OutreachChannel,
  statuses,
  type OutreachStatus,
} from "@/lib/outreach";

const blank = {
  name: "",
  category: "",
  phone: "",
  email: "",
  contactFormUrl: "",
  preferredChannel: "" as OutreachChannel | "",
  website: "",
  contactPerson: "",
  status: "new" as OutreachStatus,
  nextAction: "",
  followUpDate: "",
  supplierProfileId: "" as Id<"profiles"> | "",
};
const selectClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm";
type View = "today" | "all" | "follow_up" | "interested";

export function OutreachPanel() {
  const prospects = useQuery(api.outreach.list);
  const importProspects = useMutation(api.outreach.importProspects);
  const [view, setView] = useState<View>("today");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Doc<"prospects"> | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [today, setToday] = useState(() => belgradeToday());
  useEffect(() => {
    const timer = setInterval(() => setToday(belgradeToday()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const active = isActiveProspect;
  const due = (p: Doc<"prospects">) => isFollowUpDue(p, today);
  const toContact = (p: Doc<"prospects">) => isToContactToday(p, today);
  const rows = (prospects ?? [])
    .filter((p) => {
      if (view === "today" && !toContact(p)) return false;
      if (view === "follow_up" && (!active(p) || !p.followUpDate)) return false;
      if (view === "interested" && p.status !== "interested") return false;
      return (
        (!category || p.category === category) &&
        (!status || p.status === status) &&
        [
          p.name,
          p.category,
          p.phone,
          p.email,
          p.contactFormUrl,
          p.contactPerson,
        ]
          .join(" ")
          .toLocaleLowerCase("sr")
          .includes(search.toLocaleLowerCase("sr"))
      );
    })
    .sort(
      (a, b) =>
        Number(due(b)) - Number(due(a)) ||
        (a.followUpDate || "9999").localeCompare(b.followUpDate || "9999") ||
        a.name.localeCompare(b.name, "sr"),
    );
  async function importRows(
    rows: Array<
      Omit<(typeof initialProspects)[number], "status"> & {
        status: OutreachStatus;
        email?: string;
        contactFormUrl?: string;
        preferredChannel?: OutreachChannel;
      }
    >,
  ) {
    setBusy(true);
    try {
      const result = await importProspects({ rows });
      toast.success(
        `Uvezeno: ${result.imported}. Preskočeni duplikati: ${result.skipped}.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Uvoz nije uspeo.");
    } finally {
      setBusy(false);
    }
  }
  async function importCsv(file: File) {
    try {
      if (file.size > 1_000_000)
        throw new Error("CSV fajl može imati najviše 1 MB.");
      const parsed = parseProspectCsv(await file.text());
      await importRows(parsed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Uvoz nije uspeo.");
    }
  }
  function download(
    rows: Array<
      Omit<(typeof initialProspects)[number], "status"> & {
        status: OutreachStatus;
        email?: string;
        contactFormUrl?: string;
        preferredChannel?: OutreachChannel;
      }
    >,
    filename: string,
  ) {
    const csv = encodeCsv([
      [...csvColumns],
      ...rows.map((row) => csvColumns.map((column) => row[column] ?? "")),
    ]);
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Saradnja</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kontaktiraj firmu mejlom, preko kontakt forme ili telefonom i
            zabeleži sledeći korak.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Dodaj firmu
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["today", "Za kontakt danas", prospects?.filter(toContact).length],
            [
              "follow_up",
              "Zakazani kontakti",
              prospects?.filter((p) => active(p) && p.followUpDate).length,
            ],
            [
              "interested",
              "Zainteresovani",
              prospects?.filter((p) => p.status === "interested").length,
            ],
            ["all", "Sve firme", prospects?.length],
          ] as const
        ).map(([key, label, count]) => (
          <Button
            variant="ghost"
            type="button"
            key={key}
            onClick={() => setView(key)}
            aria-pressed={view === key}
            className={`h-auto flex-col items-start rounded-xl border p-4 text-left ${view === key ? "border-podeli-accent bg-podeli-accent/10" : "border-border bg-card"}`}
          >
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{count ?? "…"}</div>
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Pretraži firme"
            placeholder="Firma, osoba, mejl ili telefon…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          aria-label="Kategorija"
          className={selectClass}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Sve kategorije</option>
          {[...new Set(prospects?.map((p) => p.category))].sort().map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Status"
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Svi statusi</option>
          {Object.entries(statuses).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {prospects === undefined ? (
        <p role="status">Učitavanje kontakata…</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {prospects.length === 0
              ? "Dodaj firmu ili uvezi početnih 18 kontakata."
              : "Nema firmi u ovom prikazu."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((p) => (
            <Card key={p._id}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setEditing(p)}
                      className="h-auto justify-start p-0 text-left font-semibold whitespace-normal hover:underline"
                    >
                      {p.name}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      {p.category}
                      {p.contactPerson && ` · ${p.contactPerson}`}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {statuses[p.status]}
                  </span>
                </div>
                {p.preferredChannel && (
                  <p className="text-xs text-muted-foreground">
                    Sledeći kanal: {channels[p.preferredChannel]}
                  </p>
                )}
                {p.nextAction && <p className="text-sm">{p.nextAction}</p>}
                {p.latestActivity && (
                  <div className="border-l-2 border-podeli-accent pl-3 text-sm text-muted-foreground">
                    <p className="text-xs">
                      Poslednji kontakt
                      {p.latestActivity.channel
                        ? ` (${channels[p.latestActivity.channel]})`
                        : ""}
                      :{" "}
                      {new Intl.DateTimeFormat("sr-Latn-RS", {
                        timeZone: "Europe/Belgrade",
                        dateStyle: "medium",
                      }).format(p.latestActivity.createdAt)}
                    </p>
                    {p.latestActivity.note && (
                      <p className="mt-1 line-clamp-2 whitespace-pre-wrap">
                        {p.latestActivity.note}
                      </p>
                    )}
                  </div>
                )}
                {p.followUpDate && active(p) && (
                  <p
                    className={`flex items-center gap-2 text-sm ${due(p) ? "font-medium text-[#006992]" : "text-muted-foreground"}`}
                  >
                    <CalendarClock className="h-4 w-4" />
                    {due(p) ? "Za kontakt: " : "Sledeći kontakt: "}
                    {p.followUpDate.split("-").reverse().join(".")}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {p.phone && (
                    <a
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#006992]"
                      href={`tel:${p.phone.replace(/[^+0-9]/g, "")}`}
                    >
                      <Phone className="h-4 w-4" />
                      {p.phone}
                    </a>
                  )}
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#006992]"
                    >
                      <Mail className="h-4 w-4" />
                      {p.email}
                    </a>
                  )}
                  {p.contactFormUrl && (
                    <a
                      href={p.contactFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#006992]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Kontakt forma
                    </a>
                  )}
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground"
                    >
                      Sajt
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setEditing(p)}
                  >
                    Zabeleži kontakt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button
          variant="outline"
          disabled={busy || prospects === undefined}
          onClick={() => importRows(initialProspects)}
        >
          <Upload className="h-4 w-4" /> Uvezi početnih 18
        </Button>
        <Button
          variant="outline"
          disabled={busy || prospects === undefined}
          onClick={() => document.getElementById("outreach-csv")?.click()}
        >
          Uvezi CSV
        </Button>
        <input
          id="outreach-csv"
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void importCsv(file);
          }}
        />
        <Button
          variant="outline"
          disabled={!prospects?.length}
          onClick={() => download(prospects ?? [], "podeli-kontakti.csv")}
        >
          <Download className="h-4 w-4" /> Izvezi kontakte
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            download(initialProspects.slice(0, 1), "primer-kontakata.csv")
          }
        >
          CSV primer
        </Button>
        <p className="w-full text-xs text-muted-foreground">
          Uvoz preskače postojeće firme sa istim nazivom i telefonom. Ne menja
          beleške ni status postojećih kontakata.
        </p>
      </div>
      {editing && (
        <ProspectDialog
          key={editing === "new" ? "new" : editing._id}
          prospect={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ProspectDialog({
  prospect,
  onClose,
}: {
  prospect: Doc<"prospects"> | null;
  onClose: () => void;
}) {
  const save = useMutation(api.outreach.save);
  const history = useQuery(
    api.outreach.history,
    prospect ? { id: prospect._id } : "skip",
  );
  const suppliers = useQuery(api.outreach.suppliers);
  const [form, setForm] = useState<typeof blank>(
    prospect
      ? {
          ...blank,
          ...prospect,
          email: prospect.email ?? "",
          contactFormUrl: prospect.contactFormUrl ?? "",
          preferredChannel: prospect.preferredChannel ?? "",
          supplierProfileId: prospect.supplierProfileId ?? "",
        }
      : blank,
  );
  const [channel, setChannel] = useState<OutreachChannel | "">(
    prospect?.preferredChannel ?? "",
  );
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<OutreachStatus | "">("");
  const [busy, setBusy] = useState(false);
  function field<K extends keyof typeof blank>(
    key: K,
    value: (typeof blank)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await save({
        id: prospect?._id,
        prospect: {
          name: form.name,
          category: form.category,
          phone: form.phone.trim(),
          email: form.email.trim(),
          contactFormUrl: form.contactFormUrl.trim(),
          preferredChannel: form.preferredChannel || undefined,
          website: form.website,
          contactPerson: form.contactPerson,
          status: form.status,
          nextAction: form.nextAction,
          followUpDate: form.followUpDate,
          supplierProfileId: form.supplierProfileId || undefined,
        },
        note,
        channel: channel || undefined,
        outcome: outcome || undefined,
      });
      toast.success("Kontakt sačuvan.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Čuvanje nije uspelo.");
    } finally {
      setBusy(false);
    }
  }
  function chooseOutcome(value: OutreachStatus) {
    setOutcome(value);
    setForm((f) => ({
      ...f,
      status: value,
      followUpDate: ["not_interested", "onboarded"].includes(value)
        ? ""
        : f.followUpDate,
    }));
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
          <DialogTitle>{prospect?.name ?? "Nova firma"}</DialogTitle>
          <DialogDescription>
            Kontakt i istorija kontakata dostupni su samo administratorima.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["name", "Firma"],
                  ["category", "Kategorija"],
                  ["email", "Mejl"],
                  ["contactFormUrl", "Kontakt forma (URL)"],
                  ["phone", "Telefon"],
                  ["website", "Sajt"],
                  ["contactPerson", "Kontakt osoba"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`prospect-${key}`}>{label}</Label>
                  <Input
                    id={`prospect-${key}`}
                    type={
                      key === "website" || key === "contactFormUrl"
                        ? "url"
                        : key === "email"
                          ? "email"
                          : key === "phone"
                            ? "tel"
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
              <Label htmlFor="prospect-preferred-channel">
                Kanal za sledeći kontakt
              </Label>
              <select
                id="prospect-preferred-channel"
                className={`${selectClass} w-full`}
                value={form.preferredChannel}
                onChange={(e) =>
                  field(
                    "preferredChannel",
                    e.target.value as OutreachChannel | "",
                  )
                }
              >
                <option value="">Nije izabran</option>
                {Object.entries(channels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="prospect-activity-channel">
                Kanal kontakta koji beležiš
              </Label>
              <select
                id="prospect-activity-channel"
                className={`${selectClass} w-full`}
                value={channel}
                onChange={(e) =>
                  setChannel(e.target.value as OutreachChannel | "")
                }
              >
                <option value="">Bez kanala / interna beleška</option>
                {Object.entries(channels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Ishod kontakta</Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["new", "Nema odgovora"],
                    ["contacted", "Poruka poslata / kontakt ostvaren"],
                    ["follow_up", "Kontaktiraj kasnije"],
                    ["interested", "Zainteresovani"],
                    ["not_interested", "Nisu zainteresovani"],
                    ["onboarded", "Uključeni"],
                  ] as const
                ).map(([key, label]) => (
                  <Button
                    key={key}
                    type="button"
                    size="sm"
                    variant={outcome === key ? "default" : "outline"}
                    onClick={() => chooseOutcome(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="prospect-status">Status</Label>
                <select
                  id="prospect-status"
                  className={`${selectClass} w-full`}
                  value={form.status}
                  onChange={(e) =>
                    chooseOutcome(e.target.value as OutreachStatus)
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
                <Label htmlFor="prospect-date">Sledeći kontakt</Label>
                <Input
                  id="prospect-date"
                  type="date"
                  required={form.status === "follow_up"}
                  disabled={["not_interested", "onboarded"].includes(
                    form.status,
                  )}
                  value={form.followUpDate}
                  onChange={(e) => field("followUpDate", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="prospect-action">Sledeći korak</Label>
              <Input
                id="prospect-action"
                maxLength={500}
                placeholder="Npr. poslati mejl sa primerom oglasa"
                value={form.nextAction}
                onChange={(e) => field("nextAction", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prospect-note">Beleška o kontaktu</Label>
              <textarea
                id="prospect-note"
                maxLength={5000}
                className="min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm"
                placeholder="Šta ste dogovorili?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prospect-supplier">
                Poveži nalog na platformi
              </Label>
              <select
                id="prospect-supplier"
                className={`${selectClass} w-full`}
                value={form.supplierProfileId}
                onChange={(e) =>
                  field(
                    "supplierProfileId",
                    e.target.value as Id<"profiles"> | "",
                  )
                }
              >
                <option value="">Bez povezanog naloga</option>
                {suppliers?.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
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
              {busy ? "Čuvanje…" : "Sačuvaj"}
            </Button>
          </div>
        </form>
        {prospect && (
          <section className="space-y-3 border-t pt-4">
            <h2 className="font-semibold">Istorija kontakata</h2>
            {history === undefined ? (
              <p role="status" className="text-sm">
                Učitavanje…
              </p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Još nema zabeleženih kontakata.
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
                  {entry.note && (
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {entry.note}
                    </p>
                  )}
                </div>
              ))
            )}
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
