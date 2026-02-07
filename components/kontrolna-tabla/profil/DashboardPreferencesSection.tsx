"use client";

import { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type ModeOption = "podeli" | "zakupi" | "ask";

export function DashboardPreferencesSection() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.profiles.getMyProfile, isAuthenticated ? {} : "skip");
  const updateMode = useMutation(api.profiles.updateDefaultDashboardMode);
  // null = user hasn't interacted yet, use server value
  const [localSelected, setLocalSelected] = useState<ModeOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const serverValue: ModeOption = profile?.defaultDashboardMode ?? "ask";
  const selected = localSelected ?? serverValue;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await updateMode({
      defaultDashboardMode: selected === "ask" ? null : selected,
    });
    setLocalSelected(null);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const options: Array<{ value: ModeOption; label: string }> = [
    { value: "podeli", label: "Podeli" },
    { value: "zakupi", label: "Zakupi" },
    { value: "ask", label: "Uvek pitaj" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-podeli-dark">Kontrolna tabla</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Podrazumevani režim rada pri otvaranju kontrolne table
      </p>

      <div className="mt-4 space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted has-[:checked]:border-podeli-accent has-[:checked]:bg-podeli-accent/5"
          >
            <input
              type="radio"
              name="dashboardMode"
              value={option.value}
              checked={selected === option.value}
              onChange={() => setLocalSelected(option.value)}
              className="h-4 w-4 text-podeli-accent focus:ring-podeli-accent"
            />
            <span className="text-sm font-medium text-podeli-dark">
              {option.label}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
          size="sm"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sačuvaj
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Sačuvano!</span>
        )}
      </div>
    </div>
  );
}
