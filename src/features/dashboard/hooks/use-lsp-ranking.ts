import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { assessmentRepository } from "@/src/features/assessments/data/assessment.repository";
import { useAssessmentScope } from "@/src/features/assessments/hooks/use-assessments";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import type { LspRanking } from "@/src/features/dashboard/domain/lsp-ranking";
import { rankLsps } from "@/src/features/dashboard/domain/lsp-ranking";
import { toViewState } from "@/src/hooks/use-query-view-state";
import type { ViewState } from "@/src/types/view-state";

const RANKING_STALE_TIME_MS = 5 * 60_000;

/** Top and bottom performing LSPs, computed in the app from completed assessments. */
export const useLspRanking = (): { viewState: ViewState<LspRanking>; reload: () => void } => {
  const session = useAuthStore((state) => state.session);
  const scope = useAssessmentScope();
  const query = useQuery({
    queryKey: ["lsp-ranking", session?.user.id ?? "", scope.assignedToUserId ?? "everyone"],
    queryFn: async (): Promise<LspRanking> => {
      if (!session) throw new Error("Your session has expired. Sign in again.");
      const ratings = await assessmentRepository.completedRatings(session, { assignedToUserId: scope.assignedToUserId });
      return rankLsps(ratings);
    },
    enabled: Boolean(session),
    staleTime: RANKING_STALE_TIME_MS,
  });
  const { refetch } = query;
  const reload = useCallback((): void => { void refetch(); }, [refetch]);
  return {
    viewState: toViewState(query, {
      isEnabled: Boolean(session),
      isEmpty: (data) => data.top.length === 0 && data.bottom.length === 0,
      errorMessage: "Performance data could not be loaded.",
    }),
    reload,
  };
};
