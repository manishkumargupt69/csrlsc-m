import type { EvidenceAttachment } from "@/src/types/evidence";

const DOCUMENT_MIME_TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

export const SUPPORTED_DOCUMENT_EXTENSIONS = Object.keys(DOCUMENT_MIME_TYPES);
export const SUPPORTED_DOCUMENT_MIME_TYPES = Object.values(DOCUMENT_MIME_TYPES);

export const getSupportedDocumentMimeType = (name: string): string | null => {
  const extension = name.split(".").pop()?.toLowerCase();
  if (!extension || !Object.prototype.hasOwnProperty.call(DOCUMENT_MIME_TYPES, extension)) return null;
  return DOCUMENT_MIME_TYPES[extension as keyof typeof DOCUMENT_MIME_TYPES];
};

interface SupportedUploadFile {
  name: string;
  mimeType: string;
}

export const getSupportedUploadFile = (attachment: EvidenceAttachment): SupportedUploadFile | null => {
  if (attachment.kind === "photo") {
    if (!attachment.mimeType.startsWith("image/")) return null;
    return { name: `${attachment.name.replace(/\.[^.]+$/, "")}.jpg`, mimeType: "image/jpeg" };
  }
  if (attachment.kind === "video") {
    if (attachment.mimeType !== "video/mp4") return null;
    return { name: `${attachment.name.replace(/\.[^.]+$/, "")}.mp4`, mimeType: "video/mp4" };
  }
  if (attachment.kind !== "document") return null;
  const mimeType = getSupportedDocumentMimeType(attachment.name);
  if (!mimeType) return null;
  return {
    name: attachment.name,
    mimeType,
  };
};
