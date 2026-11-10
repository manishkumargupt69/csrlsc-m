import type { AuthSession } from "@/src/features/auth/domain/auth.types";
import type { LookupOption } from "@/src/features/assessments/domain/assessment.types";
import { asRecord, asString, readPage, requestJson } from "@/src/utils/authenticated-request";

/** Master lists are small; one large page keeps the pickers simple. */
const LOOKUP_LIMIT = 1000;

export type GeoTypeName = "Country" | "State" | "City" | "ShipPoint";

interface GeoSource {
  path: string;
  sortBy: string;
}

const GEO_SOURCES: Readonly<Record<GeoTypeName, GeoSource>> = {
  Country: { path: "/country/search-country", sortBy: "nameCode" },
  State: { path: "/state/search-state", sortBy: "nameCode" },
  City: { path: "/city/search-city", sortBy: "name" },
  ShipPoint: { path: "/shipPoint/search-shipPoint", sortBy: "nameCode" },
};

export const isGeoTypeName = (value: string): value is GeoTypeName => value in GEO_SOURCES;

const search = async (
  session: AuthSession,
  path: string,
  body: Record<string, unknown>,
  failureMessage: string,
): Promise<unknown[]> => {
  const response = await requestJson(
    session,
    "POST",
    path,
    { page: 1, limit: LOOKUP_LIMIT, sortOrder: "asc", ...body },
    failureMessage,
  );
  return readPage(response, (raw) => raw).items;
};

const toOptions = (rows: readonly unknown[], labelKey: string): LookupOption[] =>
  rows.flatMap((row) => {
    const record = asRecord(row);
    const id = asString(record.id);
    const label = asString(record[labelKey]).trim();
    return id && label ? [{ id, label }] : [];
  });

export class LookupRepository {
  async services(session: AuthSession): Promise<LookupOption[]> {
    const rows = await search(session, "/service/search-service", { sortBy: "nameCode" }, "Services could not be loaded.");
    return toOptions(rows, "nameCode");
  }

  async subServices(session: AuthSession, serviceId: string): Promise<LookupOption[]> {
    const rows = await search(
      session,
      "/subService/search-subService",
      { sortBy: "name", filters: { serviceMasterId: serviceId } },
      "Sub services could not be loaded.",
    );
    return toOptions(rows, "name");
  }

  /** Quick-code lists such as DomainType, MaterialGroup and Geo. */
  async quickCodes(session: AuthSession, codeType: string): Promise<LookupOption[]> {
    const rows = await search(
      session,
      "/quick/search-generalCode",
      { sortBy: "codeValue", filters: { codeType } },
      "Options could not be loaded.",
    );
    return toOptions(rows, "codeValue");
  }

  async shippers(session: AuthSession): Promise<LookupOption[]> {
    const rows = await search(session, "/shipper/search-shipper", { sortBy: "companyName" }, "Companies could not be loaded.");
    return toOptions(rows, "companyName");
  }

  /** Geo names for a Geo Type; the API stores the plain name, not an id. */
  async geoNames(session: AuthSession, geoType: GeoTypeName): Promise<LookupOption[]> {
    const source = GEO_SOURCES[geoType];
    const rows = await search(session, source.path, { sortBy: source.sortBy }, "Locations could not be loaded.");
    const labelKey = geoType === "City" ? "name" : "nameCode";
    return rows.flatMap((row) => {
      const record = asRecord(row);
      const id = asString(record.id);
      const name = asString(record.name).trim();
      const label = asString(record[labelKey]).trim() || name;
      return id && name ? [{ id, label, value: name }] : [];
    });
  }

  async auditors(session: AuthSession): Promise<LookupOption[]> {
    const rows = await search(
      session,
      "/user/search-user",
      {
        sortBy: "nameCode",
        filters: { isActive: true, "userCompany.userRole.role.roleName": { in: ["Audit"] } },
      },
      "Auditors could not be loaded.",
    );
    return toOptions(rows, "nameCode");
  }

  /** Parameters that apply to the chosen service, sub service and domain. */
  async parameters(
    session: AuthSession,
    filters: { serviceId: string; subServiceId: string; domainId: string },
  ): Promise<unknown[]> {
    return search(
      session,
      "/mainParameter/search-mainParameter",
      {
        filters,
        include: {
          mainParameter: { select: { codeValue: true } },
          parameterType: { select: { codeValue: true } },
          domain: { select: { codeValue: true } },
          apiSource: { select: { codeValue: true } },
          country: { select: { nameCode: true } },
          state: { select: { nameCode: true } },
          responseType: { select: { codeValue: true } },
          service: { select: { nameCode: true } },
          subService: { select: { name: true } },
          overallGroupingValue: { select: { codeValue: true } },
          specialCommodityValue: { select: { codeValue: true } },
          productCategory: { select: { codeValue: true } },
        },
      },
      "Parameters could not be loaded.",
    );
  }
}

export const lookupRepository = new LookupRepository();
