import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import type { StatusTone } from "@/src/types/status";

interface StatusBadgeProps { label: string; tone: StatusTone; }
export default function StatusBadge({ label, tone }: StatusBadgeProps): ReactElement {
  return <View accessibilityLabel={`Status: ${label}`} style={[styles.badge, CONTAINER_STYLES[tone]]}><Text style={[styles.label, LABEL_STYLES[tone]]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: RADII.pill, paddingHorizontal: SPACING.medium, paddingVertical: SPACING.extraSmall },
  label: { ...TYPOGRAPHY.caption, fontWeight: "700" },
  neutralContainer: { backgroundColor: COLORS.neutralBackground }, neutralLabel: { color: COLORS.neutralInk },
  infoContainer: { backgroundColor: COLORS.accentSoft }, infoLabel: { color: COLORS.accent },
  successContainer: { backgroundColor: COLORS.successBackground }, successLabel: { color: COLORS.successInk },
  warningContainer: { backgroundColor: COLORS.warningBackground }, warningLabel: { color: COLORS.warningInk },
  dangerContainer: { backgroundColor: COLORS.surface }, dangerLabel: { color: COLORS.danger },
});

const CONTAINER_STYLES = { neutral: styles.neutralContainer, info: styles.infoContainer, success: styles.successContainer, warning: styles.warningContainer, danger: styles.dangerContainer } satisfies Record<StatusTone, object>;
const LABEL_STYLES = { neutral: styles.neutralLabel, info: styles.infoLabel, success: styles.successLabel, warning: styles.warningLabel, danger: styles.dangerLabel } satisfies Record<StatusTone, object>;
