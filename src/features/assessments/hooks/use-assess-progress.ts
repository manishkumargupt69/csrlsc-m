import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { assessmentRepository } from "@/src/features/assessments/data/assessment.repository";
import type { ProgressSummary } from "@/src/features/assessments/domain/progress-summary";
import { summarizeProgress } from "@/src/features/assessments/domain/progress-summary";
import { ASSESSMENTS_QUERY_KEY, useAssessmentScope } from "@/src/features/assessments/hooks/use-assessments";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { toViewState } from "@/src/hooks/use-query-view-state";
import type { ViewState } from "@/src/types/view-state";

export const ASSESS_PROGRESS_QUERY_KEY = "assess-progress";

/** Parameter and request totals for the Assess tab, for everything the signed-in user can assess. */
export const useAssessProgress = (): { viewState: ViewState<ProgressSummary>; reload: () => void } => {
  const session = useAuthStore((state) => state.session);
  const scope = useAssessmentScope();
  const query = useQuery({
    // Shares the assessments prefix so saving an audit or creating a request refreshes it.
    queryKey: [ASSESSMENTS_QUERY_KEY, ASSESS_PROGRESS_QUERY_KEY, session?.user.id ?? "", scope.assignedToUserId ?? "everyone"],
    queryFn: async (): Promise<ProgressSummary> => {
      if (!session) throw new Error("Your session has expired. Sign in again.");
      return summarizeProgress(await assessmentRepository.progressCounts(session, scope));
    },
    enabled: Boolean(session),
  });
  const { refetch } = query;
  const reload = useCallback((): void => { void refetch(); }, [refetch]);
  return {
    viewState: toViewState(query, {
      isEnabled: Boolean(session),
      isEmpty: (data) => data.requests.total === 0,
      errorMessage: "Assessment progress could not be loaded.",
    }),
    reload,
  };
};
