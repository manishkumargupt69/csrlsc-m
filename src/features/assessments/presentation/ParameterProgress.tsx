import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import ProgressRing from "@/src/components/charts/ProgressRing";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface ParameterProgressProps {
  total: number;
  assessed: number;
  percent: number;
}

interface PillProps {
  label: string;
  value: number;
  tint: string;
  ink: string;
}

function Pill({ label, value, tint, ink }: PillProps): ReactElement {
  return (
    <View accessibilityLabel={label + ": " + value} style={[styles.pill, { backgroundColor: tint }]}>
      <Text style={[styles.pillValue, { color: ink }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

/** Ring plus Total / Assessed / Pending counts for the parameters of one request. */
export default function ParameterProgress({ total, assessed, percent }: ParameterProgressProps): ReactElement {
  const pending = Math.max(0, total - assessed);
  return (
    <View style={styles.row}>
      <ProgressRing
        accessibilityLabel={"Assessed " + assessed + " of " + total + " parameters"}
        caption="assessed"
        percent={percent}
        size={92}
        strokeWidth={11}
      />
      <View style={styles.pills}>
        <Pill ink={COLORS.accent} label="Total" tint={COLORS.accentSoft} value={total} />
        <Pill ink={COLORS.successInk} label="Assessed" tint={COLORS.successBackground} value={assessed} />
        <Pill ink={COLORS.warningInk} label="Pending" tint={COLORS.warningBackground} value={pending} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: SPACING.large, paddingTop: SPACING.small },
  pills: { flex: 1, flexDirection: "row", gap: SPACING.small },
  pill: { alignItems: "center", borderRadius: RADII.medium, flex: 1, gap: 2, paddingVertical: SPACING.medium },
  pillValue: { fontSize: 20, fontVariant: ["tabular-nums"], fontWeight: "800" },
  pillLabel: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontWeight: "600" },
});
