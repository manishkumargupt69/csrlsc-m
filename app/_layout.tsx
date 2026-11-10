import type { ReactElement } from "react";
import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import LaunchSplashScreen from "@/src/components/branding/LaunchSplashScreen";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { useLaunchSplash } from "@/src/hooks/use-launch-splash";
import AppProviders from "@/src/providers/AppProviders";
import { COLORS } from "@/src/theme/tokens";

void SplashScreen.preventAutoHideAsync();

function RootNavigator(): ReactElement | null {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const launchSplash = useLaunchSplash(isHydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (launchSplash.isVisible) {
    return (
      <LaunchSplashScreen
        iconScale={launchSplash.iconScale}
        opacity={launchSplash.opacity}
      />
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: COLORS.background },
          headerShown: false,
          animation: "fade_from_bottom",
        }}
      />
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout(): ReactElement {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
