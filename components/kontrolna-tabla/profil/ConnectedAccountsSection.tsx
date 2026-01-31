"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import type { ExternalAccountResource } from "@clerk/types";
import { Link2, Unlink, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Provider display names and icons in Serbian
const PROVIDER_INFO: Record<string, { name: string; color: string }> = {
  google: { name: "Google", color: "bg-red-500" },
  facebook: { name: "Facebook", color: "bg-blue-600" },
  apple: { name: "Apple", color: "bg-black" },
  github: { name: "GitHub", color: "bg-gray-800" },
  twitter: { name: "Twitter", color: "bg-sky-500" },
  linkedin: { name: "LinkedIn", color: "bg-blue-700" },
  microsoft: { name: "Microsoft", color: "bg-blue-500" },
};

function getProviderInfo(provider: string) {
  return PROVIDER_INFO[provider.toLowerCase()] ?? {
    name: provider.charAt(0).toUpperCase() + provider.slice(1),
    color: "bg-gray-500"
  };
}

export function ConnectedAccountsSection() {
  const { user } = useUser();
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDisconnect = useCallback(async (account: ExternalAccountResource) => {
    if (!user) return;

    // Prevent disconnecting if it's the only way to sign in
    if (user.externalAccounts.length === 1 && !user.passwordEnabled) {
      setError(
        "Ne možete ukloniti jedini način prijave. Prvo dodajte lozinku ili drugu povezanu mrežu."
      );
      return;
    }

    setDisconnectingId(account.id);
    setError(null);

    try {
      await account.destroy();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri uklanjanju naloga."
      );
    } finally {
      setDisconnectingId(null);
    }
  }, [user]);

  if (!user) return null;

  const externalAccounts = user.externalAccounts;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Povezani nalozi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upravljajte društvenim mrežama povezanim sa vašim nalogom.
        </p>

        {externalAccounts.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Nemate povezanih naloga sa društvenih mreža.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {externalAccounts.map((account) => {
              const providerInfo = getProviderInfo(account.provider);
              const isDisconnecting = disconnectingId === account.id;

              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${providerInfo.color} text-white text-xs font-semibold`}
                    >
                      {providerInfo.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{providerInfo.name}</p>
                      {account.emailAddress && (
                        <p className="text-xs text-muted-foreground">
                          {account.emailAddress}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(account)}
                    disabled={isDisconnecting}
                    className="text-podeli-red hover:text-podeli-red"
                    title="Ukloni povezani nalog"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-podeli-red/30 bg-podeli-red/10 px-3 py-2 text-sm text-podeli-red">
            {error}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Za povezivanje novog naloga, odjavite se i prijavite putem željene mreže.
        </p>
      </CardContent>
    </Card>
  );
}
