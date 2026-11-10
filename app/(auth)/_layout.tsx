import type { ReactElement } from "react";
import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/src/features/auth/state/auth-store";

export default function AuthLayout(): ReactElement {
  const session = useAuthStore((state) => state.session);
  if (session) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
