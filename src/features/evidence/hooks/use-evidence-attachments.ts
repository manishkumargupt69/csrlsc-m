import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import {
  createEvidenceAttachment,
  MAX_EVIDENCE_CONTENT_BYTES,
} from "@/src/features/evidence/data/evidence-file.service";
import {
  getSupportedDocumentMimeType,
  SUPPORTED_DOCUMENT_MIME_TYPES,
} from "@/src/features/evidence/domain/evidence-upload-policy";
import type { CapturedEvidence, EvidenceAttachment, EvidenceKind } from "@/src/types/evidence";

const EMPTY_ATTACHMENTS: readonly EvidenceAttachment[] = [];

interface EvidenceAttachmentsOptions {
  initialAttachments?: readonly EvidenceAttachment[];
  onPickerFinished?: () => void;
  mediaStamp?: "address-date";
}

export interface EvidencePreparationState {
  name: string;
  progress: number | null;
}

interface EvidenceAttachmentsResult {
  attachments: readonly EvidenceAttachment[];
  preparation: EvidencePreparationState | null;
  addDocument: () => Promise<void>;
  addFromGallery: () => Promise<void>;
  addMediaFromGallery: () => Promise<void>;
  addPhoto: () => Promise<void>;
  addCapturedMedia: (evidence: CapturedEvidence) => Promise<void>;
  addVoiceNote: (recording: VoiceNoteRecording) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

export interface VoiceNoteRecording {
  uri: string;
  durationMilliseconds: number;
}

interface EvidenceSelection {
  kind: EvidenceKind;
  durationMilliseconds?: number;
  mimeType: string;
  name: string;
  sourceUri: string;
}

const showEvidenceError = (message: string): void => {
  Alert.alert("Evidence unavailable", message);
};

const getRemainingEvidenceBytes = (attachments: readonly EvidenceAttachment[]): number =>
  MAX_EVIDENCE_CONTENT_BYTES - attachments.reduce(
    (totalBytes, attachment) => totalBytes + (attachment.sizeBytes ?? 0),
    0,
  );

const getEvidenceErrorMessage = ({ error, fallbackMessage }: { error: unknown; fallbackMessage: string }): string =>
  error instanceof Error ? error.message : fallbackMessage;

export const useEvidenceAttachments = ({
  initialAttachments = EMPTY_ATTACHMENTS,
  onPickerFinished,
  mediaStamp,
}: EvidenceAttachmentsOptions = {}): EvidenceAttachmentsResult => {
  const [attachments, setAttachments] = useState<readonly EvidenceAttachment[]>(initialAttachments);
  const [preparation, setPreparation] = useState<EvidencePreparationState | null>(null);
  const isPreparingRef = useRef(false);

  useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  const appendAttachment = useCallback((attachment: EvidenceAttachment): void => {
    setAttachments((currentAttachments) => [...currentAttachments, attachment]);
  }, []);

  const openPicker = useCallback(async <T,>(pick: () => Promise<T>): Promise<T> => {
    try {
      return await pick();
    } finally {
      onPickerFinished?.();
    }
  }, [onPickerFinished]);

  const prepareAttachment = useCallback(async (selection: EvidenceSelection): Promise<void> => {
    if (isPreparingRef.current) throw new Error("Wait for the current attachment to be ready.");
    isPreparingRef.current = true;
    setPreparation({ name: selection.name, progress: null });
    try {
      const attachment = await createEvidenceAttachment({
        ...selection,
        stampCapturedAt: mediaStamp && (selection.kind === "photo" || selection.kind === "video")
          ? new Date().toISOString()
          : undefined,
        maximumSizeBytes: getRemainingEvidenceBytes(attachments),
        onProgress: (progress) => {
          if (isPreparingRef.current) setPreparation({
            name: selection.name,
            progress: Math.min(100, Math.max(0, Math.round(progress * 100))),
          });
        },
      });
      appendAttachment(attachment);
    } finally {
      isPreparingRef.current = false;
      setPreparation(null);
    }
  }, [appendAttachment, attachments, mediaStamp]);

  const addDocument = useCallback(async (): Promise<void> => {
    try {
      const result = await openPicker(() => DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [...SUPPORTED_DOCUMENT_MIME_TYPES],
      }));
      if (result.canceled) return;

      const asset = result.assets[0];
      const mimeType = getSupportedDocumentMimeType(asset.name);
      if (!mimeType) {
        showEvidenceError("Only image, PDF, Word, and Excel files are allowed.");
        return;
      }
      await prepareAttachment({
        kind: "document",
        mimeType,
        name: asset.name,
        sourceUri: asset.uri,
      });
    } catch (error: unknown) {
      showEvidenceError(getEvidenceErrorMessage({ error, fallbackMessage: "The selected file could not be attached." }));
    }
  }, [openPicker, prepareAttachment]);

  const prepareMedia = useCallback(async (asset: ImagePicker.ImagePickerAsset): Promise<void> => {
    const isVideo = asset.type === "video" || asset.mimeType?.startsWith("video/");
    const originalName = asset.fileName ?? `${isVideo ? "video" : "photo"}-${Date.now()}.${isVideo ? "mp4" : "jpg"}`;
    await prepareAttachment({
      kind: isVideo ? "video" : "photo",
      mimeType: isVideo ? "video/mp4" : asset.mimeType ?? "image/jpeg",
      name: isVideo ? `${originalName.replace(/\.[^.]+$/, "")}.mp4` : originalName,
      sourceUri: asset.uri,
    });
  }, [prepareAttachment]);

  const addFromGallery = useCallback(async (): Promise<void> => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showEvidenceError("Allow media access to attach evidence.");
        return;
      }
      const result = await openPicker(() => ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ["images"],
        quality: 1,
      }));
      if (result.canceled) return;
      await prepareMedia(result.assets[0]);
    } catch (error: unknown) {
      showEvidenceError(getEvidenceErrorMessage({ error, fallbackMessage: "The selected photo could not be attached." }));
    }
  }, [openPicker, prepareMedia]);

  const addMediaFromGallery = useCallback(async (): Promise<void> => {
    try {
      const result = await openPicker(() => ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ["images", "videos"],
        quality: 1,
      }));
      if (result.canceled) return;
      await prepareMedia(result.assets[0]);
    } catch (error: unknown) {
      showEvidenceError(getEvidenceErrorMessage({ error, fallbackMessage: "The selected media could not be attached." }));
    }
  }, [openPicker, prepareMedia]);

  const addPhoto = useCallback(async (): Promise<void> => {
    try {
      const result = await openPicker(async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error("Allow camera access to capture evidence.");
        return ImagePicker.launchCameraAsync({
          allowsEditing: false,
          mediaTypes: ["images"],
          quality: 1,
        });
      });
      if (result.canceled) return;
      await prepareMedia(result.assets[0]);
    } catch (error: unknown) {
      showEvidenceError(getEvidenceErrorMessage({ error, fallbackMessage: "The photo could not be captured." }));
    }
  }, [openPicker, prepareMedia]);

  const addCapturedMedia = useCallback(async (evidence: CapturedEvidence): Promise<void> => {
    try {
      await prepareAttachment({
        kind: evidence.kind,
        mimeType: evidence.mimeType,
        name: evidence.name,
        sourceUri: evidence.uri,
      });
    } catch (error: unknown) {
      showEvidenceError(getEvidenceErrorMessage({ error, fallbackMessage: "The captured media could not be attached." }));
    }
  }, [prepareAttachment]);

  const addVoiceNote = useCallback(async (recording: VoiceNoteRecording): Promise<void> => {
    try {
      await prepareAttachment({
        kind: "audio",
        durationMilliseconds: recording.durationMilliseconds,
        mimeType: "audio/mp4",
        name: "voice-note-" + Date.now() + ".m4a",
        sourceUri: recording.uri,
      });
    } catch (error: unknown) {
      showEvidenceError(getEvidenceErrorMessage({ error, fallbackMessage: "The voice note could not be attached." }));
    }
  }, [prepareAttachment]);

  const removeAttachment = useCallback((id: string): void => {
    setAttachments((currentAttachments) => currentAttachments.filter((attachment) => attachment.id !== id));
  }, []);
  const clearAttachments = useCallback((): void => setAttachments([]), []);

  return { attachments, preparation, addDocument, addFromGallery, addMediaFromGallery, addPhoto, addCapturedMedia, addVoiceNote, removeAttachment, clearAttachments };
};
