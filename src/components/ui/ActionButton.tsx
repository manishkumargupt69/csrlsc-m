import type { ComponentProps, ReactElement } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface ActionButtonProps {
  label: string;
  iconName: ComponentProps<typeof Feather>["name"];
  /** "primary" is the one next step on a card (solid maroon); the others sit beside it as soft tinted buttons. */
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
      style={({ pressed }) => [styles.button, isPrimary ? styles.primary : styles.secondary, pressed && (isPrimary ? styles.primaryPressed : styles.secondaryPressed)]}
    >
      <Feather accessibilityElementsHidden color={isPrimary ? COLORS.white : COLORS.accent} name={iconName} size={16} />
      <Text maxFontSizeMultiplier={1.3} style={[styles.label, isPrimary && styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: RADII.medium,
    flexDirection: "row",
    flexGrow: 1,
    gap: SPACING.small,
    justifyContent: "center",
    minHeight: MINIMUM_TOUCH_SIZE,
    paddingHorizontal: SPACING.medium,
  },
  primary: {
    backgroundColor: COLORS.accent,
    elevation: 2,
    flexShrink: 0,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  primaryPressed: { backgroundColor: COLORS.accentPressed, transform: [{ scale: 0.98 }] },
  secondary: { backgroundColor: COLORS.accentSoft, flexShrink: 0 },
  secondaryPressed: { backgroundColor: COLORS.accentSoftPressed, transform: [{ scale: 0.98 }] },
  label: { color: COLORS.accent, flexShrink: 0, ...TYPOGRAPHY.body, fontWeight: "700" },
  primaryLabel: { color: COLORS.white },
});
