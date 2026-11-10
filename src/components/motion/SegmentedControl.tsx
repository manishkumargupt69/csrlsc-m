import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { SPRING_SMOOTH } from "@/src/theme/motion";
import { COLORS, RADII, TYPOGRAPHY } from "@/src/theme/tokens";

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
  accessibilityLabel: string;
}

const TRACK_PADDING = 3;

interface SegmentProps<T extends string> {
  option: SegmentOption<T>;
  isSelected: boolean;
  onSelect: (key: T) => void;
}

function Segment<T extends string>({ option, isSelected, onSelect }: SegmentProps<T>): ReactElement {
  const handlePress = useCallback((): void => onSelect(option.key), [onSelect, option.key]);
  return (
    <Pressable
      accessibilityLabel={option.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected }}
      onPress={handlePress}
      style={styles.segment}
    >
      <Text adjustsFontSizeToFit maxFontSizeMultiplier={1.3} minimumFontScale={0.75} numberOfLines={1} style={[styles.label, isSelected && styles.selectedLabel]}>
        {option.label}
      </Text>
    </Pressable>
  );
}

/**
 * Single-choice filter with one highlight that springs between options
 * (the Motion `layoutId` pattern, built on a shared value).
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>): ReactElement {
  const [trackWidth, setTrackWidth] = useState(0);
  const index = Math.max(0, options.findIndex((option) => option.key === value));
  const segmentWidth = trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / options.length : 0;
  const position = useSharedValue(index);
  const isReady = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth === 0) return;
    // First measurement jumps into place; later changes spring.
    if (isReady.value === 0) {
      position.value = index;
      isReady.value = 1;
    } else {
      position.value = withSpring(index, SPRING_SMOOTH);
    }
  }, [index, isReady, position, segmentWidth]);

  const handleLayout = useCallback((event: LayoutChangeEvent): void => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: isReady.value,
    transform: [{ translateX: position.value * segmentWidth }],
    width: segmentWidth,
  }));

  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="tablist" onLayout={handleLayout} style={styles.track}>
      <Animated.View pointerEvents="none" style={[styles.indicator, indicatorStyle]} />
      {options.map((option) => (
        <Segment key={option.key} isSelected={option.key === value} onSelect={onChange} option={option} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.medium,
    flexDirection: "row",
    padding: TRACK_PADDING,
  },
  indicator: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.accent,
    borderRadius: RADII.medium - 2,
    borderWidth: 1,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    position: "absolute",
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
    top: TRACK_PADDING,
  },
  segment: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 40, paddingHorizontal: 4 },
  label: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontSize: 13, fontWeight: "700" },
  selectedLabel: { color: COLORS.accent },
});
