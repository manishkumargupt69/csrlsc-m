import type { ReactElement } from "react";

import AppHeader from "@/src/components/ui/AppHeader";

interface DetailHeaderProps {
  title: string;
  onBack: () => void;
}

/**
 * Header for screens opened from a tab (request detail, audit, parameter, new request…): back and title only.
 * The side menu is reached from the main tab screens, whose DrawerHeader carries the menu button.
 */
export default function DetailHeader({ title, onBack }: DetailHeaderProps): ReactElement {
  return <AppHeader onBack={onBack} title={title} />;
}
