import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import OptionPickerSheet from "@/src/components/ui/OptionPickerSheet";
import type { PickerOption } from "@/src/components/ui/OptionPickerSheet";
import type { LookupOption, ParameterFilters } from "@/src/features/assessments/domain/assessment.types";
import type { LookupResult } from "@/src/features/assessments/hooks/use-lookups";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";


interface ParameterFilterBarProps {
  value: ParameterFilters;
  onChange: (value: ParameterFilters) => void;
  /** Choices for each filter; option ids are what the filter values hold. */
  parameterTypes: LookupResult;
  groupings: LookupResult;
}

type OpenPicker = "parameterType" | "overallGrouping" | null;

interface FilterPillProps {
  label: string;
  selected: LookupOption | undefined;
  onOpen: () => void;
  onClear: () => void;
}

/** A compact dropdown pill: the filter's name until something is chosen, then the choice with a clear button. */
function FilterPill({ label, selected, onOpen, onClear }: FilterPillProps): ReactElement {
  const isActive = Boolean(selected);
  return (
    <View style={[styles.pill, isActive && styles.pillActive]}>
      <Pressable
        accessibilityLabel={isActive ? label + ": " + selected?.label + ". Change" : "Filter by " + label}
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [styles.pillMain, pressed && styles.pressed]}
      >
        <Feather accessibilityElementsHidden color={isActive ? COLORS.white : COLORS.accent} name="filter" size={14} />
        <Text numberOfLines={1} style={[styles.pillLabel, isActive && styles.pillLabelActive]}>{isActive ? selected?.label : label}</Text>
        {isActive ? null : <Feather accessibilityElementsHidden color={COLORS.accent} name="chevron-down" size={15} />}
      </Pressable>
      {isActive ? (
        <Pressable accessibilityLabel={"Clear " + label + " filter"} accessibilityRole="button" hitSlop={8} onPress={onClear} style={styles.clear}>
          <Feather color={COLORS.white} name="x" size={15} />
        </Pressable>
      ) : null}
    </View>
  );
}

const findOption = (lookup: LookupResult, id: string | undefined): LookupOption | undefined =>
  id ? lookup.options.find((option) => option.id === id) : undefined;

/** Two dropdown pills, Parameter Type and Overall Grouping; the caller decides the choices and what they filter. */
export default function ParameterFilterBar({ value, onChange, parameterTypes, groupings }: ParameterFilterBarProps): ReactElement {
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  const closePicker = useCallback((): void => setOpenPicker(null), []);
  const openParameterTypes = useCallback((): void => setOpenPicker("parameterType"), []);
  const openGroupings = useCallback((): void => setOpenPicker("overallGrouping"), []);
  const clearParameterType = useCallback((): void => onChange({ ...value, parameterTypeId: undefined }), [onChange, value]);
  const clearGrouping = useCallback((): void => onChange({ ...value, overallGroupingId: undefined }), [onChange, value]);

  // Choosing the selected option again clears it, so the sheet works as a toggle.
  const handleSelect = useCallback((option: PickerOption): void => {
    if (openPicker === "parameterType") {
      onChange({ ...value, parameterTypeId: value.parameterTypeId === option.id ? undefined : option.id });
    } else if (openPicker === "overallGrouping") {
      onChange({ ...value, overallGroupingId: value.overallGroupingId === option.id ? undefined : option.id });
    }
    setOpenPicker(null);
  }, [onChange, openPicker, value]);

  const activeLookup = openPicker === "overallGrouping" ? groupings : parameterTypes;
  const activeTitle = openPicker === "overallGrouping" ? "Overall Grouping" : "Parameter Type";
  const activeSelectedId = openPicker === "overallGrouping" ? value.overallGroupingId : value.parameterTypeId;

  return (
    <View style={styles.row}>
      <FilterPill label="Parameter Type" onClear={clearParameterType} onOpen={openParameterTypes} selected={findOption(parameterTypes, value.parameterTypeId)} />
      <FilterPill label="Overall Grouping" onClear={clearGrouping} onOpen={openGroupings} selected={findOption(groupings, value.overallGroupingId)} />
      <OptionPickerSheet
        isError={activeLookup.isError}
        isLoading={activeLookup.isLoading}
        isVisible={openPicker !== null}
        onClose={closePicker}
        onRetry={activeLookup.reload}
        onSelect={handleSelect}
        options={activeLookup.options}
        selectedIds={activeSelectedId ? [activeSelectedId] : []}
        title={activeTitle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.small },
  pill: { alignItems: "center", backgroundColor: COLORS.accentSoft, borderRadius: RADII.pill, flexDirection: "row", flexGrow: 1, flexShrink: 1, maxWidth: "100%", minHeight: 40 },
  pillActive: { backgroundColor: COLORS.accent },
  pillMain: { alignItems: "center", flexDirection: "row", flexShrink: 1, gap: 6, minHeight: 40, paddingLeft: SPACING.medium, paddingRight: SPACING.small },
  pressed: { opacity: 0.75 },
  pillLabel: { color: COLORS.accent, ...TYPOGRAPHY.caption, flexShrink: 1, fontSize: 13, fontWeight: "700" },
  pillLabelActive: { color: COLORS.white },
  clear: { alignItems: "center", height: 40, justifyContent: "center", paddingLeft: 2, paddingRight: SPACING.medium },
});
