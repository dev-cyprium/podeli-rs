import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for return reminders every 6 hours
crons.interval(
  "check return reminders",
  { hours: 6 },
  internal.cronHandlers.checkReturnReminders
);

// Clean up old messages daily at 3 AM
crons.daily(
  "cleanup old messages",
  { hourUTC: 3, minuteUTC: 0 },
  internal.cronHandlers.cleanupOldMessages
);

export default crons;
