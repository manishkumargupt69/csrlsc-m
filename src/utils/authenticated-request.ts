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

/*
 * The CSRLSC server has very few database connections. When several requests arrive together (the dashboard
 * fires about ten at sign-in) some fail with "Too many database connections", and its token check then answers
 * 401 INVALID_TOKEN although the token is valid. Signing out on that 401 threw users back to the login screen
 * right after signing in. So the app keeps at most two requests in flight, and retries a 401 (and a read that
 * hit the connection limit) after a short wait before treating the session as ended.
 */
const MAX_REQUESTS_IN_FLIGHT = 2;
const RETRY_DELAYS_MS = [700, 1_600] as const;
const CONNECTION_LIMIT_MESSAGE = "too many database connections";

let requestsInFlight = 0;
const waitingForSlot: (() => void)[] = [];

const withRequestSlot = async <T>(task: () => Promise<T>): Promise<T> => {
  if (requestsInFlight >= MAX_REQUESTS_IN_FLIGHT) {
    // A finishing request hands its slot straight to us (the count stays the same), so a request that
    // arrives in between cannot slip past the limit.
    await new Promise<void>((resolve) => waitingForSlot.push(resolve));
  } else {
    requestsInFlight += 1;
  }
  try {
    return await task();
  } finally {
    const next = waitingForSlot.shift();
    if (next) next();
    else requestsInFlight -= 1;
  }
};

const wait = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

const hitConnectionLimit = (body: unknown): boolean =>
  getApiErrorMessage(body, "").toLocaleLowerCase().includes(CONNECTION_LIMIT_MESSAGE);

/** Searches, details and GETs only read, so repeating them after a server-side failure is safe. */
const isReadRequest = (method: string, path: string): boolean =>
  method === "GET" || /\/(search|details)-/.test(path);

interface ApiResult {
  response: Response;
  body: unknown;
}

/**
 * Runs a request in a free slot and repeats it while the server answers 401 or, for reads, runs out of database
 * connections. Only a 401 that survives the retries ends the session.
 */
const sendWithRetry = async (send: () => Promise<ApiResult>, canRetryServerErrors: boolean): Promise<ApiResult> => {
  let result = await withRequestSlot(send);
  for (const delay of RETRY_DELAYS_MS) {
    const isRetryable =
      result.response.status === UNAUTHORIZED ||
      (canRetryServerErrors && result.response.status >= 500 && hitConnectionLimit(result.body));
    if (!isRetryable) break;
    await wait(delay);
    result = await withRequestSlot(send);
  }
  return result;
};

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
  const { response, body: responseBody } = await sendWithRetry(
    () => executeJsonRequest({
      url: API_BASE_URL + path,
      method,
      headers: { ...createAuthenticatedHeaders(session), "Content-Type": "application/json" },
      body,
    }),
    isReadRequest(method, path),
  );
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
  // An upload is repeated only after a 401, which the server sends before it stores anything.
  const { response, body: responseBody } = await sendWithRetry(
    () => executeMultipartRequest({
      url: API_BASE_URL + path,
      method,
      headers: createAuthenticatedHeaders(session),
      body,
    }),
    false,
  );
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
