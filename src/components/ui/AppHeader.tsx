import type { ComponentProps, ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BrandLogo, { BRAND_NAME } from "@/src/components/branding/BrandLogo";
import GlassBackground from "@/src/components/ui/GlassBackground";
import { APP_HEADER_CONTENT_HEIGHT, COLORS, MINIMUM_TOUCH_SIZE, SCREEN_HORIZONTAL_PADDING, SPACING } from "@/src/theme/tokens";

interface HeaderAction { accessibilityLabel: string; icon: ComponentProps<typeof Feather>["name"]; onPress: () => void; }
interface AppHeaderProps { title: string; onBack?: () => void; leadingAction?: HeaderAction; action?: HeaderAction; }

export default function AppHeader({ title, onBack, leadingAction, action }: AppHeaderProps): ReactElement {
  const { top: statusBarHeight } = useSafeAreaInsets();
  const menuAction = leadingAction ?? (action?.icon === "menu" ? action : undefined);
  const actionWithoutMenu = action?.icon === "menu" ? undefined : action;
  // With a back button the menu moves to the trailing edge so the header stays one row tall.
  const trailingAction = actionWithoutMenu ?? (onBack ? menuAction : undefined);

  return (
    <View style={[styles.header, { paddingTop: statusBarHeight }]}>
      <GlassBackground highlight="bottom" />
      <View style={styles.container}>
        {onBack ? <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}><Feather accessibilityElementsHidden color={COLORS.white} importantForAccessibility="no-hide-descendants" name="arrow-left" size={22} /></Pressable> : menuAction ? <Pressable accessibilityLabel={menuAction.accessibilityLabel} accessibilityRole="button" onPress={menuAction.onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}><Feather accessibilityElementsHidden color={COLORS.white} importantForAccessibility="no-hide-descendants" name={menuAction.icon} size={22} /></Pressable> : null}
        {title === BRAND_NAME ? (
          <View style={styles.brandTitle}>
            <BrandLogo variant="wordmark" tone="light" width={96} />
          </View>
        ) : (
          <Text accessibilityRole="header" adjustsFontSizeToFit maxFontSizeMultiplier={1.3} minimumFontScale={0.7} numberOfLines={1} style={styles.title}>{title}</Text>
        )}
        {trailingAction ? <Pressable accessibilityLabel={trailingAction.accessibilityLabel} accessibilityRole="button" onPress={trailingAction.onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}><Feather accessibilityElementsHidden color={COLORS.white} importantForAccessibility="no-hide-descendants" name={trailingAction.icon} size={22} /></Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Floats over the content, which scrolls beneath it; the frosted glass reaches up behind the status bar.
  header: { left: 0, position: "absolute", right: 0, top: 0, zIndex: 10 },
  container: { alignItems: "center", flexDirection: "row", minHeight: APP_HEADER_CONTENT_HEIGHT, paddingHorizontal: SCREEN_HORIZONTAL_PADDING - SPACING.medium },
  brandTitle: { flex: 1, paddingHorizontal: SPACING.small },
  iconButton: { alignItems: "center", borderRadius: 24, justifyContent: "center", minHeight: MINIMUM_TOUCH_SIZE, minWidth: MINIMUM_TOUCH_SIZE },
  iconButtonPressed: { backgroundColor: "rgba(255, 255, 255, 0.16)" },
  title: { color: COLORS.white, flex: 1, fontSize: 17, fontWeight: "700", paddingHorizontal: SPACING.small },
});
