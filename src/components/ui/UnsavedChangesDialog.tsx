import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface UnsavedChangesDialogProps {
  onDiscard: () => void;
  onKeepEditing: () => void;
}

export default function UnsavedChangesDialog({ onDiscard, onKeepEditing }: UnsavedChangesDialogProps): ReactElement {
  return (
    <View accessibilityViewIsModal style={styles.dialog}>
      <View style={styles.iconWrap}>
        <Feather accessibilityElementsHidden color={COLORS.warningInk} name="alert-triangle" size={24} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>Leave without saving?</Text>
      <Text style={styles.message}>The changes you made on this screen will not be saved.</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onKeepEditing} style={({ pressed }) => [styles.button, styles.keepButton, pressed && styles.pressed]}>
          <Text style={styles.keepLabel}>Keep editing</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDiscard} style={({ pressed }) => [styles.button, styles.discardButton, pressed && styles.discardPressed]}>
          <Text style={styles.discardLabel}>Don&apos;t save and leave</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dialog: { alignSelf: "center", backgroundColor: COLORS.surface, borderRadius: RADII.sheet, marginHorizontal: SPACING.extraLarge, maxWidth: 400, padding: SPACING.extraLarge, width: "88%" },
  iconWrap: { alignItems: "center", backgroundColor: COLORS.warningBackground, borderRadius: RADII.medium, height: 48, justifyContent: "center", marginBottom: SPACING.large, width: 48 },
  title: { color: COLORS.ink, fontSize: 22, fontWeight: "700" },
  message: { color: COLORS.inkMuted, ...TYPOGRAPHY.body, marginTop: SPACING.small },
  actions: { gap: SPACING.small, marginTop: SPACING.extraLarge },
  button: { alignItems: "center", borderRadius: RADII.medium, justifyContent: "center", minHeight: 52, paddingHorizontal: SPACING.medium },
  keepButton: { backgroundColor: COLORS.accent },
  discardButton: { backgroundColor: COLORS.dangerSoft },
  keepLabel: { color: COLORS.white, ...TYPOGRAPHY.control, fontWeight: "700" },
  discardLabel: { color: COLORS.danger, ...TYPOGRAPHY.control, fontWeight: "700" },
  pressed: { backgroundColor: COLORS.accentPressed },
  discardPressed: { opacity: 0.7 },
});
