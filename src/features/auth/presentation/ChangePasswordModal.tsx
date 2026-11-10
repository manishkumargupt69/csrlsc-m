import type { ReactElement } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import BottomSheetModal from "@/src/components/ui/BottomSheetModal";
import FormField from "@/src/components/ui/FormField";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import {
  COLORS,
  SCREEN_HORIZONTAL_PADDING,
  SPACING,
  TYPOGRAPHY,
} from "@/src/theme/tokens";

interface ChangePasswordModalProps {
  isVisible: boolean;
  oldPassword: string;
  newPassword: string;
  confirmation: string;
  oldPasswordError?: string;
  newPasswordError?: string;
  confirmationError?: string;
  notice: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onChangeOldPassword: (value: string) => void;
  onChangeNewPassword: (value: string) => void;
  onChangeConfirmation: (value: string) => void;
  onSubmit: () => void;
}

export default function ChangePasswordModal({
  isVisible,
  oldPassword,
  newPassword,
  confirmation,
  oldPasswordError,
  newPasswordError,
  confirmationError,
  notice,
  isSubmitting,
  onClose,
  onChangeOldPassword,
  onChangeNewPassword,
  onChangeConfirmation,
  onSubmit,
}: ChangePasswordModalProps): ReactElement {
  return (
    <BottomSheetModal
      accessibilityLabel="Close Change password"
      isVisible={isVisible}
      onClose={onClose}
      title="Change password"
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.supportingText}>
          Enter your current password, then choose a new one.
        </Text>
        <View style={styles.form}>
            <FormField
              allowsSecureTextReveal
              errorMessage={oldPasswordError}
              isSecure
              label="Current password"
              onChangeText={onChangeOldPassword}
              placeholder="Enter current password"
              value={oldPassword}
            />
            <FormField
              allowsSecureTextReveal
              errorMessage={newPasswordError}
              isSecure
              label="New password"
              onChangeText={onChangeNewPassword}
              placeholder="Enter new password"
              value={newPassword}
            />
            <FormField
              allowsSecureTextReveal
              errorMessage={confirmationError}
              isSecure
              label="Confirm new password"
              onChangeText={onChangeConfirmation}
              placeholder="Repeat new password"
              value={confirmation}
            />
            {notice ? (
              <Text accessibilityLiveRegion="polite" style={styles.notice}>
                {notice}
              </Text>
            ) : null}
            <PrimaryButton
              isLoading={isSubmitting}
              label="Change password"
              onPress={onSubmit}
            />
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: SPACING.extraLarge,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    paddingTop: SPACING.large,
  },
  supportingText: {
    color: COLORS.inkMuted,
    ...TYPOGRAPHY.body,
    marginTop: SPACING.small,
  },
  form: {
    gap: SPACING.large,
    marginTop: SPACING.extraLarge,
  },
  notice: {
    color: COLORS.danger,
    ...TYPOGRAPHY.caption,
  },
});
