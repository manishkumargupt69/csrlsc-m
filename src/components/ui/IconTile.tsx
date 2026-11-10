import type { ComponentProps, ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import { COLORS, RADII } from "@/src/theme/tokens";
import type { StatusTone } from "@/src/types/status";

type IconName = ComponentProps<typeof Feather>["name"];

interface IconTileProps {
  name: IconName;
  tone?: StatusTone;
  size?: number;
}

const TONE_COLORS: Readonly<Record<StatusTone, { background: string; ink: string }>> = {
  neutral: { background: COLORS.neutralBackground, ink: COLORS.neutralInk },
  info: { background: COLORS.accentSoft, ink: COLORS.accent },
  success: { background: COLORS.successBackground, ink: COLORS.successInk },
  warning: { background: COLORS.warningBackground, ink: COLORS.warningInk },
  danger: { background: COLORS.dangerSoft, ink: COLORS.danger },
};

/** Rounded square holding an icon; the Settings-style marker for rows and cards. */
export default function IconTile({ name, tone = "info", size = 32 }: IconTileProps): ReactElement {
  const colors = TONE_COLORS[tone];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { backgroundColor: colors.background, borderRadius: Math.round(size * 0.3), height: size, width: size }]}
    >
      <Feather color={colors.ink} name={name} size={Math.round(size * 0.52)} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: "center", justifyContent: "center", borderRadius: RADII.small },
});
