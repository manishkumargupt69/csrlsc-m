import * as SecureStore from "expo-secure-store";

import type {
  AuthRoleComponent,
  AuthSession,
} from "@/src/features/auth/domain/auth.types";

const SESSION_STORAGE_KEY = "csrlsc.auth.session";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isCompany = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.name === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isNullableString = (value: unknown): value is string | null =>
  typeof value === "string" || value === null;

const isAuthRoleComponent = (value: unknown): value is AuthRoleComponent => {
  if (!isRecord(value) || !Array.isArray(value.children)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.componentName === "string" &&
    typeof value.moduleName === "string" &&
    typeof value.componentType === "string" &&
    isNullableString(value.description) &&
    isNullableString(value.routeLink) &&
    isNullableString(value.mobileRouteLink) &&
    isNullableString(value.icon) &&
    isNullableString(value.mobileIcon) &&
    typeof value.orderNo === "number" &&
    isStringArray(value.permissions) &&
    typeof value.hasAccess === "boolean" &&
    value.children.every(isAuthRoleComponent)
  );
};

const isAuthSession = (value: unknown): value is AuthSession => {
  if (!isRecord(value) || !isRecord(value.user)) {
    return false;
  }

  return (
    typeof value.accessToken === "string" &&
    Array.isArray(value.roleComponents) &&
    value.roleComponents.every(isAuthRoleComponent) &&
    typeof value.user.id === "string" &&
    (value.user.clientId === undefined || typeof value.user.clientId === "number") &&
    isNullableString(value.user.employeeCode) &&
    typeof value.user.displayName === "string" &&
    typeof value.user.name === "string" &&
    typeof value.user.clientName === "string" &&
    typeof value.user.isAdmin === "boolean" &&
    typeof value.user.roleName === "string" &&
    typeof value.user.email === "string" &&
    typeof value.user.mobile === "string" &&
    typeof value.user.userId === "string" &&
    typeof value.user.hasMpin === "boolean" &&
    typeof value.user.lastLogin === "string" &&
    typeof value.user.roleId === "string" &&
    (typeof value.user.branchId === "string" || value.user.branchId === null) &&
    Array.isArray(value.user.company) &&
    value.user.company.every(isCompany)
  );
};

export const loadStoredSession = async (): Promise<AuthSession | null> => {
  const serializedSession = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
  if (!serializedSession) {
    return null;
  }

  try {
    const parsedSession: unknown = JSON.parse(serializedSession);
    if (isAuthSession(parsedSession)) {
      return parsedSession;
    }
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
    return null;
  } catch {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
    return null;
  }
};

export const storeSession = async (session: AuthSession): Promise<void> => {
  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const removeStoredSession = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
};
