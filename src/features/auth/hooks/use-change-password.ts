import { useCallback, useState } from "react";

import { authRepository } from "@/src/features/auth/data/auth.repository";
import type { AuthSession } from "@/src/features/auth/domain/auth.types";
import { showSuccessMessage } from "@/src/utils/show-success-message";

interface ChangePasswordFields {
  oldPassword: string;
  newPassword: string;
  confirmation: string;
}

interface ChangePasswordErrors {
  oldPassword?: string;
  newPassword?: string;
  confirmation?: string;
}

interface ChangePasswordResult {
  isVisible: boolean;
  fields: ChangePasswordFields;
  errors: ChangePasswordErrors;
  isSubmitting: boolean;
  notice: string | null;
  open: () => void;
  close: () => void;
  updateField: (field: keyof ChangePasswordFields, value: string) => void;
  submit: () => Promise<void>;
}

const INITIAL_FIELDS: ChangePasswordFields = {
  oldPassword: "",
  newPassword: "",
  confirmation: "",
};

const getValidationErrors = (
  fields: ChangePasswordFields,
): ChangePasswordErrors => {
  if (!fields.oldPassword) {
    return { oldPassword: "Enter your current password." };
  }
  if (!fields.newPassword) {
    return { newPassword: "Enter a new password." };
  }
  if (fields.newPassword !== fields.confirmation) {
    return { confirmation: "The new passwords do not match." };
  }
  return {};
};

const hasErrors = (errors: ChangePasswordErrors): boolean =>
  Object.values(errors).some(Boolean);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Password could not be changed.";

export const useChangePassword = (
  session: AuthSession | null,
): ChangePasswordResult => {
  const [isVisible, setIsVisible] = useState(false);
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [errors, setErrors] = useState<ChangePasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const open = useCallback((): void => {
    setFields(INITIAL_FIELDS);
    setErrors({});
    setNotice(null);
    setIsVisible(true);
  }, []);

  const close = useCallback((): void => {
    setIsVisible(false);
    setFields(INITIAL_FIELDS);
    setErrors({});
    setNotice(null);
  }, []);

  const updateField = useCallback(
    (field: keyof ChangePasswordFields, value: string): void => {
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
      await authRepository.changePassword(session, {
        oldPassword: fields.oldPassword,
        newPassword: fields.newPassword,
      });
      close();
      showSuccessMessage("Password changed successfully.");
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
