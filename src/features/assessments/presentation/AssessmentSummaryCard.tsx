import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Animated, { FadeIn } from "react-native-reanimated";

import StatusBadge from "@/src/components/ui/StatusBadge";
import { getStatusTone } from "@/src/features/assessments/presentation/status-tone";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import { formatDate } from "@/src/utils/format-date-time";

interface AssessmentSummaryCardProps {
  assessmentNo: string;
  toBeCompletedBy: string;
  status: string;
  /** With both, a second line reads "Main Parameter › Sub Parameter", as the web's audit header does. */
  mainParameter?: string;
  subParameter?: string;
  /** The parameter's code from the API (parameterCode), e.g. "PARAM008". */
  parameterCode?: string;
  /** The rest of the request; when given, the card opens on tap to show them. Empty values are left out. */
  details?: readonly SummaryDetail[];
}

export interface SummaryDetail {
  label: string;
  value: string;
}

/** Points down while closed and up while open. */
function Chevron({ isOpen }: { isOpen: boolean }): ReactElement {
  return (
    <View style={[styles.chevron, isOpen && styles.chevronOpen]}>
      <Feather color={isOpen ? COLORS.accent : COLORS.inkMuted} name={isOpen ? "chevron-up" : "chevron-down"} size={16} />
    </View>
  );
}

/**
 * The compact header of the request screens. Line one: Assessment No, the date it is due and its status.
 * Line two (on a parameter): where the parameter sits, Main Parameter then Sub Parameter.
 * With details, it starts closed as that compact tile and opens on tap to list the rest of the request.
 */
export default function AssessmentSummaryCard({ assessmentNo, toBeCompletedBy, status, mainParameter, subParameter, parameterCode, details }: AssessmentSummaryCardProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback((): void => setIsOpen((open) => !open), []);
  const shownDetails = (details ?? []).filter((detail) => Boolean(detail.value));
  const isExpandable = shownDetails.length > 0;
  const dueDate = formatDate(toBeCompletedBy);
  const hasParameterLine = Boolean(mainParameter || subParameter || parameterCode);
  const parameterLabel = (parameterCode ? ", parameter " + parameterCode : "") + (mainParameter ? ", main parameter " + mainParameter : "") + (subParameter ? ", sub parameter " + subParameter : "");

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityHint={isExpandable ? (isOpen ? "Hides the request details" : "Shows the request details") : undefined}
        accessibilityLabel={"Assessment No " + assessmentNo + (dueDate ? ", to be completed by " + dueDate : "") + (status ? ", status " + status : "") + parameterLabel}
        accessibilityRole={isExpandable ? "button" : "summary"}
        accessibilityState={isExpandable ? { expanded: isOpen } : undefined}
        disabled={!isExpandable}
        onPress={toggle}
        style={styles.summary}
      >
      <View style={styles.topLine}>
        <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.number}>{assessmentNo}</Text>
        {dueDate ? (
          <View style={styles.due}>
            <Feather color={COLORS.inkMuted} name="calendar" size={13} />
            <Text numberOfLines={1} style={styles.dueText}>{dueDate}</Text>
          </View>
        ) : null}
        <StatusBadge label={status} tone={getStatusTone(status)} />
        {isExpandable ? <Chevron isOpen={isOpen} /> : null}
      </View>

      {hasParameterLine ? (
        <View style={styles.parameterLine}>
          <Feather color={COLORS.accent} name="folder" size={14} style={styles.parameterIcon} />
          <View style={styles.parameterCopy}>
            {parameterCode ? <Text style={styles.code}>{"#" + parameterCode}</Text> : null}
          <Text numberOfLines={4} style={styles.parameterText}>
            {mainParameter ? <Text style={styles.mainParameter}>{mainParameter}</Text> : null}
            {mainParameter && subParameter ? <Text style={styles.separator}>{"  › "}</Text> : null}
            {subParameter ? <Text style={styles.subParameter}>{subParameter}</Text> : null}
          </Text>
          </View>
        </View>
      ) : null}
      </Pressable>

      {isOpen && isExpandable ? (
        <Animated.View entering={FadeIn.duration(160)} style={styles.details}>
          {shownDetails.map((detail) => (
            <View key={detail.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text selectable style={styles.detailValue}>{detail.value}</Text>
            </View>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: SPACING.small,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
  },
  summary: { gap: SPACING.small },
  topLine: { alignItems: "center", flexDirection: "row", gap: SPACING.small },
  chevron: { alignItems: "center", backgroundColor: COLORS.surfaceMuted, borderRadius: RADII.pill, height: 26, justifyContent: "center", width: 26 },
  chevronOpen: { backgroundColor: COLORS.accentSoft },
  // Opened details: each label sits above its value, so long values use the full width.
  details: { borderTopColor: COLORS.border, borderTopWidth: StyleSheet.hairlineWidth, gap: SPACING.small, paddingTop: SPACING.small },
  detailRow: { gap: 1 },
  detailLabel: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontSize: 12, fontWeight: "600" },
  detailValue: { color: COLORS.ink, ...TYPOGRAPHY.caption, fontSize: 13, fontWeight: "700" },
  number: { color: COLORS.ink, flex: 1, fontSize: 16, fontVariant: ["tabular-nums"], fontWeight: "800", letterSpacing: -0.2 },
  due: { alignItems: "center", flexDirection: "row", flexShrink: 1, gap: 4 },
  dueText: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, flexShrink: 1, fontVariant: ["tabular-nums"], fontWeight: "700" },
  // A hairline separates the request from the parameter, so the two lines read as two levels.
  parameterLine: {
    alignItems: "flex-start",
    borderTopColor: COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: SPACING.small,
    paddingTop: SPACING.small,
  },
  parameterIcon: { marginTop: 2 },
  parameterCopy: { flex: 1, gap: 2 },
  code: { color: COLORS.accent, ...TYPOGRAPHY.caption, fontVariant: ["tabular-nums"], fontWeight: "700", letterSpacing: 0.3 },
  parameterText: { ...TYPOGRAPHY.caption, fontSize: 13 },
  mainParameter: { color: COLORS.inkMuted, fontWeight: "600" },
  separator: { color: COLORS.inkMuted, fontWeight: "700" },
  subParameter: { color: COLORS.ink, fontWeight: "700" },
});
