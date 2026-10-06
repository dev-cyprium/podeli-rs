"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { InquirySupport } from "@/components/booking/InquirySupport";
import { getItemUrl } from "@/lib/utils";
const statuses = {
  pending: "Čeka odgovor",
  accepted: "Prihvaćen upit",
  rejected: "Odbijen upit",
  purchased: "Kupljeno",
  not_purchased: "Kupovina nije realizovana",
};

export function PurchaseInquiries({ role }: { role: "owner" | "buyer" }) {
  const { isAuthenticated } = useConvexAuth();
  const inquiries = useQuery(
    api.purchases.listMine,
    isAuthenticated ? { role } : "skip",
  );
  if (!isAuthenticated) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {role === "owner" ? "Upiti za prodaju" : "Moji upiti za kupovinu"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {inquiries === undefined ? (
          <p>Učitavanje upita...</p>
        ) : inquiries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nema upita za kupovinu.
          </p>
        ) : (
          inquiries.map((inquiry) => (
            <InquiryCard key={inquiry._id} inquiry={inquiry} role={role} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
function InquiryCard({
  inquiry,
  role,
}: {
  inquiry: Doc<"purchaseInquiries"> & {
    item: Pick<Doc<"items">, "_id" | "title" | "shortId" | "slug"> | null;
  };
  role: "owner" | "buyer";
}) {
  const respond = useMutation(api.purchases.respond);
  const recordOutcome = useMutation(api.purchases.recordOutcome);
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Izmena nije uspela.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap justify-between gap-2">
        {inquiry.item ? (
          <Link className="font-semibold" href={getItemUrl(inquiry.item)}>
            {inquiry.item.title}
          </Link>
        ) : (
          <span>Predmet nije dostupan</span>
        )}
        <span className="text-sm font-medium">{statuses[inquiry.status]}</span>
      </div>
      <p className="text-sm">
        Prodajna cena u trenutku upita: {inquiry.salePrice.toFixed(0)} RSD
      </p>
      <p className="whitespace-pre-wrap text-sm">
        <strong>Upit:</strong> {inquiry.question}
      </p>
      {inquiry.response && (
        <p className="whitespace-pre-wrap text-sm">
          <strong>Odgovor ponuđača:</strong> {inquiry.response}
        </p>
      )}
      {role === "owner" && inquiry.status === "pending" && (
        <>
          <label
            htmlFor={`response-${inquiry._id}`}
            className="text-sm font-medium"
          >
            Odgovor kupcu
          </label>
          <Textarea
            id={`response-${inquiry._id}`}
            value={response}
            maxLength={2000}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Napišite odgovor i način kontakta za dogovor."
          />
          <div className="flex gap-2">
            {(["accepted", "rejected"] as const).map((decision) => (
              <Button
                key={decision}
                variant="outline"
                disabled={busy || !response.trim()}
                onClick={() =>
                  run(() => respond({ id: inquiry._id, decision, response }))
                }
              >
                {decision === "accepted" ? "Prihvati upit" : "Odbij upit"}
              </Button>
            ))}
          </div>
        </>
      )}
      {role === "buyer" && inquiry.status === "accepted" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Nakon dogovora zabeležite ishod. „Kupljeno“ označava predmet kao
            prodat i zatvara ostale upite.
          </p>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={busy}>Kupljeno</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Potvrda kupovine</AlertDialogTitle>
                  <AlertDialogDescription>
                    Potvrđujete da ste kupili predmet. Oglas će biti označen kao
                    prodat, a ostali otvoreni upiti zatvoreni. Ova radnja se ne
                    može poništiti.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Otkaži</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        recordOutcome({ id: inquiry._id, purchased: true }),
                      )
                    }
                  >
                    Da, kupljeno
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                run(() => recordOutcome({ id: inquiry._id, purchased: false }))
              }
            >
              Nije kupljeno
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-podeli-red">
          {error}
        </p>
      )}
      {role === "buyer" && <InquirySupport reference={inquiry._id} />}
    </div>
  );
}
