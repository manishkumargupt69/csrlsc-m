import type { ReactElement } from "react";
import type { ViewStyle } from "react-native";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { SPRING_SMOOTH } from "@/src/theme/motion";
import { COLORS, RADII } from "@/src/theme/tokens";

interface ProgressBarProps {
  /** Whole-number percentage from 0 to 100. */
  percent: number;
  accessibilityLabel: string;
  /** Fill colour; defaults to the accent and turns green at 100 percent. */
  tone?: "accent" | "success" | "warning";
  /** Spring the fill into place. Turn off inside long lists, where it costs a shared value per row. */
  isAnimated?: boolean;
}

const getFillStyles = (tone: NonNullable<ProgressBarProps["tone"]>, clamped: number): (ViewStyle | false)[] => [
  styles.fill,
  tone === "success" && styles.complete,
  tone === "warning" && styles.warning,
  tone === "accent" && clamped === 100 && styles.complete,
];

const clampPercent = (percent: number): number => Math.min(100, Math.max(0, Math.round(percent)));

function Track({ clamped, accessibilityLabel, children }: { clamped: number; accessibilityLabel: string; children: ReactElement }): ReactElement {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={styles.track}
    >
      {children}
    </View>
  );
}

function StaticProgressBar({ percent, accessibilityLabel, tone = "accent" }: ProgressBarProps): ReactElement {
  const clamped = clampPercent(percent);
  return (
    <Track accessibilityLabel={accessibilityLabel} clamped={clamped}>
      <View style={[...getFillStyles(tone, clamped), { width: (clamped + "%") as `${number}%` }]} />
    </Track>
  );
}

function AnimatedProgressBar({ percent, accessibilityLabel, tone = "accent" }: ProgressBarProps): ReactElement {
  const clamped = clampPercent(percent);
  const fraction = useSharedValue(0);

  useEffect(() => {
    fraction.value = withSpring(clamped / 100, SPRING_SMOOTH);
  }, [clamped, fraction]);

  const fillStyle = useAnimatedStyle(() => {
    const percentWidth = Math.max(0, Math.min(1, fraction.value)) * 100;
    return { width: (percentWidth + "%") as `${number}%` };
  });

  return (
    <Track accessibilityLabel={accessibilityLabel} clamped={clamped}>
      <Animated.View style={[...getFillStyles(tone, clamped), fillStyle]} />
    </Track>
  );
}

export default function ProgressBar({ isAnimated = true, ...props }: ProgressBarProps): ReactElement {
  return isAnimated ? <AnimatedProgressBar {...props} /> : <StaticProgressBar {...props} />;
}

const styles = StyleSheet.create({
  track: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADII.pill, height: 8, overflow: "hidden" },
  fill: { backgroundColor: COLORS.accent, borderRadius: RADII.pill, height: 8 },
  complete: { backgroundColor: COLORS.successInk },
  warning: { backgroundColor: COLORS.warningInk },
});
