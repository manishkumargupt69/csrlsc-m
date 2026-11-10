import { useCallback, useState } from "react";

import { authRepository } from "@/src/features/auth/data/auth.repository";
import { configureMpin } from "@/src/features/auth/data/mpin.service";
import type { AuthSession } from "@/src/features/auth/domain/auth.types";
import { showSuccessMessage } from "@/src/utils/show-success-message";

const MPIN_PATTERN = /^\d{4}$/;

interface ChangeMpinFields {
  oldMpin: string;
  newMpin: string;
  confirmation: string;
}

interface ChangeMpinErrors {
  oldMpin?: string;
  newMpin?: string;
  confirmation?: string;
}

interface ChangeMpinResult {
  isVisible: boolean;
  fields: ChangeMpinFields;
  errors: ChangeMpinErrors;
  isSubmitting: boolean;
  notice: string | null;
  open: () => void;
  close: () => void;
  updateField: (field: keyof ChangeMpinFields, value: string) => void;
  submit: () => Promise<void>;
}

const EMPTY_FIELDS: ChangeMpinFields = {
  oldMpin: "",
  newMpin: "",
  confirmation: "",
};

const getValidationErrors = (
  fields: ChangeMpinFields,
): ChangeMpinErrors => {
  if (!MPIN_PATTERN.test(fields.oldMpin)) {
    return { oldMpin: "Enter your current 4-digit MPIN." };
  }
  if (!MPIN_PATTERN.test(fields.newMpin)) {
    return { newMpin: "Choose a new 4-digit MPIN." };
  }
  if (fields.newMpin !== fields.confirmation) {
    return { confirmation: "The new MPIN values do not match." };
  }
  return {};
};

const hasErrors = (errors: ChangeMpinErrors): boolean =>
  Object.values(errors).some(Boolean);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "MPIN could not be changed.";

export const useChangeMpin = (
  session: AuthSession | null,
): ChangeMpinResult => {
  const [isVisible, setIsVisible] = useState(false);
  const [fields, setFields] = useState<ChangeMpinFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<ChangeMpinErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const open = useCallback((): void => {
    setFields(EMPTY_FIELDS);
    setErrors({});
    setNotice(null);
    setIsVisible(true);
  }, []);

  const close = useCallback((): void => {
    setIsVisible(false);
    setFields(EMPTY_FIELDS);
    setErrors({});
    setNotice(null);
  }, []);

  const updateField = useCallback(
    (field: keyof ChangeMpinFields, value: string): void => {
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
      await authRepository.changeMpin(session, {
        oldMpin: fields.oldMpin,
        newMpin: fields.newMpin,
      });
      await configureMpin(session.user.email);
      close();
      showSuccessMessage("MPIN changed successfully.");
    } catch (error: unknown) {
      setNotice(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [close, fields, session]);

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
