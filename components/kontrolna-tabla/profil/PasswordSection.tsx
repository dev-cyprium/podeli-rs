"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordSection() {
  const { user } = useUser();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasPassword = user?.passwordEnabled ?? false;

  const handleUpdatePassword = useCallback(async () => {
    if (!user) return;

    setError(null);
    setSuccess(false);

    // Validation
    if (hasPassword && !currentPassword) {
      setError("Unesite trenutnu lozinku.");
      return;
    }

    if (!newPassword) {
      setError("Unesite novu lozinku.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Nova lozinka mora imati najmanje 8 karaktera.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Lozinke se ne poklapaju.");
      return;
    }

    setIsUpdating(true);

    try {
      if (hasPassword) {
        await user.updatePassword({
          currentPassword,
          newPassword,
        });
      } else {
        // For OAuth-only users, create a password
        await user.updatePassword({
          newPassword,
          signOutOfOtherSessions: false,
        });
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri promeni lozinke."
      );
    } finally {
      setIsUpdating(false);
    }
  }, [user, hasPassword, currentPassword, newPassword, confirmPassword]);

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Lozinka
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPassword && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
            Trenutno nemate postavljenu lozinku. Prijavljujete se putem društvene
            mreže. Možete dodati lozinku za dodatnu sigurnost.
          </div>
        )}

        {hasPassword && (
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Trenutna lozinka</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="newPassword">
            {hasPassword ? "Nova lozinka" : "Lozinka"}
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Najmanje 8 karaktera
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Potvrdi lozinku</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-podeli-red/30 bg-podeli-red/10 px-3 py-2 text-sm text-podeli-red">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700">
            Lozinka je uspešno {hasPassword ? "promenjena" : "postavljena"}.
          </div>
        )}

        <Button
          onClick={handleUpdatePassword}
          disabled={isUpdating || !newPassword || !confirmPassword}
          className="bg-podeli-accent text-podeli-dark hover:bg-podeli-accent/90"
        >
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {hasPassword ? "Promeni lozinku" : "Postavi lozinku"}
        </Button>
      </CardContent>
    </Card>
  );
}
