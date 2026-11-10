import type { ReactElement } from "react";
import { useCallback } from "react";
import { router } from "expo-router";

import { useAppNavigation } from "@/src/components/navigation/AppNavigationContext";
import FloatingNavBar from "@/src/components/navigation/FloatingNavBar";
import type { TabItem } from "@/src/components/navigation/tab-items";
import { useFloatingNavigationVisibility } from "@/src/components/navigation/use-floating-navigation-visibility";

/** Shown on detail screens that sit outside the tab navigator; no tab is current there. */
export default function FloatingNavigationBar(): ReactElement | null {
  const isVisible = useFloatingNavigationVisibility();
  const { requestNavigation } = useAppNavigation();
  const openTab = useCallback((item: TabItem): void => {
    requestNavigation(() => router.navigate(item.route));
  }, [requestNavigation]);

  if (!isVisible) return null;
  return <FloatingNavBar activeIndex={-1} isOptimistic={false} onSelect={openTab} />;
}
