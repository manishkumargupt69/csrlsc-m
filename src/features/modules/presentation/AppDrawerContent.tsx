import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { router, usePathname } from "expo-router";

import { useAppNavigation } from "@/src/components/navigation/AppNavigationContext";
import { useSignOut } from "@/src/features/auth/hooks/use-sign-out";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { getPermittedModules } from "@/src/features/modules/domain/mobile-modules";
import type { ModuleKey, ModuleViewModel } from "@/src/features/modules/domain/module.types";
import AppDrawerView from "@/src/features/modules/presentation/AppDrawerView";

type ModuleRoute =
  | "/(app)/(tabs)/dashboard"
  | "/(app)/(tabs)/assessments"
  | "/(app)/(tabs)/assess"
  | "/(app)/(tabs)/incidents";

const MODULE_ROUTES: Record<ModuleKey, ModuleRoute> = {
  dashboard: "/(app)/(tabs)/dashboard",
  assessments: "/(app)/(tabs)/assessments",
  assess: "/(app)/(tabs)/assess",
  incidents: "/(app)/(tabs)/incidents",
};

interface AppDrawerContentProps { onClose: () => void; }

export default function AppDrawerContent({ onClose }: AppDrawerContentProps): ReactElement {
  const session = useAuthStore((store) => store.session);
  const signOut = useSignOut();
  const pathname = usePathname();
  const { requestNavigation } = useAppNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const modules = useMemo(() => (session ? getPermittedModules(session) : []), [session]);
  const selectedRoute = pathname.split("/").at(-1);

  const openProfile = useCallback((): void => {
    onClose();
    requestNavigation(() => router.navigate("/(app)/(tabs)/profile"));
  }, [onClose, requestNavigation]);
  const openModule = useCallback((module: ModuleViewModel): void => {
    onClose();
    const moduleKey = module.key;
    if (!moduleKey) return;
    requestNavigation(() => router.navigate(MODULE_ROUTES[moduleKey]));
  }, [onClose, requestNavigation]);
  const handleLogout = useCallback(async (): Promise<void> => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch {
      setIsLoggingOut(false);
      Alert.alert("Unable to log out", "Please try again.");
    }
  }, [isLoggingOut, signOut]);
  const requestLogout = useCallback((): void => {
    onClose();
    requestNavigation(() => { void handleLogout(); });
  }, [handleLogout, onClose, requestNavigation]);

  return (
    <AppDrawerView
      clientName={session?.user.clientName ?? ""}
      isLoggingOut={isLoggingOut}
      modules={modules}
      onClose={onClose}
      onLogout={requestLogout}
      onModulePress={openModule}
      onProfile={openProfile}
      selectedRoute={selectedRoute}
      userEmail={session?.user.email ?? ""}
      userName={session?.user.name ?? ""}
    />
  );
}
