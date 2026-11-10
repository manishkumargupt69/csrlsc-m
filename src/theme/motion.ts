import { Easing, ReduceMotion } from "react-native-reanimated";
import type { WithSpringConfig, WithTimingConfig } from "react-native-reanimated";

/**
 * Motion presets. Springs carry velocity when interrupted, which gives the fluid,
 * Apple-like feel; every preset honours the system "reduce motion" setting.
 */
export const SPRING_SNAPPY: WithSpringConfig = {
  damping: 18,
  mass: 0.6,
  stiffness: 320,
  reduceMotion: ReduceMotion.System,
};

export const SPRING_SMOOTH: WithSpringConfig = {
  damping: 22,
  mass: 0.9,
  stiffness: 180,
  reduceMotion: ReduceMotion.System,
};

export const SPRING_SOFT: WithSpringConfig = {
  damping: 20,
  mass: 1,
  stiffness: 120,
  reduceMotion: ReduceMotion.System,
};

export const TIMING_FAST: WithTimingConfig = {
  duration: 160,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

export const PRESS_SCALE = 0.97;
export const PRESSED_OPACITY = 0.92;
export const STAGGER_MS = 45;
export const STAGGER_LIMIT = 8;
export const ENTRANCE_OFFSET = 12;
