import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import AsyncStateView from "@/src/components/ui/AsyncStateView";
import DrawerHeader from "@/src/components/ui/DrawerHeader";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import ScreenContainer, { useScreenInsets } from "@/src/components/ui/ScreenContainer";
import SearchField from "@/src/components/ui/SearchField";
import SegmentedControl from "@/src/components/motion/SegmentedControl";
import type { SegmentOption } from "@/src/components/motion/SegmentedControl";
import type { IncidentSortKey } from "@/src/features/incidents/domain/incident.types";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

const SORT_OPTIONS: readonly SegmentOption<IncidentSortKey>[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "number", label: "Incident #" },
];

export default function IncidentsScreen(): ReactElement {
  const insets = useScreenInsets();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<IncidentSortKey>("newest");

  const handleClear = useCallback((): void => setSearch(""), []);
  const handleReport = useCallback((): void => router.push("/(app)/incidents/new"), []);
  const handleRetry = useCallback((): void => undefined, []);

  // The incident service does not exist yet, so there is never anything to list and nothing is stored.
  return (
    <ScreenContainer>
      <DrawerHeader title="Incidents" />
      <View style={[styles.state, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.notice}>Not implemented yet. Incidents are not saved or listed until the incident service is connected.</Text>
          <PrimaryButton label="Report incident" onPress={handleReport} />
          <View style={styles.searchRow}>
            <SearchField accessibilityLabel="Search incidents" onChangeText={setSearch} onClear={handleClear} placeholder="Search incidents" value={search} />
          </View>
          <SegmentedControl accessibilityLabel="Sort incidents" onChange={setSort} options={SORT_OPTIONS} value={sort} />
        </View>
        <AsyncStateView emptyMessage="No incidents to show." onRetry={handleRetry} status="empty" variant="list" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1, paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  header: { gap: SPACING.medium, paddingBottom: SPACING.small, paddingTop: SPACING.large },
  notice: { backgroundColor: COLORS.accentSoft, borderRadius: RADII.medium, color: COLORS.accent, ...TYPOGRAPHY.caption, padding: SPACING.medium },
  searchRow: { flexDirection: "row" },
});
