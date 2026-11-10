import { useCallback, useState } from "react";

import { authRepository } from "@/src/features/auth/data/auth.repository";

export type ForgotPasswordStep = "mobile" | "otp" | "password";

interface Fields {
  mobile: string;
  otp: string;
  newPassword: string;
  confirmation: string;
}

type Errors = Partial<Record<keyof Fields, string>>;

const INITIAL_FIELDS: Fields = { mobile: "", otp: "", newPassword: "", confirmation: "" };
const MOBILE_PATTERN = /^\d{10}$/;
const OTP_PATTERN = /^\d{4,8}$/;
const MINIMUM_PASSWORD_LENGTH = 6;

const getMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/** Drives the three-step reset: mobile number, one-time passcode, new password. */
export const useForgotPassword = (onFinished: () => void) => {
  const [step, setStep] = useState<ForgotPasswordStep>("mobile");
  const [fields, setFields] = useState<Fields>(INITIAL_FIELDS);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((field: keyof Fields, value: string): void => {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  }, []);

  const run = useCallback(async (action: () => Promise<void>, fallback: string): Promise<void> => {
    setIsSubmitting(true);
    setNotice(null);
    try {
      await action();
    } catch (error: unknown) {
      setNotice(getMessage(error, fallback));
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const sendOtp = useCallback(async (): Promise<void> => {
    if (!MOBILE_PATTERN.test(fields.mobile)) {
      setErrors({ mobile: "Enter your 10-digit mobile number." });
      return;
    }
    await run(async () => {
      await authRepository.requestOtp(fields.mobile, "FORGOT_PASSWORD");
      setStep("otp");
      setNotice("We sent a one-time passcode to your mobile number.");
    }, "The passcode could not be sent.");
  }, [fields.mobile, run]);

  const verifyOtp = useCallback(async (): Promise<void> => {
    if (!OTP_PATTERN.test(fields.otp)) {
      setErrors({ otp: "Enter the passcode you received." });
      return;
    }
    await run(async () => {
      setResetToken(await authRepository.verifyOtp(fields.mobile, fields.otp, "FORGOT_PASSWORD"));
      setStep("password");
    }, "The passcode could not be verified.");
  }, [fields.mobile, fields.otp, run]);

  const resetPassword = useCallback(async (): Promise<void> => {
    if (fields.newPassword.length < MINIMUM_PASSWORD_LENGTH) {
      setErrors({ newPassword: "Use at least " + MINIMUM_PASSWORD_LENGTH + " characters." });
      return;
    }
    if (fields.newPassword !== fields.confirmation) {
      setErrors({ confirmation: "The passwords do not match." });
      return;
    }
    await run(async () => {
      await authRepository.resetPassword({
        mobile: fields.mobile,
        otp: fields.otp,
        resetToken,
        newPassword: fields.newPassword,
      });
      onFinished();
    }, "The password could not be reset.");
  }, [fields, onFinished, resetToken, run]);

  const backToMobile = useCallback((): void => {
    setStep("mobile");
    setFields((current) => ({ ...current, otp: "" }));
    setErrors({});
    setNotice(null);
  }, []);

  return { step, fields, errors, notice, isSubmitting, updateField, sendOtp, verifyOtp, resetPassword, backToMobile };
};
