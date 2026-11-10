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

function ParameterRow({ parameter, hasDraft, rating, onPress }: ParameterRowProps): ReactElement {
  const handlePress = useCallback((): void => onPress?.(parameter), [onPress, parameter]);
  const content = (
    <>
      <View style={styles.copy}>
        <Text numberOfLines={3} style={styles.title}>{parameter.title || parameter.code}</Text>
        <View style={styles.meta}>
          <StatusBadge label={hasDraft ? "Edited" : parameter.status} tone={hasDraft ? "info" : getStatusTone(parameter.status)} />
          {rating !== null ? <Text style={styles.rating}>Rating {rating}/10</Text> : null}
          {parameter.mandatory ? <Text style={styles.mandatory}>Mandatory</Text> : null}
        </View>
      </View>
      {onPress ? <Feather accessibilityElementsHidden color={COLORS.inkMuted} name="chevron-right" size={20} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityLabel={(parameter.title || parameter.code) + ", " + parameter.status}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export default memo(ParameterRow);

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: SPACING.medium, minHeight: MINIMUM_TOUCH_SIZE, paddingHorizontal: SPACING.large, paddingVertical: SPACING.medium },
  pressed: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADII.medium },
  copy: { flex: 1, gap: SPACING.small },
  title: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "600" },
  meta: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: SPACING.small },
  rating: { color: COLORS.ink, ...TYPOGRAPHY.caption, fontVariant: ["tabular-nums"], fontWeight: "700" },
  mandatory: { color: COLORS.danger, ...TYPOGRAPHY.caption, fontWeight: "700" },
});
