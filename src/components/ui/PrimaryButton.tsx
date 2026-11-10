import { ActivityIndicator, StyleSheet, Text } from "react-native";

import PressableScale from "@/src/components/motion/PressableScale";

import {
  COLORS,
  CONTROL_HEIGHT,
  RADII,
  SPACING,
  TYPOGRAPHY,
} from "@/src/theme/tokens";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
}

function PrimaryButton({
  label,
  onPress,
  isDisabled = false,
  isLoading = false,
}: PrimaryButtonProps) {
  const isUnavailable = isDisabled || isLoading;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isUnavailable, busy: isLoading }}
      disabled={isUnavailable}
      onPress={onPress}
      style={[styles.button, isUnavailable && styles.buttonDisabled]}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.white} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </PressableScale>
  );
}

export default PrimaryButton;

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: RADII.large,
    minHeight: CONTROL_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: SPACING.large,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  label: {
    color: COLORS.white,
    ...TYPOGRAPHY.control,
    fontSize: 17,
    fontWeight: "700",
  },
});
