import type { ReactElement } from "react";
import { Animated, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import BrandLogo from "./BrandLogo";
import { COLORS, SPACING } from "@/src/theme/tokens";

interface LaunchSplashScreenProps {
  iconScale: Animated.Value;
  opacity: Animated.Value;
}

export default function LaunchSplashScreen({
  iconScale,
  opacity,
}: LaunchSplashScreenProps): ReactElement {
  // Same width as the logo in the native splash (55% of its 300 pt image), so the hand-off does not jump.
  const logoWidth = 165;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.content, { opacity }]}>
        <Animated.View style={[styles.icon, { transform: [{ scale: iconScale }] }]}>
          <BrandLogo width={logoWidth} />
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: SPACING.extraLarge },
  icon: { alignItems: "center", justifyContent: "center", width: "100%" },
});
