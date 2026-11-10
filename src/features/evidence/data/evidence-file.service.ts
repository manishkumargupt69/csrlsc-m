import { Directory, File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";
import {
  Audio as AudioCompressor,
  Image as ImageCompressor,
  Video as VideoCompressor,
} from "react-native-compressor";

import {
  deleteStampedEvidenceFile,
  getEvidenceAddressLines,
  stampEvidenceMedia,
} from "@/src/features/evidence/data/evidence-stamp.service";
import type {
  EvidenceAttachment,
  EvidenceKind,
} from "@/src/types/evidence";

const EVIDENCE_DIRECTORY_NAME = "csrlsc-evidence";
const BYTES_PER_MEBIBYTE = 1024 * 1024;
const MULTIPART_OVERHEAD_RESERVE_BYTES = 256 * 1024;
const COMPRESSION_PROGRESS_SHARE = 0.6;
export const MAX_EVIDENCE_CONTENT_BYTES =
  10 * BYTES_PER_MEBIBYTE - MULTIPART_OVERHEAD_RESERVE_BYTES;

interface CreateEvidenceAttachmentOptions {
  sourceUri: string;
  name: string;
  kind: EvidenceKind;
  mimeType: string;
  durationMilliseconds?: number;
  stampCapturedAt?: string;
  maximumSizeBytes: number;
  onProgress?: (progress: number) => void;
}

const getEvidenceDirectory = (): Directory => {
  const directory = new Directory(Paths.document, EVIDENCE_DIRECTORY_NAME);
  if (!directory.exists) {
    directory.create({ idempotent: true, intermediates: true });
  }
  return directory;
};

const sanitizeFileName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]/g, "-");

const getCompressedSourceUri = async ({
  kind,
  sourceUri,
  onProgress,
}: {
  kind: EvidenceKind;
  sourceUri: string;
  onProgress?: (progress: number) => void;
}): Promise<string> => {
  if (kind === "photo") {
    return ImageCompressor.compress(sourceUri, {
      compressionMethod: "auto",
      output: "jpg",
    });
  }
  if (kind === "video") {
    return VideoCompressor.compress(sourceUri, {
      compressionMethod: "auto",
      minimumFileSizeForCompress: 0,
    }, onProgress);
  }
  if (kind === "audio") {
    return AudioCompressor.compress(sourceUri, { quality: "medium" });
  }
  throw new Error(
    "This file is too large. Documents must be smaller than 10 MB.",
  );
};

const getFileSize = (uri: string): number => {
  const sizeBytes = new File(uri).size;
  if (sizeBytes === null) {
    throw new Error("The selected file size could not be verified.");
  }
  return sizeBytes;
};

const getUploadSourceUri = async ({
  kind,
  sourceUri,
  maximumSizeBytes,
  onProgress,
}: {
  kind: EvidenceKind;
  sourceUri: string;
  maximumSizeBytes: number;
  onProgress?: (progress: number) => void;
}): Promise<string> => {
  if (kind === "document" && getFileSize(sourceUri) <= maximumSizeBytes) {
    return sourceUri;
  }
  return getCompressedSourceUri({ kind, sourceUri, onProgress });
};

export const createEvidenceAttachment = async ({
  sourceUri,
  name,
  kind,
  mimeType,
  durationMilliseconds,
  stampCapturedAt,
  maximumSizeBytes,
  onProgress,
}: CreateEvidenceAttachmentOptions): Promise<EvidenceAttachment> => {
  if (maximumSizeBytes <= 0) {
    throw new Error(
      "Attachments must stay below 10 MB in total. Remove an attachment first.",
    );
  }

  const shouldStampMedia = Boolean(stampCapturedAt && (kind === "photo" || kind === "video"));
  const addressLines = shouldStampMedia ? await getEvidenceAddressLines() : null;
  const compressedSourceUri = await getUploadSourceUri({
    kind,
    sourceUri,
    maximumSizeBytes,
    onProgress: stampCapturedAt
      ? (progress) => onProgress?.(progress * COMPRESSION_PROGRESS_SHARE)
      : onProgress,
  });
  let stampedSourceUri: string | null = null;
  try {
    if (stampCapturedAt && addressLines && (kind === "photo" || kind === "video")) {
      onProgress?.(COMPRESSION_PROGRESS_SHARE);
      stampedSourceUri = await stampEvidenceMedia({
        kind,
        sourceUri: compressedSourceUri,
        capturedAt: stampCapturedAt,
        addressLines,
        onProgress: (progress) => onProgress?.(
          COMPRESSION_PROGRESS_SHARE + progress * (1 - COMPRESSION_PROGRESS_SHARE)
        ),
      });
    }
    const uploadSourceUri = stampedSourceUri ?? compressedSourceUri;
    const sizeBytes = getFileSize(uploadSourceUri);
    if (sizeBytes > maximumSizeBytes) {
      throw new Error(
        "The processed file is too large. Choose a shorter or smaller file.",
      );
    }

    const finalName = stampedSourceUri
      ? `${name.replace(/\.[^.]+$/, "")}.${kind === "photo" ? "jpg" : "mp4"}`
      : name;
    const id = Crypto.randomUUID();
    const destination = new File(
      getEvidenceDirectory(),
      `${id}-${sanitizeFileName(finalName)}`,
    );
    new File(uploadSourceUri).copy(destination);

    return {
      id,
      kind,
      capturedAt: stampCapturedAt ?? new Date().toISOString(),
      name: finalName,
      uri: destination.uri,
      mimeType: stampedSourceUri ? kind === "photo" ? "image/jpeg" : "video/mp4" : mimeType,
      sizeBytes,
      durationMilliseconds,
    };
  } finally {
    if (stampedSourceUri) {
      try {
        await deleteStampedEvidenceFile(stampedSourceUri);
      } catch (error: unknown) {
        console.warn("Could not remove temporary stamped evidence.", error);
      }
    }
  }
};
