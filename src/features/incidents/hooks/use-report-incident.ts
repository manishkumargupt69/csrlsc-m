import { useCallback, useReducer } from "react";

import { useEvidenceCapture } from "@/src/features/evidence/hooks/use-evidence-capture";
import { INCIDENT_TYPES } from "@/src/features/incidents/data/incident-options";
import type { IncidentOption } from "@/src/features/incidents/domain/incident.types";

interface ReportState {
  type: IncidentOption | null;
  subType: IncidentOption | null;
  description: string;
  remarks: string;
}

type ReportAction =
  | { type: "select-type"; value: IncidentOption }
  | { type: "select-subtype"; value: IncidentOption }
  | { type: "description"; value: string }
  | { type: "remarks"; value: string };

const INITIAL_STATE: ReportState = { type: null, subType: null, description: "", remarks: "" };

const reducer = (state: ReportState, action: ReportAction): ReportState => {
  switch (action.type) {
    case "select-type":
      return { ...state, type: action.value, subType: null };
    case "select-subtype":
      return { ...state, subType: action.value };
    case "description":
      return { ...state, description: action.value };
    default:
      return { ...state, remarks: action.value };
  }
};

export type ReportErrors = Partial<Record<"type" | "subType" | "description", string>>;

/**
 * Form state for the incident screen. The incident service does not exist yet, so nothing here is sent
 * or saved anywhere: the values live in memory while the screen is open and are gone when it closes.
 */
export const useReportIncident = () => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const evidence = useEvidenceCapture();
  const { attachments } = evidence;

  const subTypes = INCIDENT_TYPES.find((type) => type.id === state.type?.id)?.subTypes ?? [];
  const errors: ReportErrors = {};
  if (!state.type) errors.type = "Select an incident type.";
  if (!state.subType) errors.subType = "Select an incident sub type.";
  if (!state.description.trim()) errors.description = "Describe the incident.";

  const selectType = useCallback((value: IncidentOption): void => dispatch({ type: "select-type", value }), []);
  const selectSubType = useCallback((value: IncidentOption): void => dispatch({ type: "select-subtype", value }), []);
  const setDescription = useCallback((value: string): void => dispatch({ type: "description", value }), []);
  const setRemarks = useCallback((value: string): void => dispatch({ type: "remarks", value }), []);

  return {
    state,
    errors,
    types: INCIDENT_TYPES,
    subTypes,
    evidence,
    isDirty: Boolean(state.type || state.subType || state.description || state.remarks || attachments.length > 0 || evidence.preparation),
    selectType,
    selectSubType,
    setDescription,
    setRemarks,
  };
};
