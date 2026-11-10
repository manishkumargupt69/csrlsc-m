import type { ReactElement } from "react";
import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import AsyncStateView from "@/src/components/ui/AsyncStateView";
import DetailHeader from "@/src/components/ui/DetailHeader";
import InfoRow, { InfoGroup } from "@/src/components/ui/InfoRow";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import ParameterProgress from "@/src/features/assessments/presentation/ParameterProgress";
import ScreenContainer, { useScreenInsets } from "@/src/components/ui/ScreenContainer";
import StatusBadge from "@/src/components/ui/StatusBadge";
import { groupParameters } from "@/src/features/assessments/data/assessment.mappers";
import { useAssessmentDetail } from "@/src/features/assessments/hooks/use-assessments";
import ParameterRow from "@/src/features/assessments/presentation/ParameterRow";
import { getStatusTone } from "@/src/features/assessments/presentation/status-tone";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import { formatDate } from "@/src/utils/format-date-time";

type AssessmentParams = { id?: string };

export default function AssessmentDetailScreen(): ReactElement {
  const insets = useScreenInsets();
  const { id = "" } = useLocalSearchParams<AssessmentParams>();
  const session = useAuthStore((state) => state.session);
  const { viewState, reload } = useAssessmentDetail(id);
  const assessment = viewState.status === "success" ? viewState.data : null;
  const groups = useMemo(() => groupParameters(assessment?.parameters ?? []), [assessment]);
  const canAssess = Boolean(
    assessment && assessment.status === "Assigned" &&
    (session?.user.isAdmin || assessment.auditorIds.includes(session?.user.id ?? "")),
  );

  const handleBack = useCallback((): void => router.back(), []);
  const handleAssess = useCallback((): void => {
    router.push({ pathname: "/(app)/assessments/[id]/assess", params: { id } });
  }, [id]);

  return (
    <ScreenContainer>
      <DetailHeader onBack={handleBack} title={assessment?.assessmentNo ?? "Assessment Request"} />
      {assessment ? (
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.large, paddingBottom: insets.bottom + SPACING.section }]} showsVerticalScrollIndicator={false}>
          <InfoGroup>
            <InfoRow iconName="flag" label="Status"><StatusBadge label={assessment.status} tone={getStatusTone(assessment.status)} /></InfoRow>
            <InfoRow iconName="briefcase" label="Requested by" value={assessment.requestedBy} />
            <InfoRow iconName="target" label="Request for" value={assessment.requestFor} />
            <InfoRow iconName="user-check" label="Assigned to" value={assessment.assignedTo || "Not assigned"} />
            <InfoRow iconName="truck" label="Service" value={assessment.service} />
            <InfoRow iconName="layers" label="Sub service" value={assessment.subService} />
            <InfoRow iconName="grid" label="Domain" value={assessment.domain} />
            <InfoRow iconName="package" label="Material" value={assessment.materialGroup} />
            <InfoRow iconName="map" label="Location type" value={assessment.geoType} />
            <InfoRow iconName="map-pin" label="Location" value={assessment.geoName} />
            <InfoRow iconName="calendar" label="To be completed by" value={formatDate(assessment.toBeCompletedBy)} />
            {assessment.remarks ? <InfoRow iconName="message-square" label="Remarks" value={assessment.remarks} /> : null}
          </InfoGroup>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Progress</Text>
            <ParameterProgress assessed={assessment.auditedParameters} percent={assessment.completionPercent} total={assessment.totalParameters} />
          </View>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Parameters ({assessment.totalParameters})</Text>
          {groups.length === 0 ? <Text style={styles.empty}>No parameters are attached to this request.</Text> : null}
          {groups.map((group) => (
            <View key={group.group} style={styles.group}>
              <Text style={styles.groupTitle}>{group.group}</Text>
              {group.parameters.map((parameter) => (
                <ParameterRow key={parameter.id} hasDraft={false} parameter={parameter} rating={parameter.rating} />
              ))}
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
      {canAssess ? (
        <View style={styles.footer}>
          <PrimaryButton label="Assess" onPress={handleAssess} />
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
  sectionTitle: { color: COLORS.ink, ...TYPOGRAPHY.control, fontWeight: "800" },
  empty: { color: COLORS.inkMuted, ...TYPOGRAPHY.body },
  group: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.large, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  groupTitle: { backgroundColor: COLORS.accentSoft, color: COLORS.accent, ...TYPOGRAPHY.body, fontWeight: "700", paddingHorizontal: SPACING.large, paddingVertical: SPACING.small },
  footer: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: StyleSheet.hairlineWidth, padding: SCREEN_HORIZONTAL_PADDING },
});
