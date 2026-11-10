import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AuthMode } from "@/src/features/auth/domain/auth.types";
import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SPACING } from "@/src/theme/tokens";

interface AuthModeSelectorProps {
  selectedMode: AuthMode;
  isMpinAvailable: boolean;
  onSelectMode: (mode: AuthMode) => void;
}

const AUTH_MODES: readonly { mode: AuthMode; label: string }[] = [
  { mode: "credentials", label: "Password" },
  { mode: "mpin", label: "MPIN" },
];

function AuthModeSelector({
  selectedMode,
  isMpinAvailable,
  onSelectMode,
}: AuthModeSelectorProps) {
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {AUTH_MODES.map(({ mode, label }) => {
        const isSelected = selectedMode === mode;
        const isDisabled = mode === "mpin" && !isMpinAvailable;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isSelected, disabled: isDisabled }}
            disabled={isDisabled}
            key={mode}
            onPress={() => onSelectMode(mode)}
            style={[
              styles.option,
              isSelected && styles.optionSelected,
              isDisabled && styles.optionDisabled,
            ]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default AuthModeSelector;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.medium,
    flexDirection: "row",
    padding: SPACING.extraSmall,
  },
  option: {
    alignItems: "center",
    borderRadius: RADII.small,
    flex: 1,
    justifyContent: "center",
    minHeight: MINIMUM_TOUCH_SIZE,
  },
  optionSelected: {
    backgroundColor: COLORS.surface,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  label: {
    color: COLORS.inkMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  labelSelected: {
    color: COLORS.ink,
  },
});
