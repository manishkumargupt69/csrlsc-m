import type { ComponentProps, ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import type { StatusTone } from "@/src/types/status";

type IconName = ComponentProps<typeof Feather>["name"];

interface MetaChipProps {
  icon: IconName;
  label: string;
  tone?: StatusTone;
}

const TONE_COLORS: Readonly<Record<StatusTone, { background: string; ink: string }>> = {
  neutral: { background: COLORS.surfaceMuted, ink: COLORS.inkMuted },
  info: { background: COLORS.accentSoft, ink: COLORS.accent },
  success: { background: COLORS.successBackground, ink: COLORS.successInk },
  warning: { background: COLORS.warningBackground, ink: COLORS.warningInk },
  danger: { background: COLORS.dangerSoft, ink: COLORS.danger },
};

/** Small pill that pairs an icon with one short fact (service, domain, due date). */
export default function MetaChip({ icon, label, tone = "neutral" }: MetaChipProps): ReactElement | null {
  if (!label) return null;
  const colors = TONE_COLORS[tone];
  return (
    <View accessibilityLabel={label} style={[styles.chip, { backgroundColor: colors.background }]}>
      <Feather accessibilityElementsHidden color={colors.ink} name={icon} size={13} />
      <Text numberOfLines={1} style={[styles.label, { color: colors.ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: RADII.pill,
    flexDirection: "row",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: SPACING.medium,
    paddingVertical: 6,
  },
  label: { ...TYPOGRAPHY.caption, flexShrink: 1, fontWeight: "600" },
});
