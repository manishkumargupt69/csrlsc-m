import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SPACING } from "@/src/theme/tokens";

interface RememberMeControlProps {
  isSelected: boolean;
  onToggle: () => void;
}

function RememberMeControl({
  isSelected,
  onToggle,
}: RememberMeControlProps): ReactElement {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel="Remember me"
      accessibilityState={{ checked: isSelected }}
      onPress={onToggle}
      style={styles.container}
    >
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected ? (
          <Feather color={COLORS.white} name="check" size={16} />
        ) : null}
      </View>
      <Text style={styles.label}>Remember me on this device</Text>
    </Pressable>
  );
}

export default RememberMeControl;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: MINIMUM_TOUCH_SIZE,
    gap: SPACING.medium,
  },
  checkbox: {
    alignItems: "center",
    borderColor: COLORS.border,
    borderRadius: RADII.small,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkboxSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  label: {
    flexShrink: 1,
    color: COLORS.ink,
    fontSize: 14,
  },
});
