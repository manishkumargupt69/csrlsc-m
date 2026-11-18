import type { ReactElement } from "react";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import StatusBadge from "@/src/components/ui/StatusBadge";
import type { AssessmentParameter } from "@/src/features/assessments/domain/assessment.types";
import { getStatusTone } from "@/src/features/assessments/presentation/status-tone";
import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface ParameterRowProps {
  parameter: AssessmentParameter;
  /** True when the auditor has unsaved edits for this parameter. */
  hasDraft: boolean;
  /** Draft rating shown instead of the saved one while edits are pending. */
  rating: number | null;
  onPress?: (parameter: AssessmentParameter) => void;
}

/**
 * One parameter as its own card: Parameter Type as the title with the code beside it, the Sub Parameter
 * below, its Overall Grouping, then status, rating and whether it is mandatory. Empty fields are left out.
 */
function ParameterRow({ parameter, hasDraft, rating, onPress }: ParameterRowProps): ReactElement {
  const handlePress = useCallback((): void => onPress?.(parameter), [onPress, parameter]);
  const content = (
    <>
      <View style={styles.copy}>
        {parameter.parameterType || parameter.code ? (
          <View style={styles.titleRow}>
            {parameter.parameterType ? <Text numberOfLines={2} style={styles.title}>{parameter.parameterType}</Text> : <View style={styles.spacer} />}
            {parameter.code ? <Text style={styles.code}>{"#" + parameter.code}</Text> : null}
          </View>
        ) : null}
        {parameter.title ? <Text numberOfLines={3} style={styles.subParameter}>{parameter.title}</Text> : null}
        {parameter.overallGrouping ? (
          <View style={styles.grouping}>
            <Feather accessibilityElementsHidden color={COLORS.inkMuted} name="layers" size={13} />
            <Text numberOfLines={1} style={styles.groupingText}>{parameter.overallGrouping}</Text>
          </View>
        ) : null}
        <View style={styles.meta}>
          <StatusBadge label={hasDraft ? "Edited" : parameter.status} tone={hasDraft ? "info" : getStatusTone(parameter.status)} />
          {rating !== null ? <Text style={styles.rating}>Rating {rating}/10</Text> : null}
          {parameter.mandatory ? <Text style={styles.mandatory}>Mandatory</Text> : null}
        </View>
      </View>
      {onPress ? <Feather accessibilityElementsHidden color={COLORS.inkMuted} name="chevron-right" size={20} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.card}>{content}</View>;
  return (
    <Pressable
      accessibilityLabel={[parameter.parameterType, parameter.code, parameter.title, parameter.status].filter(Boolean).join(", ")}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export default memo(ParameterRow);

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.large,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: SPACING.medium,
    minHeight: MINIMUM_TOUCH_SIZE,
    padding: SPACING.medium,
  },
  pressed: { backgroundColor: COLORS.surfaceMuted },
  copy: { flex: 1, gap: 6 },
  titleRow: { alignItems: "flex-start", flexDirection: "row", gap: SPACING.small, justifyContent: "space-between" },
  spacer: { flex: 1 },
  title: { color: COLORS.ink, flex: 1, fontSize: 15, fontWeight: "800" },
  code: { color: COLORS.accent, ...TYPOGRAPHY.caption, fontVariant: ["tabular-nums"], fontWeight: "700", letterSpacing: 0.3, marginTop: 1 },
  subParameter: { color: COLORS.ink, ...TYPOGRAPHY.caption, fontSize: 13, fontWeight: "500" },
  grouping: { alignItems: "center", flexDirection: "row", gap: 5 },
  groupingText: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, flexShrink: 1, fontWeight: "600" },
  meta: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: SPACING.small, marginTop: 2 },
  rating: { color: COLORS.ink, ...TYPOGRAPHY.caption, fontVariant: ["tabular-nums"], fontWeight: "700" },
  mandatory: { color: COLORS.danger, ...TYPOGRAPHY.caption, fontWeight: "700" },
});
