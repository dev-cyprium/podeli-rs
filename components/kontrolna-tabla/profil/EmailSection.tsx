"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import type { EmailAddressResource } from "@clerk/types";
import { Mail, Plus, Star, Trash2, Loader2, Check, X } from "lucide-react";
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

export function EmailSection() {
  const { user } = useUser();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmailAddress, setPendingEmailAddress] = useState<EmailAddressResource | null>(null);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [deletingEmailId, setDeletingEmailId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<"email" | "code">("email");

  const handleCloseDialog = useCallback(() => {
    setShowAddDialog(false);
    setNewEmail("");
    setVerificationCode("");
    setPendingEmailAddress(null);
    setVerificationStep("email");
    setError(null);
  }, []);

  const handleAddEmail = useCallback(async () => {
    if (!user) return;

    if (!newEmail.trim()) {
      setError("Unesite email adresu.");
      return;
    }

    setIsAddingEmail(true);
    setError(null);

    try {
      const emailAddress = await user.createEmailAddress({ email: newEmail.trim() });
      await emailAddress.prepareVerification({ strategy: "email_code" });
      setPendingEmailAddress(emailAddress);
      setVerificationStep("code");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri dodavanju email adrese."
      );
    } finally {
      setIsAddingEmail(false);
    }
  }, [user, newEmail]);

  const handleVerifyEmail = useCallback(async () => {
    if (!user) return;

    if (!verificationCode.trim() || !pendingEmailAddress) {
      setError("Unesite verifikacioni kod.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await pendingEmailAddress.attemptVerification({ code: verificationCode.trim() });
      // Refresh user data
      await user.reload();
      handleCloseDialog();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Neispravan verifikacioni kod."
      );
    } finally {
      setIsVerifying(false);
    }
  }, [user, verificationCode, pendingEmailAddress, handleCloseDialog]);

  const handleResendCode = useCallback(async () => {
    if (!pendingEmailAddress) return;

    setError(null);
    try {
      await pendingEmailAddress.prepareVerification({ strategy: "email_code" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri slanju koda."
      );
    }
  }, [pendingEmailAddress]);

  const handleSetPrimary = useCallback(async (emailId: string) => {
    if (!user) return;

    setSettingPrimaryId(emailId);
    setError(null);

    try {
      await user.update({ primaryEmailAddressId: emailId });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri postavljanju primarne adrese."
      );
    } finally {
      setSettingPrimaryId(null);
    }
  }, [user]);

  const handleDeleteEmail = useCallback(async (emailAddress: EmailAddressResource) => {
    setDeletingEmailId(emailAddress.id);
    setError(null);

    try {
      await emailAddress.destroy();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri brisanju email adrese."
      );
    } finally {
      setDeletingEmailId(null);
    }
  }, []);

  if (!user) return null;

  const emailAddresses = user.emailAddresses;
  const primaryEmailId = user.primaryEmailAddressId;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Email adrese</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Dodaj email
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {emailAddresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nemate dodatih email adresa.
            </p>
          ) : (
            <div className="space-y-2">
              {emailAddresses.map((email) => {
                const isPrimary = email.id === primaryEmailId;
                const isVerified = email.verification?.status === "verified";
                const isDeleting = deletingEmailId === email.id;
                const isSettingPrimary = settingPrimaryId === email.id;

                return (
                  <div
                    key={email.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {email.emailAddress}
                        </p>
                        <div className="flex items-center gap-2">
                          {isPrimary && (
                            <span className="text-xs text-podeli-accent font-medium">
                              Primarna
                            </span>
                          )}
                          {isVerified ? (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <Check className="h-3 w-3" />
                              Verifikovana
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <X className="h-3 w-3" />
                              Nije verifikovana
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isPrimary && isVerified && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetPrimary(email.id)}
                          disabled={isSettingPrimary}
                          title="Postavi kao primarnu"
                        >
                          {isSettingPrimary ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {!isPrimary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEmail(email)}
                          disabled={isDeleting}
                          className="text-podeli-red hover:text-podeli-red"
                          title="Obriši"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && !showAddDialog && (
            <div className="rounded-lg border border-podeli-red/30 bg-podeli-red/10 px-3 py-2 text-sm text-podeli-red">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verificationStep === "email" ? "Dodaj email adresu" : "Verifikuj email"}
            </DialogTitle>
            <DialogDescription>
              {verificationStep === "email"
                ? "Unesite novu email adresu. Poslaćemo vam verifikacioni kod."
                : `Poslali smo verifikacioni kod na ${pendingEmailAddress?.emailAddress}. Unesite kod ispod.`}
            </DialogDescription>
          </DialogHeader>

          {verificationStep === "email" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email adresa</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@primer.com"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-podeli-red/30 bg-podeli-red/10 px-3 py-2 text-sm text-podeli-red">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verifikacioni kod</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Unesite kod"
                />
              </div>

              <Button
                variant="link"
                className="h-auto p-0 text-sm"
                onClick={handleResendCode}
              >
                Ponovo pošalji kod
              </Button>

              {error && (
                <div className="rounded-lg border border-podeli-red/30 bg-podeli-red/10 px-3 py-2 text-sm text-podeli-red">
                  {error}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Otkaži
            </Button>
            {verificationStep === "email" ? (
              <Button
                onClick={handleAddEmail}
                disabled={isAddingEmail || !newEmail.trim()}
                className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
              >
                {isAddingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Nastavi
              </Button>
            ) : (
              <Button
                onClick={handleVerifyEmail}
                disabled={isVerifying || !verificationCode.trim()}
                className="bg-podeli-accent text-white hover:bg-podeli-accent/90"
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verifikuj
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
