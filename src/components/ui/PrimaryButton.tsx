import type { ComponentProps, ReactElement } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import PressableScale from "@/src/components/motion/PressableScale";
import { COLORS, CONTROL_HEIGHT, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

type IconName = ComponentProps<typeof Feather>["name"];

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  /** An icon that names the action (plus, check, send…); leading by default. */
  iconName?: IconName;
  /** "trailing" for actions that move forward, e.g. Continue with an arrow. */
  iconPlacement?: "leading" | "trailing";
}

const BUTTON_RADIUS = 16;
const ICON_SIZE = 19;

/**
 * The one main action of a screen or sheet. A maroon surface with a faint top highlight and a soft maroon
 * shadow so it reads as something to press, not a flat bar; it springs down when held. Unavailable is shown
 * by colour (a quiet grey with readable text), not by fading the whole button.
 */
function PrimaryButton({ label, onPress, isDisabled = false, isLoading = false, iconName, iconPlacement = "leading" }: PrimaryButtonProps): ReactElement {
  const isUnavailable = isDisabled || isLoading;
  const inkColor = isDisabled && !isLoading ? COLORS.inkMuted : COLORS.white;
  const icon = iconName && !isLoading ? <Feather accessibilityElementsHidden color={inkColor} name={iconName} size={ICON_SIZE} /> : null;

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isUnavailable, busy: isLoading }}
      disabled={isUnavailable}
      onPress={onPress}
      style={[styles.button, isDisabled && !isLoading ? styles.disabled : styles.enabled]}
    >
      {isDisabled && !isLoading ? null : <View pointerEvents="none" style={styles.highlight} />}
      {isLoading ? <ActivityIndicator color={COLORS.white} size="small" /> : null}
      {iconPlacement === "leading" ? icon : null}
      <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={[styles.label, { color: inkColor }]}>{label}</Text>
      {iconPlacement === "trailing" ? icon : null}
    </PressableScale>
  );
}

export default PrimaryButton;

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: BUTTON_RADIUS,
    flexDirection: "row",
    gap: SPACING.small,
    justifyContent: "center",
    minHeight: CONTROL_HEIGHT,
    paddingHorizontal: SPACING.extraLarge,
  },
  enabled: {
    backgroundColor: COLORS.accent,
    elevation: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  disabled: { backgroundColor: COLORS.border },
  // A hairline of light along the top edge gives the surface a little volume.
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: BUTTON_RADIUS,
    borderTopWidth: 1,
  },
  label: { ...TYPOGRAPHY.control, flexShrink: 1, fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
});
