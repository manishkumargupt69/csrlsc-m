import { create } from "zustand";

import type { AuditDraft } from "@/src/features/assessments/domain/assessment.types";

type ParameterDrafts = Readonly<Record<string, AuditDraft>>;

interface AuditDraftState {
  /** Unsaved audit edits, keyed by assessment id then parameter id. */
  drafts: Readonly<Record<string, ParameterDrafts>>;
  setDraft: (assessmentId: string, parameterId: string, draft: AuditDraft) => void;
  clear: (assessmentId: string) => void;
  /** Drops every draft, e.g. when the signed-in user changes. */
  reset: () => void;
}

export const EMPTY_DRAFTS: ParameterDrafts = {};

export const useAuditDraftStore = create<AuditDraftState>((set) => ({
  drafts: {},
  setDraft: (assessmentId, parameterId, draft): void =>
    set((state) => ({
      drafts: {
        ...state.drafts,
        [assessmentId]: { ...(state.drafts[assessmentId] ?? EMPTY_DRAFTS), [parameterId]: draft },
      },
    })),
  clear: (assessmentId): void =>
    set((state) => {
      const { [assessmentId]: _removed, ...rest } = state.drafts;
      return { drafts: rest };
    }),
  reset: (): void => set({ drafts: {} }),
}));
