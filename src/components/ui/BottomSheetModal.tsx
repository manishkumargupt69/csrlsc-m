import type { PropsWithChildren, ReactElement } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Feather from "@expo/vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, MAX_CONTENT_WIDTH, RADII, SPACING } from "@/src/theme/tokens";

interface BottomSheetModalProps extends PropsWithChildren {
  accessibilityLabel: string;
  isVisible: boolean;
  title: string;
  /** One line under the title that names what the sheet is acting on. */
  subtitle?: string;
  onClose: () => void;
  onDismiss?: () => void;
}

const BOTTOM_SAFE_AREA_EDGES = ["bottom"] as const;

export default function BottomSheetModal({
  accessibilityLabel,
  children,
  isVisible,
  title,
  subtitle,
  onClose,
  onDismiss,
}: BottomSheetModalProps): ReactElement {
  return (
    <Modal
      animationType="slide"
      onDismiss={onDismiss}
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={isVisible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          behavior="padding"
          pointerEvents="box-none"
          style={styles.keyboardArea}
        >
          <SafeAreaView
            accessibilityViewIsModal
            edges={BOTTOM_SAFE_AREA_EDGES}
            style={styles.sheet}
          >
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.titleBlock}>
                <Text accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>
                {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <Pressable
                accessibilityLabel={`Close ${title}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onClose}
                style={styles.closeButton}
              >
                <Feather color={COLORS.inkMuted} name="x" size={16} />
              </Pressable>
            </View>
            {children}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: COLORS.overlay,
    flex: 1,
  },
  keyboardArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    alignSelf: "center",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    maxWidth: MAX_CONTENT_WIDTH,
    overflow: "hidden",
    width: "100%",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: COLORS.border,
    borderRadius: RADII.pill,
    height: 5,
    marginTop: SPACING.small + 2,
    width: 40,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.medium,
    paddingBottom: SPACING.small,
    paddingHorizontal: SPACING.large + 4,
    paddingTop: SPACING.medium,
  },
  titleBlock: { flex: 1, gap: 2 },
  title: {
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: { color: COLORS.inkMuted, fontSize: 14, fontWeight: "500" },
  closeButton: {
    alignItems: "center",
    backgroundColor: COLORS.border,
    borderRadius: RADII.pill,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
});
