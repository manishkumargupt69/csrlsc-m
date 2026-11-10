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

interface ChangeMpinModalProps {
  isVisible: boolean;
  oldMpin: string;
  newMpin: string;
  confirmation: string;
  oldMpinError?: string;
  newMpinError?: string;
  confirmationError?: string;
  notice: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onChangeOldMpin: (value: string) => void;
  onChangeNewMpin: (value: string) => void;
  onChangeConfirmation: (value: string) => void;
  onSubmit: () => void;
}

export default function ChangeMpinModal({
  isVisible,
  oldMpin,
  newMpin,
  confirmation,
  oldMpinError,
  newMpinError,
  confirmationError,
  notice,
  isSubmitting,
  onClose,
  onChangeOldMpin,
  onChangeNewMpin,
  onChangeConfirmation,
  onSubmit,
}: ChangeMpinModalProps): ReactElement {
  return (
    <BottomSheetModal
      accessibilityLabel="Close Change MPIN"
      isVisible={isVisible}
      onClose={onClose}
      title="Change MPIN"
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.supportingText}>
          Confirm your current MPIN, then choose a new one.
        </Text>
        <View style={styles.form}>
          <FormField
            errorMessage={oldMpinError}
            isSecure
            keyboardType="number-pad"
            label="Current MPIN"
            maxLength={4}
            onChangeText={onChangeOldMpin}
            placeholder="Enter current MPIN"
            value={oldMpin}
          />
          <FormField
            errorMessage={newMpinError}
            isSecure
            keyboardType="number-pad"
            label="New MPIN"
            maxLength={4}
            onChangeText={onChangeNewMpin}
            placeholder="Enter new MPIN"
            value={newMpin}
          />
          <FormField
            errorMessage={confirmationError}
            isSecure
            keyboardType="number-pad"
            label="Confirm new MPIN"
            maxLength={4}
            onChangeText={onChangeConfirmation}
            placeholder="Repeat new MPIN"
            value={confirmation}
          />
          {notice ? (
            <Text accessibilityLiveRegion="polite" style={styles.notice}>
              {notice}
            </Text>
          ) : null}
          <PrimaryButton
            isLoading={isSubmitting}
            label="Change MPIN"
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
