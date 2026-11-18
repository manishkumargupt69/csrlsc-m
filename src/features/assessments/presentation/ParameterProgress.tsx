import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import ProgressBar from "@/src/components/ui/ProgressBar";
import { COLORS, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface ParameterProgressProps {
  total: number;
  assessed: number;
  percent: number;
}

interface CountProps {
  label: string;
  value: number;
  color: string;
}

function Count({ label, value, color }: CountProps): ReactElement {
  return (
    <View style={styles.count}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.countText}>
        <Text style={styles.countValue}>{value}</Text> {label}
      </Text>
    </View>
  );
}

/** Compact progress for one request: title and percentage, a bar, then Total / Audited / Pending counts. */
export default function ParameterProgress({ total, assessed, percent }: ParameterProgressProps): ReactElement {
  const pending = Math.max(0, total - assessed);
  return (
    <View accessibilityLabel={"Progress: " + assessed + " of " + total + " parameters audited, " + percent + " percent"} accessible style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.percent}>{percent}%</Text>
      </View>
      <ProgressBar accessibilityLabel={percent + " percent audited"} percent={percent} />
      <View style={styles.counts}>
        <Count color={COLORS.accent} label="Total" value={total} />
        <Count color={COLORS.successInk} label="Audited" value={assessed} />
        <Count color={COLORS.warningInk} label="Pending" value={pending} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.small },
  header: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between" },
  title: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "800" },
  percent: { color: COLORS.ink, fontSize: 18, fontVariant: ["tabular-nums"], fontWeight: "800" },
  counts: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.large },
  count: { alignItems: "center", flexDirection: "row", gap: 6 },
  dot: { borderRadius: 4, height: 8, width: 8 },
  countText: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontWeight: "600" },
  countValue: { color: COLORS.ink, fontVariant: ["tabular-nums"], fontWeight: "800" },
});
