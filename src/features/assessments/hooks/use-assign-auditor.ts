import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { assessmentRepository } from "@/src/features/assessments/data/assessment.repository";
import type { AssessmentListItem } from "@/src/features/assessments/domain/assessment.types";
import {
  ASSESSMENT_COUNTS_QUERY_KEY,
  ASSESSMENT_DETAIL_QUERY_KEY,
  ASSESSMENTS_QUERY_KEY,
} from "@/src/features/assessments/hooks/use-assessments";
import { useAuditors } from "@/src/features/assessments/hooks/use-lookups";
import { useAuthStore } from "@/src/features/auth/state/auth-store";

const EMPTY_SELECTION: readonly string[] = [];

export const useAssignAuditor = () => {
  const session = useAuthStore((state) => state.session);
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<AssessmentListItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>(EMPTY_SELECTION);
  const [remarks, setRemarks] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const auditors = useAuditors(target !== null);

  const mutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!session || !target) throw new Error("Your session has expired. Sign in again.");
      await assessmentRepository.assignAuditors(session, target.id, selectedIds, remarks.trim());
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [ASSESSMENTS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [ASSESSMENT_DETAIL_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [ASSESSMENT_COUNTS_QUERY_KEY] }),
      ]);
    },
  });

  const open = useCallback((item: AssessmentListItem): void => {
    setTarget(item);
    setSelectedIds(item.auditorIds);
    setRemarks("");
    setValidationMessage(null);
  }, []);
  const close = useCallback((): void => setTarget(null), []);
  const toggleAuditor = useCallback((id: string): void => {
    setValidationMessage(null);
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }, []);
  const submit = useCallback(async (): Promise<boolean> => {
    if (selectedIds.length === 0) {
      setValidationMessage("Select at least one auditor.");
      return false;
    }
    await mutation.mutateAsync();
    setTarget(null);
    return true;
  }, [mutation, selectedIds.length]);

  return {
    target,
    isVisible: target !== null,
    auditors,
    selectedIds,
    remarks,
    validationMessage,
    isSubmitting: mutation.isPending,
    open,
    close,
    toggleAuditor,
    setRemarks,
    submit,
  };
};
