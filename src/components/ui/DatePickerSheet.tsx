import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import PressableScale from "@/src/components/motion/PressableScale";
import BottomSheetModal from "@/src/components/ui/BottomSheetModal";
import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface DatePickerSheetProps {
  isVisible: boolean;
  title: string;
  value: Date | null;
  /** Earlier days are shown but cannot be chosen. */
  minimumDate: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

interface QuickPick {
  key: string;
  label: string;
  days: number;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const SELECTED_FORMATTER = new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const DAYS_IN_GRID = 42;
const QUICK_PICKS: readonly QuickPick[] = [
  { key: "tomorrow", label: "Tomorrow", days: 1 },
  { key: "week", label: "In a week", days: 7 },
  { key: "two-weeks", label: "In 2 weeks", days: 14 },
  { key: "month", label: "In a month", days: 30 },
];

const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const isSameDay = (first: Date, second: Date): boolean =>
  first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();

const buildMonthGrid = (month: Date): Date[] => {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - firstOfMonth.getDay());
  return Array.from({ length: DAYS_IN_GRID }, (_, index) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index));
};

interface QuickPickChipProps {
  pick: QuickPick;
  onPick: (days: number) => void;
}

function QuickPickChip({ pick, onPick }: QuickPickChipProps): ReactElement {
  const handlePress = useCallback((): void => onPick(pick.days), [onPick, pick.days]);
  return (
    <PressableScale accessibilityLabel={pick.label} accessibilityRole="button" onPress={handlePress} style={styles.quickChip}>
      <Text style={styles.quickLabel}>{pick.label}</Text>
    </PressableScale>
  );
}

export default function DatePickerSheet({ isVisible, title, value, minimumDate, onClose, onConfirm }: DatePickerSheetProps): ReactElement {
  // Callers often pass a freshly built Date each render, so everything below keys off timestamps.
  const minimumTime = minimumDate.getTime();
  const valueTime = value ? value.getTime() : null;
  const minimum = useMemo(() => startOfDay(new Date(minimumTime)), [minimumTime]);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfDay(value ?? minimum));

  useEffect(() => {
    if (isVisible) setViewMonth(startOfDay(new Date(valueTime ?? minimumTime)));
  }, [isVisible, minimumTime, valueTime]);

  const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const today = useMemo(() => startOfDay(new Date()), []);
  const canGoBack = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0) >= minimum;
  const goBack = useCallback((): void => setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)), []);
  const goForward = useCallback((): void => setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)), []);
  const handleQuickPick = useCallback((offsetDays: number): void => {
    const base = startOfDay(new Date());
    onConfirm(new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsetDays));
    onClose();
  }, [onClose, onConfirm]);

  return (
    <BottomSheetModal
      accessibilityLabel={"Close " + title}
      isVisible={isVisible}
      onClose={onClose}
      subtitle={value ? SELECTED_FORMATTER.format(value) : "Pick a date"}
      title={title}
    >
      <View style={styles.content}>
        <View style={styles.quickRow}>
          {QUICK_PICKS.map((pick) => <QuickPickChip key={pick.key} onPick={handleQuickPick} pick={pick} />)}
        </View>
        <View style={styles.calendar}>
          <View style={styles.monthRow}>
            <Pressable accessibilityLabel="Previous month" accessibilityRole="button" accessibilityState={{ disabled: !canGoBack }} disabled={!canGoBack} onPress={goBack} style={[styles.navButton, !canGoBack && styles.navDisabled]}>
              <Feather color={COLORS.ink} name="chevron-left" size={20} />
            </Pressable>
            <Text accessibilityLiveRegion="polite" style={styles.monthLabel}>{MONTH_FORMATTER.format(viewMonth)}</Text>
            <Pressable accessibilityLabel="Next month" accessibilityRole="button" onPress={goForward} style={styles.navButton}>
              <Feather color={COLORS.ink} name="chevron-right" size={20} />
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((day, index) => <Text key={day + index} style={styles.weekday}>{day}</Text>)}
          </View>
          <View style={styles.grid}>
            {days.map((day) => {
              const isOutside = day.getMonth() !== viewMonth.getMonth();
              const isDisabled = day < minimum;
              const isSelected = value !== null && isSameDay(day, value);
              const isToday = isSameDay(day, today);
              const handlePress = (): void => {
                onConfirm(day);
                onClose();
              };
              return (
                <Pressable
                  key={day.toISOString()}
                  accessibilityLabel={day.toDateString()}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isDisabled, selected: isSelected }}
                  disabled={isDisabled}
                  onPress={handlePress}
                  style={styles.cell}
                >
                  <View style={[styles.day, isToday && !isSelected && styles.dayToday, isSelected && styles.daySelected]}>
                    <Text style={[styles.dayLabel, isOutside && styles.dayOutside, isDisabled && styles.dayDisabled, isSelected && styles.dayLabelSelected]}>{day.getDate()}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACING.medium, padding: SCREEN_HORIZONTAL_PADDING },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.small },
  quickChip: { alignItems: "center", backgroundColor: COLORS.accentSoft, borderRadius: RADII.pill, justifyContent: "center", minHeight: 36, paddingHorizontal: SPACING.large },
  quickLabel: { color: COLORS.accent, ...TYPOGRAPHY.caption, fontSize: 13, fontWeight: "700" },
  calendar: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.sheet, borderWidth: StyleSheet.hairlineWidth, gap: SPACING.small, padding: SPACING.medium },
  monthRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  navButton: { alignItems: "center", backgroundColor: COLORS.surfaceMuted, borderRadius: RADII.pill, height: 40, justifyContent: "center", width: 40 },
  navDisabled: { opacity: 0.3 },
  monthLabel: { color: COLORS.ink, ...TYPOGRAPHY.control, fontWeight: "800" },
  weekRow: { flexDirection: "row" },
  weekday: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, flex: 1, fontWeight: "700", letterSpacing: 0.6, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { alignItems: "center", height: MINIMUM_TOUCH_SIZE, justifyContent: "center", width: "14.2857%" },
  day: { alignItems: "center", borderRadius: RADII.pill, height: 40, justifyContent: "center", width: 40 },
  dayToday: { borderColor: COLORS.accent, borderWidth: 1.5 },
  daySelected: { backgroundColor: COLORS.accent },
  dayLabel: { color: COLORS.ink, ...TYPOGRAPHY.body, fontVariant: ["tabular-nums"] },
  dayLabelSelected: { color: COLORS.white, fontWeight: "700" },
  dayOutside: { color: COLORS.inkMuted, opacity: 0.55 },
  dayDisabled: { opacity: 0.25 },
});
