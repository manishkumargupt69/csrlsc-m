import type { PropsWithChildren, ReactElement } from "react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import AppNavigationOverlay from "@/src/components/navigation/AppNavigationOverlay";

interface FormGuard {
  isDirty: boolean;
  allowExit: () => void;
}

interface AppNavigationContextValue {
  isFloatingBarHidden: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  requestNavigation: (action: () => void) => void;
  registerFormGuard: (guard: FormGuard | null) => void;
  setFloatingBarHidden: (isHidden: boolean) => void;
}

const AppNavigationContext = createContext<AppNavigationContextValue | null>(null);

export default function AppNavigationProvider({ children }: PropsWithChildren): ReactElement {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isFloatingBarHidden, setFloatingBarHidden] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const formGuard = useRef<FormGuard | null>(null);

  const openMenu = useCallback((): void => setIsMenuVisible(true), []);
  const closeMenu = useCallback((): void => setIsMenuVisible(false), []);
  const registerFormGuard = useCallback((guard: FormGuard | null): void => {
    formGuard.current = guard;
  }, []);
  const requestNavigation = useCallback((action: () => void): void => {
    setIsMenuVisible(false);
    if (formGuard.current?.isDirty) {
      setPendingAction(() => () => {
        formGuard.current?.allowExit();
        action();
      });
      return;
    }
    action();
  }, []);
  const cancelNavigation = useCallback((): void => setPendingAction(null), []);
  const discardAndLeave = useCallback((): void => {
    const action = pendingAction;
    setPendingAction(null);
    action?.();
  }, [pendingAction]);
  const value = useMemo((): AppNavigationContextValue => ({
    isFloatingBarHidden,
    openMenu,
    closeMenu,
    requestNavigation,
    registerFormGuard,
    setFloatingBarHidden,
  }), [closeMenu, isFloatingBarHidden, openMenu, registerFormGuard, requestNavigation]);

  return (
    <AppNavigationContext.Provider value={value}>
      {children}
      <AppNavigationOverlay
        isMenuVisible={isMenuVisible}
        isWarningVisible={pendingAction !== null}
        onCancel={cancelNavigation}
        onCloseMenu={closeMenu}
        onDiscard={discardAndLeave}
      />
    </AppNavigationContext.Provider>
  );
}

export function useAppNavigation(): AppNavigationContextValue {
  const context = useContext(AppNavigationContext);
  if (!context) throw new Error("AppNavigationProvider is missing.");
  return context;
}

export function useOptionalAppNavigation(): AppNavigationContextValue | null {
  return useContext(AppNavigationContext);
}
