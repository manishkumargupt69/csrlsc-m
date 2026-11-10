import type { ReactElement } from "react";
import { memo, useCallback, useEffect } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
// Import the one icon family: the package index pulls every family's font into the app (about 5 MB).
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  runOnUI,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GlassBackground from "@/src/components/ui/GlassBackground";
import type { TabItem } from "@/src/components/navigation/tab-items";
import { TAB_ITEMS } from "@/src/components/navigation/tab-items";
import { SPRING_SMOOTH, SPRING_SNAPPY, TIMING_FAST } from "@/src/theme/motion";
import {
  COLORS,
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MINIMUM_BOTTOM_OFFSET,
  FLOATING_TAB_BAR_SAFE_AREA_GAP,
  MAX_CONTENT_WIDTH,
} from "@/src/theme/tokens";

const SIDE_MARGIN = 20;
const BAR_PADDING = 6;
const INDICATOR_INSET = 4;
const INDICATOR_HEIGHT = FLOATING_TAB_BAR_HEIGHT - BAR_PADDING * 2;
const MAX_STRETCH = 0.22;
const PRESSED_SCALE = 0.9;
// 0.78 keeps the inactive labels above 4.5:1 even where the glass sits over a white card.
const MUTED = "rgba(255, 255, 255, 0.78)";

interface NavTabProps {
  item: TabItem;
  index: number;
  slotWidth: number;
  isActive: boolean;
  /** Current x of the capsule, on the UI thread; the tab lights up as the capsule reaches it. */
  capsuleX: SharedValue<number>;
  capsuleVisible: SharedValue<number>;
  onPress: (item: TabItem, index: number) => void;
}

const NavTab = memo(function NavTab({ item, index, slotWidth, isActive, capsuleX, capsuleVisible, onPress }: NavTabProps): ReactElement {
  const pressed = useSharedValue(1);
  // 1 when the capsule sits exactly on this tab, 0 when it is a full slot away. No React state involved,
  // so icon, label and capsule move as one even while the JS thread is busy mounting the next screen.
  const progress = useDerivedValue(() => capsuleVisible.value * Math.max(0, 1 - Math.abs(capsuleX.value - index * slotWidth) / slotWidth));

  const outlineStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const filledStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }, { translateY: -progress.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({ color: interpolateColor(progress.value, [0, 1], [MUTED, COLORS.maroonDark]) }));

  return (
    <Pressable
      accessibilityLabel={item.accessibilityLabel}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      onPress={() => onPress(item, index)}
      onPressIn={() => { pressed.value = withSpring(PRESSED_SCALE, SPRING_SNAPPY); }}
      onPressOut={() => { pressed.value = withSpring(1, SPRING_SNAPPY); }}
      style={[styles.tab, { width: slotWidth }]}
    >
      <Animated.View style={[styles.tabContent, contentStyle]}>
        <View style={styles.iconBox}>
          <Animated.View style={[styles.iconLayer, outlineStyle]}>
            <Ionicons color={MUTED} name={item.icon} size={22} />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, filledStyle]}>
            <Ionicons color={COLORS.maroonDark} name={item.activeIcon} size={22} />
          </Animated.View>
        </View>
        <Animated.Text adjustsFontSizeToFit maxFontSizeMultiplier={1.25} minimumFontScale={0.8} numberOfLines={1} style={[styles.label, labelStyle]}>{item.title}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
});

interface FloatingNavBarProps {
  /** Index in TAB_ITEMS of the current tab, or -1 on screens that sit above the tabs. */
  activeIndex: number;
  onSelect: (item: TabItem) => void;
  /** Move the capsule the instant a tab is touched, before navigation finishes. Off where navigation can be cancelled. */
  isOptimistic?: boolean;
}

/**
 * Frosted-glass maroon floating bar. One gold capsule slides between destinations: it travels on a spring and
 * stretches while it moves, then settles, so switching reads as a single liquid gesture.
 */
export default function FloatingNavBar({ activeIndex, onSelect, isOptimistic = true }: FloatingNavBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const bottom = Math.max(insets.bottom + FLOATING_TAB_BAR_SAFE_AREA_GAP, FLOATING_TAB_BAR_MINIMUM_BOTTOM_OFFSET);
  const barWidth = Math.min(screenWidth - SIDE_MARGIN * 2, MAX_CONTENT_WIDTH - SIDE_MARGIN * 2);
  const slotWidth = (barWidth - BAR_PADDING * 2) / TAB_ITEMS.length;
  const indicatorWidth = slotWidth - INDICATOR_INSET * 2;

  const targetX = useSharedValue(Math.max(activeIndex, 0) * slotWidth);
  const x = useSharedValue(Math.max(activeIndex, 0) * slotWidth);
  const visible = useSharedValue(activeIndex >= 0 ? 1 : 0);

  const moveTo = useCallback(
    (index: number): void => {
      runOnUI(() => {
        "worklet";
        if (targetX.value === index * slotWidth) return;
        targetX.value = index * slotWidth;
        x.value = withSpring(index * slotWidth, SPRING_SMOOTH);
      })();
    },
    [slotWidth, targetX, x],
  );

  // Follows the navigator when the tab changes some other way (Back, deep link) or the width changes.
  useEffect(() => {
    if (activeIndex >= 0) moveTo(activeIndex);
    visible.value = withTiming(activeIndex >= 0 ? 1 : 0, TIMING_FAST);
  }, [activeIndex, moveTo, visible]);

  const handleSelect = useCallback(
    (item: TabItem, index: number): void => {
      if (isOptimistic) {
        visible.value = 1;
        moveTo(index);
      }
      // Navigating re-renders a whole screen on the JS thread. Let the capsule take its first frame
      // before that work starts, so the touch is answered immediately.
      requestAnimationFrame(() => onSelect(item));
    },
    [isOptimistic, moveTo, onSelect, visible],
  );

  // The farther the capsule still has to travel, the more it stretches along its path.
  const stretch = useDerivedValue(() => 1 + Math.min(1, Math.abs(targetX.value - x.value) / slotWidth) * MAX_STRETCH);
  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [{ translateX: x.value }, { scaleX: stretch.value }, { scaleY: 2 - stretch.value }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.position, { bottom }]}>
      <View accessibilityRole="tablist" style={[styles.bar, { width: barWidth }]}>
        <GlassBackground highlight="all" radius={FLOATING_TAB_BAR_HEIGHT / 2} tint={COLORS.glassMaroonDeep} />
        <Animated.View
          pointerEvents="none"
          style={[styles.indicator, { left: BAR_PADDING + INDICATOR_INSET, width: indicatorWidth }, indicatorStyle]}
        />
        {TAB_ITEMS.map((item, index) => (
          <NavTab
            key={item.name}
            capsuleVisible={visible}
            capsuleX={x}
            index={index}
            isActive={index === activeIndex}
            item={item}
            onPress={handleSelect}
            slotWidth={slotWidth}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  position: { alignItems: "center", left: 0, position: "absolute", right: 0 },
  bar: {
    alignItems: "center",
    borderRadius: FLOATING_TAB_BAR_HEIGHT / 2,
    flexDirection: "row",
    height: FLOATING_TAB_BAR_HEIGHT,
    paddingHorizontal: BAR_PADDING,
  },
  indicator: {
    backgroundColor: COLORS.gold,
    borderRadius: INDICATOR_HEIGHT / 2,
    height: INDICATOR_HEIGHT,
    position: "absolute",
    top: BAR_PADDING,
  },
  tab: { alignItems: "center", height: "100%", justifyContent: "center" },
  tabContent: { alignItems: "center", gap: 2, maxWidth: "100%" },
  iconBox: { height: 24, width: 24 },
  iconLayer: { alignItems: "center", height: 24, justifyContent: "center", position: "absolute", width: 24 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.1 },
});
