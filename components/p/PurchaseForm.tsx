"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function PurchaseForm({ item }: { item: Doc<"items"> }) {
  const { isSignedIn } = useAuth();
  const create = useMutation(api.purchases.create);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kupovina · {item.salePrice?.toFixed(0)} RSD</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <p>
            Upit je poslat. Odgovor i ishod pratite u{" "}
            <Link
              className="text-podeli-blue underline"
              href="/kontrolna-tabla/zakupi"
            >
              svojim upitima
            </Link>
            .
          </p>
        ) : (
          <>
            <label htmlFor="purchase-question" className="text-sm font-medium">
              Poruka ponuđaču
            </label>
            <Textarea
              id="purchase-question"
              maxLength={2000}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Pitajte o stanju predmeta, preuzimanju i uslovima kupovine."
            />
            <p className="text-sm text-muted-foreground">
              Kupovina ne zahteva datume. Plaćanje i preuzimanje dogovarate
              direktno sa ponuđačem.
            </p>
            {!isSignedIn ? (
              <p>Prijavite se da biste poslali upit za kupovinu.</p>
            ) : (
              <Button
                disabled={busy || !question.trim()}
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    await create({ itemId: item._id, question });
                    setSent(true);
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Slanje upita nije uspelo.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Slanje..." : "Pošalji upit za kupovinu"}
              </Button>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-podeli-red">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
