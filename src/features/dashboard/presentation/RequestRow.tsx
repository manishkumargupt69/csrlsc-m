import type { ReactElement } from "react";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import PressableScale from "@/src/components/motion/PressableScale";
import IconTile from "@/src/components/ui/IconTile";
import type { AssessmentListItem } from "@/src/features/assessments/domain/assessment.types";
import { getDueInfo } from "@/src/features/assessments/domain/due-info";
import { getStatusIcon, getStatusTone } from "@/src/features/assessments/presentation/status-tone";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface RequestRowProps {
  item: AssessmentListItem;
  onPress: (item: AssessmentListItem) => void;
  /** Show the due-date signal instead of the status, for the "needs attention" list. */
  emphasizeDue?: boolean;
}

/** One request as a tappable row: status icon, number, company and either status or due date. */
export default function RequestRow({ item, onPress, emphasizeDue = false }: RequestRowProps): ReactElement {
  const handlePress = useCallback((): void => onPress(item), [item, onPress]);
  const due = getDueInfo(item.toBeCompletedBy, item.status);
  const tone = emphasizeDue ? due.tone : getStatusTone(item.status);
  const icon = emphasizeDue ? due.icon : getStatusIcon(item.status);
  const detail = emphasizeDue ? due.label : item.status + " · " + (item.requestFor || "—");

  return (
    <PressableScale accessibilityLabel={item.assessmentNo + ", " + item.status + ", " + due.label} accessibilityRole="button" onPress={handlePress} style={styles.row}>
      <IconTile name={icon} size={40} tone={tone} />
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.number}>{item.assessmentNo}</Text>
        <Text numberOfLines={1} style={[styles.detail, emphasizeDue && due.tone === "danger" && styles.danger]}>{detail}</Text>
        {emphasizeDue ? <Text numberOfLines={1} style={styles.company}>{item.requestFor || "—"}</Text> : null}
      </View>
      <Feather accessibilityElementsHidden color={COLORS.inkMuted} name="chevron-right" size={18} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", borderRadius: RADII.medium, flexDirection: "row", gap: SPACING.medium, minHeight: 60, paddingHorizontal: SPACING.medium, paddingVertical: SPACING.small },
  copy: { flex: 1, gap: 1 },
  number: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "800" },
  detail: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontWeight: "600" },
  danger: { color: COLORS.danger },
  company: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption },
});
