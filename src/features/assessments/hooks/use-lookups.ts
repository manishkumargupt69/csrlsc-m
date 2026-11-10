import { useQuery } from "@tanstack/react-query";

import { lookupRepository } from "@/src/features/assessments/data/lookup.repository";
import type { GeoTypeName } from "@/src/features/assessments/data/lookup.repository";
import type { LookupOption } from "@/src/features/assessments/domain/assessment.types";
import type { AuthSession } from "@/src/features/auth/domain/auth.types";
import { useAuthStore } from "@/src/features/auth/state/auth-store";

const LOOKUP_STALE_TIME_MS = 5 * 60_000;
const EMPTY_OPTIONS: readonly LookupOption[] = [];

export interface LookupResult {
  options: readonly LookupOption[];
  isLoading: boolean;
  isError: boolean;
  reload: () => void;
}

const useLookup = (
  key: readonly (string | null)[],
  load: (session: AuthSession) => Promise<LookupOption[]>,
  isEnabled = true,
): LookupResult => {
  const session = useAuthStore((state) => state.session);
  const query = useQuery({
    queryKey: ["lookup", ...key],
    queryFn: () => {
      if (!session) throw new Error("Your session has expired. Sign in again.");
      return load(session);
    },
    enabled: Boolean(session) && isEnabled,
    staleTime: LOOKUP_STALE_TIME_MS,
  });
  return {
    options: query.data ?? EMPTY_OPTIONS,
    isLoading: query.isFetching && !query.data,
    isError: query.isError,
    reload: () => { void query.refetch(); },
  };
};

export const useServices = (): LookupResult =>
  useLookup(["services"], (session) => lookupRepository.services(session));

export const useSubServices = (serviceId: string | null): LookupResult =>
  useLookup(
    ["sub-services", serviceId],
    (session) => lookupRepository.subServices(session, serviceId ?? ""),
    Boolean(serviceId),
  );

export const useQuickCodes = (codeType: string): LookupResult =>
  useLookup(["quick-codes", codeType], (session) => lookupRepository.quickCodes(session, codeType));

export const useShippers = (): LookupResult =>
  useLookup(["shippers"], (session) => lookupRepository.shippers(session));

export const useGeoNames = (geoType: GeoTypeName | null): LookupResult =>
  useLookup(
    ["geo-names", geoType],
    (session) => (geoType ? lookupRepository.geoNames(session, geoType) : Promise.resolve([])),
    Boolean(geoType),
  );

export const useAuditors = (isEnabled: boolean): LookupResult =>
  useLookup(["auditors"], (session) => lookupRepository.auditors(session), isEnabled);
