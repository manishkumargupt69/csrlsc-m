import type { ReactElement } from "react";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import AsyncStateView from "@/src/components/ui/AsyncStateView";
import DetailHeader from "@/src/components/ui/DetailHeader";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import ParameterProgress from "@/src/features/assessments/presentation/ParameterProgress";
import ScreenContainer, { useScreenInsets } from "@/src/components/ui/ScreenContainer";
import { useAssessmentDetail } from "@/src/features/assessments/hooks/use-assessments";
import ParameterList from "@/src/features/assessments/presentation/ParameterList";
import AssessmentSummaryCard from "@/src/features/assessments/presentation/AssessmentSummaryCard";
import { getRequestDetails } from "@/src/features/assessments/presentation/request-details";
import ParameterFilterBar from "@/src/features/assessments/presentation/ParameterFilterBar";
import { useParameterFilter } from "@/src/features/assessments/hooks/use-parameter-filter";
import type { AssessmentParameter } from "@/src/features/assessments/domain/assessment.types";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

type AssessmentParams = { id?: string };


const NO_PARAMETERS: readonly AssessmentParameter[] = [];
export default function AssessmentDetailScreen(): ReactElement {
  const insets = useScreenInsets();
  const { id = "" } = useLocalSearchParams<AssessmentParams>();
  const session = useAuthStore((state) => state.session);
  const { viewState, reload } = useAssessmentDetail(id);
  const assessment = viewState.status === "success" ? viewState.data : null;
  const parameterFilter = useParameterFilter(assessment?.parameters ?? NO_PARAMETERS);
  // As on the web, an admin or an assigned auditor can audit a request whatever its status.
  const canAudit = Boolean(assessment && (session?.user.isAdmin || assessment.auditorIds.includes(session?.user.id ?? "")));

  const handleBack = useCallback((): void => router.back(), []);
  const handleAssess = useCallback((): void => {
    router.push({ pathname: "/(app)/assessments/[id]/assess", params: { id } });
  }, [id]);

  return (
    <ScreenContainer>
      <DetailHeader onBack={handleBack} title={assessment?.assessmentNo ?? "Assessment Request"} />
      {assessment ? (
        <ParameterList
          contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.large, paddingBottom: insets.bottom + SPACING.section }]}
          emptyMessage={parameterFilter.isFiltering ? "No parameters match these filters." : "No parameters are attached to this request."}
          header={
            <>
              <AssessmentSummaryCard
                assessmentNo={assessment.assessmentNo}
                details={getRequestDetails(assessment)}
                status={assessment.status}
                toBeCompletedBy={assessment.toBeCompletedBy}
              />
              <View style={styles.card}>
                <ParameterProgress assessed={assessment.auditedParameters} percent={assessment.completionPercent} total={assessment.totalParameters} />
              </View>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Parameters ({assessment.totalParameters})</Text>
              {assessment.parameters.length > 0 ? (
                <ParameterFilterBar
                  groupings={parameterFilter.groupings}
                  onChange={parameterFilter.setFilters}
                  parameterTypes={parameterFilter.parameterTypes}
                  value={parameterFilter.filters}
                />
              ) : null}
            </>
          }
          parameters={parameterFilter.filtered}
        />
      ) : (
        <View style={styles.state}>
          <AsyncStateView
            emptyMessage="This assessment is unavailable."
            message={viewState.status === "error" ? viewState.message : undefined}
            onRetry={reload}
            status={viewState.status === "success" ? "empty" : viewState.status}
            variant="detail"
          />
        </View>
      )}
      {canAudit ? (
        <View style={styles.footer}>
          <PrimaryButton iconName="check-square" label="Audit" onPress={handleAssess} />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  state: { flex: 1, paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  card: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.large, borderWidth: StyleSheet.hairlineWidth, gap: SPACING.medium, padding: SPACING.medium },
  sectionTitle: { color: COLORS.ink, ...TYPOGRAPHY.control, fontWeight: "800" },
  footer: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: StyleSheet.hairlineWidth, padding: SCREEN_HORIZONTAL_PADDING },
});
