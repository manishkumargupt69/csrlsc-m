import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ListRenderItemInfo } from "react-native";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";

import AsyncStateView from "@/src/components/ui/AsyncStateView";
import LastUpdatedLabel from "@/src/components/ui/LastUpdatedLabel";
import SearchField from "@/src/components/ui/SearchField";
import SegmentedControl from "@/src/components/motion/SegmentedControl";
import type { SegmentOption } from "@/src/components/motion/SegmentedControl";
import type {
  AssessmentListItem,
  AssessmentListQuery,
  AssessmentStatus,
} from "@/src/features/assessments/domain/assessment.types";
import { ASSESSMENT_STATUSES } from "@/src/features/assessments/domain/assessment.types";
import { matchesAssessmentSearch } from "@/src/features/assessments/domain/assessment-search";
import { useAssessmentList } from "@/src/features/assessments/hooks/use-assessments";
import AssessmentCard from "@/src/features/assessments/presentation/AssessmentCard";
import { COLORS, SCREEN_HORIZONTAL_PADDING, SPACING } from "@/src/theme/tokens";
import { useScreenInsets } from "@/src/components/ui/ScreenContainer";

interface AssessmentListViewProps {
  query: AssessmentListQuery;
  statusFilter: AssessmentStatus | undefined;
  onStatusFilterChange: (status: AssessmentStatus | undefined) => void;
  showProgress: boolean;
  emptyMessage: string;
  onView: (item: AssessmentListItem) => void;
  onAssign?: (item: AssessmentListItem) => void;
  /** Return false to hide the Assess button for a given request. */
  canAssess?: (item: AssessmentListItem) => boolean;
  onAssess?: (item: AssessmentListItem) => void;
  header?: ReactElement;
}

const getItemKey = (item: AssessmentListItem): string => item.id;

type StatusKey = AssessmentStatus | "All";

const STATUS_OPTIONS: readonly SegmentOption<StatusKey>[] = [
  { key: "All", label: "All" },
  ...ASSESSMENT_STATUSES.map((status): SegmentOption<StatusKey> => ({ key: status, label: status })),
];

export default function AssessmentListView({
  query,
  statusFilter,
  onStatusFilterChange,
  showProgress,
  emptyMessage,
  onView,
  onAssign,
  canAssess,
  onAssess,
  header,
}: AssessmentListViewProps): ReactElement {
  const insets = useScreenInsets();
  const list = useAssessmentList({ ...query, status: statusFilter });
  const { refresh } = list;
  const [search, setSearch] = useState("");
  const handleClearSearch = useCallback((): void => setSearch(""), []);
  // Searches the requests already loaded; more load as you scroll, so a search that finds little keeps paging.
  const visibleItems = useMemo(
    () => (list.viewState.status === "success" ? list.viewState.data.filter((item) => matchesAssessmentSearch(item, search)) : []),
    [list.viewState, search],
  );

  // A search only sees the requests loaded so far. While it finds nothing and more pages exist, keep loading,
  // otherwise a match on a later page would be reported as "no results".
  const { hasNextPage, isFetchingNextPage, loadMore } = list;
  useEffect(() => {
    if (search.trim() && visibleItems.length === 0 && hasNextPage && !isFetchingNextPage) loadMore();
  }, [hasNextPage, isFetchingNextPage, loadMore, search, visibleItems.length]);

  const handleFilterChange = useCallback((key: StatusKey): void => {
    onStatusFilterChange(key === "All" ? undefined : key);
  }, [onStatusFilterChange]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<AssessmentListItem>): ReactElement => (
    <AssessmentCard
      item={item}
      onAssess={onAssess && (!canAssess || canAssess(item)) ? onAssess : undefined}
      onAssign={onAssign}
      onView={onView}
      showProgress={showProgress}
    />
  ), [canAssess, onAssess, onAssign, onView, showProgress]);

  const filters = (
    <>
      <SearchField accessibilityLabel="Search requests" onChangeText={setSearch} onClear={handleClearSearch} placeholder="Search requests" value={search} />
      <SegmentedControl
        accessibilityLabel="Filter by status"
        onChange={handleFilterChange}
        options={STATUS_OPTIONS}
        value={statusFilter ?? "All"}
      />
      <LastUpdatedLabel isRefreshing={list.isRefreshing} updatedAt={list.updatedAt} />
    </>
  );

  return (
    <View style={styles.container}>
      {list.viewState.status === "success" ? (
        <FlatList
          contentContainerStyle={[styles.list, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.section }]}
          data={visibleItems}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          removeClippedSubviews
          windowSize={7}
          keyExtractor={getItemKey}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={COLORS.accent} style={styles.footer} /> : null}
          ListEmptyComponent={<AsyncStateView emptyMessage={"No requests match “" + search.trim() + "”."} onRetry={refresh} status="empty" variant="list" />}
          ListHeaderComponent={<View style={styles.header}>{header}{filters}</View>}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl colors={[COLORS.accent]} progressViewOffset={insets.top} onRefresh={refresh} refreshing={list.isRefreshing} />}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={[styles.state, { paddingTop: insets.top + SPACING.large }]}>
          {header}
          {filters}
          <AsyncStateView
            emptyMessage={emptyMessage}
            message={list.viewState.status === "error" ? list.viewState.message : undefined}
            onRetry={refresh}
            status={list.viewState.status}
            variant="list"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { gap: SPACING.medium, paddingBottom: SPACING.section, paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  header: { gap: SPACING.medium, paddingBottom: SPACING.small, paddingTop: SPACING.large },
  footer: { paddingVertical: SPACING.large },
  state: { flex: 1, gap: SPACING.medium, paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: SPACING.large },
});
