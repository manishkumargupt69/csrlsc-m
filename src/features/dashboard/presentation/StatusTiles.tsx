import type { ReactElement } from "react";
import { useCallback } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import PressableScale from "@/src/components/motion/PressableScale";
import IconTile from "@/src/components/ui/IconTile";
import type { HeroCounts } from "@/src/features/dashboard/presentation/DashboardHero";
import { getStatusIcon, getStatusTone } from "@/src/features/assessments/presentation/status-tone";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

export type TileStatus = "Pending" | "Assigned" | "Completed";

const LARGE_TEXT_SCALE = 1.3;

/** Coloured top edge per status, as on the web dashboard cards. */
const TILE_ACCENT: Readonly<Record<TileStatus, string>> = {
  Pending: COLORS.statusAmber,
  Assigned: COLORS.statusNavy,
  Completed: COLORS.statusTeal,
};

interface StatusTileProps {
  status: TileStatus;
  value: number;
  share: number;
  /** When tiles stack in a column, each is full width and no longer shares a row. */
  isStacked: boolean;
  onPress: (status: TileStatus) => void;
}

function StatusTile({ status, value, share, isStacked, onPress }: StatusTileProps): ReactElement {
  const handlePress = useCallback((): void => onPress(status), [onPress, status]);
  return (
    <PressableScale
      accessibilityLabel={status + ": " + value + " requests, " + share + " percent. Show these requests"}
      accessibilityRole="button"
      onPress={handlePress}
      style={[styles.tile, isStacked && styles.tileStacked, { borderTopColor: TILE_ACCENT[status], borderTopWidth: 3 }]}
    >
      <IconTile name={getStatusIcon(status)} size={36} tone={getStatusTone(status)} />
      <Text style={styles.valueText}>{value}</Text>
      <Text style={styles.label}>{status}</Text>
      <Text style={styles.share}>{share}% of requests</Text>
    </PressableScale>
  );
}

interface StatusTilesProps {
  counts: HeroCounts;
  /** Called with the status of the tapped tile so the list can open already filtered. */
  onOpen: (status: TileStatus) => void;
}

/** One tappable tile per status, so the split is readable at a glance and each opens the list. */
export default function StatusTiles({ counts, onOpen }: StatusTilesProps): ReactElement {
  const share = useCallback((value: number): number => (counts.total > 0 ? Math.round((value / counts.total) * 100) : 0), [counts.total]);
  // Three tiles side by side stop fitting once the system text size is large, so they stack.
  const { fontScale } = useWindowDimensions();
  const isStacked = fontScale > LARGE_TEXT_SCALE;
  return (
    <View style={isStacked ? styles.rowStacked : styles.row}>
      <StatusTile isStacked={isStacked} onPress={onOpen} share={share(counts.pending)} status="Pending" value={counts.pending} />
      <StatusTile isStacked={isStacked} onPress={onOpen} share={share(counts.assigned)} status="Assigned" value={counts.assigned} />
      <StatusTile isStacked={isStacked} onPress={onOpen} share={share(counts.completed)} status="Completed" value={counts.completed} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: SPACING.small },
  rowStacked: { flexDirection: "column", gap: SPACING.small },
  tileStacked: { flex: 0 },
  tile: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 2,
    padding: SPACING.medium,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  valueText: { color: COLORS.ink, fontSize: 28, fontVariant: ["tabular-nums"], fontWeight: "800", marginTop: SPACING.small },
  label: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "700" },
  share: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontVariant: ["tabular-nums"] },
});
