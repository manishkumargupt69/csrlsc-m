import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import AsyncStateView from "@/src/components/ui/AsyncStateView";
import ProgressBar from "@/src/components/ui/ProgressBar";
import IconTile from "@/src/components/ui/IconTile";
import DashboardSection from "@/src/features/dashboard/presentation/DashboardSection";
import type { LspScore } from "@/src/features/dashboard/domain/lsp-ranking";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import type { ViewState } from "@/src/types/view-state";

const MAX_RATING = 10;

interface LspListProps {
  title: string;
  /** Whether this card lists the best or the weakest performers; changes the icon and the bar colour. */
  variant: "top" | "bottom";
  scores: readonly LspScore[];
  /** The ranking's load state, so the card can show loading and error itself. */
  state: ViewState<unknown>["status"];
  errorMessage?: string;
  emptyMessage: string;
  onRetry: () => void;
}

interface ScoreRowProps {
  score: LspScore;
  rank: number;
  variant: "top" | "bottom";
}

function ScoreRow({ score, rank, variant }: ScoreRowProps): ReactElement {
  const percent = Math.round((score.averageRating / MAX_RATING) * 100);
  return (
    <View accessibilityLabel={rank + ". " + score.companyName + ", average rating " + score.averageRating.toFixed(1) + " out of 10"} style={styles.row}>
      <Text style={[styles.rank, variant === "top" ? styles.rankTop : styles.rankBottom]}>{rank}</Text>
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>{score.companyName}</Text>
          <Text style={styles.score}>{score.averageRating.toFixed(1)}</Text>
        </View>
        <ProgressBar accessibilityLabel={"Average rating " + percent + " percent of the scale"} percent={percent} tone={variant === "top" ? "success" : "warning"} />
        <Text style={styles.meta}>{score.assessmentCount} {score.assessmentCount === 1 ? "assessment" : "assessments"}</Text>
      </View>
    </View>
  );
}

export default function LspList({ title, variant, scores, state, errorMessage, emptyMessage, onRetry }: LspListProps): ReactElement {
  const hasScores = state === "success" && scores.length > 0;
  return (
    <DashboardSection subtitle="Average rating out of 10" title={title}>
      {hasScores ? (
        <View style={styles.list}>
          {scores.map((score, index) => <ScoreRow key={score.companyId} rank={index + 1} score={score} variant={variant} />)}
        </View>
      ) : (
        <View style={styles.state}>
          {state === "success" ? <IconTile name={variant === "top" ? "award" : "trending-down"} size={44} tone="neutral" /> : null}
          <AsyncStateView
            emptyMessage={emptyMessage}
            message={errorMessage}
            onRetry={onRetry}
            status={state === "success" ? "empty" : state === "error" ? "error" : state}
            variant="detail"
          />
        </View>
      )}
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.small, paddingBottom: SPACING.small },
  state: { alignItems: "center", gap: SPACING.small, paddingBottom: SPACING.medium, paddingHorizontal: SPACING.medium },
  row: { alignItems: "center", flexDirection: "row", gap: SPACING.medium, paddingHorizontal: SPACING.medium, paddingVertical: SPACING.small },
  rank: { borderRadius: RADII.pill, ...TYPOGRAPHY.caption, fontVariant: ["tabular-nums"], fontWeight: "800", height: 30, lineHeight: 30, overflow: "hidden", textAlign: "center", width: 30 },
  rankTop: { backgroundColor: COLORS.successBackground, color: COLORS.successInk },
  rankBottom: { backgroundColor: COLORS.warningBackground, color: COLORS.warningInk },
  copy: { flex: 1, gap: 6 },
  nameRow: { alignItems: "center", flexDirection: "row", gap: SPACING.small, justifyContent: "space-between" },
  name: { color: COLORS.ink, ...TYPOGRAPHY.body, flex: 1, fontWeight: "700" },
  score: { color: COLORS.ink, fontSize: 18, fontVariant: ["tabular-nums"], fontWeight: "800" },
  meta: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption },
});
