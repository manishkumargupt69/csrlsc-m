import { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager, Platform } from "react-native";

import { useEvidenceAttachments } from "@/src/features/evidence/hooks/use-evidence-attachments";
import { useVoiceNoteRecorder } from "@/src/features/evidence/hooks/use-voice-note-recorder";
import type { CapturedEvidence, EvidenceAttachment } from "@/src/types/evidence";

interface EvidenceCaptureOptions {
  initialAttachments?: readonly EvidenceAttachment[];
}

/**
 * Everything a form needs to collect evidence: the attachment list, the
 * evidence sheet, the camera modal hand-off and voice-note recording.
 * Pair it with MediaAttachmentTray and EvidenceCameraModal.
 */
export const useEvidenceCapture = ({ initialAttachments }: EvidenceCaptureOptions = {}) => {
  const [isEvidenceVisible, setIsEvidenceVisible] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const pendingPicker = useRef<(() => Promise<void>) | null>(null);
  const pendingCapture = useRef<CapturedEvidence | null>(null);
  const isReturningFromCamera = useRef(false);
  const openEvidence = useCallback((): void => setIsEvidenceVisible(true), []);
  const closeEvidence = useCallback((): void => setIsEvidenceVisible(false), []);
  const evidence = useEvidenceAttachments({
    initialAttachments,
    onPickerFinished: openEvidence,
    mediaStamp: "address-date",
  });
  const recorder = useVoiceNoteRecorder();
  const { addCapturedMedia, addDocument, addMediaFromGallery, addVoiceNote } = evidence;
  const { isRecording, start: startRecording, stop: stopRecording } = recorder;

  const startPicker = useCallback((picker: () => Promise<void>): void => {
    pendingPicker.current = picker;
    setIsEvidenceVisible(false);
  }, []);
  const handleEvidenceDismiss = useCallback((): void => {
    const picker = pendingPicker.current;
    pendingPicker.current = null;
    if (picker) void picker();
  }, []);
  const chooseCamera = useCallback((): void => startPicker(async () => {
    isReturningFromCamera.current = true;
    setIsCameraVisible(true);
  }), [startPicker]);
  const chooseGallery = useCallback((): void => startPicker(addMediaFromGallery), [addMediaFromGallery, startPicker]);
  const chooseFile = useCallback((): void => startPicker(addDocument), [addDocument, startPicker]);
  const closeCamera = useCallback((): void => setIsCameraVisible(false), []);
  const handleCameraCaptured = useCallback((captured: CapturedEvidence): void => {
    pendingCapture.current = captured;
    setIsCameraVisible(false);
  }, []);
  const handleCameraDismiss = useCallback((): void => {
    if (!isReturningFromCamera.current) return;
    isReturningFromCamera.current = false;
    const captured = pendingCapture.current;
    pendingCapture.current = null;
    openEvidence();
    if (captured) void addCapturedMedia(captured);
  }, [addCapturedMedia, openEvidence]);
  const toggleVoiceNote = useCallback(async (): Promise<void> => {
    if (isRecording) {
      const recording = await stopRecording();
      if (recording) await addVoiceNote(recording);
      return;
    }
    await startRecording();
  }, [addVoiceNote, isRecording, startRecording, stopRecording]);

  // Android does not always fire the modal onDismiss callbacks, so mirror them.
  useEffect(() => {
    if (Platform.OS !== "android" || isEvidenceVisible) return;
    const task = InteractionManager.runAfterInteractions(handleEvidenceDismiss);
    return () => task.cancel();
  }, [handleEvidenceDismiss, isEvidenceVisible]);
  useEffect(() => {
    if (Platform.OS !== "android" || isCameraVisible) return;
    const task = InteractionManager.runAfterInteractions(handleCameraDismiss);
    return () => task.cancel();
  }, [handleCameraDismiss, isCameraVisible]);

  return {
    attachments: evidence.attachments,
    preparation: evidence.preparation,
    removeAttachment: evidence.removeAttachment,
    clearAttachments: evidence.clearAttachments,
    isRecording,
    recordingMilliseconds: recorder.durationMilliseconds,
    toggleVoiceNote,
    isEvidenceVisible,
    isCameraVisible,
    openEvidence,
    closeEvidence,
    chooseCamera,
    chooseGallery,
    chooseFile,
    closeCamera,
    handleEvidenceDismiss,
    handleCameraDismiss,
    handleCameraCaptured,
  };
};
