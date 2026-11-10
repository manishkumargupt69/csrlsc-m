import type { AuthSession } from "@/src/features/auth/domain/auth.types";
import { mapDetail, mapListItem } from "@/src/features/assessments/data/assessment.mappers";
import type {
  AssessmentCreateInput,
  AssessmentDetail,
  AssessmentListItem,
  AssessmentListQuery,
  ParameterAnswerInput,
} from "@/src/features/assessments/domain/assessment.types";
import { appendFormDataFile } from "@/src/utils/append-form-data-file";
import type { Page } from "@/src/utils/authenticated-request";
import {
  asRecord,
  asString,
  readData,
  readPage,
  requestJson,
  requestMultipart,
} from "@/src/utils/authenticated-request";

const PAGE_SIZE = 20;
const PERFORMANCE_PAGE_SIZE = 100;
const MAX_PERFORMANCE_PAGES = 10;
const AUDIT_DOCUMENT_TYPE = "AuditDocument";

const LIST_INCLUDE = {
  service: { select: { id: true, nameCode: true } },
  subService: { select: { id: true, name: true } },
  demandedBy: { select: { id: true, companyName: true } },
  assesmentOf: { select: { id: true, companyName: true } },
  domain: { select: { id: true, codeValue: true } },
  auditors: { include: { auditor: { select: { id: true, nameCode: true } } } },
  parameters: { select: { id: true, status: true } },
} as const;

const DETAIL_INCLUDE = {
  materialGroup: { select: { id: true, codeValue: true } },
  service: { select: { id: true, nameCode: true } },
  subService: { select: { id: true, name: true } },
  demandedBy: { select: { id: true, companyName: true } },
  assesmentOf: { select: { id: true, companyName: true } },
  domain: { select: { id: true, codeValue: true } },
  geoType: { select: { id: true, codeValue: true } },
  auditors: { include: { auditor: { select: { id: true, nameCode: true } } } },
  parameters: {
    include: {
      mainParameter: { select: { codeValue: true } },
      parameterType: { select: { codeValue: true } },
      responseType: { select: { codeValue: true } },
    },
  },
} as const;

interface AuditParameterPayload {
  id: string;
  question: string;
  answer: string | null;
  rating: number | null;
  ratingRemarks: string | null;
  document: string | null;
}

const toAuditPayload = (answer: ParameterAnswerInput): AuditParameterPayload => ({
  id: answer.parameterId,
  question: answer.question,
  answer: answer.answer || null,
  rating: answer.rating,
  ratingRemarks: answer.remarks || null,
  document: answer.existingDocument,
});

/** Mirrors the web client: parameters travel in "data" and each file carries its metadata. */
const buildAuditFormData = (answers: readonly ParameterAnswerInput[]): FormData => {
  const parameters = answers.map(toAuditPayload);
  const formData = new FormData();
  formData.append("data", JSON.stringify({ parameters }));
  formData.append("parameters", JSON.stringify(parameters));
  for (const answer of answers) {
    for (const attachment of answer.attachments) {
      const uniqueFileName = attachment.id + "_" + attachment.name;
      appendFormDataFile({
        formData,
        fieldName: "files",
        file: { uri: attachment.uri, name: uniqueFileName, type: attachment.mimeType, sizeBytes: attachment.sizeBytes },
      });
      formData.append("filesMeta", JSON.stringify({
        id: attachment.id,
        uniqueId: attachment.id,
        parameterId: answer.parameterId,
        name: uniqueFileName,
        size: attachment.sizeBytes ?? 0,
        type: attachment.mimeType,
        documentType: AUDIT_DOCUMENT_TYPE,
      }));
    }
  }
  return formData;
};

/** Ratings given on one completed request, tagged with the company that was assessed. */
export interface CompanyRating {
  companyId: string;
  companyName: string;
  ratings: number[];
}

/** Parameter counts for one request. */
export interface RequestProgress {
  total: number;
  audited: number;
}

export class AssessmentRepository {
  async list(
    session: AuthSession,
    query: AssessmentListQuery,
    page: number,
  ): Promise<Page<AssessmentListItem>> {
    const filters: Record<string, unknown> = {};
    if (query.status) filters.status = query.status;
    // The auditors join table is the source of truth; the legacy auditorId column is not.
    if (query.assignedToUserId) filters["auditors.auditorId"] = query.assignedToUserId;
    const body = await requestJson(session, "POST", "/assessment/search-assessment", {
      page,
      limit: PAGE_SIZE,
      sortBy: "createdAt",
      sortOrder: "desc",
      filters,
      include: LIST_INCLUDE,
    }, "Assessment requests could not be loaded.");
    return readPage(body, mapListItem);
  }

  /** Counts requests without downloading them (a one-row page carries the total). */
  async count(
    session: AuthSession,
    scope: { status?: string; assignedToUserId?: string },
  ): Promise<number> {
    const filters: Record<string, unknown> = {};
    if (scope.status) filters.status = scope.status;
    if (scope.assignedToUserId) filters["auditors.auditorId"] = scope.assignedToUserId;
    const body = await requestJson(session, "POST", "/assessment/search-assessment", {
      page: 1,
      limit: 1,
      filters,
    }, "Assessment totals could not be loaded.");
    return readPage(body, mapListItem).totalRecords;
  }

  /** Parameter totals for every request in scope, used by the Assess progress overview. */
  async progressCounts(
    session: AuthSession,
    scope: { assignedToUserId?: string },
  ): Promise<RequestProgress[]> {
    const filters: Record<string, unknown> = {};
    if (scope.assignedToUserId) filters["auditors.auditorId"] = scope.assignedToUserId;
    const requests: RequestProgress[] = [];
    for (let page = 1; page <= MAX_PERFORMANCE_PAGES; page += 1) {
      const body = await requestJson(session, "POST", "/assessment/search-assessment", {
        page,
        limit: PERFORMANCE_PAGE_SIZE,
        filters,
        include: { parameters: { select: { id: true, status: true } } },
      }, "Assessment progress could not be loaded.");
      const result = readPage(body, mapListItem);
      for (const item of result.items) {
        requests.push({ total: item.totalParameters, audited: item.auditedParameters });
      }
      if (page >= result.totalPages) break;
    }
    return requests;
  }

  /** Every rating given on completed requests, grouped later into a per-company score. */
  async completedRatings(
    session: AuthSession,
    scope: { assignedToUserId?: string },
  ): Promise<CompanyRating[]> {
    const filters: Record<string, unknown> = { status: "Completed" };
    if (scope.assignedToUserId) filters["auditors.auditorId"] = scope.assignedToUserId;
    const ratings: CompanyRating[] = [];
    for (let page = 1; page <= MAX_PERFORMANCE_PAGES; page += 1) {
      const body = await requestJson(session, "POST", "/assessment/search-assessment", {
        page,
        limit: PERFORMANCE_PAGE_SIZE,
        filters,
        include: {
          assesmentOf: { select: { id: true, companyName: true } },
          parameters: { select: { id: true, rating: true } },
        },
      }, "Performance data could not be loaded.");
      const result = readPage(body, (raw) => raw);
      for (const raw of result.items) {
        const record = asRecord(raw);
        const company = asRecord(record.assesmentOf);
        const companyId = asString(company.id);
        if (!companyId) continue;
        const values = (Array.isArray(record.parameters) ? record.parameters : [])
          .map((parameter) => asRecord(parameter).rating)
          .filter((value): value is number => typeof value === "number");
        ratings.push({ companyId, companyName: asString(company.companyName), ratings: values });
      }
      if (page >= result.totalPages) break;
    }
    return ratings;
  }

  async details(session: AuthSession, id: string): Promise<AssessmentDetail> {
    const body = await requestJson(
      session,
      "POST",
      "/assessment/details-assessment/" + encodeURIComponent(id),
      { include: DETAIL_INCLUDE },
      "The assessment could not be loaded.",
    );
    const data = readData(body);
    if (!data) throw new Error("The assessment could not be found.");
    return mapDetail(data);
  }

  async create(session: AuthSession, input: AssessmentCreateInput): Promise<string> {
    const body = await requestJson(session, "POST", "/assessment/add-assessment", {
      materialGroupId: input.materialGroupId,
      serviceId: input.serviceId,
      subServiceId: input.subServiceId,
      toBeCompletedBy: input.toBeCompletedBy.toISOString(),
      demandedById: input.demandedById,
      assesmentOfId: input.assesmentOfId,
      domainId: input.domainId,
      geoTypeId: input.geoTypeId,
      geoName: input.geoName,
      parameter: input.parameters,
    }, "The assessment request could not be created.");
    return asString(asRecord(readData(body)).assessmentNo);
  }

  async assignAuditors(
    session: AuthSession,
    id: string,
    auditorIds: readonly string[],
    remarks: string,
  ): Promise<void> {
    await requestJson(
      session,
      "PUT",
      "/assessment/assign-auditor/" + encodeURIComponent(id),
      { auditorIds, remarks },
      "The auditor could not be assigned.",
    );
  }

  async saveAudit(
    session: AuthSession,
    id: string,
    answers: readonly ParameterAnswerInput[],
  ): Promise<void> {
    const path = "/assessment/audit-parameters/" + encodeURIComponent(id);
    const fallback = "The audit could not be saved.";
    const hasFiles = answers.some((answer) => answer.attachments.length > 0);
    if (hasFiles) {
      await requestMultipart(session, "PUT", path, buildAuditFormData(answers), fallback);
      return;
    }
    await requestJson(session, "PUT", path, { parameters: answers.map(toAuditPayload) }, fallback);
  }
}

export const assessmentRepository = new AssessmentRepository();
