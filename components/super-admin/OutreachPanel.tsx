"use client";

import { ProspectDialog } from "./ProspectDialog";
import { ProspectActivityDialog } from "./ProspectActivityDialog";
import { ListingOfferDialog } from "./ListingOfferDialog";
import { offerStatuses } from "@/lib/listing-offers";
import { channels as channelLabels } from "@/lib/outreach";
import { useEffect, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  nextSteps,
  type OutreachChannel,
  type OutreachStep,
  statuses,
  type OutreachStatus,
} from "@/lib/outreach";

const selectClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm";
type View = "today" | "all" | "offers" | "claimed";

export function OutreachPanel() {
  const { isAuthenticated } = useConvexAuth();
  const prospects = useQuery(api.outreach.list, isAuthenticated ? {} : "skip");
  const importProspects = useMutation(api.outreach.importProspects);
  const [view, setView] = useState<View>("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Doc<"prospects"> | "new" | null>(null);
  const [activity, setActivity] = useState<Doc<"prospects"> | null>(null);
  const [offerProspect, setOfferProspect] = useState<Doc<"prospects"> | null>(
    null,
  );
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
      if (
        view === "offers" &&
        (!p.offer || !["ready", "sent"].includes(p.offer.status))
      )
        return false;
      if (view === "claimed" && p.offer?.status !== "claimed") return false;
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
      Omit<(typeof initialProspects)[number], "status" | "nextStep"> & {
        status: OutreachStatus;
        nextStep?: OutreachStep;
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
      Omit<(typeof initialProspects)[number], "status" | "nextStep"> & {
        status: OutreachStatus;
        nextStep?: OutreachStep;
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
            Izmeni firmu, pripremi predlog oglasa i pošalji link ponuđaču. Ovde
            pratiš odgovor, preuzimanje i objavu.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Dodaj firmu
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            ["today", "Zadaci za danas", prospects?.filter(toContact).length],
            [
              "offers",
              "Ponude sa linkom",
              prospects?.filter(
                (p) => p.offer && ["ready", "sent"].includes(p.offer.status),
              ).length,
            ],
            [
              "claimed",
              "Preuzete za objavu",
              prospects?.filter((p) => p.offer?.status === "claimed").length,
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
                <p className="text-sm font-medium">
                  {active(p)
                    ? nextSteps[p.nextStep ?? "prepare_offer"]
                    : p.status === "onboarded"
                      ? "Ponuđač uključen"
                      : "Saradnja zatvorena"}
                </p>
                {p.nextAction && (
                  <p className="text-sm text-muted-foreground">
                    {p.nextAction}
                  </p>
                )}
                {p.offer && (
                  <p className="text-xs text-muted-foreground">
                    {offerStatuses[p.offer.status]}
                  </p>
                )}
                {p.latestActivity && (
                  <div className="border-l-2 border-podeli-accent pl-3 text-sm text-muted-foreground">
                    <p className="text-xs">
                      Poslednja aktivnost
                      {p.latestActivity.channel
                        ? ` (${channelLabels[p.latestActivity.channel]})`
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
                    {due(p) ? "Podsetnik: " : "Zadatak zakazan: "}
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
                </div>
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(p)}
                  >
                    Izmeni firmu
                  </Button>
                  <Button size="sm" onClick={() => setOfferProspect(p)}>
                    {p.offer ? "Otvori ponudu" : "Pripremi ponudu"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActivity(p)}
                  >
                    Odgovor i istorija
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
      {activity && (
        <ProspectActivityDialog
          key={activity._id}
          prospect={
            (prospects ?? []).find((p) => p._id === activity._id) ?? activity
          }
          onClose={() => setActivity(null)}
        />
      )}
      {offerProspect && (
        <ListingOfferDialog
          key={offerProspect._id}
          prospect={
            (prospects ?? []).find((p) => p._id === offerProspect._id) ??
            offerProspect
          }
          onClose={() => setOfferProspect(null)}
          onEditFirm={() => {
            setEditing(
              (prospects ?? []).find((p) => p._id === offerProspect._id) ??
                offerProspect,
            );
            setOfferProspect(null);
          }}
        />
      )}
    </div>
  );
}
