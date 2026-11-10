import { useCallback, useState } from "react";

import { authRepository } from "@/src/features/auth/data/auth.repository";
import { configureMpin } from "@/src/features/auth/data/mpin.service";
import type { AuthSession } from "@/src/features/auth/domain/auth.types";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { showSuccessMessage } from "@/src/utils/show-success-message";

const MPIN_PATTERN = /^\d{4}$/;

interface SetMpinFields {
  mobile: string;
  mpin: string;
  confirmation: string;
}

interface SetMpinErrors {
  mobile?: string;
  mpin?: string;
  confirmation?: string;
}

interface SetMpinResult {
  isVisible: boolean;
  fields: SetMpinFields;
  errors: SetMpinErrors;
  isSubmitting: boolean;
  notice: string | null;
  open: () => void;
  close: () => void;
  updateField: (field: keyof SetMpinFields, value: string) => void;
  submit: () => Promise<void>;
}

const EMPTY_FIELDS: SetMpinFields = {
  mobile: "",
  mpin: "",
  confirmation: "",
};

const getValidationErrors = (fields: SetMpinFields): SetMpinErrors => {
  if (!fields.mobile.trim()) {
    return { mobile: "Enter your mobile number." };
  }
  if (!MPIN_PATTERN.test(fields.mpin)) {
    return { mpin: "Choose a 4-digit MPIN." };
  }
  if (fields.mpin !== fields.confirmation) {
    return { confirmation: "The MPIN values do not match." };
  }
  return {};
};

const hasErrors = (errors: SetMpinErrors): boolean =>
  Object.values(errors).some(Boolean);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "MPIN could not be set.";

export const useSetMpin = (
  session: AuthSession | null,
): SetMpinResult => {
  const markMpinConfigured = useAuthStore(
    (state) => state.markMpinConfigured,
  );
  const [isVisible, setIsVisible] = useState(false);
  const [fields, setFields] = useState<SetMpinFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<SetMpinErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const open = useCallback((): void => {
    setFields({
      ...EMPTY_FIELDS,
      mobile: session?.user.mobile ?? "",
    });
    setErrors({});
    setNotice(null);
    setIsVisible(true);
  }, [session?.user.mobile]);

  const close = useCallback((): void => {
    setIsVisible(false);
    setFields(EMPTY_FIELDS);
    setErrors({});
    setNotice(null);
  }, []);

  const updateField = useCallback(
    (field: keyof SetMpinFields, value: string): void => {
      setFields((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setNotice(null);
    },
    [],
  );

  const submit = useCallback(async (): Promise<void> => {
    const validationErrors = getValidationErrors(fields);
    setErrors(validationErrors);
    if (hasErrors(validationErrors) || !session) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);
    try {
      await authRepository.setMpin(session, {
        mobile: fields.mobile.trim(),
        mpin: fields.mpin,
      });
      await configureMpin(session.user.email);
      markMpinConfigured();
      close();
      showSuccessMessage("MPIN set successfully.");
    } catch (error: unknown) {
      setNotice(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [close, fields, markMpinConfigured, session]);

  return {
    isVisible,
    fields,
    errors,
    isSubmitting,
    notice,
    open,
    close,
    updateField,
    submit,
  };
};
