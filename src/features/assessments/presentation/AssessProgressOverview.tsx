import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import Reveal from "@/src/components/motion/Reveal";
import AsyncStateView from "@/src/components/ui/AsyncStateView";
import ProgressBar from "@/src/components/ui/ProgressBar";
import { useAssessProgress } from "@/src/features/assessments/hooks/use-assess-progress";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface StatProps {
  label: string;
  value: number;
  color: string;
}

function Stat({ label, value, color }: StatProps): ReactElement {
  return (
    <View accessibilityLabel={label + ": " + value} style={styles.stat}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Compact strip above the Assess list: one bar and one line of counts, so the list stays the focus. */
export default function AssessProgressOverview(): ReactElement | null {
  const { viewState, reload } = useAssessProgress();

  if (viewState.status === "empty" || viewState.status === "idle") return null;
  if (viewState.status !== "success") {
    return (
      <View style={styles.state}>
        <AsyncStateView
          emptyMessage=""
          message={viewState.status === "error" ? viewState.message : undefined}
          onRetry={reload}
          status={viewState.status}
          variant="detail"
        />
      </View>
    );
  }

  const { parameters, requests } = viewState.data;
  return (
    <Reveal>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.title}>Parameters assessed</Text>
          <Text style={styles.percent}>{parameters.percent}%</Text>
        </View>
        <ProgressBar
          accessibilityLabel={"Assessed " + parameters.assessed + " of " + parameters.total + " parameters"}
          percent={parameters.percent}
          tone="success"
        />
        <View style={styles.stats}>
          <Stat color={COLORS.successInk} label="done" value={parameters.assessed} />
          <Stat color={COLORS.warningInk} label="to do" value={parameters.pending} />
          <Stat color={COLORS.inkMuted} label="in all" value={parameters.total} />
        </View>
        <Text style={styles.requests}>
          Requests: {requests.total} in all · {requests.completed} completed · {requests.inProgress} in progress · {requests.notStarted} not started
        </Text>
      </View>
    </Reveal>
  );
}

const styles = StyleSheet.create({
  state: { paddingVertical: SPACING.medium },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: SPACING.small,
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
  },
  titleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  title: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "800" },
  percent: { color: COLORS.successInk, ...TYPOGRAPHY.body, fontVariant: ["tabular-nums"], fontWeight: "800" },
  stats: { columnGap: SPACING.large, flexDirection: "row", flexWrap: "wrap", rowGap: SPACING.extraSmall },
  stat: { alignItems: "center", flexDirection: "row", gap: 6 },
  dot: { borderRadius: RADII.pill, height: 8, width: 8 },
  statValue: { color: COLORS.ink, ...TYPOGRAPHY.caption, fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "800" },
  statLabel: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontWeight: "600" },
  requests: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontVariant: ["tabular-nums"] },
});
