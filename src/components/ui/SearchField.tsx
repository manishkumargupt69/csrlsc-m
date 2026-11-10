import type { ReactElement } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface SearchFieldProps { accessibilityLabel: string; onChangeText: (value: string) => void; onClear: () => void; placeholder: string; value: string; }

const FIELD_HEIGHT = 44;

/** Rounded search field in the system style: magnifier, plain text, a clear button once there is text. */
export default function SearchField({ accessibilityLabel, onChangeText, onClear, placeholder, value }: SearchFieldProps): ReactElement {
  return (
    <View style={styles.container}>
      <Feather accessibilityElementsHidden color={COLORS.inkMuted} name="search" size={18} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        onChangeText={onChangeText}
        placeholder={placeholder}
        numberOfLines={1}
        placeholderTextColor={COLORS.inkMuted}
        returnKeyType="search"
        selectionColor={COLORS.accent}
        showSoftInputOnFocus
        style={styles.input}
        value={value}
      />
      {value ? (
        <Pressable accessibilityLabel="Clear search" accessibilityRole="button" hitSlop={10} onPress={onClear} style={styles.clearButton}>
          <Feather color={COLORS.inkMuted} name="x-circle" size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.medium,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: SPACING.small,
    minHeight: FIELD_HEIGHT,
    paddingHorizontal: SPACING.medium,
  },
  input: { color: COLORS.ink, flex: 1, ...TYPOGRAPHY.body, minHeight: FIELD_HEIGHT, paddingVertical: 0 },
  clearButton: { alignItems: "center", justifyContent: "center", paddingLeft: SPACING.small },
});
