"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => Promise<void>;
}

function ToggleRow({ label, description, checked, onCheckedChange }: ToggleRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (value: boolean) => {
    setIsUpdating(true);
    try {
      await onCheckedChange(value);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="space-y-0.5 pr-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <Switch
          checked={checked}
          onCheckedChange={handleChange}
          disabled={isUpdating}
        />
      </div>
    </div>
  );
}

export function EmailNotificationsSection() {
  const preferences = useQuery(api.notificationPreferences.getMyPreferences);
  const updatePreferences = useMutation(api.notificationPreferences.updatePreferences);

  if (preferences === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email obaveštenja</CardTitle>
          <p className="text-sm text-muted-foreground">Učitavanje...</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (preferences === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email obaveštenja</CardTitle>
          <p className="text-sm text-muted-foreground">Učitavanje podešavanja...</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email obaveštenja</CardTitle>
        <p className="text-sm text-muted-foreground">Želim da primam email obaveštenja kada:</p>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          <ToggleRow
            label="Kada neko zahteva rezervaciju"
            description="Primite email kada neko pošalje zahtev za vaš predmet"
            checked={preferences.emailOnBookingRequest}
            onCheckedChange={async (checked) => {
              await updatePreferences({ emailOnBookingRequest: checked });
            }}
          />
          <ToggleRow
            label="Kada dobijem novu poruku"
            description="Primite email kada dobijete novu poruku u četu"
            checked={preferences.emailOnNewMessage}
            onCheckedChange={async (checked) => {
              await updatePreferences({ emailOnNewMessage: checked });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
