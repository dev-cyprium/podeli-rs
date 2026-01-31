"use client";

import { useState, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const CONFIRMATION_TEXT = "OBRIŠI MOJ NALOG";

export function DeleteAccountSection() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCloseDialog = useCallback(() => {
    setShowConfirmDialog(false);
    setConfirmText("");
    setError(null);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;

    if (confirmText !== CONFIRMATION_TEXT) {
      setError(`Unesite "${CONFIRMATION_TEXT}" da potvrdite.`);
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await user.delete();
      // Sign out and redirect to home
      await signOut({ redirectUrl: "/" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri brisanju naloga."
      );
      setIsDeleting(false);
    }
  }, [user, confirmText, signOut]);

  if (!user) return null;

  return (
    <>
      <Card className="border-podeli-red/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-podeli-red">
            <AlertTriangle className="h-5 w-5" />
            Opasna zona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-podeli-red/20 bg-podeli-red/5 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Brisanje naloga je <strong>trajno i nepovratno</strong>. Svi vaši podaci,
              uključujući predmete, rezervacije, ocene i poruke, biće obrisani.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowConfirmDialog(true)}
            className="border-podeli-red text-podeli-red hover:bg-podeli-red/10 hover:text-podeli-red"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Obriši nalog
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-podeli-red">
              <AlertTriangle className="h-5 w-5" />
              Potvrda brisanja naloga
            </DialogTitle>
            <DialogDescription>
              Ova radnja je <strong>trajna i nepovratna</strong>. Svi vaši podaci će biti
              obrisani i nećete moći da ih povratite.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-podeli-red/20 bg-podeli-red/5 px-4 py-3">
              <p className="text-sm font-medium text-podeli-dark">
                Šta će biti obrisano:
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                <li>Vaš profil i lični podaci</li>
                <li>Svi vaši predmeti</li>
                <li>Sve vaše rezervacije</li>
                <li>Sve vaše ocene</li>
                <li>Sve vaše poruke</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmDelete">
                Unesite <strong>{CONFIRMATION_TEXT}</strong> da potvrdite
              </Label>
              <Input
                id="confirmDelete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRMATION_TEXT}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-podeli-red/30 bg-podeli-red/10 px-3 py-2 text-sm text-podeli-red">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isDeleting}>
              Otkaži
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmText !== CONFIRMATION_TEXT}
              className="bg-podeli-red text-white hover:bg-podeli-red/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Trajno obriši nalog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
