import type { ReactElement } from "react";
import { useCallback } from "react";

import { useAppNavigation } from "@/src/components/navigation/AppNavigationContext";
import AppHeader from "@/src/components/ui/AppHeader";

interface DetailHeaderProps {
  title: string;
  onBack: () => void;
}

export default function DetailHeader({ title, onBack }: DetailHeaderProps): ReactElement {
  const { openMenu } = useAppNavigation();
  const handleMenu = useCallback((): void => openMenu(), [openMenu]);
  return <AppHeader leadingAction={{ accessibilityLabel: "Open menu", icon: "menu", onPress: handleMenu }} onBack={onBack} title={title} />;
}
