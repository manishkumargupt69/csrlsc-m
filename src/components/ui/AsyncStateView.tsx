import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import EmptyListState from "@/src/components/ui/EmptyListState";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface AsyncStateViewProps {
  emptyMessage: string;
  message?: string;
  onRetry: () => void;
  status: "idle" | "loading" | "empty" | "error";
  variant: "list" | "detail";
}

export default function AsyncStateView({ emptyMessage, message, onRetry, status, variant }: AsyncStateViewProps): ReactElement {
  if (status === "idle" || status === "loading") {
    return variant === "list" ? <View accessibilityLabel="Loading" style={styles.skeletons}><View style={styles.listBlock} /><View style={styles.listBlock} /><View style={styles.listBlock} /></View> : <View accessibilityLabel="Loading" style={styles.skeletons}><View style={styles.detailLine} /><View style={styles.detailBlock} /><View style={styles.detailBlock} /></View>;
  }

  if (status === "empty") {
    return variant === "list" ? (
      <View style={styles.listState}><EmptyListState message={emptyMessage} /></View>
    ) : <Text style={styles.message}>{emptyMessage}</Text>;
  }
  return (
    <View style={variant === "list" ? styles.listState : styles.error}>
      {variant === "list" ? <Feather color={COLORS.inkMuted} name="alert-circle" size={36} /> : null}
      <Text accessibilityLiveRegion="polite" style={variant === "list" ? styles.listMessage : styles.message}>{message || "This content could not be loaded."}</Text>
      <PrimaryButton label="Try again" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletons: { gap: SPACING.large, paddingVertical: SPACING.large },
  listBlock: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADII.small, height: 108 },
  detailLine: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADII.small, height: 28 },
  detailBlock: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADII.small, height: 96 },
  error: { gap: SPACING.large, paddingVertical: SPACING.extraLarge },
  message: { color: COLORS.inkMuted, ...TYPOGRAPHY.body, paddingVertical: SPACING.extraLarge },
  listState: { alignItems: "center", flex: 1, gap: SPACING.extraLarge, justifyContent: "center", paddingHorizontal: SPACING.extraLarge, paddingVertical: SPACING.section },
  listMessage: { color: COLORS.ink, fontSize: 18, fontWeight: "700", textAlign: "center" },
});
