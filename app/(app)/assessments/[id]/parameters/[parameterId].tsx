import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import AsyncStateView from "@/src/components/ui/AsyncStateView";
import BottomSheetModal from "@/src/components/ui/BottomSheetModal";
import DetailHeader from "@/src/components/ui/DetailHeader";
import MediaAttachmentTray from "@/src/components/ui/MediaAttachmentTray";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import ScreenContainer, { useScreenInsets } from "@/src/components/ui/ScreenContainer";
import SecondaryButton from "@/src/components/ui/SecondaryButton";
import type { AssessmentParameter, AuditDraft } from "@/src/features/assessments/domain/assessment.types";
import { getInitialDraft } from "@/src/features/assessments/hooks/use-assessment-audit";
import { useAssessmentDetail } from "@/src/features/assessments/hooks/use-assessments";
import ParameterForm from "@/src/features/assessments/presentation/ParameterForm";
import AssessmentSummaryCard from "@/src/features/assessments/presentation/AssessmentSummaryCard";
import { getRequestDetails } from "@/src/features/assessments/presentation/request-details";
import { EMPTY_DRAFTS, useAuditDraftStore } from "@/src/features/assessments/state/audit-draft-store";
import EvidenceCameraModal from "@/src/features/evidence/presentation/EvidenceCameraModal";
import { useEvidenceCapture } from "@/src/features/evidence/hooks/use-evidence-capture";
import { useUnsavedChanges } from "@/src/hooks/use-unsaved-changes";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import type { EvidenceAttachment } from "@/src/types/evidence";

type ParameterParams = { id?: string; parameterId?: string };

const NO_ATTACHMENTS: readonly EvidenceAttachment[] = [];

const hasChanged = (initial: AuditDraft, current: AuditDraft, attachments: readonly EvidenceAttachment[]): boolean =>
  initial.answer !== current.answer ||
  initial.rating !== current.rating ||
  initial.remarks !== current.remarks ||
  attachments.length !== initial.attachments.length;

export default function ParameterScreen(): ReactElement {
  const insets = useScreenInsets();
  const { id = "", parameterId = "" } = useLocalSearchParams<ParameterParams>();
  const { viewState, reload } = useAssessmentDetail(id);
  const assessment = viewState.status === "success" ? viewState.data : null;
  const parameter: AssessmentParameter | null = useMemo(
    () => assessment?.parameters.find((item) => item.id === parameterId) ?? null,
    [assessment, parameterId],
  );
  const storedDraft = useAuditDraftStore((state) => (state.drafts[id] ?? EMPTY_DRAFTS)[parameterId]);
  const setStoredDraft = useAuditDraftStore((state) => state.setDraft);
  const initialDraft = useMemo(
    (): AuditDraft | null => (parameter ? storedDraft ?? getInitialDraft(parameter) : null),
    [parameter, storedDraft],
  );

  const evidence = useEvidenceCapture({ initialAttachments: initialDraft?.attachments ?? NO_ATTACHMENTS });
  const [draft, setDraft] = useState<AuditDraft | null>(null);
  const [ratingError, setRatingError] = useState<string | undefined>(undefined);
  const hydratedFor = parameter?.id ?? null;

  useEffect(() => {
    if (initialDraft && hydratedFor) setDraft(initialDraft);
    // Hydrate once per parameter so later query refreshes never overwrite typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydratedFor]);

  const isDirty = Boolean(initialDraft && draft && hasChanged(initialDraft, draft, evidence.attachments));
  const allowNavigation = useUnsavedChanges(isDirty);

  const handleBack = useCallback((): void => router.back(), []);
  const handleChange = useCallback((next: AuditDraft): void => {
    setDraft(next);
    setRatingError(undefined);
  }, []);
  const handleApply = useCallback((): void => {
    if (!parameter || !draft) return;
    if (parameter.mandatory && draft.rating === null) {
      setRatingError("A rating is required for this parameter.");
      return;
    }
    setStoredDraft(id, parameter.id, { ...draft, attachments: evidence.attachments });
    allowNavigation();
    router.back();
  }, [allowNavigation, draft, evidence.attachments, id, parameter, setStoredDraft]);

  /*
   * Android draws edge to edge, so the window no longer shrinks for the keyboard and it would cover Rating
   * Remarks. While it is open the form gets extra room at the bottom, as tall as the keyboard, and focusing
   * Remarks scrolls it into view above the keyboard.
   */
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isRemarksFocused = useRef(false);
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) => setKeyboardHeight(event.endCoordinates.height));
    const hidden = Keyboard.addListener("keyboardDidHide", () => {
      isRemarksFocused.current = false;
      setKeyboardHeight(0);
    });
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  useEffect(() => {
    if (keyboardHeight > 0 && isRemarksFocused.current) {
      // Wait a frame for the added room to lay out before scrolling to it.
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [keyboardHeight]);
  const handleRemarksFocus = useCallback((): void => {
    isRemarksFocused.current = true;
    if (Keyboard.isVisible()) scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  const attachmentCount = evidence.attachments.length;
  const evidenceLabel = attachmentCount > 0 ? "Photo / Video / Voice note (" + attachmentCount + ")" : "Photo / Video / Voice note";

  return (
    <ScreenContainer>
      <DetailHeader onBack={handleBack} title="Parameter" />
      {assessment && parameter && draft ? (
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.large, paddingBottom: insets.bottom + SPACING.section + keyboardHeight }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <AssessmentSummaryCard
            assessmentNo={assessment.assessmentNo}
            details={getRequestDetails(assessment)}
            mainParameter={parameter.group}
            parameterCode={parameter.code}
            status={parameter.status}
            subParameter={parameter.title}
            toBeCompletedBy={assessment.toBeCompletedBy}
          />
          <ParameterForm draft={draft} onChange={handleChange} onRemarksFocus={handleRemarksFocus} parameter={parameter} ratingError={ratingError} />
          <SecondaryButton iconName="paperclip" label={evidenceLabel} onPress={evidence.openEvidence} />
          {parameter.documentUrls.length > 0 ? (
            <Text style={styles.existing}>{parameter.documentUrls.length} file(s) already attached to this parameter.</Text>
          ) : null}
        </ScrollView>
      ) : (
        <View style={styles.state}>
          <AsyncStateView
            emptyMessage="This parameter is unavailable."
            message={viewState.status === "error" ? viewState.message : undefined}
            onRetry={reload}
            status={viewState.status === "success" && !parameter ? "empty" : viewState.status === "success" ? "loading" : viewState.status}
            variant="detail"
          />
        </View>
      )}
      {assessment && parameter && draft ? (
        <View style={styles.footer}>
          {evidence.preparation ? <Text accessibilityLiveRegion="polite" style={styles.footerStatus}>Preparing evidence…</Text> : null}
          <PrimaryButton isDisabled={Boolean(evidence.preparation) || evidence.isRecording} iconName="check" label="Apply" onPress={handleApply} />
        </View>
      ) : null}
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
  state: { flex: 1, paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  card: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.large, borderWidth: StyleSheet.hairlineWidth, gap: SPACING.medium, padding: SPACING.large },
  existing: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption },
  footer: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: StyleSheet.hairlineWidth, padding: SCREEN_HORIZONTAL_PADDING },
  footerStatus: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, marginBottom: SPACING.small, textAlign: "center" },
  sheet: { gap: SPACING.large, padding: SCREEN_HORIZONTAL_PADDING },
});
