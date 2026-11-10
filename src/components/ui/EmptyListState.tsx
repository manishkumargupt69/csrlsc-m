import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import EmptyListIllustration from "@/src/components/ui/EmptyListIllustration";
import { COLORS, SPACING } from "@/src/theme/tokens";

interface EmptyListStateProps {
  message: string;
}

export default function EmptyListState({ message }: EmptyListStateProps): ReactElement {
  return (
    <View style={styles.container}>
      <EmptyListIllustration />
      <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: SPACING.extraLarge, justifyContent: "center", minHeight: 264, paddingHorizontal: SPACING.extraLarge, paddingVertical: SPACING.section },
  message: { color: COLORS.ink, fontSize: 18, fontWeight: "700", textAlign: "center" },
});
