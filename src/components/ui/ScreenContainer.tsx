import type { PropsWithChildren, ReactElement } from "react";
import { useMemo } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import {
  useFloatingNavigationVisibility,
  useIsTabScreen,
} from "@/src/components/navigation/use-floating-navigation-visibility";
import { APP_HEADER_CONTENT_HEIGHT, COLORS, FLOATING_TAB_BAR_CONTENT_CLEARANCE, MAX_CONTENT_WIDTH } from "@/src/theme/tokens";

/** Space that scrolling content leaves for the glass header above it and the glass bar below it. */
export interface ScreenInsets {
  top: number;
  bottom: number;
}

/**
 * Header and navigation bar float over the content so it can scroll beneath their frosted glass.
 * Scrollers add these to their padding so the first and last items still start and end in the clear.
 * A screen calls this itself, above its ScreenContainer, so it reads the route directly instead of a context.
 */
export const useScreenInsets = (): ScreenInsets => {
  const showFloatingNavigation = useFloatingNavigationVisibility();
  const isTabScreen = useIsTabScreen();
  const safeArea = useSafeAreaInsets();
  return useMemo(
    (): ScreenInsets => ({
      top: safeArea.top + APP_HEADER_CONTENT_HEIGHT,
      bottom: showFloatingNavigation || isTabScreen ? FLOATING_TAB_BAR_CONTENT_CLEARANCE : 0,
    }),
    [isTabScreen, safeArea.top, showFloatingNavigation],
  );
};

interface ScreenContainerProps extends PropsWithChildren {
  /** Screens with the glass app header let content scroll beneath it. */
  hasHeader?: boolean;
}

export default function ScreenContainer({ children, hasHeader = true }: ScreenContainerProps): ReactElement {
  return (
    <View style={styles.root}>
      <StatusBar style={hasHeader ? "light" : "dark"} translucent />
      <SafeAreaView edges={hasHeader ? ["left", "right", "bottom"] : ["top", "left", "right", "bottom"]} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior="padding"
          enabled={Platform.OS === "ios"}
          style={styles.keyboardArea}
        >
          <View style={styles.content}>{children}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: COLORS.background, flex: 1 },
  safeArea: { flex: 1 },
  keyboardArea: { flex: 1 },
  content: { alignSelf: "center", flex: 1, maxWidth: MAX_CONTENT_WIDTH, width: "100%" },
});
