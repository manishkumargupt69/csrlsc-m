import { useCallback } from "react";
import type { ComponentProps, ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import PressableScale from "@/src/components/motion/PressableScale";
import IconTile from "@/src/components/ui/IconTile";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import { runAfterKeyboardDismissed } from "@/src/utils/run-after-keyboard-dismissed";

interface SelectFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onPress: () => void;
  isDisabled?: boolean;
  /** Leading icon that hints at what is being chosen. */
  iconName?: ComponentProps<typeof Feather>["name"];
  /** Shown instead of the placeholder while the field is unavailable, e.g. "Choose a service first". */
  hint?: string;
  /** Marks the field with an asterisk and announces it as required. */
  isRequired?: boolean;
}

export default function SelectField({ label, placeholder, value, onPress, isDisabled = false, iconName, hint, isRequired = false }: SelectFieldProps): ReactElement {
  const handlePress = useCallback((): void => {
    runAfterKeyboardDismissed(onPress);
  }, [onPress]);
  const hasValue = Boolean(value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}{isRequired ? <Text style={styles.required}> *</Text> : null}</Text>
      <PressableScale
        accessibilityLabel={label + (isRequired ? ", required" : "") + ": " + (value || placeholder)}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={handlePress}
        style={[styles.control, hasValue && styles.controlFilled, isDisabled && styles.disabled]}
      >
        {iconName ? <IconTile name={iconName} tone={hasValue ? "info" : "neutral"} /> : null}
        <Text numberOfLines={2} style={[styles.valueText, !hasValue && styles.placeholder]}>{value || (isDisabled && hint ? hint : placeholder)}</Text>
        <View style={styles.chevron}>
          <Feather accessibilityElementsHidden color={COLORS.inkMuted} name="chevron-down" size={16} />
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.small },
  label: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "700" },
  required: { color: COLORS.danger },
  control: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.large,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.medium,
    minHeight: 56,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
  },
  controlFilled: { borderColor: COLORS.accent },
  disabled: { backgroundColor: COLORS.surfaceMuted, opacity: 0.6 },
  valueText: { color: COLORS.ink, flex: 1, ...TYPOGRAPHY.control, fontWeight: "600" },
  placeholder: { color: COLORS.inkMuted, fontWeight: "400" },
  chevron: { alignItems: "center", backgroundColor: COLORS.surfaceMuted, borderRadius: RADII.pill, height: 28, justifyContent: "center", width: 28 },
});
