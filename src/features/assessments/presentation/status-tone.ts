import type { ComponentProps } from "react";
import type Feather from "@expo/vector-icons/Feather";

import { COLORS } from "@/src/theme/tokens";
import type { StatusTone } from "@/src/types/status";

/** Maps assessment and parameter statuses onto the shared badge tones. */
export const getStatusTone = (status: string): StatusTone => {
  switch (status) {
    case "Completed":
    case "Audited":
      return "success";
    case "Assigned":
      return "info";
    case "Pending":
      return "warning";
    default:
      return "neutral";
  }
};

/** Solid colors for charts, one per assessment status. */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "Completed":
      return COLORS.successInk;
    case "Assigned":
      return COLORS.accent;
    case "Pending":
      return COLORS.warningInk;
    default:
      return COLORS.neutralInk;
  }
};

/** Icon that pairs with each assessment status so state is never colour alone. */
export const getStatusIcon = (status: string): ComponentProps<typeof Feather>["name"] => {
  switch (status) {
    case "Completed":
    case "Audited":
      return "check-circle";
    case "Assigned":
      return "user-check";
    case "Pending":
      return "clock";
    default:
      return "circle";
  }
};
