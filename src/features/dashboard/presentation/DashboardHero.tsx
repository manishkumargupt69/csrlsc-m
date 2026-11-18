import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

import ProgressRing from "@/src/components/charts/ProgressRing";
import type { AssessmentStatus } from "@/src/features/assessments/domain/assessment.types";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

export interface HeroCounts {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
}

interface DashboardHeroProps {
  greeting: string;
  name: string;
  clientName: string;
  counts: HeroCounts | null;
  /** Opens the request list filtered to the tapped status. */
  onOpenStatus: (status: AssessmentStatus) => void;
}

// Light tints that stay legible on the maroon surface; the dark status colours are for white cards.
const HERO_PENDING = "#FFBD4A";
const HERO_ASSIGNED = "#7DD3FC";
const HERO_IN_PROGRESS = "#C4B5FD";
const HERO_COMPLETED = "#86EFAC";
const ON_HERO = COLORS.white;
const ON_HERO_MUTED = "rgba(255, 255, 255, 0.78)";

interface StatusChipProps {
  status: AssessmentStatus;
  value: number;
  color: string;
  onPress: (status: AssessmentStatus) => void;
}

/** One status count as a tappable chip tinted in its bar colour; it opens the list filtered to that status. */
function StatusChip({ status, value, color, onPress }: StatusChipProps): ReactElement {
  const handlePress = useCallback((): void => onPress(status), [onPress, status]);
  return (
    <Pressable
      accessibilityHint="Shows these requests"
      accessibilityLabel={status + ": " + value + " requests"}
      accessibilityRole="button"
      hitSlop={4}
      onPress={handlePress}
      style={({ pressed }) => [styles.chip, { backgroundColor: color + "2E", borderColor: color + "8C" }, pressed && styles.chipPressed]}
    >
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{status}</Text>
    </Pressable>
  );
}

/** Top of the dashboard: who is signed in, the headline request total and how it splits by status. */
export default function DashboardHero({ greeting, name, clientName, counts, onOpenStatus }: DashboardHeroProps): ReactElement {
  // The sheen is drawn at the card's measured size: percentage sizes inside the SVG came out short in release builds.
  const [size, setSize] = useState({ width: 0, height: 0 });
  const handleLayout = useCallback((event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
  }, []);
  const total = counts?.total ?? 0;
  const completionPercent = total > 0 && counts ? Math.round((counts.completed / total) * 100) : 0;
  const segments = counts
    ? [
        { key: "pending", value: counts.pending, color: HERO_PENDING },
        { key: "assigned", value: counts.assigned, color: HERO_ASSIGNED },
        { key: "inProgress", value: counts.inProgress, color: HERO_IN_PROGRESS },
        { key: "completed", value: counts.completed, color: HERO_COMPLETED },
      ].filter((segment) => segment.value > 0)
    : [];

  return (
    <View onLayout={handleLayout} style={styles.hero}>
      <Svg height={size.height} pointerEvents="none" style={StyleSheet.absoluteFill} width={size.width}>
        <Defs>
          <LinearGradient id="heroSheen" x1="0" x2="0.9" y1="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.34" />
            <Stop offset="0.38" stopColor="#FFFFFF" stopOpacity="0.07" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <RadialGradient cx="0.92" cy="0.04" id="heroGlow" r="0.75">
            <Stop offset="0" stopColor="#FFBD4A" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#FFBD4A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect fill="url(#heroGlow)" height={size.height} width={size.width} />
        <Rect fill="url(#heroSheen)" height={size.height} width={size.width} />
      </Svg>
      <View pointerEvents="none" style={styles.rim} />

      <Text accessibilityRole="header" numberOfLines={1} style={styles.name}>
        <Text style={styles.greeting}>{greeting + (name ? ", " : "")}</Text>
        {name}
      </Text>
      {clientName && clientName !== name ? <Text numberOfLines={1} style={styles.client}>{clientName}</Text> : null}

      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Text accessibilityLabel={total + " assessment requests"} style={styles.metricValue}>{counts ? total : "–"}</Text>
          <Text style={styles.metricLabel}>Assessment requests</Text>
        </View>
        <ProgressRing
          accessibilityLabel={completionPercent + " percent of requests completed"}
          caption="done"
          captionColor={ON_HERO_MUTED}
          color={HERO_COMPLETED}
          percent={completionPercent}
          size={72}
          strokeWidth={8}
          trackColor="rgba(255, 255, 255, 0.22)"
          valueColor={ON_HERO}
        />
      </View>

      <View accessibilityElementsHidden style={styles.bar}>
        {segments.length > 0
          ? segments.map((segment) => <View key={segment.key} style={[styles.segment, { backgroundColor: segment.color, flex: segment.value }]} />)
          : <View style={[styles.segment, styles.emptySegment]} />}
      </View>

      {counts ? (
        <View style={styles.chips}>
          <StatusChip color={HERO_PENDING} onPress={onOpenStatus} status="Pending" value={counts.pending} />
          <StatusChip color={HERO_ASSIGNED} onPress={onOpenStatus} status="Assigned" value={counts.assigned} />
          <StatusChip color={HERO_IN_PROGRESS} onPress={onOpenStatus} status="In Progress" value={counts.inProgress} />
          <StatusChip color={HERO_COMPLETED} onPress={onOpenStatus} status="Completed" value={counts.completed} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "rgba(100, 18, 29, 0.9)",
    borderRadius: 24,
    gap: SPACING.extraSmall,
    overflow: "hidden",
    padding: SPACING.large,
    // No elevation: Android draws its shadow beneath a translucent card, which shows through as a box.
  },
  rim: { ...StyleSheet.absoluteFillObject, borderColor: "rgba(255, 255, 255, 0.38)", borderRadius: 24, borderWidth: 1.5 },
  greeting: { color: ON_HERO_MUTED, fontWeight: "600" },
  name: { color: ON_HERO, fontSize: 18, fontWeight: "800" },
  client: { color: ON_HERO_MUTED, ...TYPOGRAPHY.body },
  metricRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.small },
  metric: { flex: 1 },
  metricValue: { color: ON_HERO, fontSize: 40, fontVariant: ["tabular-nums"], fontWeight: "800" },
  metricLabel: { color: ON_HERO_MUTED, ...TYPOGRAPHY.body, fontWeight: "600" },
  bar: { borderRadius: RADII.pill, flexDirection: "row", gap: 3, height: 8, marginTop: SPACING.small, overflow: "hidden" },
  segment: { borderRadius: RADII.pill },
  emptySegment: { backgroundColor: "rgba(255, 255, 255, 0.22)", flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.small, marginTop: SPACING.small },
  chip: { alignItems: "center", borderRadius: RADII.pill, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 40, paddingHorizontal: SPACING.medium },
  chipPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  chipDot: { borderRadius: RADII.pill, height: 8, width: 8 },
  chipValue: { color: ON_HERO, ...TYPOGRAPHY.body, fontVariant: ["tabular-nums"], fontWeight: "800" },
  chipLabel: { color: ON_HERO, ...TYPOGRAPHY.caption, fontWeight: "700" },
});
