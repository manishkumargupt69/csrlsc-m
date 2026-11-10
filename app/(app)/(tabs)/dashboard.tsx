import type { ReactElement } from "react";
import { useCallback, useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import Reveal from "@/src/components/motion/Reveal";
import AsyncStateView from "@/src/components/ui/AsyncStateView";
import DrawerHeader from "@/src/components/ui/DrawerHeader";
import LastUpdatedLabel from "@/src/components/ui/LastUpdatedLabel";
import ScreenContainer, { useScreenInsets } from "@/src/components/ui/ScreenContainer";
import { BRAND_NAME } from "@/src/components/branding/BrandLogo";
import type { AssessmentListItem } from "@/src/features/assessments/domain/assessment.types";
import {
  useAssessmentCounts,
  useAssessmentList,
  useAssessmentScope,
} from "@/src/features/assessments/hooks/use-assessments";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { useLspRanking } from "@/src/features/dashboard/hooks/use-lsp-ranking";
import DashboardHero from "@/src/features/dashboard/presentation/DashboardHero";
import type { HeroCounts } from "@/src/features/dashboard/presentation/DashboardHero";
import DashboardSection from "@/src/features/dashboard/presentation/DashboardSection";
import LspList from "@/src/features/dashboard/presentation/LspList";
import RequestRow from "@/src/features/dashboard/presentation/RequestRow";
import type { TileStatus } from "@/src/features/dashboard/presentation/StatusTiles";
import StatusTiles from "@/src/features/dashboard/presentation/StatusTiles";
import { COLORS, SCREEN_HORIZONTAL_PADDING, SPACING } from "@/src/theme/tokens";

const RECENT_LIMIT = 5;
const MORNING_ENDS = 12;
const AFTERNOON_ENDS = 17;

const getGreeting = (now: Date): string => {
  const hour = now.getHours();
  if (hour < MORNING_ENDS) return "Good morning";
  if (hour < AFTERNOON_ENDS) return "Good afternoon";
  return "Good evening";
};

export default function DashboardScreen(): ReactElement {
  const insets = useScreenInsets();
  const session = useAuthStore((state) => state.session);
  const scope = useAssessmentScope();
  const counts = useAssessmentCounts();
  const recent = useAssessmentList(scope);
  const ranking = useLspRanking();
  const { reload: reloadCounts } = counts;
  const { refresh: refreshRecent } = recent;
  const { reload: reloadRanking } = ranking;

  const refresh = useCallback((): void => {
    reloadCounts();
    refreshRecent();
    reloadRanking();
  }, [refreshRecent, reloadCounts, reloadRanking]);
  const openRequests = useCallback((): void => router.navigate("/(app)/(tabs)/assessments"), []);
  const openRequestsByStatus = useCallback((status: TileStatus): void => {
    // The nonce makes repeat taps on the same tile re-apply the filter after it was changed by hand.
    router.navigate({ pathname: "/(app)/(tabs)/assessments", params: { status, nonce: String(Date.now()) } });
  }, []);
  const handleOpen = useCallback((item: AssessmentListItem): void => {
    router.push({ pathname: "/(app)/assessments/[id]", params: { id: item.id } });
  }, []);

  const heroCounts = useMemo((): HeroCounts | null => {
    if (counts.viewState.status !== "success") return null;
    const { total, byStatus } = counts.viewState.data;
    return { total, pending: byStatus.Pending ?? 0, assigned: byStatus.Assigned ?? 0, completed: byStatus.Completed ?? 0 };
  }, [counts.viewState]);

  const recentItems = useMemo(
    () => (recent.viewState.status === "success" ? recent.viewState.data.slice(0, RECENT_LIMIT) : []),
    [recent.viewState],
  );
  const ranked = ranking.viewState.status === "success" ? ranking.viewState.data : null;
  const greeting = useMemo(() => getGreeting(new Date()), []);

  return (
    <ScreenContainer>
      <DrawerHeader title={BRAND_NAME} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.large, paddingBottom: insets.bottom + SPACING.section }]}
        refreshControl={<RefreshControl colors={[COLORS.accent]} progressViewOffset={insets.top} onRefresh={refresh} refreshing={recent.isRefreshing} />}
        showsVerticalScrollIndicator={false}
      >
        <Reveal index={0}>
          <DashboardHero clientName={session?.user.clientName ?? ""} counts={heroCounts} greeting={greeting} name={session?.user.name ?? ""} />
        </Reveal>

        <LastUpdatedLabel isRefreshing={recent.isRefreshing} updatedAt={recent.updatedAt} />

        {counts.viewState.status === "error" ? (
          <AsyncStateView emptyMessage="" message={counts.viewState.message} onRetry={reloadCounts} status="error" variant="detail" />
        ) : null}

        {heroCounts ? (
          <Reveal index={1}>
            <StatusTiles counts={heroCounts} onOpen={openRequestsByStatus} />
          </Reveal>
        ) : null}

        <Reveal index={2}>
          <DashboardSection actionLabel="See all" onAction={openRequests} subtitle="Latest activity" title="Recent requests">
            {recent.viewState.status === "success" ? (
              <View>
                {recentItems.map((item) => <RequestRow key={item.id} item={item} onPress={handleOpen} />)}
              </View>
            ) : (
              <AsyncStateView
                emptyMessage="No assessment requests yet."
                message={recent.viewState.status === "error" ? recent.viewState.message : undefined}
                onRetry={refreshRecent}
                status={recent.viewState.status}
                variant="detail"
              />
            )}
          </DashboardSection>
        </Reveal>

        <Reveal index={3}>
          <LspList
            emptyMessage="Rankings appear once assessments are completed and rated."
            errorMessage={ranking.viewState.status === "error" ? ranking.viewState.message : undefined}
            onRetry={reloadRanking}
            scores={ranked?.top ?? []}
            state={ranking.viewState.status}
            title="Top performing LSP"
            variant="top"
          />
        </Reveal>
        <Reveal index={4}>
          <LspList
            emptyMessage="Rankings appear once assessments are completed and rated."
            errorMessage={ranking.viewState.status === "error" ? ranking.viewState.message : undefined}
            onRetry={reloadRanking}
            scores={ranked?.bottom ?? []}
            state={ranking.viewState.status}
            title="Bottom performing LSP"
            variant="bottom"
          />
        </Reveal>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACING.large, padding: SCREEN_HORIZONTAL_PADDING, paddingBottom: SPACING.section },
});
