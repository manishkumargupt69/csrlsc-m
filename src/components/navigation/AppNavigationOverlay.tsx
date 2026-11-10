import type { ReactElement } from "react";
import { useEffect } from "react";
import { BackHandler, Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, SlideInLeft } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import UnsavedChangesDialog from "@/src/components/ui/UnsavedChangesDialog";
import AppDrawerContent from "@/src/features/modules/presentation/AppDrawerContent";
import { COLORS } from "@/src/theme/tokens";

interface AppNavigationOverlayProps {
  isMenuVisible: boolean;
  isWarningVisible: boolean;
  onCancel: () => void;
  onCloseMenu: () => void;
  onDiscard: () => void;
}

const DRAWER_ENTRANCE_MS = 240;

export default function AppNavigationOverlay({ isMenuVisible, isWarningVisible, onCancel, onCloseMenu, onDiscard }: AppNavigationOverlayProps): ReactElement {
  // The menu lives in the app's own window, not a Modal, so its frosted glass can blur the screen behind it.
  useEffect(() => {
    if (!isMenuVisible || isWarningVisible) return undefined;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onCloseMenu();
      return true;
    });
    return () => subscription.remove();
  }, [isMenuVisible, isWarningVisible, onCloseMenu]);

  return (
    <>
      {isMenuVisible ? (
        <View pointerEvents="box-none" style={styles.menuLayer}>
          <Animated.View entering={FadeIn.duration(DRAWER_ENTRANCE_MS)} style={StyleSheet.absoluteFill}>
            <Pressable accessibilityLabel="Close menu" accessibilityRole="button" onPress={onCloseMenu} style={styles.backdrop} />
          </Animated.View>
          <Animated.View entering={SlideInLeft.duration(DRAWER_ENTRANCE_MS)} style={styles.drawerSlot}>
            <SafeAreaView edges={["top", "bottom"]} style={styles.drawer}>
              <AppDrawerContent onClose={onCloseMenu} />
            </SafeAreaView>
          </Animated.View>
        </View>
      ) : null}
      {isWarningVisible ? (
        <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible>
          <View style={styles.overlay}>
            <Pressable accessibilityLabel="Keep editing" accessibilityRole="button" onPress={onCancel} style={StyleSheet.absoluteFill} />
            <UnsavedChangesDialog onDiscard={onDiscard} onKeepEditing={onCancel} />
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  menuLayer: { ...StyleSheet.absoluteFillObject, elevation: 30, zIndex: 30 },
  backdrop: { backgroundColor: COLORS.overlay, flex: 1 },
  drawerSlot: { bottom: 0, left: 0, maxWidth: 340, position: "absolute", top: 0, width: "82%" },
  overlay: { backgroundColor: COLORS.overlay, flex: 1, justifyContent: "center" },
  drawer: { height: "100%", width: "100%" },
});
