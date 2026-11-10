import { useCallback, useEffect, useRef } from "react";
import { useIsFocused, useNavigation, usePreventRemove } from "@react-navigation/native";

import { useAppNavigation } from "@/src/components/navigation/AppNavigationContext";

export function useUnsavedChanges(isDirty: boolean): () => void {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { registerFormGuard, requestNavigation } = useAppNavigation();
  const allowExit = useRef(false);

  const allowNavigation = useCallback((): void => {
    allowExit.current = true;
  }, []);

  useEffect(() => {
    if (!isDirty) allowExit.current = false;
  }, [isDirty]);

  useEffect(() => {
    if (!isFocused) return;
    registerFormGuard({ isDirty, allowExit: allowNavigation });
    return () => registerFormGuard(null);
  }, [allowNavigation, isDirty, isFocused, registerFormGuard]);

  usePreventRemove(isDirty, ({ data }) => {
    if (allowExit.current) {
      navigation.dispatch(data.action);
      return;
    }
    requestNavigation(() => navigation.dispatch(data.action));
  });

  return allowNavigation;
}
