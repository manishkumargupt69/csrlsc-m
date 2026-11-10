export type EvidenceKind = "document" | "photo" | "video" | "audio";

export interface CapturedEvidence {
  kind: "photo" | "video";
  name: string;
  uri: string;
  mimeType: string;
}

export interface EvidenceAttachment {
  id: string;
  kind: EvidenceKind;
  name: string;
  uri: string;
  mimeType: string;
  sizeBytes?: number;
  durationMilliseconds?: number;
  capturedAt?: string;
}

const EVIDENCE_KINDS: readonly EvidenceKind[] = [
  "document",
  "photo",
  "video",
  "audio",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isEvidenceKind = (value: unknown): value is EvidenceKind =>
  typeof value === "string" && EVIDENCE_KINDS.includes(value as EvidenceKind);

const isOptionalNumber = (value: unknown): boolean =>
  value === undefined || typeof value === "number";
const isOptionalString = (value: unknown): boolean =>
  value === undefined || typeof value === "string";

export const isEvidenceAttachment = (
  value: unknown,
): value is EvidenceAttachment =>
  isRecord(value) &&
  typeof value.id === "string" &&
  isEvidenceKind(value.kind) &&
  typeof value.name === "string" &&
  typeof value.uri === "string" &&
  typeof value.mimeType === "string" &&
  isOptionalNumber(value.sizeBytes) &&
  isOptionalNumber(value.durationMilliseconds) &&
  isOptionalString(value.capturedAt);
