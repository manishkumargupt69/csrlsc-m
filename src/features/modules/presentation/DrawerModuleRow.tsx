import { memo } from "react";
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import type { ModuleViewModel } from "@/src/features/modules/domain/module.types";
import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

const INDENT_WIDTH = 14;

interface DrawerModuleRowProps {
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  module: ModuleViewModel;
  onModulePress: (module: ModuleViewModel) => void;
  onToggle: (id: string) => void;
}

function DrawerModuleRow({ depth, isExpanded, isSelected, module, onModulePress, onToggle }: DrawerModuleRowProps): ReactElement {
  const hasChildren = Boolean(module.children?.length);
  const handlePress = (): void => {
    if (hasChildren) {
      onToggle(module.id);
      return;
    }
    onModulePress(module);
  };

  return (
    <Pressable
      accessibilityLabel={module.title}
      accessibilityRole="button"
      accessibilityState={hasChildren ? { expanded: isExpanded } : { selected: isSelected }}
      onPress={handlePress}
      style={({ pressed }) => [styles.row, { marginLeft: SPACING.extraLarge + depth * INDENT_WIDTH }, isSelected && styles.selected, pressed && styles.pressed]}
    >
      <Feather color={isSelected ? COLORS.gold : COLORS.onMaroonMuted} name={module.iconName} size={18} />
      <Text numberOfLines={1} style={[styles.label, isSelected && styles.selectedLabel]}>{module.title}</Text>
      {hasChildren ? <Feather color={COLORS.onMaroonMuted} name={isExpanded ? "chevron-down" : "chevron-right"} size={18} /> : null}
    </Pressable>
  );
}

export default memo(DrawerModuleRow);

const styles = StyleSheet.create({
  row: { alignItems: "center", borderRadius: RADII.medium, flexDirection: "row", gap: SPACING.medium, marginRight: SPACING.medium, minHeight: MINIMUM_TOUCH_SIZE, paddingHorizontal: SPACING.medium },
  label: { color: COLORS.white, ...TYPOGRAPHY.body, flex: 1, fontWeight: "600" },
  selected: { backgroundColor: "rgba(255, 189, 74, 0.16)" },
  selectedLabel: { color: COLORS.gold },
  pressed: { backgroundColor: "rgba(255, 255, 255, 0.08)" },
});
