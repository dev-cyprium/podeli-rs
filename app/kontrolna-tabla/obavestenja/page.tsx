import { Suspense } from "react";
import { NotificationSettings } from "@/components/kontrolna-tabla/notifications/NotificationSettings";
import { BackgroundPattern } from "@/components/kontrolna-tabla/BackgroundPattern";

export default function ObavestenjaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <BackgroundPattern />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-podeli-accent border-t-transparent"></div>
        </div>
      }
    >
      <div className="min-h-screen">
        <BackgroundPattern />
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <NotificationSettings />
        </div>
      </div>
    </Suspense>
  );
}
