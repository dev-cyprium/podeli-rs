"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import type { SessionWithActivitiesResource } from "@clerk/types";
import { Monitor, Smartphone, Tablet, LogOut, Loader2, MapPin, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getDeviceIcon(deviceType: string | undefined) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <Smartphone className="h-5 w-5" />;
    case "tablet":
      return <Tablet className="h-5 w-5" />;
    default:
      return <Monitor className="h-5 w-5" />;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SessionsSection() {
  const { user } = useUser();
  const { session: currentSession } = useSession();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionWithActivitiesResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userSessions = await user.getSessions();
      setSessions(userSessions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri učitavanju sesija."
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  if (!user) return null;

  async function handleRevokeSession(session: SessionWithActivitiesResource) {
    setRevokingId(session.id);
    setError(null);

    try {
      await session.revoke();
      // Remove from local state
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri odjavljivanju sesije."
      );
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Aktivne sesije
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pregled uređaja na kojima ste prijavljeni. Možete odjaviti bilo koju sesiju.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Nema aktivnih sesija.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const isCurrentSession = session.id === currentSession?.id;
              const isRevoking = revokingId === session.id;
              const latestActivity = session.latestActivity;
              const deviceType = latestActivity?.deviceType;
              const browserName = latestActivity?.browserName;
              const city = latestActivity?.city;
              const country = latestActivity?.country;

              return (
                <div
                  key={session.id}
                  className={`rounded-lg border px-4 py-3 ${
                    isCurrentSession
                      ? "border-podeli-accent bg-podeli-accent/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-muted-foreground">
                        {getDeviceIcon(deviceType)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {browserName || "Nepoznat pretraživač"}
                          </p>
                          {isCurrentSession && (
                            <span className="rounded-full bg-podeli-accent px-2 py-0.5 text-xs font-medium text-podeli-dark">
                              Trenutna
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {(city || country) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[city, country].filter(Boolean).join(", ")}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(session.lastActiveAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!isCurrentSession && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session)}
                        disabled={isRevoking}
                        className="text-podeli-red hover:text-podeli-red shrink-0"
                        title="Odjavi ovu sesiju"
                      >
                        {isRevoking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
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
      </CardContent>
    </Card>
  );
}
