import type { ReactElement, ReactNode } from "react";
import { useCallback } from "react";
import { Pressable } from "react-native";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { PRESS_SCALE, PRESSED_OPACITY, SPRING_SNAPPY } from "@/src/theme/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, "style" | "children"> {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/** Pressable that springs down slightly while held, like a native iOS control. */
export default function PressableScale({
  style,
  children,
  onPressIn,
  onPressOut,
  ...pressableProps
}: PressableScaleProps): ReactElement {
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback<NonNullable<PressableProps["onPressIn"]>>((event) => {
    pressed.value = withSpring(1, SPRING_SNAPPY);
    onPressIn?.(event);
  }, [onPressIn, pressed]);
  const handlePressOut = useCallback<NonNullable<PressableProps["onPressOut"]>>((event) => {
    pressed.value = withSpring(0, SPRING_SNAPPY);
    onPressOut?.(event);
  }, [onPressOut, pressed]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * (1 - PRESSED_OPACITY),
    transform: [{ scale: 1 - pressed.value * (1 - PRESS_SCALE) }],
  }));

  return (
    <AnimatedPressable
      {...pressableProps}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
