import { usePathname } from "expo-router";

import { useOptionalAppNavigation } from "@/src/components/navigation/AppNavigationContext";
import { TAB_ITEMS } from "@/src/components/navigation/tab-items";

const TAB_SCREENS: ReadonlySet<string> = new Set(TAB_ITEMS.map((item) => item.name));
const FORM_SEGMENT = "new";

/**
 * The floating bar stands in for the tab bar on screens pushed above the tabs.
 * It stays hidden on the tab screens themselves (they render the real tab bar)
 * and on forms, where it would cover inputs and primary actions.
 */
export const useFloatingNavigationVisibility = (): boolean => {
  const pathname = usePathname();
  const navigation = useOptionalAppNavigation();
  const segments = pathname.split("/").filter((segment) => segment && !segment.startsWith("("));
  const [screen, child] = segments;

  if (!screen || !navigation || navigation.isFloatingBarHidden) return false;
  if (segments.length === 1 && TAB_SCREENS.has(screen)) return false;
  if (screen === "mpin-setup") return false;
  if (screen === "incidents" && child) return false;
  if (screen === "assessments" && (child === FORM_SEGMENT || segments.length > 2)) return false;
  return true;
};

/** True on the five tab screens themselves, where the real tab bar floats over the content. */
export const useIsTabScreen = (): boolean => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter((segment) => segment && !segment.startsWith("("));
  return segments.length === 1 && TAB_SCREENS.has(segments[0]);
};
