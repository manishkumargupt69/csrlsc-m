import type { ReactElement } from "react";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withSpring } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { SPRING_SOFT } from "@/src/theme/motion";
import { COLORS, TYPOGRAPHY } from "@/src/theme/tokens";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** Whole-number percentage from 0 to 100. */
  percent: number;
  caption: string;
  accessibilityLabel: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  valueColor?: string;
  captionColor?: string;
}

/** Circular progress whose arc springs to its value when the number changes. */
export default function ProgressRing({
  percent,
  caption,
  accessibilityLabel,
  size = 124,
  strokeWidth = 14,
  color = COLORS.successInk,
  trackColor = COLORS.warningBackground,
  valueColor = COLORS.ink,
  captionColor = COLORS.inkMuted,
}: ProgressRingProps): ReactElement {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = useSharedValue(0);

  useEffect(() => {
    fraction.value = withSpring(clamped / 100, SPRING_SOFT);
  }, [clamped, fraction]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - Math.max(0, Math.min(1, fraction.value))),
  }));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={{ height: size, width: size }}
    >
      <Svg height={size} width={size}>
        <Circle cx={size / 2} cy={size / 2} fill="none" r={radius} stroke={trackColor} strokeWidth={strokeWidth} />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          origin={size / 2 + ", " + size / 2}
          r={radius}
          rotation={-90}
          stroke={color}
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </Svg>
      <View pointerEvents="none" style={styles.center}>
        <Text allowFontScaling={false} style={[styles.valueText, { color: valueColor, fontSize: Math.round(size * 0.23), lineHeight: Math.round(size * 0.27) }]}>{clamped}%</Text>
        <Text style={[styles.caption, { color: captionColor }]}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", bottom: 0, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 },
  valueText: { color: COLORS.ink, fontSize: 28, fontWeight: "800", fontVariant: ["tabular-nums"] },
  caption: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontWeight: "600" },
});
