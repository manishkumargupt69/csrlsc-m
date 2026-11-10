import * as SecureStore from "expo-secure-store";

import type { RememberedCredentials } from "@/src/features/auth/domain/auth.types";

const REMEMBERED_CREDENTIALS_KEY = "csrlsc.auth.remembered-credentials";

const isRememberedCredentials = (
  value: unknown,
): value is RememberedCredentials => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const credentials = value as Record<string, unknown>;
  return (
    typeof credentials.userId === "string" &&
    typeof credentials.password === "string"
  );
};

export const loadRememberedCredentials =
  async (): Promise<RememberedCredentials | null> => {
    const serializedCredentials = await SecureStore.getItemAsync(
      REMEMBERED_CREDENTIALS_KEY,
    );
    if (!serializedCredentials) {
      return null;
    }

    try {
      const parsedCredentials: unknown = JSON.parse(serializedCredentials);
      if (isRememberedCredentials(parsedCredentials)) {
        return parsedCredentials;
      }
      await removeRememberedCredentials();
      return null;
    } catch {
      await removeRememberedCredentials();
      return null;
    }
  };

export const storeRememberedCredentials = async (
  credentials: RememberedCredentials,
): Promise<void> => {
  await SecureStore.setItemAsync(
    REMEMBERED_CREDENTIALS_KEY,
    JSON.stringify(credentials),
  );
};

export const removeRememberedCredentials = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(REMEMBERED_CREDENTIALS_KEY);
};
