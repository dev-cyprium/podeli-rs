"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function TimeTravelWidget() {
  const isSuperAdmin = useQuery(api.profiles.getIsCurrentUserSuperAdmin);
  const timeOverride = useQuery(api.debug.getTimeOverride);
  const setTimeOverride = useMutation(api.debug.setTimeOverride);
  const clearTimeOverride = useMutation(api.debug.clearTimeOverride);
  const triggerReminders = useMutation(api.cronHandlers.triggerReturnReminders);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [reminderResult, setReminderResult] = useState<string | null>(null);

  // Only show for super-admins in development
  if (!isSuperAdmin || process.env.NODE_ENV === "production") {
    return null;
  }

  const isTimeOverridden = timeOverride !== null && timeOverride !== undefined;
  const currentOverrideDate = isTimeOverridden && timeOverride
    ? new Date(timeOverride.timestamp).toISOString().split("T")[0]
    : "";

  const handleSetTime = async () => {
    if (!selectedDate) return;
    setIsUpdating(true);
    try {
      // Set to end of day for the selected date
      const timestamp = new Date(selectedDate + "T23:59:59").getTime();
      await setTimeOverride({ timestamp });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to set time:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearTime = async () => {
    setIsUpdating(true);
    try {
      await clearTimeOverride({});
      setSelectedDate("");
    } catch (error) {
      console.error("Failed to clear time:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickJump = async (days: number) => {
    setIsUpdating(true);
    try {
      // Add days to current override time, or start from now if no override
      const baseTime = timeOverride?.timestamp ?? Date.now();
      const target = baseTime + days * 24 * 60 * 60 * 1000;
      await setTimeOverride({ timestamp: target });
    } catch (error) {
      console.error("Failed to set time:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTriggerReminders = async () => {
    setIsUpdating(true);
    setReminderResult(null);
    try {
      const result = await triggerReminders({});
      const debugInfo = result.debug;
      let msg = `Poslato: ${result.remindersSent}\n`;
      msg += `Vreme: ${debugInfo.currentTime}\n`;
      msg += `Isporučeno: ${debugInfo.bookingsFound}, već podsetnik: ${debugInfo.bookingsAlreadyReminded}\n`;
      if (debugInfo.bookingsChecked.length > 0) {
        for (const b of debugInfo.bookingsChecked) {
          msg += `endDate: ${b.endDate}, sati do: ${b.hoursUntilReturnDay}, šalje: ${b.wouldSend}\n`;
        }
      }
      setReminderResult(msg);
      console.log("Reminder debug:", result);
    } catch (error) {
      console.error("Failed to trigger reminders:", error);
      setReminderResult("Greška");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-10 w-10 rounded-lg",
            isTimeOverridden
              ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <Clock className="h-5 w-5" />
          {isTimeOverridden && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-purple-500" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Time Travel (Debug)</h4>
            {isTimeOverridden && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearTime}
                disabled={isUpdating}
                className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
              >
                <X className="mr-1 h-3 w-3" />
                Reset
              </Button>
            )}
          </div>

          {isTimeOverridden && timeOverride && (
            <div className="rounded-md bg-purple-50 p-2 text-xs">
              <p className="font-medium text-purple-700">Aktivno vreme:</p>
              <p className="text-purple-600">
                {new Date(timeOverride.timestamp).toLocaleString("sr-RS", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Postavi datum
            </label>
            <input
              type="date"
              value={selectedDate || currentOverrideDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button
              onClick={handleSetTime}
              disabled={!selectedDate || isUpdating}
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Postavi vreme
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Brzi skokovi
            </label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickJump(-1)}
                disabled={isUpdating}
                className="text-xs"
              >
                -1 dan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickJump(1)}
                disabled={isUpdating}
                className="text-xs"
              >
                +1 dan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickJump(-7)}
                disabled={isUpdating}
                className="text-xs"
              >
                -7 dana
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickJump(7)}
                disabled={isUpdating}
                className="text-xs"
              >
                +7 dana
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <label className="text-xs font-medium text-muted-foreground">
              Pokreni cron zadatke
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerReminders}
              disabled={isUpdating}
              className="w-full text-xs"
            >
              <Bell className="mr-1 h-3 w-3" />
              Proveri podsetnike
            </Button>
            {reminderResult && (
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap bg-muted p-2 rounded mt-2">
                {reminderResult}
              </pre>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground">
            Ovo utiče na provere datuma u aplikaciji. Samo za testiranje.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
