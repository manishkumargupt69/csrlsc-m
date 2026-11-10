import type { ReactElement } from "react";
import { StyleSheet, Text } from "react-native";

import { COLORS, TYPOGRAPHY } from "@/src/theme/tokens";

interface LastUpdatedLabelProps {
  /** When the data on screen was last fetched, in milliseconds; 0 or undefined while nothing has loaded. */
  updatedAt: number | undefined;
  isRefreshing?: boolean;
}

const formatTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/**
 * Says how fresh the list is, so a list shown after a failed refresh or on a weak connection never looks
 * confirmed by the server when it is not.
 */
export default function LastUpdatedLabel({ updatedAt, isRefreshing = false }: LastUpdatedLabelProps): ReactElement | null {
  if (!updatedAt) return null;
  return (
    <Text accessibilityLiveRegion="polite" style={styles.label}>
      {isRefreshing ? "Refreshing…" : "Updated " + formatTime(updatedAt) + " · pull down to refresh"}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontVariant: ["tabular-nums"], textAlign: "center" },
});
