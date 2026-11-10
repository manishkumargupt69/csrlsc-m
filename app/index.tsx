import type { ReactElement } from "react";
import { Redirect } from "expo-router";

import { useAuthStore } from "@/src/features/auth/state/auth-store";

export default function IndexScreen(): ReactElement {
  const session = useAuthStore((state) => state.session);
  return <Redirect href={session ? "/(app)/(tabs)/dashboard" : "/(auth)/sign-in"} />;
}
