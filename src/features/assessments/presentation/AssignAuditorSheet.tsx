import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import BottomSheetModal from "@/src/components/ui/BottomSheetModal";
import FormField from "@/src/components/ui/FormField";
import OptionPickerSheet from "@/src/components/ui/OptionPickerSheet";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import SelectField from "@/src/components/ui/SelectField";
import type { useAssignAuditor } from "@/src/features/assessments/hooks/use-assign-auditor";
import { COLORS, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import { showSuccessMessage } from "@/src/utils/show-success-message";

type AssignAuditorState = ReturnType<typeof useAssignAuditor>;

interface AssignAuditorSheetProps {
  assign: AssignAuditorState;
}

export default function AssignAuditorSheet({ assign }: AssignAuditorSheetProps): ReactElement {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const { auditors, selectedIds, target } = assign;
  const selectedNames = auditors.options
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => option.label)
    .join(", ");
  const openPicker = useCallback((): void => setIsPickerVisible(true), []);
  const closePicker = useCallback((): void => setIsPickerVisible(false), []);
  const handleToggle = useCallback((option: { id: string }): void => assign.toggleAuditor(option.id), [assign]);
  const handleSubmit = useCallback(async (): Promise<void> => {
    try {
      if (await assign.submit()) showSuccessMessage("Auditor assigned");
    } catch (error: unknown) {
      Alert.alert("Unable to assign auditor", error instanceof Error ? error.message : "Try again.");
    }
  }, [assign]);

  return (
    <>
      <BottomSheetModal accessibilityLabel="Close assign auditor" isVisible={assign.isVisible && !isPickerVisible} onClose={assign.close} subtitle={target ? target.assessmentNo : undefined} title="Assign auditor">
        <View style={styles.sheet}>
          <SelectField
            iconName="user-plus"
            label="Auditors"
            onPress={openPicker}
            placeholder={auditors.isLoading ? "Loading auditors…" : "Select auditors"}
            value={selectedNames || (selectedIds.length > 0 ? selectedIds.length + " selected" : "")}
          />
          {assign.validationMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{assign.validationMessage}</Text> : null}
          <FormField isMultiline label="Remarks" onChangeText={assign.setRemarks} placeholder="Add remarks (optional)" textCapitalization="sentences" value={assign.remarks} />
          <PrimaryButton isLoading={assign.isSubmitting} label="Assign" onPress={handleSubmit} />
        </View>
      </BottomSheetModal>
      <OptionPickerSheet
        emptyMessage="No auditors are available."
        isError={auditors.isError}
        isLoading={auditors.isLoading}
        isMultiple
        isVisible={assign.isVisible && isPickerVisible}
        onClose={closePicker}
        onRetry={auditors.reload}
        onSelect={handleToggle}
        options={auditors.options}
        selectedIds={selectedIds}
        title="Auditors"
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: SPACING.large, padding: SCREEN_HORIZONTAL_PADDING },
  request: { color: COLORS.ink, ...TYPOGRAPHY.control, fontWeight: "700" },
  error: { color: COLORS.danger, ...TYPOGRAPHY.caption },
});
