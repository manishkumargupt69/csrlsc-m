import { useCallback, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { assessmentRepository } from "@/src/features/assessments/data/assessment.repository";
import type {
  AssessmentDetail,
  AssessmentListItem,
  AssessmentListQuery,
} from "@/src/features/assessments/domain/assessment.types";
import { ASSESSMENT_STATUSES } from "@/src/features/assessments/domain/assessment.types";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { toViewState } from "@/src/hooks/use-query-view-state";
import type { ViewState } from "@/src/types/view-state";

export const ASSESSMENTS_QUERY_KEY = "assessments";
export const ASSESSMENT_DETAIL_QUERY_KEY = "assessment-detail";
export const ASSESSMENT_COUNTS_QUERY_KEY = "assessment-counts";

interface AssessmentListResult {
  viewState: ViewState<AssessmentListItem[]>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isRefreshing: boolean;
  /** Milliseconds timestamp of the last successful fetch; 0 before the first one. */
  updatedAt: number;
  loadMore: () => void;
  refresh: () => void;
}

export const useAssessmentList = (query: AssessmentListQuery): AssessmentListResult => {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user.id ?? "";
  const result = useInfiniteQuery({
    queryKey: [ASSESSMENTS_QUERY_KEY, userId, query.status ?? "all", query.assignedToUserId ?? "everyone"],
    queryFn: ({ pageParam }) => {
      if (!session) throw new Error("Your session has expired. Sign in again.");
      return assessmentRepository.list(session, query, pageParam);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    enabled: Boolean(session),
  });
  const items = useMemo(
    () => result.data?.pages.flatMap((page) => page.items),
    [result.data],
  );
  const { fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } = result;
  const loadMore = useCallback((): void => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const refresh = useCallback((): void => { void refetch(); }, [refetch]);

  return {
    viewState: toViewState(
      { ...result, data: items },
      {
        isEnabled: Boolean(session),
        isEmpty: (data) => data.length === 0,
        errorMessage: "Assessment requests could not be loaded. Check your connection.",
      },
    ),
    hasNextPage,
    isFetchingNextPage,
    isRefreshing: isRefetching && !isFetchingNextPage,
    updatedAt: result.dataUpdatedAt,
    loadMore,
    refresh,
  };
};

interface AssessmentDetailResult {
  viewState: ViewState<AssessmentDetail>;
  reload: () => void;
}

export const useAssessmentDetail = (id: string): AssessmentDetailResult => {
  const session = useAuthStore((state) => state.session);
  const query = useQuery({
    queryKey: [ASSESSMENT_DETAIL_QUERY_KEY, session?.user.id ?? "", id],
    queryFn: () => {
      if (!session) throw new Error("Your session has expired. Sign in again.");
      return assessmentRepository.details(session, id);
    },
    enabled: Boolean(session && id),
  });
  const { refetch } = query;
  const reload = useCallback((): void => { void refetch(); }, [refetch]);
  return {
    viewState: toViewState(query, {
      isEnabled: Boolean(session && id),
      isEmpty: () => false,
      errorMessage: "The assessment could not be loaded. Check your connection.",
    }),
    reload,
  };
};

export interface AssessmentCounts {
  total: number;
  byStatus: Readonly<Record<string, number>>;
}

/** Who the lists and dashboard are about: admins see everything, others only their own requests. */
export const useAssessmentScope = (): AssessmentListQuery => {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user.id ?? "";
  const isAdmin = session?.user.isAdmin ?? false;
  return useMemo((): AssessmentListQuery => (isAdmin ? {} : { assignedToUserId: userId }), [isAdmin, userId]);
};

/** Totals per status for the dashboard, fetched as one-row pages. */
export const useAssessmentCounts = (): {
  viewState: ViewState<AssessmentCounts>;
  reload: () => void;
} => {
  const session = useAuthStore((state) => state.session);
  const scope = useAssessmentScope();
  const query = useQuery({
    queryKey: [ASSESSMENT_COUNTS_QUERY_KEY, session?.user.id ?? "", scope.assignedToUserId ?? "everyone"],
    queryFn: async (): Promise<AssessmentCounts> => {
      if (!session) throw new Error("Your session has expired. Sign in again.");
      const assignedToUserId = scope.assignedToUserId;
      const [total, ...perStatus] = await Promise.all([
        assessmentRepository.count(session, { assignedToUserId }),
        ...ASSESSMENT_STATUSES.map((status) => assessmentRepository.count(session, { status, assignedToUserId })),
      ]);
      return {
        total,
        byStatus: Object.fromEntries(ASSESSMENT_STATUSES.map((status, index) => [status, perStatus[index]])),
      };
    },
    enabled: Boolean(session),
  });
  const { refetch } = query;
  const reload = useCallback((): void => { void refetch(); }, [refetch]);
  return {
    viewState: toViewState(query, {
      isEnabled: Boolean(session),
      isEmpty: () => false,
      errorMessage: "Assessment totals could not be loaded.",
    }),
    reload,
  };
};
