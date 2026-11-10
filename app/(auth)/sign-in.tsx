import type { ReactElement } from "react";
import { useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import BrandLogo from "@/src/components/branding/BrandLogo";
import ScreenContainer from "@/src/components/ui/ScreenContainer";
import type { AuthMode } from "@/src/features/auth/domain/auth.types";
import { useSignIn } from "@/src/features/auth/hooks/use-sign-in";
import AuthModeSelector from "@/src/features/auth/presentation/AuthModeSelector";
import RememberMeControl from "@/src/features/auth/presentation/RememberMeControl";
import SignInForm from "@/src/features/auth/presentation/SignInForm";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import { runAfterKeyboardDismissed } from "@/src/utils/run-after-keyboard-dismissed";

export default function SignInScreen(): ReactElement {
  const signIn = useSignIn();
  const { selectMode } = signIn;
  const handleModeSelect = useCallback((mode: AuthMode): void => {
    runAfterKeyboardDismissed(() => selectMode(mode));
  }, [selectMode]);

  const handleForgotPassword = useCallback((): void => router.push("/(auth)/forgot-password"), []);

  return (
    <ScreenContainer hasHeader={false}>
      <KeyboardAvoidingView
        behavior="height"
        enabled={Platform.OS === "android"}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          style={styles.scroll}
        >
          <View style={styles.header}>
            <View style={styles.brandMarkContainer}>
              <View style={styles.brandMark}>
                <BrandLogo width={240} />
              </View>
            </View>
          </View>
          
          <View style={styles.panel}>
            <AuthModeSelector
              isMpinAvailable={signIn.isMpinAvailable}
              onSelectMode={handleModeSelect}
              selectedMode={signIn.mode}
            />
            <View style={styles.formContainer}>
              <SignInForm
                errors={signIn.errors}
                fields={signIn.fields}
                isSubmitting={signIn.isSubmitting}
                mode={signIn.mode}
                onChangeField={signIn.updateField}
                onSubmit={signIn.submit}
              />
              {signIn.mode !== "mpin" ? (
                <View style={styles.rememberMeContainer}>
                  <RememberMeControl isSelected={signIn.isRemembered} onToggle={signIn.toggleRemembered} />
                  <Pressable accessibilityRole="button" onPress={handleForgotPassword} style={styles.forgot}>
                    <Text style={styles.forgotLabel}>Forgot password?</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
            {signIn.notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{signIn.notice}</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingVertical: SPACING.extraLarge },
  header: { alignItems: "center", marginBottom: SPACING.extraLarge },
  brandMarkContainer: {
    marginBottom: SPACING.large,
  },
  brandMark: { 
    alignItems: "center", 
    justifyContent: "center", 
  },
  brandSubtitle: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "600", marginBottom: SPACING.medium },
  title: { color: COLORS.ink, ...TYPOGRAPHY.screenTitle, fontWeight: "800", letterSpacing: -0.5 },
  panel: { gap: SPACING.large },
  formContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.large,
    borderRadius: RADII.sheet,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rememberMeContainer: {
    marginTop: SPACING.medium,
    paddingTop: SPACING.medium,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  forgot: { alignItems: "center", justifyContent: "center", minHeight: 48 },
  forgotLabel: { color: COLORS.accent, ...TYPOGRAPHY.body, fontWeight: "700" },
  notice: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, textAlign: "center" },
});
