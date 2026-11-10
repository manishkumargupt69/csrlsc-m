import type { ComponentProps } from "react";
import type Feather from "@expo/vector-icons/Feather";

import type { StatusTone } from "@/src/types/status";
import { formatDate, parseApiDate } from "@/src/utils/format-date-time";

export interface DueInfo {
  label: string;
  tone: StatusTone;
  icon: ComponentProps<typeof Feather>["name"];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SOON_DAYS = 3;

const startOfDay = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** How urgent a request's target date is, in words the card can show. Completed requests are never urgent. */
export const getDueInfo = (toBeCompletedBy: string, status: string, now: Date = new Date()): DueInfo => {
  if (!toBeCompletedBy) return { label: "No due date", tone: "neutral", icon: "calendar" };
  const dateLabel = formatDate(toBeCompletedBy);
  if (status === "Completed") return { label: "Due " + dateLabel, tone: "neutral", icon: "check-circle" };
  const daysLeft = Math.round((startOfDay(parseApiDate(toBeCompletedBy)) - startOfDay(now)) / DAY_MS);
  if (daysLeft < 0) return { label: "Overdue · " + dateLabel, tone: "danger", icon: "alert-circle" };
  if (daysLeft === 0) return { label: "Due today", tone: "warning", icon: "clock" };
  if (daysLeft <= SOON_DAYS) return { label: "Due in " + daysLeft + (daysLeft === 1 ? " day" : " days"), tone: "warning", icon: "clock" };
  return { label: "Due " + dateLabel, tone: "neutral", icon: "calendar" };
};
