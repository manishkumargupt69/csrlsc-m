import * as SecureStore from "expo-secure-store";

const MPIN_PROMPT_DISMISSED_KEY = "csrlsc.mpin-prompt.dismissed";

/** Whether the person already answered "Not now" to the one-time offer to set up an MPIN on this device. */
export const isMpinPromptDismissed = async (): Promise<boolean> => {
  try {
    return (await SecureStore.getItemAsync(MPIN_PROMPT_DISMISSED_KEY)) === "true";
  } catch {
    // If storage cannot be read, do not nag: an unread flag must not turn into a prompt on every sign-in.
    return true;
  }
};

export const dismissMpinPrompt = async (): Promise<void> => {
  try {
    await SecureStore.setItemAsync(MPIN_PROMPT_DISMISSED_KEY, "true");
  } catch {
    // Best effort; the worst case is being asked once more.
  }
};
