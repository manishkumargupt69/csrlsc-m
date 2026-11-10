import type { ReactElement } from "react";
import { useCallback, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import AsyncStateView from "@/src/components/ui/AsyncStateView";
import DetailHeader from "@/src/components/ui/DetailHeader";
import InfoRow, { InfoGroup } from "@/src/components/ui/InfoRow";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import ParameterProgress from "@/src/features/assessments/presentation/ParameterProgress";
import ScreenContainer, { useScreenInsets } from "@/src/components/ui/ScreenContainer";
import StatusBadge from "@/src/components/ui/StatusBadge";
import { groupParameters } from "@/src/features/assessments/data/assessment.mappers";
import type { AssessmentParameter } from "@/src/features/assessments/domain/assessment.types";
import { useAssessmentAudit } from "@/src/features/assessments/hooks/use-assessment-audit";
import { useAssessmentDetail } from "@/src/features/assessments/hooks/use-assessments";
import ParameterRow from "@/src/features/assessments/presentation/ParameterRow";
import { getStatusTone } from "@/src/features/assessments/presentation/status-tone";
import { useUnsavedChanges } from "@/src/hooks/use-unsaved-changes";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import { formatDate } from "@/src/utils/format-date-time";
import { showSuccessMessage } from "@/src/utils/show-success-message";

type AssessParams = { id?: string };

export default function AssessScreen(): ReactElement {
  const insets = useScreenInsets();
  const { id = "" } = useLocalSearchParams<AssessParams>();
  const { viewState, reload } = useAssessmentDetail(id);
  const assessment = viewState.status === "success" ? viewState.data : null;
  const audit = useAssessmentAudit(assessment);
  const allowNavigation = useUnsavedChanges(audit.touchedCount > 0);
  const groups = useMemo(() => groupParameters(assessment?.parameters ?? []), [assessment]);
  const isLocked = assessment !== null && assessment.status !== "Assigned";

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
      <DetailHeader onBack={handleBack} title="Assess Request" />
      {assessment ? (
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.large, paddingBottom: insets.bottom + SPACING.section }]} showsVerticalScrollIndicator={false}>
          <InfoGroup>
            <InfoRow iconName="hash" label="Request#" value={assessment.assessmentNo} />
            <InfoRow iconName="calendar" label="Target completion" value={formatDate(assessment.toBeCompletedBy)} />
            <InfoRow iconName="flag" label="Status"><StatusBadge label={assessment.status} tone={getStatusTone(assessment.status)} /></InfoRow>
          </InfoGroup>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Progress</Text>
            <ParameterProgress assessed={assessment.auditedParameters} percent={assessment.completionPercent} total={assessment.totalParameters} />
          </View>
          {isLocked ? <Text style={styles.notice}>This request is {assessment.status.toLocaleLowerCase()}, so it can no longer be assessed.</Text> : null}
          {groups.map((group) => (
            <View key={group.group} style={styles.group}>
              <Text style={styles.groupTitle}>{group.group}</Text>
              {group.parameters.map((parameter) => {
                const draft = audit.drafts[parameter.id];
                return (
                  <ParameterRow
                    key={parameter.id}
                    hasDraft={Boolean(draft)}
                    onPress={isLocked ? undefined : handleOpenParameter}
                    parameter={parameter}
                    rating={draft ? draft.rating : parameter.rating}
                  />
                );
              })}
            </View>
          ))}
        </ScrollView>
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
      {assessment && !isLocked ? (
        <View style={styles.footer}>
          <PrimaryButton
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
  content: { gap: SPACING.large, padding: SCREEN_HORIZONTAL_PADDING },
  state: { flex: 1, paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  card: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.large, borderWidth: StyleSheet.hairlineWidth, gap: SPACING.medium, padding: SPACING.large },
  cardTitle: { color: COLORS.ink, ...TYPOGRAPHY.control, fontWeight: "800" },
  notice: { color: COLORS.inkMuted, ...TYPOGRAPHY.body },
  group: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.large, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  groupTitle: { backgroundColor: COLORS.accentSoft, color: COLORS.accent, ...TYPOGRAPHY.body, fontWeight: "700", paddingHorizontal: SPACING.large, paddingVertical: SPACING.small },
  footer: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: StyleSheet.hairlineWidth, padding: SCREEN_HORIZONTAL_PADDING },
});
