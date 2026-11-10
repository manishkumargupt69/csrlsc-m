import type { ReactElement } from "react";
import { useCallback } from "react";

import { useAppNavigation } from "@/src/components/navigation/AppNavigationContext";
import AppHeader from "@/src/components/ui/AppHeader";

interface DrawerHeaderProps {
  title: string;
}

export default function DrawerHeader({ title }: DrawerHeaderProps): ReactElement {
  const { openMenu } = useAppNavigation();
  const openDrawer = useCallback((): void => openMenu(), [openMenu]);

  return <AppHeader title={title} leadingAction={{ accessibilityLabel: "Open menu", icon: "menu", onPress: openDrawer }} />;
}
