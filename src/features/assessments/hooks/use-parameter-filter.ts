import { useMemo, useState } from "react";

import type { AssessmentParameter, LookupOption, ParameterFilters } from "@/src/features/assessments/domain/assessment.types";
import type { LookupResult } from "@/src/features/assessments/hooks/use-lookups";

interface ParameterFilterState {
  filters: ParameterFilters;
  setFilters: (filters: ParameterFilters) => void;
  parameterTypes: LookupResult;
  groupings: LookupResult;
  /** The request's parameters that match both filters. */
  filtered: readonly AssessmentParameter[];
  isFiltering: boolean;
}

const noReload = (): void => undefined;

/** Distinct non-empty values, in the order the parameters list them, as picker options. */
const toOptions = (values: readonly string[]): LookupResult => ({
  options: [...new Set(values.filter(Boolean))].map((value): LookupOption => ({ id: value, label: value })),
  isLoading: false,
  isError: false,
  reload: noReload,
});

/**
 * Parameter Type and Overall Grouping filters over one request's parameters, already loaded on the phone.
 * The choices are only the values this request's parameters have, so a choice never leaves the list empty.
 */
export const useParameterFilter = (parameters: readonly AssessmentParameter[]): ParameterFilterState => {
  const [selected, setFilters] = useState<ParameterFilters>({});
  const parameterTypes = useMemo(() => toOptions(parameters.map((parameter) => parameter.parameterType)), [parameters]);
  const groupings = useMemo(() => toOptions(parameters.map((parameter) => parameter.overallGrouping)), [parameters]);
  // After a reload a chosen value may no longer exist; it is then ignored rather than hiding every parameter.
  const filters = useMemo((): ParameterFilters => {
    const hasOption = (lookup: LookupResult, id: string | undefined): boolean => Boolean(id) && lookup.options.some((option) => option.id === id);
    return {
      parameterTypeId: hasOption(parameterTypes, selected.parameterTypeId) ? selected.parameterTypeId : undefined,
      overallGroupingId: hasOption(groupings, selected.overallGroupingId) ? selected.overallGroupingId : undefined,
    };
  }, [groupings, parameterTypes, selected]);
  const filtered = useMemo(
    () => parameters.filter((parameter) =>
      (!filters.parameterTypeId || parameter.parameterType === filters.parameterTypeId) &&
      (!filters.overallGroupingId || parameter.overallGrouping === filters.overallGroupingId)),
    [filters, parameters],
  );
  return { filters, setFilters, parameterTypes, groupings, filtered, isFiltering: Boolean(filters.parameterTypeId || filters.overallGroupingId) };
};
