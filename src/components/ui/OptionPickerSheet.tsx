import type { ReactElement } from "react";
import { memo, useCallback, useMemo, useState } from "react";
import type { ListRenderItemInfo } from "react-native";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import BottomSheetModal from "@/src/components/ui/BottomSheetModal";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import SearchField from "@/src/components/ui/SearchField";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

export interface PickerOption {
  id: string;
  label: string;
}

interface OptionPickerSheetProps {
  isVisible: boolean;
  title: string;
  options: readonly PickerOption[];
  selectedIds: readonly string[];
  onSelect: (option: PickerOption) => void;
  onClose: () => void;
  /** Multi-select keeps the sheet open and shows a Done button. */
  isMultiple?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
}

const SEARCH_THRESHOLD = 8;
const SHEET_HEIGHT_RATIO = 0.64;

const getOptionKey = (option: PickerOption): string => option.id;

interface HighlightedLabelProps {
  label: string;
  query: string;
  isSelected: boolean;
}

/** Label with the searched text picked out in the accent colour. */
function HighlightedLabel({ label, query, isSelected }: HighlightedLabelProps): ReactElement {
  const needle = query.trim().toLocaleLowerCase();
  const start = needle ? label.toLocaleLowerCase().indexOf(needle) : -1;
  const base = [styles.rowLabel, isSelected && styles.rowLabelSelected];
  if (start < 0) return <Text numberOfLines={2} style={base}>{label}</Text>;
  const end = start + needle.length;
  return (
    <Text numberOfLines={2} style={base}>
      {label.slice(0, start)}
      <Text style={styles.match}>{label.slice(start, end)}</Text>
      {label.slice(end)}
    </Text>
  );
}

interface OptionRowProps {
  option: PickerOption;
  query: string;
  isSelected: boolean;
  isMultiple: boolean;
  onSelect: (option: PickerOption) => void;
}

const OptionRow = memo(function OptionRow({ option, query, isSelected, isMultiple, onSelect }: OptionRowProps): ReactElement {
  const handlePress = useCallback((): void => onSelect(option), [onSelect, option]);
  return (
    <Pressable
      accessibilityLabel={option.label}
      accessibilityRole={isMultiple ? "checkbox" : "button"}
      accessibilityState={{ selected: isSelected, checked: isMultiple ? isSelected : undefined }}
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <HighlightedLabel isSelected={isSelected} label={option.label} query={query} />
      <View style={[styles.mark, isMultiple && styles.markBox, isSelected && styles.markSelected]}>
        {isSelected ? <Feather accessibilityElementsHidden color={COLORS.white} name="check" size={14} /> : null}
      </View>
    </Pressable>
  );
});

function Separator(): ReactElement {
  return <View style={styles.separator} />;
}

export default function OptionPickerSheet({
  isVisible,
  title,
  options,
  selectedIds,
  onSelect,
  onClose,
  isMultiple = false,
  isLoading = false,
  isError = false,
  onRetry,
  emptyMessage = "Nothing to choose from yet.",
}: OptionPickerSheetProps): ReactElement {
  const [query, setQuery] = useState("");
  const { height } = useWindowDimensions();
  const isSearchable = options.length > SEARCH_THRESHOLD;
  const visibleOptions = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return needle ? options.filter((option) => option.label.toLocaleLowerCase().includes(needle)) : options;
  }, [options, query]);
  const handleClear = useCallback((): void => setQuery(""), []);
  const handleDismiss = useCallback((): void => setQuery(""), []);
  const handleRetry = useCallback((): void => onRetry?.(), [onRetry]);

  const renderOption = useCallback(({ item }: ListRenderItemInfo<PickerOption>): ReactElement => (
    <OptionRow isMultiple={isMultiple} isSelected={selectedIds.includes(item.id)} onSelect={onSelect} option={item} query={query} />
  ), [isMultiple, onSelect, query, selectedIds]);

  const countLabel = query
    ? visibleOptions.length + (visibleOptions.length === 1 ? " result" : " results")
    : options.length + (options.length === 1 ? " option" : " options");
  const selectedLabel = isMultiple && selectedIds.length > 0 ? " · " + selectedIds.length + " selected" : "";

  let body: ReactElement;
  if (isLoading) {
    body = <View style={styles.state}><ActivityIndicator color={COLORS.accent} /></View>;
  } else if (isError) {
    body = (
      <View style={styles.state}>
        <View style={styles.stateIcon}><Feather color={COLORS.danger} name="wifi-off" size={22} /></View>
        <Text style={styles.stateText}>This list could not be loaded.</Text>
        {onRetry ? <PrimaryButton label="Try again" onPress={handleRetry} /> : null}
      </View>
    );
  } else if (visibleOptions.length === 0) {
    body = (
      <View style={styles.state}>
        <View style={styles.stateIcon}><Feather color={COLORS.inkMuted} name={query ? "search" : "inbox"} size={22} /></View>
        <Text style={styles.stateText}>{query ? "No matches for “" + query.trim() + "”." : emptyMessage}</Text>
      </View>
    );
  } else {
    body = (
      <FlatList
        contentContainerStyle={styles.listContent}
        data={visibleOptions}
        extraData={selectedIds}
        initialNumToRender={20}
        ItemSeparatorComponent={Separator}
        keyboardShouldPersistTaps="handled"
        keyExtractor={getOptionKey}
        renderItem={renderOption}
        showsVerticalScrollIndicator={false}
        style={styles.listCard}
      />
    );
  }

  return (
    <BottomSheetModal accessibilityLabel={"Close " + title} isVisible={isVisible} onClose={onClose} onDismiss={handleDismiss} title={title}>
      <View style={[styles.content, { height: height * SHEET_HEIGHT_RATIO }]}>
        {isSearchable ? (
          <View style={styles.search}>
            <SearchField accessibilityLabel={"Search " + title} onChangeText={setQuery} onClear={handleClear} placeholder={"Search " + title.toLocaleLowerCase()} value={query} />
          </View>
        ) : null}
        {!isLoading && !isError && options.length > 0 ? <Text style={styles.count}>{countLabel + selectedLabel}</Text> : null}
        <View style={styles.list}>{body}</View>
        {isMultiple ? (
          <View style={styles.footer}>
            <PrimaryButton label={selectedIds.length > 0 ? "Done (" + selectedIds.length + ")" : "Done"} onPress={onClose} />
          </View>
        ) : null}
      </View>
    </BottomSheetModal>
  );
}

const MARK_SIZE = 24;

const styles = StyleSheet.create({
  content: { paddingTop: SPACING.small },
  search: { flexDirection: "row", paddingBottom: SPACING.small, paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  count: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontWeight: "600", paddingBottom: SPACING.small, paddingHorizontal: SCREEN_HORIZONTAL_PADDING + 4 },
  list: { flex: 1 },
  listCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.large,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
    marginHorizontal: SCREEN_HORIZONTAL_PADDING,
  },
  listContent: { paddingVertical: 2 },
  row: { alignItems: "center", flexDirection: "row", gap: SPACING.medium, minHeight: 54, paddingHorizontal: SPACING.large, paddingVertical: SPACING.small },
  rowPressed: { backgroundColor: COLORS.surfaceMuted },
  rowLabel: { color: COLORS.ink, ...TYPOGRAPHY.body, flex: 1 },
  rowLabelSelected: { color: COLORS.accent, fontWeight: "700" },
  match: { color: COLORS.accent, fontWeight: "800" },
  mark: { alignItems: "center", borderColor: COLORS.border, borderRadius: MARK_SIZE / 2, borderWidth: 1.5, height: MARK_SIZE, justifyContent: "center", width: MARK_SIZE },
  markBox: { borderRadius: 7 },
  markSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  separator: { backgroundColor: COLORS.border, height: StyleSheet.hairlineWidth, marginLeft: SPACING.large },
  state: { alignItems: "center", flex: 1, gap: SPACING.medium, justifyContent: "center", padding: SCREEN_HORIZONTAL_PADDING },
  stateIcon: { alignItems: "center", backgroundColor: COLORS.surface, borderRadius: RADII.pill, height: 52, justifyContent: "center", width: 52 },
  stateText: { color: COLORS.inkMuted, ...TYPOGRAPHY.body, textAlign: "center" },
  footer: { padding: SCREEN_HORIZONTAL_PADDING },
});
