import { useCallback } from "react";
import type { ReactElement } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import SecondaryButton from "@/src/components/ui/SecondaryButton";
import EvidenceAttachmentList from "@/src/features/evidence/presentation/EvidenceAttachmentList";
import type { EvidencePreparationState } from "@/src/features/evidence/hooks/use-evidence-attachments";
import type { EvidenceAttachment } from "@/src/types/evidence";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import { runAfterKeyboardDismissed } from "@/src/utils/run-after-keyboard-dismissed";

interface MediaAttachmentTrayProps {
  title?: string;
  attachments: readonly EvidenceAttachment[];
  preparation?: EvidencePreparationState | null;
  supportsVideo?: boolean;
  onAddDocument?: () => void;
  onAddFromGallery?: () => void;
  onAddPhoto: () => void;
  onRemove: (id: string) => void;
  onToggleVoiceNote?: () => void;
  isRecording?: boolean;
  recordingMilliseconds?: number;
}

const formatRecordingTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  return Math.floor(totalSeconds / 60) + ":" + String(totalSeconds % 60).padStart(2, "0");
};

export default function MediaAttachmentTray({ title = "Evidence", attachments, preparation = null, supportsVideo = false, onAddDocument, onAddFromGallery, onAddPhoto, onRemove, onToggleVoiceNote, isRecording = false, recordingMilliseconds = 0 }: MediaAttachmentTrayProps): ReactElement {
  const baseText = supportsVideo ? "Attach photos, MP4 video, PDF, Word, or Excel files." : "Attach photos, PDF, Word, or Excel files.";
  const supportingText = onToggleVoiceNote ? baseText.replace("files.", "files, or record a voice note.") : baseText;
  const recordingLabel = "Stop " + formatRecordingTime(recordingMilliseconds);
  const handleAddDocument = useCallback((): void => { if (onAddDocument) runAfterKeyboardDismissed(onAddDocument); }, [onAddDocument]);
  const handleOpenCamera = useCallback((): void => runAfterKeyboardDismissed(onAddPhoto), [onAddPhoto]);
  const handleToggleVoiceNote = useCallback((): void => { if (onToggleVoiceNote) onToggleVoiceNote(); }, [onToggleVoiceNote]);
  const handleAddFromGallery = useCallback((): void => { if (onAddFromGallery) runAfterKeyboardDismissed(onAddFromGallery); }, [onAddFromGallery]);
  return <View style={styles.container}>
    <View><Text style={styles.title}>{title}</Text><Text style={styles.supportingText}>{supportingText}</Text></View>
    {attachments.length > 0 || !preparation ? <EvidenceAttachmentList attachments={attachments} onRemove={onRemove} /> : null}
    {preparation ? <View accessibilityLiveRegion="polite" style={styles.preparation}>
      <ActivityIndicator color={COLORS.accent} />
      <View style={styles.preparationCopy}>
        <Text numberOfLines={1} style={styles.preparationName}>{preparation.name}</Text>
        <Text style={styles.preparationStatus}>{preparation.progress === null ? "Preparing attachment…" : `Processing evidence: ${preparation.progress}%`}</Text>
      </View>
    </View> : null}
    {supportsVideo && attachments.length > 0 && !preparation ? <Text accessibilityLiveRegion="polite" style={styles.ready}>{attachments.length} {attachments.length === 1 ? "file" : "files"} ready to upload on submit</Text> : null}
    <View style={styles.actions}>
      <SecondaryButton iconName="camera" isDisabled={Boolean(preparation)} label="Camera" onPress={handleOpenCamera} style={styles.action} />
      {onAddFromGallery ? <SecondaryButton iconName="image" isDisabled={Boolean(preparation)} label="Gallery" onPress={handleAddFromGallery} style={styles.action} /> : null}
      {onToggleVoiceNote ? <SecondaryButton iconName={isRecording ? "square" : "mic"} isDisabled={Boolean(preparation)} isSelected={isRecording} label={isRecording ? recordingLabel : "Voice note"} onPress={handleToggleVoiceNote} style={styles.action} /> : null}
      {onAddDocument ? <SecondaryButton iconName="file-text" isDisabled={Boolean(preparation)} label="File" onPress={handleAddDocument} style={styles.action} /> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({ container: { gap: SPACING.medium }, title: { color: COLORS.ink, ...TYPOGRAPHY.control, fontWeight: "700" }, supportingText: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, marginTop: SPACING.extraSmall }, preparation: { alignItems: "center", backgroundColor: COLORS.accentSoft, borderRadius: RADII.medium, flexDirection: "row", gap: SPACING.medium, padding: SPACING.medium }, preparationCopy: { flex: 1, gap: SPACING.extraSmall }, preparationName: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "700" }, preparationStatus: { color: COLORS.accent, ...TYPOGRAPHY.caption }, ready: { color: COLORS.successInk, ...TYPOGRAPHY.caption, fontWeight: "700" }, actions: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.small }, action: { flexBasis: "48%", flexGrow: 1, paddingHorizontal: SPACING.medium } });
