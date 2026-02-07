"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Check, ChevronsUpDown, Plus, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CategoryComboboxProps {
  value: string;
  onChange: (name: string) => void;
}

export function CategoryCombobox({ value, onChange }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const categories = useQuery(api.categories.listNames) ?? [];
  const suggest = useMutation(api.categories.suggestCategory);

  const filtered = categories.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase()),
  );
  const exactMatch = categories.some(
    (c) => c.toLowerCase() === search.trim().toLowerCase(),
  );
  const showCreate = search.trim().length > 0 && !exactMatch;

  function openCreateModal(name: string) {
    setOpen(false);
    setSearch("");
    setModalName(name);
    setModalError(null);
    setModalSuccess(null);
    setModalOpen(true);
  }

  async function handleCreate() {
    const trimmed = modalName.trim();
    if (!trimmed) {
      setModalError("Unesite naziv kategorije.");
      return;
    }
    setCreating(true);
    setModalError(null);
    setModalSuccess(null);
    try {
      const response = await suggest({ name: trimmed });
      if (response.result === "exists") {
        // Active category already exists — just select it
        onChange(response.name);
        setModalOpen(false);
      } else if (response.result === "already_pending") {
        // Already pending
        setModalSuccess(
          `Kategorija "${response.name}" je već predložena i čeka odobrenje. Vaš predmet će koristiti kategoriju "Ostalo".`,
        );
        onChange("Ostalo");
      } else {
        // Created as pending
        setModalSuccess(
          `Kategorija "${response.name}" je uspešno predložena! Vaš predmet će koristiti kategoriju "Ostalo" dok administrator ne odobri novu kategoriju.`,
        );
        onChange("Ostalo");
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Greška pri predlaganju kategorije.";
      setModalError(msg);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {value || "Izaberite kategoriju..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Pretraži ili predloži kategoriju..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {search.trim()
                  ? "Nema rezultata."
                  : "Unesite naziv za pretragu."}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((cat) => (
                  <CommandItem
                    key={cat}
                    value={cat}
                    onSelect={() => {
                      onChange(cat);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === cat ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {cat}
                  </CommandItem>
                ))}
                {showCreate && (
                  <CommandItem
                    value={`__create__${search.trim()}`}
                    onSelect={() => openCreateModal(search.trim())}
                    className="text-podeli-accent"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Predloži: &quot;{search.trim()}&quot;
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Predloži novu kategoriju</DialogTitle>
            <DialogDescription>
              Vaš predlog će biti pregledan od strane administratora pre nego što
              postane dostupan na platformi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!modalSuccess && (
              <>
                <div className="rounded-lg border border-podeli-blue/20 bg-podeli-blue/5 p-3">
                  <div className="flex gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-podeli-blue" />
                    <p className="text-sm text-podeli-blue">
                      Do odobrenja nove kategorije, vaš predmet će biti svrstan
                      u kategoriju &quot;Ostalo&quot;. Kada administrator odobri
                      kategoriju, moći ćete da ažurirate svoj predmet.
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-cat-name">Naziv kategorije</Label>
                  <Input
                    id="new-cat-name"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="Npr. Sport, Kućni aparati..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreate();
                      }
                    }}
                    autoFocus
                  />
                </div>
                {modalError && (
                  <p className="text-sm text-podeli-red">{modalError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                  >
                    Otkaži
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating || !modalName.trim()}
                    className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
                  >
                    {creating ? "Slanje..." : "Predloži"}
                  </Button>
                </div>
              </>
            )}
            {modalSuccess && (
              <>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="flex gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <p className="text-sm text-green-700">{modalSuccess}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
                  >
                    U redu
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
