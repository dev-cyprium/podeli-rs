"use client";

import { useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { User, Camera, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileSection() {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleUpdateName = useCallback(async () => {
    if (!user) return;

    const hasChanges = firstName !== (user.firstName ?? "") || lastName !== (user.lastName ?? "");
    if (!hasChanges) return;

    setIsUpdatingName(true);
    setNameError(null);
    setNameSuccess(false);

    try {
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : "Greška pri ažuriranju imena."
      );
    } finally {
      setIsUpdatingName(false);
    }
  }, [user, firstName, lastName]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setImageError("Molimo izaberite sliku.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImageError("Slika mora biti manja od 10MB.");
      return;
    }

    setIsUpdatingImage(true);
    setImageError(null);

    try {
      await user.setProfileImage({ file });
    } catch (err) {
      setImageError(
        err instanceof Error ? err.message : "Greška pri učitavanju slike."
      );
    } finally {
      setIsUpdatingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [user]);

  const handleRemoveImage = useCallback(async () => {
    if (!user) return;

    setIsUpdatingImage(true);
    setImageError(null);

    try {
      await user.setProfileImage({ file: null });
    } catch (err) {
      setImageError(
        err instanceof Error ? err.message : "Greška pri uklanjanju slike."
      );
    } finally {
      setIsUpdatingImage(false);
    }
  }, [user]);

  if (!user) return null;

  const hasChanges = firstName !== (user.firstName ?? "") || lastName !== (user.lastName ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Image */}
        <div className="space-y-3">
          <Label>Profilna slika</Label>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Profilna slika"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              {isUpdatingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdatingImage}
              >
                <Camera className="mr-2 h-4 w-4" />
                {user.imageUrl ? "Promeni sliku" : "Dodaj sliku"}
              </Button>
              {user.imageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={isUpdatingImage}
                  className="text-podeli-red hover:text-podeli-red"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Ukloni
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          {imageError && (
            <p className="text-sm text-podeli-red">{imageError}</p>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Ime</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setNameSuccess(false);
              }}
              placeholder="Vaše ime"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Prezime</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setNameSuccess(false);
              }}
              placeholder="Vaše prezime"
            />
          </div>
        </div>

        {nameError && (
          <div className="rounded-lg border border-podeli-red/30 bg-podeli-red/10 px-3 py-2 text-sm text-podeli-red">
            {nameError}
          </div>
        )}

        {nameSuccess && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700">
            Ime je uspešno ažurirano.
          </div>
        )}

        <Button
          onClick={handleUpdateName}
          disabled={!hasChanges || isUpdatingName}
          className="bg-podeli-accent text-podeli-dark hover:bg-podeli-accent/90"
        >
          {isUpdatingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sačuvaj izmene
        </Button>
      </CardContent>
    </Card>
  );
}
