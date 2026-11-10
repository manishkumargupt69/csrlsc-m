import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { assessmentRepository } from "@/src/features/assessments/data/assessment.repository";
import type {
  AssessmentDetail,
  AssessmentParameter,
  AuditDraft,
  ParameterAnswerInput,
} from "@/src/features/assessments/domain/assessment.types";
import { MAX_RATING, MIN_RATING } from "@/src/features/assessments/domain/assessment.types";
import {
  ASSESSMENT_COUNTS_QUERY_KEY,
  ASSESSMENT_DETAIL_QUERY_KEY,
  ASSESSMENTS_QUERY_KEY,
} from "@/src/features/assessments/hooks/use-assessments";
import { EMPTY_DRAFTS, useAuditDraftStore } from "@/src/features/assessments/state/audit-draft-store";
import { useAuthStore } from "@/src/features/auth/state/auth-store";

const isRatingValid = (rating: number | null): boolean =>
  rating === null || (Number.isInteger(rating) && rating >= MIN_RATING && rating <= MAX_RATING);

/** One shared empty list keeps attachment state stable across re-renders. */
const NO_ATTACHMENTS: AuditDraft["attachments"] = [];

export const getInitialDraft = (parameter: AssessmentParameter): AuditDraft => ({
  answer: parameter.answer,
  rating: parameter.rating,
  remarks: parameter.remarks,
  attachments: NO_ATTACHMENTS,
});

/**
 * Collects the auditor's edits locally and submits only the parameters that
 * were touched, so a long assessment can be completed over several visits.
 */
export const useAssessmentAudit = (assessment: AssessmentDetail | null) => {
  const session = useAuthStore((state) => state.session);
  const queryClient = useQueryClient();
  const assessmentId = assessment?.id ?? "";
  const drafts = useAuditDraftStore((state) => state.drafts[assessmentId] ?? EMPTY_DRAFTS);
  const storeSetDraft = useAuditDraftStore((state) => state.setDraft);
  const clearDrafts = useAuditDraftStore((state) => state.clear);

  const setDraft = useCallback((parameterId: string, draft: AuditDraft): void => {
    storeSetDraft(assessmentId, parameterId, draft);
  }, [assessmentId, storeSetDraft]);

  const parametersById = useMemo(
    () => new Map((assessment?.parameters ?? []).map((parameter) => [parameter.id, parameter])),
    [assessment],
  );

  const mutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!session || !assessment) throw new Error("Your session has expired. Sign in again.");
      const answers: ParameterAnswerInput[] = Object.entries(drafts).flatMap(([parameterId, draft]) => {
        const parameter = parametersById.get(parameterId);
        if (!parameter) return [];
        if (parameter.mandatory && draft.rating === null) {
          throw new Error("Rating is required for mandatory parameter " + (parameter.code || parameter.title) + ".");
        }
        if (!isRatingValid(draft.rating)) {
          throw new Error("Ratings must be whole numbers from " + MIN_RATING + " to " + MAX_RATING + ".");
        }
        return [{
          parameterId,
          question: parameter.question || parameter.title,
          answer: draft.answer.trim(),
          rating: draft.rating,
          remarks: draft.remarks.trim(),
          existingDocument: parameter.documentUrls[0] ?? null,
          attachments: draft.attachments,
        }];
      });
      if (answers.length === 0) throw new Error("Rate at least one parameter before saving.");
      await assessmentRepository.saveAudit(session, assessment.id, answers);
    },
    onSuccess: async () => {
      clearDrafts(assessmentId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [ASSESSMENTS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [ASSESSMENT_DETAIL_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [ASSESSMENT_COUNTS_QUERY_KEY] }),
      ]);
    },
  });

  const save = useCallback(async (): Promise<void> => mutation.mutateAsync(), [mutation]);
  const discard = useCallback((): void => clearDrafts(assessmentId), [assessmentId, clearDrafts]);

  return {
    drafts,
    touchedCount: Object.keys(drafts).length,
    isSaving: mutation.isPending,
    setDraft,
    save,
    discard,
  };
};
