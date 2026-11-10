import type { ReactElement } from "react";
import { useCallback } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import FloatingNavBar from "@/src/components/navigation/FloatingNavBar";
import type { TabItem } from "@/src/components/navigation/tab-items";
import { TAB_ITEMS } from "@/src/components/navigation/tab-items";

/** Tab bar of the signed-in app: maps the navigator state onto the shared floating bar. */
export default function FloatingTabBar({ state, navigation }: BottomTabBarProps): ReactElement {
  const activeName = state.routes[state.index]?.name;
  const activeIndex = TAB_ITEMS.findIndex((item) => item.name === activeName);

  const select = useCallback(
    (item: TabItem): void => {
      const route = state.routes.find((candidate) => candidate.name === item.name);
      if (!route) return;
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (item.name !== activeName && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    },
    [activeName, navigation, state.routes],
  );

  return <FloatingNavBar activeIndex={activeIndex} onSelect={select} />;
}
