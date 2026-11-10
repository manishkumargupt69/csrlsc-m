import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";

import { authRepository } from "@/src/features/auth/data/auth.repository";
import {
  getConfiguredMpinUserId,
} from "@/src/features/auth/data/mpin.service";
import { dismissMpinPrompt, isMpinPromptDismissed } from "@/src/features/auth/data/mpin-prompt-storage";
import {
  loadRememberedCredentials,
  removeRememberedCredentials,
  storeRememberedCredentials,
} from "@/src/features/auth/data/remembered-credentials-storage";
import type {
  AuthMode,
  RememberedCredentials,
} from "@/src/features/auth/domain/auth.types";
import { useAuthStore } from "@/src/features/auth/state/auth-store";

const MPIN_PATTERN = /^\d{4}$/;

interface SignInFields {
  userId: string;
  password: string;
  mpin: string;
}

interface FieldErrors {
  userId?: string;
  password?: string;
  mpin?: string;
}

const INITIAL_FIELDS: SignInFields = {
  userId: "",
  password: "",
  mpin: "",
};

const askToUpdateSavedPassword = (): Promise<boolean> =>
  new Promise<boolean>((resolve) => {
    Alert.alert(
      "Update saved password?",
      "The password you entered is different from the one saved on this device.",
      [
        { text: "Keep saved password", onPress: () => resolve(false) },
        { text: "Update password", onPress: () => resolve(true) },
      ],
      { cancelable: false },
    );
  });

/** One-time offer after a password sign-in: an MPIN is four digits, so it is much quicker than a password on a phone. */
const offerMpinSetup = (): void => {
  Alert.alert(
    "Sign in faster next time",
    "Set a 4-digit MPIN and use it instead of your password on this phone.",
    [
      { text: "Not now", style: "cancel", onPress: () => void dismissMpinPrompt() },
      {
        text: "Set up MPIN",
        onPress: () => router.navigate({ pathname: "/(app)/(tabs)/profile", params: { setupMpin: String(Date.now()) } }),
      },
    ],
    { cancelable: true },
  );
};

const getValidationErrors = (
  mode: AuthMode,
  fields: SignInFields,
): FieldErrors => {
  if (mode === "mpin") {
    if (!fields.userId.trim()) {
      return { userId: "Enter your user ID." };
    }
    return MPIN_PATTERN.test(fields.mpin) ? {} : { mpin: "Enter your 4-digit MPIN." };
  }

  if (!fields.userId.trim()) {
    return { userId: "Enter your user ID." };
  }

  if (!fields.password) {
    return { password: "Enter your password." };
  }

  return {};
};

const hasErrors = (errors: FieldErrors): boolean =>
  Object.values(errors).some(Boolean);

export const useSignIn = () => {
  const signInPersisted = useAuthStore((state) => state.signIn);
  const signInForCurrentRun = useAuthStore(
    (state) => state.signInForCurrentRun,
  );
  const [mode, setMode] = useState<AuthMode>("credentials");
  const [fields, setFields] = useState<SignInFields>(INITIAL_FIELDS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isRemembered, setIsRemembered] = useState(false);
  const [rememberedCredentials, setRememberedCredentials] =
    useState<RememberedCredentials | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const loadSignInPreferences = async (): Promise<void> => {
      try {
        const [configuredMpinUserId, savedCredentials] = await Promise.all([
          getConfiguredMpinUserId(),
          loadRememberedCredentials(),
        ]);
        setRememberedCredentials(savedCredentials);
        if (savedCredentials || configuredMpinUserId) {
          setFields((current) => ({ ...current, userId: savedCredentials?.userId ?? configuredMpinUserId ?? "", password: savedCredentials?.password ?? "" }));
        }
        if (savedCredentials) {
          setIsRemembered(true);
        }
      } catch {
        setNotice("Saved sign-in details could not be loaded.");
      }
    };
    void loadSignInPreferences();
  }, []);

  const updateField = useCallback(
    (field: keyof SignInFields, value: string): void => {
      setFields((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setNotice(null);
    },
    [],
  );

  const selectMode = useCallback((nextMode: AuthMode): void => {
    setMode(nextMode);
    setErrors({});
    setNotice(null);
  }, []);

  const submit = useCallback(async (): Promise<void> => {
    const nextErrors = getValidationErrors(mode, fields);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);
    try {
      const session =
        mode === "credentials"
          ? await authRepository.loginWithCredentials({
              userId: fields.userId.trim(),
              password: fields.password,
            })
          : await authRepository.loginWithMpin(fields.userId.trim(), fields.mpin);

      if (mode === "credentials" && isRemembered) {
        const enteredCredentials = {
          userId: fields.userId.trim(),
          password: fields.password,
        };
        const shouldStoreCredentials =
          !rememberedCredentials ||
          rememberedCredentials.userId !== enteredCredentials.userId ||
          (rememberedCredentials.password !== enteredCredentials.password &&
            (await askToUpdateSavedPassword()));
        if (shouldStoreCredentials) {
          try {
            await storeRememberedCredentials(enteredCredentials);
            setRememberedCredentials(enteredCredentials);
          } catch {
            Alert.alert(
              "Password not saved",
              "You are signed in, but this device could not save your password.",
            );
          }
        }
      }

      if (isRemembered) {
        await signInPersisted(session);
      } else {
        signInForCurrentRun(session);
      }
      router.replace("/(app)/(tabs)/dashboard");
      if (mode === "credentials" && !session.user.hasMpin && !(await isMpinPromptDismissed())) {
        offerMpinSetup();
      }
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Sign-in could not be completed. Check your details and retry.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    fields,
    isRemembered,
    mode,
    rememberedCredentials,
    signInForCurrentRun,
    signInPersisted,
  ]);

  const toggleRemembered = useCallback(async (): Promise<void> => {
    const shouldRemember = !isRemembered;
    setIsRemembered(shouldRemember);
    if (shouldRemember) {
      return;
    }

    try {
      await removeRememberedCredentials();
      setRememberedCredentials(null);
    } catch {
      setNotice("Saved sign-in details could not be removed.");
    }
  }, [isRemembered]);

  return {
    mode,
    fields,
    errors,
    isRemembered,
    isSubmitting,
    isMpinAvailable: true,
    notice,
    selectMode,
    updateField,
    toggleRemembered,
    submit,
  };
};
