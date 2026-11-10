import type { ReactElement, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import PressableScale from "@/src/components/motion/PressableScale";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  /** Optional link-style action on the right, e.g. "See all". */
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}

/** White card with a title row, used for every list-like block on the dashboard. */
export default function DashboardSection({ title, subtitle, actionLabel, onAction, children }: DashboardSectionProps): ReactElement {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actionLabel && onAction ? (
          <PressableScale accessibilityLabel={actionLabel + ": " + title} accessibilityRole="button" hitSlop={8} onPress={onAction} style={styles.action}>
            <Text style={styles.actionLabel}>{actionLabel}</Text>
          </PressableScale>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    gap: SPACING.small,
    paddingBottom: SPACING.small,
    paddingHorizontal: SPACING.small,
    paddingTop: SPACING.large,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  header: { alignItems: "center", flexDirection: "row", gap: SPACING.medium, paddingHorizontal: SPACING.medium },
  titles: { flex: 1, gap: 2 },
  title: { color: COLORS.ink, fontSize: 18, fontWeight: "800" },
  subtitle: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontWeight: "500" },
  action: { alignItems: "center", backgroundColor: COLORS.accentSoft, borderRadius: RADII.pill, justifyContent: "center", minHeight: 32, paddingHorizontal: SPACING.medium },
  actionLabel: { color: COLORS.accent, ...TYPOGRAPHY.caption, fontSize: 13, fontWeight: "700" },
});
