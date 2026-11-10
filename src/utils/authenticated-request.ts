import { API_BASE_URL } from "@/src/config/env";
import { createAuthenticatedHeaders } from "@/src/features/auth/data/authenticated-headers";
import type { AuthSession } from "@/src/features/auth/domain/auth.types";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import {
  executeJsonRequest,
  executeMultipartRequest,
  getApiErrorMessage,
  isApiErrorResponse,
} from "@/src/utils/api-client";

type JsonMethod = "POST" | "PUT" | "GET" | "DELETE";

export interface Page<T> {
  items: T[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const UNAUTHORIZED = 401;

const assertSuccess = async (
  response: Response,
  body: unknown,
  fallbackMessage: string,
): Promise<void> => {
  if (response.status === UNAUTHORIZED) {
    await useAuthStore.getState().signOut();
    throw new Error("Your session has expired. Sign in again.");
  }
  if (!response.ok || isApiErrorResponse(body)) {
    throw new Error(getApiErrorMessage(body, fallbackMessage));
  }
};

/** Sends an authenticated JSON request and returns the parsed response body. */
export const requestJson = async (
  session: AuthSession,
  method: JsonMethod,
  path: string,
  body: unknown,
  fallbackMessage: string,
): Promise<unknown> => {
  const { response, body: responseBody } = await executeJsonRequest({
    url: API_BASE_URL + path,
    method,
    headers: { ...createAuthenticatedHeaders(session), "Content-Type": "application/json" },
    body,
  });
  await assertSuccess(response, responseBody, fallbackMessage);
  return responseBody;
};

/** Sends an authenticated multipart request and returns the parsed response body. */
export const requestMultipart = async (
  session: AuthSession,
  method: "POST" | "PUT",
  path: string,
  body: FormData,
  fallbackMessage: string,
): Promise<unknown> => {
  const { response, body: responseBody } = await executeMultipartRequest({
    url: API_BASE_URL + path,
    method,
    headers: createAuthenticatedHeaders(session),
    body,
  });
  await assertSuccess(response, responseBody, fallbackMessage);
  return responseBody;
};

/** Reads the object the API wraps in `{ data: { data: ... } }`. */
export const readData = (body: unknown): unknown =>
  isRecord(body) && isRecord(body.data) ? body.data.data : undefined;

/** Reads a paginated list from `{ data: { data: [], totalRecords, ... } }`. */
export const readPage = <T>(body: unknown, mapItem: (raw: unknown) => T): Page<T> => {
  const container = isRecord(body) && isRecord(body.data) ? body.data : {};
  const rows = Array.isArray(container.data) ? container.data : [];
  return {
    items: rows.map(mapItem),
    totalRecords: typeof container.totalRecords === "number" ? container.totalRecords : rows.length,
    totalPages: typeof container.totalPages === "number" ? container.totalPages : 1,
    currentPage: typeof container.currentPage === "number" ? container.currentPage : 1,
  };
};

export const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

export const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const asNumberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
