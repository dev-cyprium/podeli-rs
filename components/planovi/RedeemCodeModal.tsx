"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface RedeemCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RedeemCodeModal({ open, onOpenChange }: RedeemCodeModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const redeem = useMutation(api.promotionalCodes.redeemPromotionalCode);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("Unesite promotivni kod.");
      return;
    }
    setLoading(true);
    try {
      await redeem({ code: trimmed });
      toast.success("Kod je uspešno unet. Vaš plan je ažuriran.");
      setCode("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška pri unosu koda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        accessibleTitle="Unesi promotivni kod"
        accessibleDescription="Unesite kod koji ste dobili za nadogradnju plana."
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Unesi promotivni kod</DialogTitle>
            <DialogDescription>
              Unesite kod koji ste dobili za nadogradnju plana. Plan će vam biti aktiviran odmah.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="redeem-code" className="sr-only">
              Promotivni kod
            </Label>
            <Input
              id="redeem-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="npr. POGODA2025"
              className="font-mono uppercase"
              autoComplete="off"
              disabled={loading}
            />
          </div>
          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Otkaži
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#f0a202] hover:bg-[#f0a202]/90">
              {loading ? "Unos…" : "Unesi kod"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
