import type {
  AssessmentDetail,
  AssessmentListItem,
  AssessmentParameter,
  AuditorSummary,
  ResponseKind,
} from "@/src/features/assessments/domain/assessment.types";
import { PARAMETER_AUDITED } from "@/src/features/assessments/domain/assessment.types";
import { asNumberOrNull, asRecord, asString } from "@/src/utils/authenticated-request";

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** Options arrive as a JSON string on assessments and as an array on masters. */
export const parseStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch {
    // Not JSON: fall through to the comma-separated form.
  }
  return value.includes(",") ? value.split(",").map((item) => item.trim()).filter(Boolean) : [value.trim()];
};

const getResponseKind = (responseType: string): ResponseKind => {
  const normalized = responseType.toLocaleLowerCase();
  if (normalized.includes("choice") && normalized.includes("single")) return "single";
  if (normalized.includes("choice") && normalized.includes("multiple")) return "multiple";
  return "descriptive";
};

const getAuditors = (raw: Record<string, unknown>): AuditorSummary[] =>
  asArray(raw.auditors).flatMap((entry) => {
    const record = asRecord(entry);
    const id = asString(record.auditorId);
    if (!id) return [];
    return [{ id, name: asString(asRecord(record.auditor).nameCode) || "Auditor" }];
  });

export const mapParameter = (rawParameter: unknown): AssessmentParameter => {
  const raw = asRecord(rawParameter);
  const options = parseStringList(raw.responseOptions);
  const documentUrls = [
    ...asArray(raw.documentUrls).filter((item): item is string => typeof item === "string"),
    ...(typeof raw.document === "string" && raw.document ? [raw.document] : []),
  ];
  return {
    id: asString(raw.id),
    code: asString(raw.parameterCode),
    title: asString(raw.subParameter),
    question: asString(raw.questions) || asString(raw.parameterAssessment),
    hint: asString(raw.hintForParameter),
    mandatory: raw.mandatory === true,
    group: asString(asRecord(raw.mainParameter).codeValue) || "General",
    subGroup: asString(asRecord(raw.parameterType).codeValue),
    responseKind: getResponseKind(asString(asRecord(raw.responseType).codeValue)),
    options,
    status: asString(raw.status) || "Pending",
    rating: asNumberOrNull(raw.rating),
    answer: asString(raw.answer),
    remarks: asString(raw.remarks),
    documentUrls: [...new Set(documentUrls)],
  };
};

export const mapListItem = (rawItem: unknown): AssessmentListItem => {
  const raw = asRecord(rawItem);
  const parameters = asArray(raw.parameters).map(asRecord);
  const auditedParameters = parameters.filter((parameter) => parameter.status === PARAMETER_AUDITED).length;
  const auditors = getAuditors(raw);
  return {
    id: asString(raw.id),
    assessmentNo: asString(raw.assessmentNo),
    requestedBy: asString(asRecord(raw.demandedBy).companyName),
    requestFor: asString(asRecord(raw.assesmentOf).companyName),
    assignedTo: auditors.map((auditor) => auditor.name).join(", "),
    auditorIds: auditors.map((auditor) => auditor.id),
    service: asString(asRecord(raw.service).nameCode),
    subService: asString(asRecord(raw.subService).name),
    domain: asString(asRecord(raw.domain).codeValue),
    status: asString(raw.status) || "Pending",
    toBeCompletedBy: asString(raw.toBeCompletedBy),
    totalParameters: parameters.length,
    auditedParameters,
    completionPercent: parameters.length > 0 ? Math.round((auditedParameters / parameters.length) * 100) : 0,
  };
};

export const mapDetail = (rawItem: unknown): AssessmentDetail => {
  const raw = asRecord(rawItem);
  const parameters = asArray(raw.parameters).map(mapParameter);
  const audited = parameters.filter((parameter) => parameter.status === PARAMETER_AUDITED).length;
  const base = mapListItem({ ...raw, parameters: asArray(raw.parameters) });
  return {
    ...base,
    auditedParameters: audited,
    totalParameters: parameters.length,
    completionPercent: parameters.length > 0 ? Math.round((audited / parameters.length) * 100) : 0,
    geoType: asString(asRecord(raw.geoType).codeValue),
    geoName: asString(raw.geoName),
    materialGroup: asString(asRecord(raw.materialGroup).codeValue),
    remarks: asString(raw.remarks),
    auditors: getAuditors(raw),
    parameters,
  };
};

export interface ParameterGroup {
  group: string;
  parameters: AssessmentParameter[];
}

/** Groups parameters by main parameter, keeping the order the API returned them in. */
export const groupParameters = (parameters: readonly AssessmentParameter[]): ParameterGroup[] => {
  const groups = new Map<string, AssessmentParameter[]>();
  for (const parameter of parameters) {
    const existing = groups.get(parameter.group);
    if (existing) existing.push(parameter);
    else groups.set(parameter.group, [parameter]);
  }
  return Array.from(groups, ([group, items]) => ({ group, parameters: items }));
};
