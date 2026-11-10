const DEFAULT_API_BASE_URL = "http://34.100.253.156/csrlsc-api";

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
);

export const AUTH_SECRET = process.env.EXPO_PUBLIC_AUTH_SECRET ?? "";

/** Origin of the API host, used to resolve server-relative file paths. */
export const API_ORIGIN = API_BASE_URL.replace(/^(https?:\/\/[^/]+).*$/, "$1");
