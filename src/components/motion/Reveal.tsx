import type { ReactElement, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";

import { ENTRANCE_OFFSET, STAGGER_LIMIT, STAGGER_MS } from "@/src/theme/motion";

interface RevealProps {
  children: ReactNode;
  /** Position in a sequence; later items start a little later. */
  index?: number;
  /** Skip the entrance entirely (for rows that mount while scrolling). */
  isStatic?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Built once per position so re-renders do not create new animation objects.
const ENTRANCES = Array.from({ length: STAGGER_LIMIT }, (_, position) =>
  FadeInDown.delay(position * STAGGER_MS)
    .springify()
    .damping(20)
    .stiffness(140)
    .withInitialValues({ opacity: 0, transform: [{ translateY: ENTRANCE_OFFSET }] })
    .reduceMotion(ReduceMotion.System),
);

/** Fades and floats content in with a spring, staggered by index. */
export default function Reveal({ children, index = 0, isStatic = false, style }: RevealProps): ReactElement {
  if (isStatic || index >= STAGGER_LIMIT) return <Animated.View style={style}>{children}</Animated.View>;
  return <Animated.View entering={ENTRANCES[index]} style={style}>{children}</Animated.View>;
}
