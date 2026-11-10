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

interface SetMpinModalProps {
  isVisible: boolean;
  mobile: string;
  mpin: string;
  confirmation: string;
  mobileError?: string;
  mpinError?: string;
  confirmationError?: string;
  notice: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onChangeMobile: (value: string) => void;
  onChangeMpin: (value: string) => void;
  onChangeConfirmation: (value: string) => void;
  onSubmit: () => void;
}

export default function SetMpinModal({
  isVisible,
  mobile,
  mpin,
  confirmation,
  mobileError,
  mpinError,
  confirmationError,
  notice,
  isSubmitting,
  onClose,
  onChangeMobile,
  onChangeMpin,
  onChangeConfirmation,
  onSubmit,
}: SetMpinModalProps): ReactElement {
  return (
    <BottomSheetModal
      accessibilityLabel="Close Set MPIN"
      isVisible={isVisible}
      onClose={onClose}
      title="Set MPIN"
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.supportingText}>
          Use four digits for quick sign-in on this device.
        </Text>
        <View style={styles.form}>
          <FormField
            errorMessage={mobileError}
            keyboardType="phone-pad"
            label="Mobile number"
            onChangeText={onChangeMobile}
            placeholder="Enter mobile number"
            value={mobile}
          />
          <FormField
            errorMessage={mpinError}
            isSecure
            keyboardType="number-pad"
            label="New MPIN"
            maxLength={4}
            onChangeText={onChangeMpin}
            placeholder="4 digits"
            value={mpin}
          />
          <FormField
            errorMessage={confirmationError}
            isSecure
            keyboardType="number-pad"
            label="Confirm MPIN"
            maxLength={4}
            onChangeText={onChangeConfirmation}
            placeholder="Repeat MPIN"
            value={confirmation}
          />
          {notice ? (
            <Text accessibilityLiveRegion="polite" style={styles.notice}>
              {notice}
            </Text>
          ) : null}
          <PrimaryButton
            isLoading={isSubmitting}
            label="Set MPIN"
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
