import type { ReactElement } from "react";
import { useCallback } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import BrandLogo from "@/src/components/branding/BrandLogo";
import FormField from "@/src/components/ui/FormField";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import ScreenContainer from "@/src/components/ui/ScreenContainer";
import { useForgotPassword } from "@/src/features/auth/hooks/use-forgot-password";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

const STEP_COPY = {
  mobile: { title: "Forgot password", body: "Enter the mobile number registered with your account and we will send a one-time passcode." },
  otp: { title: "Enter passcode", body: "Type the passcode we sent to your mobile number." },
  password: { title: "Choose a new password", body: "Pick a password you have not used before." },
} as const;

export default function ForgotPasswordScreen(): ReactElement {
  const handleFinished = useCallback((): void => {
    Alert.alert("Password updated", "You can now sign in with your new password.");
    router.replace("/(auth)/sign-in");
  }, []);
  const form = useForgotPassword(handleFinished);
  const { fields, errors, updateField } = form;
  const copy = STEP_COPY[form.step];

  const handleMobile = useCallback((value: string): void => updateField("mobile", value.replace(/\D/g, "")), [updateField]);
  const handleOtp = useCallback((value: string): void => updateField("otp", value.replace(/\D/g, "")), [updateField]);
  const handleNewPassword = useCallback((value: string): void => updateField("newPassword", value), [updateField]);
  const handleConfirmation = useCallback((value: string): void => updateField("confirmation", value), [updateField]);
  const handleBack = useCallback((): void => router.back(), []);

  return (
    <ScreenContainer hasHeader={false}>
      <KeyboardAvoidingView behavior="height" enabled={Platform.OS === "android"} style={styles.keyboardArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}><BrandLogo width={200} /></View>
          <View style={styles.panel}>
            <Text accessibilityRole="header" style={styles.title}>{copy.title}</Text>
            <Text style={styles.body}>{copy.body}</Text>
            {form.step === "mobile" ? (
              <>
                <FormField errorMessage={errors.mobile} keyboardType="phone-pad" label="Mobile number" maxLength={10} onChangeText={handleMobile} placeholder="10-digit mobile number" value={fields.mobile} />
                <PrimaryButton isLoading={form.isSubmitting} label="Send passcode" onPress={form.sendOtp} />
              </>
            ) : null}
            {form.step === "otp" ? (
              <>
                <FormField errorMessage={errors.otp} keyboardType="number-pad" label="Passcode" maxLength={8} onChangeText={handleOtp} placeholder="Enter passcode" value={fields.otp} />
                <PrimaryButton isLoading={form.isSubmitting} label="Verify" onPress={form.verifyOtp} />
                <Pressable accessibilityRole="button" onPress={form.backToMobile} style={styles.link}>
                  <Text style={styles.linkLabel}>Use a different number</Text>
                </Pressable>
              </>
            ) : null}
            {form.step === "password" ? (
              <>
                <FormField allowsSecureTextReveal errorMessage={errors.newPassword} isSecure label="New password" onChangeText={handleNewPassword} placeholder="Enter new password" value={fields.newPassword} />
                <FormField allowsSecureTextReveal errorMessage={errors.confirmation} isSecure label="Confirm password" onChangeText={handleConfirmation} placeholder="Re-enter new password" value={fields.confirmation} />
                <PrimaryButton isLoading={form.isSubmitting} label="Reset password" onPress={form.resetPassword} />
              </>
            ) : null}
            {form.notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{form.notice}</Text> : null}
            <Pressable accessibilityRole="button" onPress={handleBack} style={styles.link}>
              <Text style={styles.linkLabel}>Back to sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingVertical: SPACING.extraLarge },
  brand: { alignItems: "center", marginBottom: SPACING.extraLarge },
  panel: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.sheet, borderWidth: 1, gap: SPACING.large, padding: SPACING.large },
  title: { color: COLORS.ink, ...TYPOGRAPHY.sectionTitle, fontWeight: "800" },
  body: { color: COLORS.inkMuted, ...TYPOGRAPHY.body },
  notice: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, textAlign: "center" },
  link: { alignItems: "center", minHeight: 48, justifyContent: "center" },
  linkLabel: { color: COLORS.accent, ...TYPOGRAPHY.body, fontWeight: "700" },
});
