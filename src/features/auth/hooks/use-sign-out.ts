import { useCallback } from "react";

import { authRepository } from "@/src/features/auth/data/auth.repository";
import { useAuthStore } from "@/src/features/auth/state/auth-store";

/**
 * Ends the server session (best effort) and always clears the local session,
 * so a network failure can never leave the user stuck signed in.
 */
export const useSignOut = (): (() => Promise<void>) => {
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.signOut);

  return useCallback(async (): Promise<void> => {
    if (session) {
      try {
        await authRepository.logout(session);
      } catch {
        // Offline or expired token: the local session is cleared regardless.
      }
    }
    await clearSession();
  }, [clearSession, session]);
};
