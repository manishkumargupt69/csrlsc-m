import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import BottomSheetModal from "@/src/components/ui/BottomSheetModal";
import DetailHeader from "@/src/components/ui/DetailHeader";
import FormField from "@/src/components/ui/FormField";
import InfoRow, { InfoGroup } from "@/src/components/ui/InfoRow";
import MediaAttachmentTray from "@/src/components/ui/MediaAttachmentTray";
import OptionPickerSheet from "@/src/components/ui/OptionPickerSheet";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import ScreenContainer, { useScreenInsets } from "@/src/components/ui/ScreenContainer";
import SecondaryButton from "@/src/components/ui/SecondaryButton";
import SelectField from "@/src/components/ui/SelectField";
import StatusBadge from "@/src/components/ui/StatusBadge";
import EvidenceCameraModal from "@/src/features/evidence/presentation/EvidenceCameraModal";
import type { IncidentOption } from "@/src/features/incidents/domain/incident.types";
import { useReportIncident } from "@/src/features/incidents/hooks/use-report-incident";
import { useUnsavedChanges } from "@/src/hooks/use-unsaved-changes";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

type PickerKind = "type" | "subType" | null;

export default function NewIncidentScreen(): ReactElement {
  const insets = useScreenInsets();
  const report = useReportIncident();
  const { evidence, state, errors } = report;
  const [picker, setPicker] = useState<PickerKind>(null);
  const [showErrors, setShowErrors] = useState(false);
  useUnsavedChanges(report.isDirty);

  const handleBack = useCallback((): void => router.back(), []);
  const openTypePicker = useCallback((): void => setPicker("type"), []);
  const openSubTypePicker = useCallback((): void => setPicker("subType"), []);
  const closePicker = useCallback((): void => setPicker(null), []);
  const handleSelect = useCallback((option: IncidentOption): void => {
    if (picker === "type") report.selectType(option);
    else report.selectSubType(option);
    setPicker(null);
  }, [picker, report]);
  const handleSubmit = useCallback((): void => {
    setShowErrors(true);
    if (Object.keys(errors).length > 0) return;
    // The incident service does not exist yet, so nothing is sent or saved.
    Alert.alert("Not implemented yet", "Reporting incidents is not available yet. Nothing was saved.", [{ text: "OK" }], { cancelable: true });
  }, [errors]);

  const pickerOptions = picker === "type" ? report.types : report.subTypes;
  const selectedId = picker === "type" ? state.type?.id : state.subType?.id;
  const attachmentCount = evidence.attachments.length;
  const evidenceLabel = attachmentCount > 0 ? "Photo / Video / Voice note (" + attachmentCount + ")" : "Photo / Video / Voice note";

  return (
    <ScreenContainer>
      <DetailHeader onBack={handleBack} title="Report Incident" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.large, paddingBottom: insets.bottom + SPACING.section }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.notice}>Not implemented yet. You can fill in the form, but nothing is sent or saved.</Text>
        <Text style={styles.legend}>Fields marked * are required.</Text>
        <View style={styles.field}>
          <SelectField iconName="alert-triangle" isRequired label="Incident type" onPress={openTypePicker} placeholder="Select incident type" value={state.type?.label ?? ""} />
          {showErrors && errors.type ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errors.type}</Text> : null}
        </View>
        <View style={styles.field}>
          <SelectField iconName="layers" isDisabled={!state.type} isRequired label="Incident sub type" onPress={openSubTypePicker} placeholder={state.type ? "Select sub type" : "Select a type first"} value={state.subType?.label ?? ""} />
          {showErrors && errors.subType ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errors.subType}</Text> : null}
        </View>
        <View style={styles.field}>
          <FormField errorMessage={showErrors ? errors.description : undefined} isMultiline isRequired label="Incident" onChangeText={report.setDescription} placeholder="Describe the incident" textCapitalization="sentences" value={state.description} />
        </View>
        <InfoGroup><InfoRow iconName="flag" label="Status"><StatusBadge label="Pending" tone="warning" /></InfoRow></InfoGroup>
        <FormField isMultiline label="Remarks" onChangeText={report.setRemarks} placeholder="Enter remarks" textCapitalization="sentences" value={state.remarks} />
        <SecondaryButton iconName="paperclip" label={evidenceLabel} onPress={evidence.openEvidence} />
      </ScrollView>
      <View style={styles.footer}>
        {evidence.preparation ? <Text accessibilityLiveRegion="polite" style={styles.footerStatus}>Preparing evidence…</Text> : null}
        <PrimaryButton isDisabled={Boolean(evidence.preparation) || evidence.isRecording} label="Submit incident" onPress={handleSubmit} />
      </View>

      <OptionPickerSheet
        isVisible={picker !== null}
        onClose={closePicker}
        onSelect={handleSelect}
        options={pickerOptions}
        selectedIds={selectedId ? [selectedId] : []}
        title={picker === "type" ? "Incident type" : "Incident sub type"}
      />
      <BottomSheetModal accessibilityLabel="Close evidence" isVisible={evidence.isEvidenceVisible} onClose={evidence.closeEvidence} onDismiss={evidence.handleEvidenceDismiss} title="Evidence">
        <View style={styles.sheet}>
          <MediaAttachmentTray
            attachments={evidence.attachments}
            isRecording={evidence.isRecording}
            onAddDocument={evidence.chooseFile}
            onAddFromGallery={evidence.chooseGallery}
            onAddPhoto={evidence.chooseCamera}
            onRemove={evidence.removeAttachment}
            onToggleVoiceNote={evidence.toggleVoiceNote}
            preparation={evidence.preparation}
            recordingMilliseconds={evidence.recordingMilliseconds}
            supportsVideo
            title="Add evidence"
          />
        </View>
      </BottomSheetModal>
      <EvidenceCameraModal isVisible={evidence.isCameraVisible} onCaptured={evidence.handleCameraCaptured} onClose={evidence.closeCamera} onDismiss={evidence.handleCameraDismiss} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: SPACING.large, padding: SCREEN_HORIZONTAL_PADDING },
  field: { gap: SPACING.extraSmall },
  legend: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption },
  notice: { backgroundColor: COLORS.accentSoft, borderRadius: RADII.medium, color: COLORS.accent, ...TYPOGRAPHY.caption, padding: SPACING.medium },
  error: { color: COLORS.danger, ...TYPOGRAPHY.caption },
  sheet: { gap: SPACING.large, padding: SCREEN_HORIZONTAL_PADDING },
  footer: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: StyleSheet.hairlineWidth, padding: SCREEN_HORIZONTAL_PADDING },
  footerStatus: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, marginBottom: SPACING.small, textAlign: "center" },
});
