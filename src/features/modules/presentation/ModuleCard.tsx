import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PressableStateCallbackType, StyleProp, ViewStyle } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import type { ModuleIconName } from "@/src/features/modules/domain/module.types";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

const ICON_BADGE_SIZE = 44;

interface ModuleCardProps {
  id: string;
  title: string;
  description: string;
  iconName: ModuleIconName;
  onPress: () => void;
  accessibilityHint?: string;
}

const getCardStyle = ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
  styles.container,
  pressed && styles.pressed,
];

export default function ModuleCard({
  id,
  title,
  description,
  iconName,
  onPress,
  accessibilityHint = "Double tap to open module",
}: ModuleCardProps): ReactElement {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={`${title}. ${description}`}
      accessibilityRole="button"
      android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: false }}
      nativeID={id}
      onPress={onPress}
      style={getCardStyle}
    >
      <View style={styles.header}>
        <View accessibilityElementsHidden style={styles.iconBadge}>
          <Feather color={COLORS.accent} name={iconName} size={22} />
        </View>
        <View accessibilityElementsHidden style={styles.disclosureBadge}>
          <Feather color={COLORS.inkMuted} name="chevron-right" size={18} />
        </View>
      </View>
      <Text numberOfLines={2} style={styles.title}>{title}</Text>
      <Text numberOfLines={2} style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.sheet,
    borderWidth: 1,
    elevation: 3,
    flexBasis: "48%",
    flexGrow: 0,
    gap: SPACING.small,
    marginBottom: SPACING.medium,
    minHeight: 160,
    padding: SPACING.large,
    shadowColor: COLORS.ink,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  pressed: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.02,
    elevation: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.medium,
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADII.large,
    height: ICON_BADGE_SIZE,
    justifyContent: "center",
    width: ICON_BADGE_SIZE,
  },
  disclosureBadge: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.pill,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  title: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  description: {
    color: COLORS.inkMuted,
    ...TYPOGRAPHY.caption,
  },
});
