import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";
import { router } from "expo-router";

import DrawerHeader from "@/src/components/ui/DrawerHeader";
import ScreenContainer from "@/src/components/ui/ScreenContainer";
import type { AssessmentListItem, AssessmentStatus } from "@/src/features/assessments/domain/assessment.types";
import AssessProgressOverview from "@/src/features/assessments/presentation/AssessProgressOverview";
import AssessmentListView from "@/src/features/assessments/presentation/AssessmentListView";
import { useAuthStore } from "@/src/features/auth/state/auth-store";

const ALL_REQUESTS = {};

export default function AssessRequestScreen(): ReactElement {
  const session = useAuthStore((state) => state.session);
  // Opens on "Assigned": the requests that are ready to be assessed. "All" is one tap away.
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | undefined>("Assigned");
  const userId = session?.user.id ?? "";
  const isAdmin = session?.user.isAdmin ?? false;
  // Admins see every request; everyone else sees only the requests assigned to them.
  const query = useMemo(() => (isAdmin ? ALL_REQUESTS : { assignedToUserId: userId }), [isAdmin, userId]);

  const handleView = useCallback((item: AssessmentListItem): void => {
    router.push({ pathname: "/(app)/assessments/[id]", params: { id: item.id } });
  }, []);
  const handleAssess = useCallback((item: AssessmentListItem): void => {
    router.push({ pathname: "/(app)/assessments/[id]/assess", params: { id: item.id } });
  }, []);
  const canAssess = useCallback((item: AssessmentListItem): boolean => item.status === "Assigned", []);

  return (
    <ScreenContainer>
      <DrawerHeader title="Assess Request" />
      <AssessmentListView
        canAssess={canAssess}
        header={<AssessProgressOverview />}
        emptyMessage={isAdmin ? "No assessment requests yet." : "No assessments are assigned to you."}
        onAssess={handleAssess}
        onStatusFilterChange={setStatusFilter}
        onView={handleView}
        query={query}
        showProgress
        statusFilter={statusFilter}
      />
    </ScreenContainer>
  );
}
