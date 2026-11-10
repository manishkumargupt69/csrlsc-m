import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import DrawerHeader from "@/src/components/ui/DrawerHeader";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import ScreenContainer from "@/src/components/ui/ScreenContainer";
import type { AssessmentListItem, AssessmentStatus } from "@/src/features/assessments/domain/assessment.types";
import { useAssignAuditor } from "@/src/features/assessments/hooks/use-assign-auditor";
import AssessmentListView from "@/src/features/assessments/presentation/AssessmentListView";
import AssignAuditorSheet from "@/src/features/assessments/presentation/AssignAuditorSheet";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { getAssessmentPermissions } from "@/src/features/modules/domain/mobile-modules";

const ASSESSMENT_QUERY = {};
const FILTERABLE_STATUSES: readonly AssessmentStatus[] = ["Pending", "Assigned", "Completed"];

const parseStatus = (value: string | undefined): AssessmentStatus | undefined =>
  FILTERABLE_STATUSES.find((status) => status === value);

export default function AssessmentRequestsScreen(): ReactElement {
  const session = useAuthStore((state) => state.session);
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | undefined>(undefined);
  const { status: statusParam, nonce } = useLocalSearchParams<{ status?: string; nonce?: string }>();

  // Arriving from a dashboard tile applies that status. The screen stays mounted between visits,
  // so this runs on every new tap (nonce), not only the first.
  useEffect(() => {
    if (statusParam) setStatusFilter(parseStatus(statusParam));
  }, [statusParam, nonce]);

  const assign = useAssignAuditor();
  const { open: openAssign } = assign;
  const canManage = useMemo(() => (session ? getAssessmentPermissions(session).canManage : false), [session]);
  const userId = session?.user.id ?? "";
  const isAdmin = session?.user.isAdmin ?? false;

  const handleCreate = useCallback((): void => router.push("/(app)/assessments/new"), []);
  const handleView = useCallback((item: AssessmentListItem): void => {
    router.push({ pathname: "/(app)/assessments/[id]", params: { id: item.id } });
  }, []);
  const handleAssess = useCallback((item: AssessmentListItem): void => {
    router.push({ pathname: "/(app)/assessments/[id]/assess", params: { id: item.id } });
  }, []);
  const canAssess = useCallback(
    (item: AssessmentListItem): boolean =>
      item.status === "Assigned" && (isAdmin || item.auditorIds.includes(userId)),
    [isAdmin, userId],
  );

  return (
    <ScreenContainer>
      <DrawerHeader title="Assessment Requests" />
      <AssessmentListView
        canAssess={canAssess}
        emptyMessage="No assessment requests yet."
        header={canManage ? <View style={styles.create}><PrimaryButton label="Create request" onPress={handleCreate} /></View> : undefined}
        onAssess={handleAssess}
        onAssign={canManage ? openAssign : undefined}
        onStatusFilterChange={setStatusFilter}
        onView={handleView}
        query={ASSESSMENT_QUERY}
        showProgress={false}
        statusFilter={statusFilter}
      />
      <AssignAuditorSheet assign={assign} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  create: { alignSelf: "stretch" },
});
