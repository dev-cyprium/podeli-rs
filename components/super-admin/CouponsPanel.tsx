"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function CouponsPanel() {
  const plans = useQuery(api.plans.list);
  const coupons = useQuery(api.promotionalCodes.listForSuperAdmin);
  const createPromo = useMutation(api.promotionalCodes.createPromotionalCode);
  const [code, setCode] = useState("");
  const [forPlanId, setForPlanId] = useState<Id<"plans"> | "">("");
  const [durationMonths, setDurationMonths] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!forPlanId || !code.trim() || !validUntil) {
      toast.error("Unesite kod, plan i datum isteka.");
      return;
    }
    const months = Number(durationMonths);
    if (!Number.isInteger(months) || months < 1) {
      toast.error("Trajanje mora biti ceo broj meseci (npr. 1, 3, 12).");
      return;
    }
    const ts = new Date(validUntil).getTime();
    if (Number.isNaN(ts)) {
      toast.error("Neispravan datum isteka.");
      return;
    }
    setLoading(true);
    try {
      await createPromo({
        code: code.trim(),
        forPlanId: forPlanId as Id<"plans">,
        durationMonths: months,
        validUntil: ts,
        comment: comment.trim() || undefined,
      });
      toast.success("Promotivni kod je kreiran.");
      setCode("");
      setComment("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška pri kreiranju koda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#02020a]">Kuponi</h1>
        <p className="mt-1 text-muted-foreground">
          Kreiraj i upravljaj promotivnim kodovima.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novi promotivni kod</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Kreiraj kod koji korisnici mogu uneti pri nadogradnji plana.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="code">Kod</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="npr. POGODA2025"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <select
                id="plan"
                value={forPlanId}
                onChange={(e) => setForPlanId(e.target.value as Id<"plans">)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Izaberi plan</option>
                {plans?.map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name} ({plan.slug})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMonths">Trajanje plana (meseci)</Label>
              <Input
                id="durationMonths"
                type="number"
                min={1}
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                placeholder="npr. 1, 3, 12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Važi do</Label>
              <Input
                id="validUntil"
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Komentar (opciono)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Interna napomena"
                rows={2}
              />
            </div>
            <Button type="submit" disabled={loading} className="bg-[#f0a202] hover:bg-[#f0a202]/90">
              {loading ? "Kreiranje…" : "Kreiraj kod"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promotivni kodovi</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Lista svih kodova. Sortirano po datumu isteka (najskoriji prvi).
          </p>
        </CardHeader>
        <CardContent>
          {coupons === undefined ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f0a202] border-t-transparent" />
            </div>
          ) : coupons.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nema promotivnih kodova.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Kod</th>
                    <th className="pb-3 pr-4 font-medium">Plan</th>
                    <th className="pb-3 pr-4 font-medium">Meseci</th>
                    <th className="pb-3 pr-4 font-medium">Važi do</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Iskorišćen od</th>
                    <th className="pb-3 font-medium">Komentar</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c._id} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-mono font-medium text-[#02020a]">
                        {c.code}
                      </td>
                      <td className="py-3 pr-4">{c.planName}</td>
                      <td className="py-3 pr-4">
                        {c.durationMonths != null ? `${c.durationMonths} meseci` : "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(c.validUntil).toLocaleDateString("sr-RS", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        {c.isUsed ? (
                          <Badge className="bg-muted text-muted-foreground">
                            Iskorišćen
                          </Badge>
                        ) : (
                          <Badge className="bg-[#006992]/10 text-[#006992] border-[#006992]/20">
                            Aktivan
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {c.isUsed
                          ? c.usedByDisplayName ?? c.usedBy ?? "—"
                          : "—"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {c.comment ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
