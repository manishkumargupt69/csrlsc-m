import type { EvidenceAttachment } from "@/src/types/evidence";

export type AssessmentStatus = "Pending" | "Assigned" | "In Progress" | "Completed";

export const ASSESSMENT_STATUSES: readonly AssessmentStatus[] = ["Pending", "Assigned", "In Progress", "Completed"];

/** Parameters are either waiting for an auditor or already rated. */
export const PARAMETER_AUDITED = "Audited";

export const MIN_RATING = 1;
export const MAX_RATING = 10;

export interface AuditorSummary {
  id: string;
  name: string;
}

export interface AssessmentListItem {
  id: string;
  assessmentNo: string;
  /** The company that demanded the assessment ("Demanded By"). */
  requestedBy: string;
  /** The company being assessed ("Assessment Of"). */
  requestFor: string;
  /** Distinct Parameter Types of the request's parameters, in the order the API lists them. */
  parameterTypes: readonly string[];
  /** The branch or location of the request, e.g. "Gurgaon (GGN)"; shown as "Location" on the web. */
  location: string;
  /** Product / material name; shown as "Product" on the web. */
  product: string;
  remarks: string;
  /** Names of the assigned auditors, empty when unassigned. */
  assignedTo: string;
  auditorIds: readonly string[];
  service: string;
  subService: string;
  domain: string;
  status: string;
  toBeCompletedBy: string;
  totalParameters: number;
  auditedParameters: number;
  /** Audited parameters as a whole-number percentage of all parameters. */
  completionPercent: number;
}

export type ResponseKind = "descriptive" | "single" | "multiple";

export interface AssessmentParameter {
  id: string;
  code: string;
  /** Short title of the parameter (the sub-parameter text). */
  title: string;
  question: string;
  hint: string;
  mandatory: boolean;
  /** Main parameter name; used to group parameters on the assess screen. */
  group: string;
  /** Parameter Type of the parameter (quick code "ParameterType"). */
  parameterType: string;
  /** Overall Grouping of the parameter, e.g. "Global Compliance Standards and Mandates". */
  overallGrouping: string;
  responseKind: ResponseKind;
  options: readonly string[];
  status: string;
  rating: number | null;
  answer: string;
  remarks: string;
  documentUrls: readonly string[];
}

export interface AssessmentDetail extends AssessmentListItem {
  geoType: string;
  geoName: string;
  materialGroup: string;
  auditors: readonly AuditorSummary[];
  parameters: readonly AssessmentParameter[];
}

export interface AssessmentListQuery {
  status?: AssessmentStatus;
  /** Restrict the list to requests this user is assigned to audit. */
  assignedToUserId?: string;
  /** Requests that contain a parameter of this Parameter Type (quick code "ParameterType"). */
  parameterTypeId?: string;
  /** Requests that contain a parameter in this Overall Grouping (quick code "GroupType"). */
  overallGroupingId?: string;
}

/** Selected Parameter Type and Overall Grouping filters; each holds the chosen option's id. */
export interface ParameterFilters {
  parameterTypeId?: string;
  overallGroupingId?: string;
}

export interface LookupOption {
  id: string;
  label: string;
  /** Value sent to the API when it differs from the id (e.g. Geo Name). */
  value?: string;
}

export interface AssessmentCreateInput {
  serviceId: string;
  subServiceId: string;
  domainId: string;
  demandedById: string;
  assesmentOfId: string;
  geoTypeId: string;
  geoName: string;
  materialGroupId: string | null;
  toBeCompletedBy: Date;
  /** Raw main-parameter rows, sent back to the API unchanged. */
  parameters: readonly unknown[];
}

export interface ParameterAnswerInput {
  parameterId: string;
  question: string;
  answer: string;
  rating: number | null;
  remarks: string;
  /** Existing document URL kept when no new file is attached. */
  existingDocument: string | null;
  attachments: readonly EvidenceAttachment[];
}

export interface AuditDraft {
  answer: string;
  rating: number | null;
  remarks: string;
  attachments: readonly EvidenceAttachment[];
}
