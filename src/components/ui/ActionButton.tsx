import type { ComponentProps, ReactElement } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface ActionButtonProps {
  label: string;
  iconName: ComponentProps<typeof Feather>["name"];
  /** "primary" is the one next step on a card; the others sit beside it as outlined buttons. */
  variant: "primary" | "secondary";
  onPress: () => void;
}

/** Compact row button for list cards. A plain Pressable on purpose: cards repeat, so each one stays cheap. */
export default function ActionButton({ label, iconName, variant, onPress }: ActionButtonProps): ReactElement {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, isPrimary ? styles.primary : styles.secondary, pressed && styles.pressed]}
    >
      <Feather accessibilityElementsHidden color={isPrimary ? COLORS.white : COLORS.ink} name={iconName} size={16} />
      <Text maxFontSizeMultiplier={1.3} style={[styles.label, isPrimary && styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: RADII.medium,
    borderWidth: 1,
    flexDirection: "row",
    flexGrow: 1,
    gap: SPACING.small,
    justifyContent: "center",
    minHeight: MINIMUM_TOUCH_SIZE,
    paddingHorizontal: SPACING.small,
  },
  primary: { backgroundColor: COLORS.accent, borderColor: COLORS.accent, flexShrink: 0 },
  secondary: { backgroundColor: COLORS.surface, borderColor: COLORS.border, flexShrink: 0 },
  pressed: { opacity: 0.8 },
  label: { color: COLORS.ink, flexShrink: 0, ...TYPOGRAPHY.body, fontWeight: "700" },
  primaryLabel: { color: COLORS.white },
});
