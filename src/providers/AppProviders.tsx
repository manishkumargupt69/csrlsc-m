import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useAuditDraftStore } from "@/src/features/assessments/state/audit-draft-store";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { useProfilePhotoStore } from "@/src/features/profile/state/profile-photo-store";

function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60_000,
          },
        },
      }),
  );

  // Whenever a session ends (sign out, expired token, remote logout) forget everything that belonged to it,
  // so the next person on this device never sees cached requests or unsaved audit answers.
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (previous.session && !state.session) {
          queryClient.clear();
          useAuditDraftStore.getState().reset();
          useProfilePhotoStore.getState().reset();
        }
      }),
    [queryClient],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default AppProviders;
