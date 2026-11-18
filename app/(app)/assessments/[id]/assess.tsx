import type { ReactElement } from "react";
import { useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import AsyncStateView from "@/src/components/ui/AsyncStateView";
import DetailHeader from "@/src/components/ui/DetailHeader";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import ParameterProgress from "@/src/features/assessments/presentation/ParameterProgress";
import ScreenContainer, { useScreenInsets } from "@/src/components/ui/ScreenContainer";
import type { AssessmentParameter } from "@/src/features/assessments/domain/assessment.types";
import { useAssessmentAudit } from "@/src/features/assessments/hooks/use-assessment-audit";
import { useAssessmentDetail } from "@/src/features/assessments/hooks/use-assessments";
import ParameterList from "@/src/features/assessments/presentation/ParameterList";
import ParameterFilterBar from "@/src/features/assessments/presentation/ParameterFilterBar";
import { useParameterFilter } from "@/src/features/assessments/hooks/use-parameter-filter";
import AssessmentSummaryCard from "@/src/features/assessments/presentation/AssessmentSummaryCard";
import { getRequestDetails } from "@/src/features/assessments/presentation/request-details";
import { useUnsavedChanges } from "@/src/hooks/use-unsaved-changes";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING } from "@/src/theme/tokens";
import { showSuccessMessage } from "@/src/utils/show-success-message";

type AssessParams = { id?: string };


const NO_PARAMETERS: readonly AssessmentParameter[] = [];
export default function AssessScreen(): ReactElement {
  const insets = useScreenInsets();
  const { id = "" } = useLocalSearchParams<AssessParams>();
  const { viewState, reload } = useAssessmentDetail(id);
  const assessment = viewState.status === "success" ? viewState.data : null;
  const audit = useAssessmentAudit(assessment);
  const allowNavigation = useUnsavedChanges(audit.touchedCount > 0);
  const parameterFilter = useParameterFilter(assessment?.parameters ?? NO_PARAMETERS);

  const handleBack = useCallback((): void => router.back(), []);
  const handleOpenParameter = useCallback((parameter: AssessmentParameter): void => {
    router.push({
      pathname: "/(app)/assessments/[id]/parameters/[parameterId]",
      params: { id, parameterId: parameter.id },
    });
  }, [id]);
  const handleSave = useCallback(async (): Promise<void> => {
    try {
      await audit.save();
      allowNavigation();
      showSuccessMessage("Audit saved");
    } catch (error: unknown) {
      Alert.alert("Unable to save audit", error instanceof Error ? error.message : "Try again.");
    }
  }, [allowNavigation, audit]);

  return (
    <ScreenContainer>
      <DetailHeader onBack={handleBack} title="Audit Assessment" />
      {assessment ? (
        <ParameterList
          contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.large, paddingBottom: insets.bottom + SPACING.section }]}
          drafts={audit.drafts}
          emptyMessage={parameterFilter.isFiltering ? "No parameters match these filters." : "No parameters are attached to this request."}
          header={
            <>
              <AssessmentSummaryCard assessmentNo={assessment.assessmentNo} details={getRequestDetails(assessment)} status={assessment.status} toBeCompletedBy={assessment.toBeCompletedBy} />
              <View style={styles.card}>
                <ParameterProgress assessed={assessment.auditedParameters} percent={assessment.completionPercent} total={assessment.totalParameters} />
              </View>
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
          onOpen={handleOpenParameter}
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
      {assessment ? (
        <View style={styles.footer}>
          <PrimaryButton
            iconName="upload-cloud"
            isDisabled={audit.touchedCount === 0}
            isLoading={audit.isSaving}
            label={audit.touchedCount > 0 ? "Save audit (" + audit.touchedCount + ")" : "Save audit"}
            onPress={handleSave}
          />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  state: { flex: 1, paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  card: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.large, borderWidth: StyleSheet.hairlineWidth, gap: SPACING.medium, padding: SPACING.medium },
  footer: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: StyleSheet.hairlineWidth, padding: SCREEN_HORIZONTAL_PADDING },
});
