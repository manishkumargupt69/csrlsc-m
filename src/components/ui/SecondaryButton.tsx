import type { ComponentProps, ReactElement } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  iconName?: ComponentProps<typeof Feather>["name"];
  isDisabled?: boolean;
  isSelected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function SecondaryButton({ label, onPress, iconName, isDisabled = false, isSelected = false, style }: SecondaryButtonProps): ReactElement {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, selected: isSelected }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, style, isSelected && styles.selected, pressed && styles.pressed, isDisabled && styles.disabled]}
    >
      {iconName ? <Feather accessibilityElementsHidden color={isSelected ? COLORS.accent : COLORS.inkMuted} importantForAccessibility="no-hide-descendants" name={iconName} size={18} /> : null}
      <Text numberOfLines={1} style={[styles.label, isSelected && styles.selectedLabel]}>{label}</Text>
      {isSelected ? <Feather accessibilityElementsHidden color={COLORS.accent} importantForAccessibility="no-hide-descendants" name="check" size={18} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({ button: { alignItems: "center", backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.medium, borderWidth: 1, flexDirection: "row", gap: SPACING.small, justifyContent: "center", minHeight: MINIMUM_TOUCH_SIZE, paddingHorizontal: SPACING.large }, selected: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent }, selectedLabel: { color: COLORS.accent }, pressed: { backgroundColor: COLORS.surfaceMuted, transform: [{ scale: 0.98 }] }, disabled: { opacity: 0.45 }, label: { color: COLORS.ink, ...TYPOGRAPHY.control, flexShrink: 1, fontWeight: "600" } });
