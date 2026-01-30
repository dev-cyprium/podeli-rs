"use client";

import { useUser } from "@clerk/nextjs";
import { Bell, Trash2, ArrowRight, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatSerbianDate } from "@/lib/serbian-date";
import { cn } from "@/lib/utils";

function formatRelativeTime(createdAt: number): string {
  const now = Date.now();
  const diffMs = now - createdAt;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "upravo";
  if (diffMins < 60) return `pre ${diffMins} min`;
  if (diffHours < 24) return `pre ${diffHours} h`;
  if (diffDays < 2) return "juče";
  if (diffDays < 7) return `pre ${diffDays} dana`;
  return formatSerbianDate(createdAt, "short");
}

type NotificationType = "booking_pending" | "booking_approved" | "booking_rejected" | "plan_changed" | "system";

function getNotificationIcon(type?: NotificationType) {
  switch (type) {
    case "booking_approved":
      return <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />;
    case "booking_rejected":
      return <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />;
    case "booking_pending":
      return <Clock className="h-4 w-4 flex-shrink-0 text-amber-500" />;
    case "plan_changed":
      return <Sparkles className="h-4 w-4 flex-shrink-0 text-blue-500" />;
    default:
      return null;
  }
}

export function NotificationBell() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const notifications = useQuery(api.notifications.listForUser);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteAll = useMutation(api.notifications.deleteAll);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isSignedIn) {
    return null;
  }

  const unreadCount =
    notifications?.filter((n) => !n.read).length ?? 0;

  const handleNotificationClick = (notification: NonNullable<typeof notifications>[number]) => {
    markAsRead({ notificationId: notification._id });
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead({});
    setOpen(false);
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await deleteAll({});
      setOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 min-h-[44px] min-w-[44px] touch-manipulation rounded-lg bg-transparent text-[#02020a] hover:bg-[#f0a202]/10 hover:text-[#f0a202] focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Obaveštenja"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#dd1c1a] px-1 text-[10px] font-medium text-white"
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="max-w-[min(90vw,22rem)] w-[min(90vw,22rem)] overflow-hidden rounded-md border border-border bg-[#f8f7ff] p-0 text-[#02020a] shadow-md"
      >
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-sm font-semibold">Obaveštenja</h3>
        </div>
        <div className="overflow-hidden">
          {notifications === undefined ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Učitavanje…
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nema novih obaveštenja
            </div>
          ) : (
            <ul className="min-w-0 py-1">
              {notifications.map((notification) => (
                <li key={notification._id} className="min-w-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "group flex w-full min-w-0 flex-col items-start gap-0.5 rounded-none px-4 py-3 text-left text-sm font-normal transition-colors min-h-[44px] touch-manipulation h-auto whitespace-normal",
                      "bg-transparent text-[#02020a] hover:bg-[#f0a202]/10 focus:bg-[#f0a202]/10 focus-visible:ring-0 focus-visible:ring-offset-0",
                      !notification.read && "bg-[#f0a202]/5"
                    )}
                  >
                    <span className="flex w-full min-w-0 items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <span className="flex-1 min-w-0 wrap-break-word whitespace-normal text-left text-[#02020a]">
                        {notification.message}
                      </span>
                      {notification.link && (
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </span>
                    <span className={cn(
                      "text-left text-xs text-muted-foreground",
                      notification.type && "ml-6"
                    )}>
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {notifications && notifications.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="flex gap-2 p-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-center rounded-md bg-transparent text-[#006992] hover:bg-[#006992]/10 hover:text-[#006992] focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={handleMarkAllAsRead}
                >
                  Označi sve kao pročitano
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "justify-center rounded-md bg-transparent text-[#dd1c1a] hover:bg-[#dd1c1a]/10 hover:text-[#dd1c1a] focus-visible:ring-0 focus-visible:ring-offset-0",
                      unreadCount > 0 ? "flex-1" : "w-full"
                    )}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Obriši sve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Obriši sva obaveštenja?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ova radnja je nepovratna. Sva vaša obaveštenja će biti trajno obrisana.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Otkaži</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAll}
                      disabled={isDeleting}
                      className="bg-[#dd1c1a] text-white hover:bg-[#dd1c1a]/90"
                    >
                      {isDeleting ? "Brisanje..." : "Obriši"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
