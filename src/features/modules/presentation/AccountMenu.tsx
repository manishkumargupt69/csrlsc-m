import type { ReactElement } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface AccountMenuProps { isVisible: boolean; onClose: () => void; onMpinPress: () => void; onSignOutPress: () => void; }

export default function AccountMenu({ isVisible, onClose, onMpinPress, onSignOutPress }: AccountMenuProps): ReactElement {
  return <Modal animationType="fade" onRequestClose={onClose} transparent visible={isVisible}><Pressable accessibilityLabel="Close account menu" onPress={onClose} style={styles.backdrop}><View accessibilityViewIsModal style={styles.menu}><Text accessibilityRole="header" style={styles.title}>Account</Text><Pressable accessibilityRole="button" onPress={onMpinPress} style={styles.action}><Text style={styles.actionLabel}>Set MPIN</Text></Pressable><Pressable accessibilityRole="button" onPress={onSignOutPress} style={styles.action}><Text style={styles.dangerLabel}>Sign out</Text></Pressable></View></Pressable></Modal>;
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(27,29,27,0.28)", flex: 1, justifyContent: "flex-end", padding: SCREEN_HORIZONTAL_PADDING },
  menu: { backgroundColor: COLORS.surface, borderRadius: RADII.large, padding: SPACING.large },
  title: { color: COLORS.ink, ...TYPOGRAPHY.control, fontWeight: "700", padding: SPACING.medium },
  action: { borderTopColor: COLORS.border, borderTopWidth: 1, justifyContent: "center", minHeight: MINIMUM_TOUCH_SIZE, paddingHorizontal: SPACING.medium },
  actionLabel: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "600" },
  dangerLabel: { color: COLORS.danger, ...TYPOGRAPHY.body, fontWeight: "600" },
});
