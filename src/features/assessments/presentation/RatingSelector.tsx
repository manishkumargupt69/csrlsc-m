import type { ReactElement } from "react";
import { memo, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import PressableScale from "@/src/components/motion/PressableScale";

import { MAX_RATING, MIN_RATING } from "@/src/features/assessments/domain/assessment.types";
import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

const RATINGS = Array.from({ length: MAX_RATING - MIN_RATING + 1 }, (_, index) => MIN_RATING + index);
const RATINGS_PER_ROW = 5;
const RATING_ROWS = Array.from({ length: Math.ceil(RATINGS.length / RATINGS_PER_ROW) }, (_, row) =>
  RATINGS.slice(row * RATINGS_PER_ROW, (row + 1) * RATINGS_PER_ROW),
);

interface RatingSelectorProps {
  value: number | null;
  /** Mandatory parameters cannot be cleared once rated. */
  isClearable: boolean;
  errorMessage?: string;
  onChange: (value: number | null) => void;
}

interface RatingChipProps {
  rating: number;
  isSelected: boolean;
  onPress: (rating: number) => void;
}

const RatingChip = memo(function RatingChip({ rating, isSelected, onPress }: RatingChipProps): ReactElement {
  const handlePress = useCallback((): void => onPress(rating), [onPress, rating]);
  return (
    <PressableScale
      accessibilityLabel={"Rating " + rating + " of " + MAX_RATING}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={handlePress}
      style={[styles.chip, isSelected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{rating}</Text>
    </PressableScale>
  );
});

export default function RatingSelector({ value, isClearable, errorMessage, onChange }: RatingSelectorProps): ReactElement {
  const handlePress = useCallback((rating: number): void => {
    onChange(rating === value && isClearable ? null : rating);
  }, [isClearable, onChange, value]);

  return (
    <View style={styles.container}>
      {RATING_ROWS.map((row) => (
        <View key={row[0]} style={styles.chips}>
          {row.map((rating) => (
            <RatingChip key={rating} isSelected={rating === value} onPress={handlePress} rating={rating} />
          ))}
        </View>
      ))}
      {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.small },
  chips: { flexDirection: "row", gap: SPACING.small },
  chip: { alignItems: "center", backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.medium, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: MINIMUM_TOUCH_SIZE },
  chipSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipLabel: { color: COLORS.ink, ...TYPOGRAPHY.control, fontVariant: ["tabular-nums"], fontWeight: "700" },
  chipLabelSelected: { color: COLORS.white },
  error: { color: COLORS.danger, ...TYPOGRAPHY.caption },
});
