import { useCallback, useMemo, useReducer } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { assessmentRepository } from "@/src/features/assessments/data/assessment.repository";
import { isGeoTypeName, lookupRepository } from "@/src/features/assessments/data/lookup.repository";
import type { GeoTypeName } from "@/src/features/assessments/data/lookup.repository";
import type { LookupOption } from "@/src/features/assessments/domain/assessment.types";
import {
  ASSESSMENT_COUNTS_QUERY_KEY,
  ASSESSMENTS_QUERY_KEY,
} from "@/src/features/assessments/hooks/use-assessments";
import { useAuthStore } from "@/src/features/auth/state/auth-store";

export type CreateField =
  | "service"
  | "subService"
  | "domain"
  | "materialGroup"
  | "geoType"
  | "geoName"
  | "demandedBy"
  | "assessmentOf";

interface CreateState {
  service: LookupOption | null;
  subService: LookupOption | null;
  domain: LookupOption | null;
  materialGroup: LookupOption | null;
  geoType: LookupOption | null;
  geoName: LookupOption | null;
  demandedBy: LookupOption | null;
  assessmentOf: LookupOption | null;
  completeBy: Date | null;
}

type CreateAction =
  | { type: "select"; field: CreateField; option: LookupOption }
  | { type: "date"; value: Date };

const INITIAL_STATE: CreateState = {
  service: null,
  subService: null,
  domain: null,
  materialGroup: null,
  geoType: null,
  geoName: null,
  demandedBy: null,
  assessmentOf: null,
  completeBy: null,
};

const reducer = (state: CreateState, action: CreateAction): CreateState => {
  if (action.type === "date") return { ...state, completeBy: action.value };
  const next = { ...state, [action.field]: action.option };
  // Dependent fields are cleared when their parent changes.
  if (action.field === "service") next.subService = null;
  if (action.field === "geoType") next.geoName = null;
  return next;
};

export type CreateErrors = Partial<Record<CreateField | "completeBy" | "parameters", string>>;

const REQUIRED_MESSAGES: Readonly<Record<Exclude<CreateField, "materialGroup">, string>> = {
  service: "Select a service.",
  subService: "Select a sub service.",
  domain: "Select a domain.",
  geoType: "Select a location type.",
  geoName: "Select a location.",
  demandedBy: "Select who demanded the assessment.",
  assessmentOf: "Select the company to assess.",
};

/** The requirements allow future dates only, so the earliest choice is tomorrow. */
const startOfTomorrow = (): Date => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

export const getMinimumCompletionDate = startOfTomorrow;

const PARAMETERS_QUERY_KEY = "assessment-parameters";

export const useCreateAssessment = () => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const session = useAuthStore((store) => store.session);
  const queryClient = useQueryClient();

  const geoTypeName: GeoTypeName | null =
    state.geoType && isGeoTypeName(state.geoType.label) ? state.geoType.label : null;
  const serviceId = state.service?.id;
  const subServiceId = state.subService?.id;
  const domainId = state.domain?.id;
  const parameterFilters = useMemo(
    () => (serviceId && subServiceId && domainId ? { serviceId, subServiceId, domainId } : null),
    [serviceId, subServiceId, domainId],
  );

  const parametersQuery = useQuery({
    queryKey: [PARAMETERS_QUERY_KEY, parameterFilters?.serviceId, parameterFilters?.subServiceId, parameterFilters?.domainId],
    queryFn: () => {
      if (!session || !parameterFilters) throw new Error("Your session has expired. Sign in again.");
      return lookupRepository.parameters(session, parameterFilters);
    },
    enabled: Boolean(session && parameterFilters),
  });

  const mutation = useMutation({
    mutationFn: async (): Promise<string> => {
      if (!session) throw new Error("Your session has expired. Sign in again.");
      const { service, subService, domain, geoType, geoName, demandedBy, assessmentOf, completeBy } = state;
      if (!service || !subService || !domain || !geoType || !geoName || !demandedBy || !assessmentOf || !completeBy) {
        throw new Error("Complete all required fields.");
      }
      return assessmentRepository.create(session, {
        serviceId: service.id,
        subServiceId: subService.id,
        domainId: domain.id,
        demandedById: demandedBy.id,
        assesmentOfId: assessmentOf.id,
        geoTypeId: geoType.id,
        geoName: geoName.value ?? geoName.label,
        materialGroupId: state.materialGroup?.id ?? null,
        toBeCompletedBy: completeBy,
        parameters: parametersQuery.data ?? [],
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [ASSESSMENTS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [ASSESSMENT_COUNTS_QUERY_KEY] }),
      ]);
    },
  });

  const errors = useMemo((): CreateErrors => {
    const result: CreateErrors = {};
    for (const field of Object.keys(REQUIRED_MESSAGES) as (keyof typeof REQUIRED_MESSAGES)[]) {
      if (!state[field]) result[field] = REQUIRED_MESSAGES[field];
    }
    if (!state.completeBy) result.completeBy = "Choose a completion date.";
    else if (state.completeBy < startOfTomorrow()) result.completeBy = "Choose a future date.";
    if (parameterFilters && parametersQuery.isSuccess && parametersQuery.data.length === 0) {
      result.parameters = "No parameters are set up for this service, sub service and domain.";
    }
    return result;
  }, [parameterFilters, parametersQuery.data, parametersQuery.isSuccess, state]);

  const select = useCallback((field: CreateField, option: LookupOption): void => {
    dispatch({ type: "select", field, option });
  }, []);
  const setCompleteBy = useCallback((value: Date): void => dispatch({ type: "date", value }), []);
  const submit = useCallback(async (): Promise<string> => mutation.mutateAsync(), [mutation]);

  const isDirty = Object.values(state).some(Boolean);
  const parameterCount = parametersQuery.data?.length ?? 0;

  return {
    state,
    errors,
    geoTypeName,
    parameterCount,
    isLoadingParameters: parametersQuery.isFetching,
    isParametersError: parametersQuery.isError,
    isSubmitting: mutation.isPending,
    isDirty,
    select,
    setCompleteBy,
    submit,
  };
};
