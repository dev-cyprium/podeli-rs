"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useClerk } from "@clerk/nextjs";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ItemWizardForm,
  type ItemFormData,
} from "@/components/kontrolna-tabla/predmeti/ItemWizardForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OfferEmailAuth } from "./OfferEmailAuth";

export function OfferAcceptanceEditor({
  token,
  data,
  recipientHint,
  canClaim,
}: {
  token: string;
  data: ItemFormData;
  recipientHint: string;
  canClaim: boolean;
}) {
  const router = useRouter();
  const clerk = useClerk();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.profiles.getMyProfile,
    isAuthenticated ? {} : "skip",
  );
  const publish = useMutation(api.listingOffers.claimAndPublish);
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  const staged = useRef(
    new Map<string, { file: File; url: string; storageId?: Id<"_storage"> }>(),
  );
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<ItemFormData | null>(null);
  const [contact, setContact] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const photos = staged.current;
    return () => {
      for (const photo of photos.values()) URL.revokeObjectURL(photo.url);
    };
  }, []);

  async function stage(file: File) {
    const id = `local-${crypto.randomUUID()}`;
    const url = URL.createObjectURL(file);
    staged.current.set(id, { file, url });
    setUrls((previous) => ({ ...previous, [id]: url }));
    return id as Id<"_storage">;
  }
  async function finish() {
    if (!pending || !contact || !canClaim || !profile) return;
    setBusy(true);
    setError("");
    try {
      const images: Id<"_storage">[] = [];
      const points: NonNullable<ItemFormData["imageFocalPoints"]> = {};
      for (const id of pending.images) {
        const photo = staged.current.get(id);
        let storageId = id;
        if (photo) {
          if (!photo.storageId) {
            const url = await generateUploadUrl();
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": photo.file.type },
              body: photo.file,
            });
            if (!response.ok)
              throw new Error("Fotografija nije poslata. Pokušajte ponovo.");
            photo.storageId = (await response.json()).storageId;
          }
          storageId = photo.storageId!;
        }
        images.push(storageId);
        points[storageId] = pending.imageFocalPoints?.[id] ?? { x: 50, y: 50 };
      }
      await publish({
        token,
        data: {
          ...pending,
          images,
          imageFocalPoints: points,
          imageFocalPoint: points[images[0]],
        },
        confirmEmailContact: contact,
      });
      router.push("/kontrolna-tabla/predmeti");
    } catch (err) {
      setError(
        err instanceof ConvexError && typeof err.data === "string"
          ? err.data
          : err instanceof Error
            ? err.message
            : "Objavljivanje nije uspelo. Pokušajte ponovo.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Izmene i fotografije ostaju u ovom tabu do potvrde mejla. Oglas je javan
        tek kada potvrdite objavu.
      </p>
      <ItemWizardForm
        item={data}
        uploadPhoto={stage}
        localImageUrls={urls}
        preferredContactTypes={["email", "chat"]}
        submitLabel="Nastavi na potvrdu i objavu"
        onSave={async (value) => {
          setPending(value);
          setError("");
        }}
      />
      <Dialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open && !busy) setPending(null);
        }}
      >
        <DialogContent
          accessibleTitle="Potvrdi i objavi ponudu"
          accessibleDescription="Potvrdite mejl i način kontakta pre objavljivanja."
        >
          <DialogHeader>
            <DialogTitle>Potvrdi i objavi ponudu</DialogTitle>
          </DialogHeader>
          {!isAuthenticated ? (
            <OfferEmailAuth recipientHint={recipientHint} />
          ) : !canClaim ? (
            <div className="space-y-3">
              <p role="alert">
                Ponuda je namenjena mejlu {recipientHint}. Prijavite se
                odgovarajućim nalogom. Vaše izmene ostaju u ovom tabu.
              </p>
              <Button
                variant="outline"
                onClick={() => void clerk.signOut(() => {})}
              >
                Promeni nalog
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p>Mejl je potvrđen. Proverite ponudu i potvrdite objavu.</p>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={contact}
                  onChange={(e) => setContact(e.target.checked)}
                />
                <span>
                  Želim da me zainteresovani korisnici kontaktiraju preko mejla
                  i chata. Postojeća podešavanja kontakta na nalogu ostaju
                  sačuvana.
                </span>
              </label>
              <Button
                disabled={busy || !profile || !contact}
                onClick={() => void finish()}
              >
                {busy
                  ? "Objavljivanje…"
                  : !profile
                    ? "Priprema naloga…"
                    : "Potvrdi i objavi oglas"}
              </Button>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
