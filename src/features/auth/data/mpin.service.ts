import * as SecureStore from "expo-secure-store";

const MPIN_STORAGE_KEY = "csrlsc.auth.mpin";

interface StoredMpin {
  userId: string;
}

const isStoredMpin = (value: unknown): value is StoredMpin => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.userId === "string"
  );
};

const loadStoredMpin = async (): Promise<StoredMpin | null> => {
  const value = await SecureStore.getItemAsync(MPIN_STORAGE_KEY);
  if (!value) {
    return null;
  }

  try {
    const parsedMpin: unknown = JSON.parse(value);
    if (isStoredMpin(parsedMpin)) {
      return parsedMpin;
    }
    await SecureStore.deleteItemAsync(MPIN_STORAGE_KEY);
    return null;
  } catch {
    await SecureStore.deleteItemAsync(MPIN_STORAGE_KEY);
    return null;
  }
};

export const getConfiguredMpinUserId = async (): Promise<string | null> =>
  (await loadStoredMpin())?.userId ?? null;

export const configureMpin = async (userId: string): Promise<void> => {
  const storedMpin: StoredMpin = { userId };
  await SecureStore.setItemAsync(MPIN_STORAGE_KEY, JSON.stringify(storedMpin));
};
