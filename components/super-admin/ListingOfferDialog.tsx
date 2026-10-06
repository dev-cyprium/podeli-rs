"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  ItemWizardForm,
  type ItemFormData,
} from "@/components/kontrolna-tabla/predmeti/ItemWizardForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  offerStatuses,
  createOfferToken,
  offerEmail,
  offerPath,
} from "@/lib/listing-offers";
import { formatLocation } from "@/lib/item-location";
import { extractShortId, generateSlug } from "@/lib/item-url";
import { getItemUrl } from "@/lib/utils";
import { toast } from "sonner";

export function ListingOfferDialog({
  prospect,
  onClose,
  onEditFirm,
}: {
  prospect: Doc<"prospects">;
  onClose: () => void;
  onEditFirm: () => void;
}) {
  const offer = useQuery(api.listingOffers.getForProspect, {
    prospectId: prospect._id,
  });
  const save = useMutation(api.listingOffers.saveDraft);
  const createLink = useMutation(api.listingOffers.createLink);
  const revoke = useMutation(api.listingOffers.revokeLink);
  const markSent = useMutation(api.listingOffers.markSent);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [link, setLink] = useState("");

  async function perform(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      await action();
      toast.success(message);
    } catch (err) {
      setError(
        err instanceof ConvexError && typeof err.data === "string"
          ? err.data
          : "Radnja nije uspela. Pokušajte ponovo.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function saveDraft(data: ItemFormData) {
    await save({ prospectId: prospect._id, data });
    setEditing(false);
    setLink("");
    toast.success("Nejavni nacrt je sačuvan.");
  }
  function urlFor(token: string) {
    return `${window.location.origin}${offerPath(token)}`;
  }
  const locked = Boolean(offer?.claimedBy);
  const live = Boolean(
    offer?.token && offer.expiresAt && offer.expiresAt > Date.now(),
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="ph-no-capture max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ponuda za {prospect.name}</DialogTitle>
          <DialogDescription>
            Pripremi predlog oglasa. Ponuđač potvrđuje podatke i dostupnost pre
            javne objave.
          </DialogDescription>
        </DialogHeader>
        {offer === undefined ? (
          <p role="status">Učitavanje ponude…</p>
        ) : !locked && (editing || !offer) ? (
          <>
            <p className="rounded-lg bg-muted p-3 text-sm">
              Termine unosi ponuđač. Fotografije i lokaciju možeš dopuniti
              kasnije. Čuvanje izmena poništava prethodni link.
            </p>
            <ItemWizardForm
              key={offer?.updatedAt ?? "new"}
              mode="draft"
              item={
                offer?.data ?? {
                  title: "",
                  description: "",
                  category: prospect.category,
                  priceByAgreement: true,
                  pricePerDay: 0,
                  deliveryMethods: ["licno"],
                }
              }
              onSave={saveDraft}
            />
            {offer && (
              <Button variant="outline" onClick={() => setEditing(false)}>
                Odustani od izmene nacrta
              </Button>
            )}
          </>
        ) : (
          offer && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-podeli-accent">
                  {offerStatuses[offer.status]}
                </p>
                <h2 className="mt-2 text-lg font-semibold">
                  {offer.data.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {offer.data.category} · {formatLocation(offer.data)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {offer.data.description}
                </p>
                <p className="mt-2 text-sm">
                  {offer.data.priceByAgreement
                    ? "Cena po dogovoru"
                    : `${offer.data.pricePerDay.toLocaleString("sr-Latn-RS")} RSD / dan`}{" "}
                  · {offer.data.images.length} fotografija
                </p>
              </div>
              {locked ? (
                <p className="rounded-lg bg-muted p-3 text-sm">
                  Ponuđač je preuzeo ponudu. Sada je uređuje svojim nalogom.{" "}
                  {offer.status === "published"
                    ? "Oglas je objavljen."
                    : "Oglas još nije javno objavljen."}
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditing(true)}
                      disabled={busy}
                    >
                      Izmeni nacrt
                    </Button>
                    <Button
                      disabled={busy || !prospect.email}
                      onClick={() =>
                        perform(
                          () =>
                            createLink({
                              id: offer._id,
                              token: createOfferToken(),
                            }),
                          "Link ponude je napravljen.",
                        )
                      }
                    >
                      {live ? "Napravi novi link" : "Napravi link ponude"}
                    </Button>
                  </div>
                  {!prospect.email && (
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      Za preuzimanje ponude potreban je mejl ponuđača. Postojeći
                      telefon ostaje sačuvan.{" "}
                      <Button variant="link" onClick={onEditFirm}>
                        Dopuni mejl firme
                      </Button>
                    </div>
                  )}
                  {offer.token && (
                    <div className="space-y-3 rounded-lg border p-4">
                      <p className="text-sm">
                        Ponuda je namenjena adresi{" "}
                        <strong>{offer.recipientEmail}</strong>. Link važi do{" "}
                        {new Intl.DateTimeFormat("sr-Latn-RS", {
                          timeZone: "Europe/Belgrade",
                          dateStyle: "medium",
                        }).format(offer.expiresAt!)}
                        .
                      </p>
                      {!live ? (
                        <p role="alert" className="text-sm text-destructive">
                          Link je istekao. Napravi novi pre slanja.
                        </p>
                      ) : (
                        <>
                          {prospect.email?.trim().toLowerCase() !==
                            offer.recipientEmail && (
                            <p className="text-sm text-destructive">
                              Mejl firme je promenjen. Napravi novi link za novu
                              adresu.
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                perform(async () => {
                                  const url = urlFor(offer.token!);
                                  setLink(url);
                                  await navigator.clipboard.writeText(url);
                                }, "Link je kopiran.")
                              }
                            >
                              Kopiraj link
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const url = urlFor(offer.token!);
                                setLink(url);
                                window.open(
                                  url,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                            >
                              Pregled ponude
                            </Button>
                            <Button
                              variant="outline"
                              disabled={
                                prospect.email?.trim().toLowerCase() !==
                                offer.recipientEmail
                              }
                              onClick={() => {
                                const message = offerEmail(
                                  prospect.name,
                                  offer.data.title,
                                  urlFor(offer.token!),
                                );
                                window.location.href = `mailto:${encodeURIComponent(offer.recipientEmail!)}?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}`;
                              }}
                            >
                              Otvori pripremljen mejl
                            </Button>
                          </div>
                          {link && (
                            <Input
                              aria-label="Link ponude"
                              readOnly
                              value={link}
                              onFocus={(e) => e.target.select()}
                            />
                          )}
                          <p className="text-xs text-muted-foreground">
                            Kopiranje i otvaranje mejla ne šalju ponudu. Posle
                            slanja zabeleži da je link poslat.
                          </p>
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="offer-follow-up">
                                Podsetnik za odgovor (opciono)
                              </Label>
                              <Input
                                id="offer-follow-up"
                                type="date"
                                value={followUpDate}
                                onChange={(e) =>
                                  setFollowUpDate(e.target.value)
                                }
                              />
                            </div>
                            <Button
                              disabled={busy || offer.status === "sent"}
                              onClick={() =>
                                perform(
                                  () =>
                                    markSent({ id: offer._id, followUpDate }),
                                  "Slanje ponude je zabeleženo.",
                                )
                              }
                            >
                              {offer.status === "sent"
                                ? "Slanje je zabeleženo"
                                : "Označi kao poslato"}
                            </Button>
                          </div>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          perform(
                            () => revoke({ id: offer._id }),
                            "Link je povučen.",
                          )
                        }
                      >
                        Povuci link
                      </Button>
                    </div>
                  )}
                </>
              )}
              {offer.itemId && (
                <Button asChild variant="outline">
                  <a
                    href={getItemUrl({
                      shortId: extractShortId(offer.itemId!),
                      slug: generateSlug(offer.data.title),
                    })}
                  >
                    Otvori javnu ponudu
                  </a>
                </Button>
              )}
            </div>
          )
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Zatvori
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
