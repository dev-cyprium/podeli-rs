"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Info,
  Clock,
  Tag,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Shared data ────────────────────────────────────────────

const DEMO_CATEGORIES = [
  "Alati",
  "Elektronika",
  "Sportska oprema",
  "Knjige",
  "Muzički instrumenti",
  "Kućni aparati",
];

const GRID_CATEGORIES = [
  { name: "Alati", count: 12 },
  { name: "Elektronika", count: 8 },
  { name: "Sportska oprema", count: 15 },
  { name: "Knjige", count: 6 },
  { name: "Muzički instrumenti", count: 4 },
  { name: "Kućni aparati", count: 9 },
];

// ─── Wrapper for all demos ──────────────────────────────────

function DemoShell({
  hint,
  children,
}: {
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="not-prose my-6">
      <div className="rounded-2xl border-2 border-dashed border-podeli-accent/30 bg-podeli-accent/5 p-5 sm:p-6">
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-podeli-accent">
          {hint}
        </p>
        {children}
      </div>
    </div>
  );
}

// ─── Demo 1: Interactive Category Dropdown ──────────────────

export function CategoryDropdownDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [suggested, setSuggested] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = DEMO_CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(search.toLowerCase()),
  );

  const showSuggest =
    search.trim().length > 0 &&
    !DEMO_CATEGORIES.some(
      (c) => c.toLowerCase() === search.trim().toLowerCase(),
    );

  // Focus search input when dropdown opens
  const prevOpen = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      inputRef.current?.focus();
    }
    prevOpen.current = isOpen;
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleSuggest = useCallback(() => {
    setSuggested(true);
    setSelected("Ostalo");
    setIsOpen(false);
    setSearch("");
  }, []);

  const handleSelect = useCallback((cat: string) => {
    setSelected(cat);
    setIsOpen(false);
    setSearch("");
  }, []);

  const toggle = useCallback(() => {
    if (suggested) {
      setSuggested(false);
      setSelected("");
    }
    setIsOpen((o) => !o);
  }, [suggested]);

  return (
    <DemoShell hint='Isprobajte — ukucajte "Kamp oprema" u pretragu'>
      <div className="mx-auto max-w-sm">
        <label className="mb-1.5 block text-sm font-medium text-podeli-dark">
          Kategorija
        </label>

        <div ref={containerRef} className="relative">
          {/* Trigger */}
          <Button
            variant="outline"
            onClick={toggle}
            className="w-full justify-between font-normal"
          >
            <span
              className={
                selected ? "text-podeli-dark" : "text-muted-foreground"
              }
            >
              {selected || "Izaberite kategoriju..."}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>

          {/* Dropdown */}
          <div
            className={cn(
              "absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-border bg-card shadow-lg transition-all duration-200",
              isOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-2 scale-95 opacity-0",
            )}
          >
            {/* Search input */}
            <div className="border-b border-border p-2">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pretražite kategorije..."
                  className="w-full bg-transparent py-2 text-sm text-podeli-dark outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Items */}
            <div className="max-h-48 overflow-y-auto p-1.5">
              {filtered.map((cat) => (
                <div
                  key={cat}
                  role="option"
                  aria-selected={selected === cat}
                  tabIndex={0}
                  onClick={() => handleSelect(cat)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSelect(cat);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-podeli-dark transition-colors hover:bg-muted/80"
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 transition-opacity",
                      selected === cat
                        ? "text-podeli-accent opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {cat}
                </div>
              ))}

              {filtered.length === 0 && !showSuggest && (
                <p className="px-2.5 py-2 text-sm text-muted-foreground">
                  Nema rezultata.
                </p>
              )}

              {/* Suggest option */}
              {showSuggest && (
                <>
                  <div className="mx-2 my-1 border-t border-border" />
                  <div
                    role="option"
                    aria-selected={false}
                    tabIndex={0}
                    onClick={handleSuggest}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSuggest();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-podeli-accent transition-colors hover:bg-podeli-accent/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Predloži: &ldquo;{search.trim()}&rdquo;
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Success message */}
        <div
          className={cn(
            "transition-all duration-500",
            suggested
              ? "mt-3 translate-y-0 opacity-100"
              : "h-0 translate-y-2 overflow-hidden opacity-0",
          )}
        >
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <p className="text-sm text-green-700">
                Predlog je poslat! Do odobrenja, vaš predmet će biti u
                kategoriji &ldquo;Ostalo&rdquo;.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DemoShell>
  );
}

// ─── Demo 2: Suggestion Form ────────────────────────────────

export function CategorySuggestDemo() {
  const [value, setValue] = useState("Kamp oprema");
  const [state, setState] = useState<"idle" | "submitting" | "success">(
    "idle",
  );

  const handleSubmit = useCallback(() => {
    if (!value.trim() || state !== "idle") return;
    setState("submitting");
    setTimeout(() => setState("success"), 1200);
  }, [value, state]);

  const handleReset = useCallback(() => {
    setState("idle");
    setValue("Kamp oprema");
  }, []);

  return (
    <DemoShell hint='Kliknite "Predloži"'>
      <div className="mx-auto max-w-sm">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h4 className="text-base font-semibold text-podeli-dark">
            Predloži novu kategoriju
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Unesite naziv kategorije koja vam nedostaje.
          </p>

          <div className="mt-4 space-y-4">
            {/* Input */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-podeli-dark">
                Naziv kategorije
              </label>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={state !== "idle"}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-podeli-dark outline-none transition-colors focus:border-podeli-accent focus:ring-2 focus:ring-podeli-accent/20 disabled:opacity-60"
                placeholder='Npr. "Kamp oprema"'
              />
            </div>

            {/* Info box */}
            <div
              className={cn(
                "transition-all duration-300",
                state === "success"
                  ? "h-0 overflow-hidden opacity-0"
                  : "opacity-100",
              )}
            >
              <div className="rounded-lg border border-podeli-blue/20 bg-podeli-blue/5 p-3">
                <div className="flex gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-podeli-blue" />
                  <p className="text-sm text-podeli-blue">
                    Do odobrenja nove kategorije, vaš predmet će biti svrstan u
                    kategoriju &ldquo;Ostalo&rdquo;.
                  </p>
                </div>
              </div>
            </div>

            {/* Success box */}
            <div
              className={cn(
                "transition-all duration-500",
                state === "success"
                  ? "translate-y-0 opacity-100"
                  : "h-0 translate-y-2 overflow-hidden opacity-0",
              )}
            >
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="flex gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <p className="text-sm text-green-700">
                    &ldquo;{value}&rdquo; je uspešno predložena! Obavestićemo
                    vas kada bude odobrena.
                  </p>
                </div>
              </div>
            </div>

            {/* Button */}
            <Button
              onClick={state === "success" ? handleReset : handleSubmit}
              disabled={state === "submitting" || !value.trim()}
              className={cn(
                "w-full transition-all duration-300",
                state === "success"
                  ? "bg-muted text-podeli-dark hover:bg-muted/80"
                  : "bg-podeli-accent text-white hover:bg-podeli-accent/90",
              )}
            >
              {state === "idle" && (
                <>
                  <Plus className="h-4 w-4" />
                  Predloži
                </>
              )}
              {state === "submitting" && (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Slanje...
                </>
              )}
              {state === "success" && "Pokušaj ponovo"}
            </Button>
          </div>
        </div>
      </div>
    </DemoShell>
  );
}

// ─── Demo 3: Pending → Approved transition ──────────────────

export function CategoryPendingDemo() {
  const [status, setStatus] = useState<"pending" | "approved">("pending");

  const toggle = useCallback(() => {
    setStatus((s) => (s === "pending" ? "approved" : "pending"));
  }, []);

  return (
    <DemoShell
      hint={
        status === "pending"
          ? "Kliknite na karticu da simulirate odobrenje"
          : "Kliknite ponovo da resetujete"
      }
    >
      <div className="mx-auto max-w-sm">
        <div
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === "Enter") toggle();
          }}
          className={cn(
            "cursor-pointer rounded-xl border p-4 transition-all duration-500",
            status === "pending"
              ? "border-amber-200 bg-card shadow-sm"
              : "border-green-200 bg-green-50/50 shadow-md shadow-green-100",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500",
                status === "pending"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-green-100 text-green-600",
              )}
            >
              {status === "pending" ? (
                <Clock className="h-5 w-5" />
              ) : (
                <Check className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-podeli-dark">
                Kamp oprema
              </p>
              <p className="text-xs text-muted-foreground transition-all duration-300">
                {status === "pending"
                  ? "Predloženo danas"
                  : "Odobreno — dostupna svim korisnicima"}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-500",
                status === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700",
              )}
            >
              {status === "pending" ? "Na čekanju" : "Odobreno"}
            </span>
          </div>
        </div>
      </div>
    </DemoShell>
  );
}

// ─── Demo 4: Category Grid with new one appearing ───────────

export function CategoryGridDemo() {
  const [showNew, setShowNew] = useState(false);

  const toggle = useCallback(() => setShowNew((s) => !s), []);

  return (
    <DemoShell
      hint={
        showNew
          ? "Nova kategorija je dostupna svima"
          : 'Kliknite "Odobri" da vidite novu kategoriju'
      }
    >
      <div className="mx-auto max-w-lg">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {GRID_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="rounded-xl border border-border bg-card p-3 transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-podeli-accent/10 text-podeli-accent">
                <Tag className="h-3.5 w-3.5" />
              </div>
              <p className="mt-2 text-sm font-semibold text-podeli-dark">
                {cat.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {cat.count} predmeta
              </p>
            </div>
          ))}

          {/* New category that appears */}
          <div
            className={cn(
              "rounded-xl border p-3 transition-all duration-700",
              showNew
                ? "scale-100 border-podeli-accent/40 bg-podeli-accent/5 opacity-100 shadow-md shadow-podeli-accent/10"
                : "scale-90 border-transparent opacity-0",
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-podeli-accent text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <p className="mt-2 text-sm font-semibold text-podeli-dark">
              Kamp oprema
            </p>
            <p className="text-xs text-muted-foreground">1 predmet</p>
            <span className="mt-1.5 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              Novo
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            onClick={toggle}
            className={cn(
              "transition-all",
              showNew
                ? "bg-muted text-podeli-dark hover:bg-muted/80"
                : "bg-podeli-accent text-white hover:bg-podeli-accent/90",
            )}
          >
            {showNew ? "Resetuj" : "Odobri kategoriju"}
          </Button>
        </div>
      </div>
    </DemoShell>
  );
}
