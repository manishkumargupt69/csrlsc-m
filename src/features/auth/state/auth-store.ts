import { create } from "zustand";

import {
  loadStoredSession,
  removeStoredSession,
  storeSession,
} from "@/src/features/auth/data/session-storage";
import type { AuthSession } from "@/src/features/auth/domain/auth.types";

interface AuthState {
  session: AuthSession | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (session: AuthSession) => Promise<void>;
  signInForCurrentRun: (session: AuthSession) => void;
  markMpinConfigured: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isHydrated: false,
  hydrate: async (): Promise<void> => {
    const session = await loadStoredSession();
    set({ session, isHydrated: true });
  },
  signIn: async (session: AuthSession): Promise<void> => {
    await storeSession(session);
    set({ session });
  },
  signInForCurrentRun: (session: AuthSession): void => {
    set({ session });
  },
  markMpinConfigured: (): void => {
    set((state) =>
      state.session
        ? {
            session: {
              ...state.session,
              user: { ...state.session.user, hasMpin: true },
            },
          }
        : state,
    );
  },
  signOut: async (): Promise<void> => {
    await removeStoredSession();
    set({ session: null });
  },
}));
