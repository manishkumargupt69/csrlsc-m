import type { ComponentProps, ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import IconTile from "@/src/components/ui/IconTile";
import StatusBadge from "@/src/components/ui/StatusBadge";
import { COLORS, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import type { StatusTone } from "@/src/types/status";

interface SettingsRowProps {
  iconName: ComponentProps<typeof Feather>["name"];
  title: string;
  /** One line under the title that says what the row does or its current state. */
  subtitle?: string;
  /** Short status shown at the trailing edge, e.g. "Not set up". */
  badge?: { label: string; tone: StatusTone };
  /** "danger" is for destructive rows such as Sign out. */
  tone?: "default" | "danger";
  isDisabled?: boolean;
  onPress: () => void;
}

/** One tappable row in a settings-style grouped list: icon tile, title, optional state, chevron. */
export default function SettingsRow({ iconName, title, subtitle, badge, tone = "default", isDisabled = false, onPress }: SettingsRowProps): ReactElement {
  const isDanger = tone === "danger";
  return (
    <Pressable
      accessibilityLabel={subtitle ? title + ", " + subtitle : title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, isDisabled && styles.disabled]}
    >
      <IconTile name={iconName} tone={isDanger ? "danger" : "info"} />
      <View style={styles.copy}>
        <Text style={[styles.title, isDanger && styles.danger]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? <StatusBadge label={badge.label} tone={badge.tone} /> : null}
      {isDanger ? null : <Feather accessibilityElementsHidden color={COLORS.inkMuted} name="chevron-right" size={18} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: SPACING.medium, minHeight: 56, paddingHorizontal: SPACING.large, paddingVertical: SPACING.small },
  pressed: { backgroundColor: COLORS.surfaceMuted },
  disabled: { opacity: 0.5 },
  copy: { flex: 1, gap: 1 },
  title: { color: COLORS.ink, ...TYPOGRAPHY.control, fontWeight: "700" },
  danger: { color: COLORS.danger },
  subtitle: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption },
});
