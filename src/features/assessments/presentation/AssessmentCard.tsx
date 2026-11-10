import type { ComponentProps, ReactElement } from "react";
import { memo, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import ActionButton from "@/src/components/ui/ActionButton";
import MetaChip from "@/src/components/ui/MetaChip";
import ProgressBar from "@/src/components/ui/ProgressBar";
import StatusBadge from "@/src/components/ui/StatusBadge";
import type { AssessmentListItem } from "@/src/features/assessments/domain/assessment.types";
import { getDueInfo } from "@/src/features/assessments/domain/due-info";
import { getStatusTone } from "@/src/features/assessments/presentation/status-tone";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface AssessmentCardProps {
  item: AssessmentListItem;
  /** Shows "% completed" (audited parameters / total parameters). */
  showProgress?: boolean;
  onView: (item: AssessmentListItem) => void;
  onAssign?: (item: AssessmentListItem) => void;
  onAssess?: (item: AssessmentListItem) => void;
}

type ActionKey = "view" | "assign" | "assess";

interface CardAction {
  key: ActionKey;
  label: string;
  iconName: ComponentProps<typeof Feather>["name"];
  onPress: () => void;
}

interface PartyLineProps {
  caption: string;
  name: string;
}

/** One line of "who": a small label and the name, wrapping to a second line only when the name is long. */
function PartyLine({ caption, name }: PartyLineProps): ReactElement {
  return (
    <Text numberOfLines={2} style={styles.partyLine}>
      <Text style={styles.caption}>{caption}  </Text>
      {name || "—"}
    </Text>
  );
}

function AssessmentCard({ item, showProgress = false, onView, onAssign, onAssess }: AssessmentCardProps): ReactElement {
  const handleView = useCallback((): void => onView(item), [item, onView]);
  const handleAssign = useCallback((): void => onAssign?.(item), [item, onAssign]);
  const handleAssess = useCallback((): void => onAssess?.(item), [item, onAssess]);
  const due = getDueInfo(item.toBeCompletedBy, item.status);
  const assignee = item.assignedTo || (item.status === "Pending" ? "Not assigned" : "Auditor not listed");
  const serviceLine = [item.service, item.subService, item.domain].filter(Boolean).join(" · ");

  const actions: CardAction[] = [{ key: "view", label: "View", iconName: "eye", onPress: handleView }];
  if (onAssign) actions.push({ key: "assign", label: "Assign", iconName: "user-plus", onPress: handleAssign });
  if (onAssess) actions.push({ key: "assess", label: "Assess", iconName: "check-square", onPress: handleAssess });
  // The one next step is filled: assess work that is ready, otherwise assign what has no auditor, otherwise just open it.
  const primaryKey: ActionKey = onAssess && item.status === "Assigned" ? "assess" : onAssign && item.status === "Pending" ? "assign" : "view";
  const ordered = [...actions.filter((action) => action.key === primaryKey), ...actions.filter((action) => action.key !== primaryKey)];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.number}>{item.assessmentNo}</Text>
        <StatusBadge label={item.status} tone={getStatusTone(item.status)} />
      </View>

      <View style={styles.parties}>
        <PartyLine caption="Requested by" name={item.requestedBy} />
        <PartyLine caption="Request for" name={item.requestFor} />
      </View>

      <View accessibilityLabel={"Service: " + serviceLine} style={styles.serviceRow}>
        <Feather accessibilityElementsHidden color={COLORS.inkMuted} name="truck" size={14} style={styles.serviceIcon} />
        <Text numberOfLines={2} style={styles.serviceText}>{serviceLine || "—"}</Text>
      </View>

      <View style={styles.footer}>
        <MetaChip icon={due.icon} label={due.label} tone={due.tone} />
        <View accessibilityLabel={"Assigned to " + assignee} style={styles.assignee}>
          <Feather accessibilityElementsHidden color={COLORS.inkMuted} name="user" size={14} />
          <Text numberOfLines={1} style={styles.assigneeName}>{assignee}</Text>
        </View>
      </View>

      {showProgress ? (
        <View style={styles.progress}>
          <View style={styles.progressHeader}>
            <Text style={styles.caption}>Parameters assessed</Text>
            <Text style={styles.progressValue}>
              {item.auditedParameters} of {item.totalParameters} · {item.completionPercent}%
            </Text>
          </View>
          <ProgressBar accessibilityLabel={"Completed " + item.completionPercent + " percent"} isAnimated={false} percent={item.completionPercent} />
        </View>
      ) : null}

      <View style={styles.actions}>
        {ordered.map((action) => (
          <ActionButton key={action.key} iconName={action.iconName} label={action.label} onPress={action.onPress} variant={action.key === primaryKey ? "primary" : "secondary"} />
        ))}
      </View>
    </View>
  );
}

export default memo(AssessmentCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: SPACING.small,
    padding: SPACING.medium,
  },
  header: { alignItems: "center", flexDirection: "row", gap: SPACING.small, justifyContent: "space-between" },
  number: { color: COLORS.ink, flex: 1, fontSize: 17, fontWeight: "800" },
  parties: { gap: 2 },
  partyLine: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "700" },
  caption: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontWeight: "600", letterSpacing: 0.2 },
  serviceRow: { alignItems: "flex-start", flexDirection: "row", gap: 6 },
  serviceIcon: { marginTop: 3 },
  serviceText: { color: COLORS.inkMuted, flex: 1, ...TYPOGRAPHY.caption, fontSize: 13, fontWeight: "600" },
  footer: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: SPACING.small, justifyContent: "space-between" },
  assignee: { alignItems: "center", flexShrink: 1, flexDirection: "row", gap: 6 },
  assigneeName: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, flexShrink: 1, fontWeight: "600" },
  progress: { gap: SPACING.extraSmall },
  progressHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  progressValue: { color: COLORS.ink, ...TYPOGRAPHY.caption, fontVariant: ["tabular-nums"], fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.small, marginTop: SPACING.extraSmall },
});
