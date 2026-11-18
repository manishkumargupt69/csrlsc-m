import type { ReactElement } from "react";
import { memo, useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  ReduceMotion,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { SharedValue, WithSpringConfig } from "react-native-reanimated";

import PressableScale from "@/src/components/motion/PressableScale";
import BottomSheetModal from "@/src/components/ui/BottomSheetModal";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { MAX_RATING, MIN_RATING } from "@/src/features/assessments/domain/assessment.types";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

const RATINGS = Array.from({ length: MAX_RATING - MIN_RATING + 1 }, (_, index) => MIN_RATING + index);
const VISIBLE_ITEMS = 5;
const ITEM_HEIGHT = 52;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
/** Distance from the top of the wheel to the middle row, where the selected number sits. */
const CENTRE_OFFSET = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);
const DEFAULT_START_RATING = 5;
/** The wheel moves up as the rating grows: offset 0 shows the first rating, LOWEST_OFFSET the last. */
const LOWEST_OFFSET = -(RATINGS.length - 1) * ITEM_HEIGHT;

/*
 * Physics. A flick keeps travelling the way a real wheel would: the release velocity is projected forward as
 * if friction slowed it down (iOS's normal deceleration, 0.998 per ms, glides about velocity × 0.3), the end
 * point snaps to the nearest number, and a soft spring carries the release velocity into that stop, so a fast
 * flick runs several numbers and settles with a gentle overshoot instead of stopping dead.
 */
const GLIDE_FACTOR = 0.3;
/** Past the first or last number the wheel still follows the finger, at a third of the distance. */
const RUBBER_BAND = 0.33;
const SETTLE_SPRING: WithSpringConfig = { damping: 22, mass: 1, stiffness: 140, reduceMotion: ReduceMotion.System };

const offsetForIndex = (index: number): number => {
  "worklet";
  return -index * ITEM_HEIGHT;
};

const rubberBand = (value: number): number => {
  "worklet";
  if (value > 0) return value * RUBBER_BAND;
  if (value < LOWEST_OFFSET) return LOWEST_OFFSET + (value - LOWEST_OFFSET) * RUBBER_BAND;
  return value;
};

const nearestIndex = (offset: number): number => {
  "worklet";
  const index = Math.round(-offset / ITEM_HEIGHT);
  return Math.min(Math.max(index, 0), RATINGS.length - 1);
};

interface RatingSelectorProps {
  value: number | null;
  /** Mandatory parameters cannot be cleared once rated. */
  isClearable: boolean;
  errorMessage?: string;
  onChange: (value: number | null) => void;
}

interface WheelItemProps {
  rating: number;
  index: number;
  offset: SharedValue<number>;
  onPress: (index: number) => void;
}

/** One number on the wheel: full size in the middle row, smaller, fainter and tilted away towards the edges. */
const WheelItem = memo(function WheelItem({ rating, index, offset, onPress }: WheelItemProps): ReactElement {
  const handlePress = useCallback((): void => onPress(index), [index, onPress]);
  const animatedStyle = useAnimatedStyle(() => {
    // Rows away from the middle; negative above it, positive below.
    const rows = (index * ITEM_HEIGHT + offset.value) / ITEM_HEIGHT;
    const distance = Math.abs(rows);
    return {
      opacity: interpolate(distance, [0, 1, 2, 2.6], [1, 0.55, 0.22, 0], Extrapolation.CLAMP),
      transform: [
        { perspective: 600 },
        { rotateX: interpolate(rows, [-2.5, 0, 2.5], [48, 0, -48], Extrapolation.CLAMP) + "deg" },
        { scale: interpolate(distance, [0, 1, 2], [1.18, 0.9, 0.78], Extrapolation.CLAMP) },
      ],
    };
  });
  return (
    <Pressable accessibilityLabel={"Rating " + rating + " of " + MAX_RATING} accessibilityRole="button" onPress={handlePress} style={styles.item}>
      <Animated.Text style={[styles.itemLabel, animatedStyle]}>{rating}</Animated.Text>
    </Pressable>
  );
});

interface RatingWheelProps {
  startIndex: number;
  onIndexChange: (index: number) => void;
}

/** The scroll wheel itself: driven on the UI thread so a flick glides at full frame rate. */
function RatingWheel({ startIndex, onIndexChange }: RatingWheelProps): ReactElement {
  const offset = useSharedValue(offsetForIndex(startIndex));
  const dragStart = useSharedValue(0);

  // Tell the sheet which number is under the band as it passes, so "Select N" follows the wheel live.
  useAnimatedReaction(
    () => nearestIndex(offset.value),
    (index, previous) => {
      if (index !== previous) runOnJS(onIndexChange)(index);
    },
  );

  const pan = Gesture.Pan()
    .onBegin(() => {
      // Catching a moving wheel stops it under the finger, like a real one.
      cancelAnimation(offset);
      dragStart.value = offset.value;
    })
    .onUpdate((event) => {
      offset.value = rubberBand(dragStart.value + event.translationY);
    })
    .onEnd((event) => {
      const projected = offset.value + event.velocityY * GLIDE_FACTOR;
      const target = offsetForIndex(nearestIndex(projected));
      offset.value = withSpring(target, { ...SETTLE_SPRING, velocity: event.velocityY });
    });

  const columnStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value + CENTRE_OFFSET }] }));

  const handleItemPress = useCallback((index: number): void => {
    offset.value = withSpring(offsetForIndex(index), SETTLE_SPRING);
  }, [offset]);

  return (
    <GestureDetector gesture={pan}>
      <View accessibilityHint="Swipe up or down to change the rating" style={styles.wheel}>
        <View pointerEvents="none" style={styles.band} />
        <Animated.View style={columnStyle}>
          {RATINGS.map((rating, index) => (
            <WheelItem key={rating} index={index} offset={offset} onPress={handleItemPress} rating={rating} />
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

export default function RatingSelector({ value, isClearable, errorMessage, onChange }: RatingSelectorProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<number>(value ?? DEFAULT_START_RATING);

  const handleOpen = useCallback((): void => {
    setPending(value ?? DEFAULT_START_RATING);
    setIsOpen(true);
  }, [value]);
  const handleClose = useCallback((): void => setIsOpen(false), []);
  const handleIndexChange = useCallback((index: number): void => setPending(MIN_RATING + index), []);
  const handleConfirm = useCallback((): void => {
    onChange(pending);
    setIsOpen(false);
  }, [onChange, pending]);
  const handleClear = useCallback((): void => {
    onChange(null);
    setIsOpen(false);
  }, [onChange]);

  const hasValue = value !== null;
  return (
    <View style={styles.container}>
      <PressableScale
        accessibilityLabel={hasValue ? "Rating " + value + " of " + MAX_RATING + ". Change rating" : "Choose a rating from " + MIN_RATING + " to " + MAX_RATING}
        accessibilityRole="button"
        onPress={handleOpen}
        style={[styles.control, hasValue && styles.controlFilled, Boolean(errorMessage) && styles.controlError]}
      >
        <Feather accessibilityElementsHidden color={hasValue ? COLORS.gold : COLORS.inkMuted} name="star" size={20} />
        <Text style={[styles.value, !hasValue && styles.placeholder]}>{hasValue ? value + " / " + MAX_RATING : "Select rating"}</Text>
        <View style={styles.chevron}>
          <Feather accessibilityElementsHidden color={COLORS.inkMuted} name="chevron-down" size={16} />
        </View>
      </PressableScale>
      {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}

      <BottomSheetModal accessibilityLabel="Close rating" isVisible={isOpen} onClose={handleClose} title={"Rating (" + MIN_RATING + " - " + MAX_RATING + ")"}>
        {/* A modal is a separate Android window, so gestures inside it need their own root. */}
        <GestureHandlerRootView style={styles.sheetBody}>
          {isOpen ? <RatingWheel onIndexChange={handleIndexChange} startIndex={(value ?? DEFAULT_START_RATING) - MIN_RATING} /> : null}
          <Text style={styles.hint}>Flick or drag the wheel, or tap a number.</Text>
          <View style={styles.actions}>
            <PrimaryButton iconName="star" label={"Select " + pending} onPress={handleConfirm} />
            {isClearable && hasValue ? (
              <Pressable accessibilityRole="button" onPress={handleClear} style={styles.clear}>
                <Text style={styles.clearLabel}>Clear rating</Text>
              </Pressable>
            ) : null}
          </View>
        </GestureHandlerRootView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.small },
  control: { alignItems: "center", backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.large, borderWidth: 1, flexDirection: "row", gap: SPACING.medium, minHeight: 56, paddingHorizontal: SPACING.medium },
  controlFilled: { borderColor: COLORS.accent },
  controlError: { borderColor: COLORS.danger },
  value: { color: COLORS.ink, flex: 1, ...TYPOGRAPHY.control, fontVariant: ["tabular-nums"], fontWeight: "700" },
  placeholder: { color: COLORS.inkMuted, fontWeight: "400" },
  chevron: { alignItems: "center", backgroundColor: COLORS.surfaceMuted, borderRadius: RADII.pill, height: 28, justifyContent: "center", width: 28 },
  error: { color: COLORS.danger, ...TYPOGRAPHY.caption },
  sheetBody: { gap: SPACING.medium, paddingBottom: SPACING.large, paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  wheel: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.large, borderWidth: StyleSheet.hairlineWidth, height: WHEEL_HEIGHT, overflow: "hidden" },
  // The highlighted middle row that shows which number the wheel will settle on.
  band: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent, borderRadius: RADII.medium, borderWidth: 1.5, height: ITEM_HEIGHT, left: SPACING.medium, position: "absolute", right: SPACING.medium, top: CENTRE_OFFSET },
  item: { alignItems: "center", height: ITEM_HEIGHT, justifyContent: "center" },
  itemLabel: { color: COLORS.accent, fontSize: 26, fontVariant: ["tabular-nums"], fontWeight: "800" },
  hint: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, textAlign: "center" },
  actions: { gap: SPACING.small },
  clear: { alignItems: "center", justifyContent: "center", minHeight: 44 },
  clearLabel: { color: COLORS.danger, ...TYPOGRAPHY.body, fontWeight: "700" },
});
