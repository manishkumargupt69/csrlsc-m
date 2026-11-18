import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import DatePickerSheet from "@/src/components/ui/DatePickerSheet";
import DetailHeader from "@/src/components/ui/DetailHeader";
import OptionPickerSheet from "@/src/components/ui/OptionPickerSheet";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import ScreenContainer, { useScreenInsets } from "@/src/components/ui/ScreenContainer";
import SelectField from "@/src/components/ui/SelectField";
import type { LookupOption } from "@/src/features/assessments/domain/assessment.types";
import type { CreateField } from "@/src/features/assessments/hooks/use-create-assessment";
import { getMinimumCompletionDate, useCreateAssessment } from "@/src/features/assessments/hooks/use-create-assessment";
import type { LookupResult } from "@/src/features/assessments/hooks/use-lookups";
import {
  useGeoNames,
  useQuickCodes,
  useServices,
  useShippers,
  useSubServices,
} from "@/src/features/assessments/hooks/use-lookups";
import { useUnsavedChanges } from "@/src/hooks/use-unsaved-changes";
import { COLORS, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import { formatDate } from "@/src/utils/format-date-time";
import { showSuccessMessage } from "@/src/utils/show-success-message";

type ActivePicker = CreateField | "completeBy" | null;

const PICKER_TITLES: Readonly<Record<CreateField, string>> = {
  service: "Service",
  subService: "Sub Service",
  domain: "Domain",
  materialGroup: "Material Group",
  geoType: "Geo Type",
  geoName: "Geo Name",
  demandedBy: "Demanded By",
  assessmentOf: "Assessment Of",
};

interface FieldProps {
  label: string;
  option: LookupOption | null;
  placeholder: string;
  errorMessage?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  onPress: () => void;
}

const FIELD_ICONS = {
  Service: "truck",
  "Sub Service": "layers",
  Domain: "grid",
  "Material Group": "package",
  "Geo Type": "map",
  "Geo Name": "map-pin",
  "Demanded By": "briefcase",
  "Assessment Of": "target",
} as const;

function Field({ label, option, placeholder, errorMessage, isDisabled, isRequired = true, onPress }: FieldProps): ReactElement {
  return (
    <View style={styles.field}>
      <SelectField iconName={FIELD_ICONS[label as keyof typeof FIELD_ICONS]} isDisabled={isDisabled} isRequired={isRequired} label={label} onPress={onPress} placeholder={placeholder} value={option?.label ?? ""} />
      {errorMessage ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

export default function NewAssessmentScreen(): ReactElement {
  const insets = useScreenInsets();
  const form = useCreateAssessment();
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [showErrors, setShowErrors] = useState(false);
  const allowNavigation = useUnsavedChanges(form.isDirty);
  const { state, errors, select } = form;

  const services = useServices();
  const subServices = useSubServices(state.service?.id ?? null);
  const domains = useQuickCodes("DomainType");
  const materialGroups = useQuickCodes("MaterialGroup");
  const geoTypes = useQuickCodes("Geo");
  const geoNames = useGeoNames(form.geoTypeName);
  const shippers = useShippers();

  const lookups: Readonly<Record<CreateField, LookupResult>> = {
    service: services,
    subService: subServices,
    domain: domains,
    materialGroup: materialGroups,
    geoType: geoTypes,
    geoName: geoNames,
    demandedBy: shippers,
    assessmentOf: shippers,
  };

  const closePicker = useCallback((): void => setActivePicker(null), []);
  const handleBack = useCallback((): void => router.back(), []);
  const handleSelect = useCallback((option: LookupOption): void => {
    if (activePicker && activePicker !== "completeBy") select(activePicker, option);
    setActivePicker(null);
  }, [activePicker, select]);
  const handleSubmit = useCallback(async (): Promise<void> => {
    setShowErrors(true);
    if (Object.keys(errors).length > 0) return;
    try {
      const assessmentNo = await form.submit();
      allowNavigation();
      showSuccessMessage(assessmentNo ? assessmentNo + " created" : "Assessment request created");
      router.back();
    } catch (error: unknown) {
      Alert.alert("Unable to create request", error instanceof Error ? error.message : "Try again.");
    }
  }, [allowNavigation, errors, form]);

  const openPicker = (field: CreateField): (() => void) => () => setActivePicker(field);
  const errorFor = (field: CreateField): string | undefined => (showErrors ? errors[field as keyof typeof errors] : undefined);
  const pickerLookup = activePicker && activePicker !== "completeBy" ? lookups[activePicker] : null;
  const pickerSelected = activePicker && activePicker !== "completeBy" ? state[activePicker] : null;

  let parameterSummary = "Choose a service, sub service and domain to load the parameters.";
  if (form.isLoadingParameters) parameterSummary = "Loading parameters…";
  else if (form.isParametersError) parameterSummary = "Parameters could not be loaded.";
  else if (state.service && state.subService && state.domain) parameterSummary = form.parameterCount + " parameters will be included.";

  return (
    <ScreenContainer>
      <DetailHeader onBack={handleBack} title="New Assessment Request" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.large, paddingBottom: insets.bottom + SPACING.section }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.legend}>Fields marked * are required.</Text>
        <Field errorMessage={errorFor("service")} label="Service" onPress={openPicker("service")} option={state.service} placeholder="Select service" />
        <Field errorMessage={errorFor("subService")} isDisabled={!state.service} label="Sub Service" onPress={openPicker("subService")} option={state.subService} placeholder={state.service ? "Select sub service" : "Select a service first"} />
        <Field errorMessage={errorFor("domain")} label="Domain" onPress={openPicker("domain")} option={state.domain} placeholder="Select domain" />
        <Field isRequired={false} label="Material Group" onPress={openPicker("materialGroup")} option={state.materialGroup} placeholder="Select material group" />
        <Field errorMessage={errorFor("geoType")} label="Geo Type" onPress={openPicker("geoType")} option={state.geoType} placeholder="Select geo type" />
        <Field errorMessage={errorFor("geoName")} isDisabled={!form.geoTypeName} label="Geo Name" onPress={openPicker("geoName")} option={state.geoName} placeholder={form.geoTypeName ? "Select geo name" : "Select a geo type first"} />
        <Field errorMessage={errorFor("demandedBy")} label="Demanded By" onPress={openPicker("demandedBy")} option={state.demandedBy} placeholder="Select company" />
        <Field errorMessage={errorFor("assessmentOf")} label="Assessment Of" onPress={openPicker("assessmentOf")} option={state.assessmentOf} placeholder="Select company" />
        <View style={styles.field}>
          <SelectField
            iconName="calendar"
            isRequired
            label="To Be Completed By"
            onPress={() => setActivePicker("completeBy")}
            placeholder="Choose a date"
            value={state.completeBy ? formatDate(state.completeBy.toISOString()) : ""}
          />
          {showErrors && errors.completeBy ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errors.completeBy}</Text> : null}
        </View>
        <Text accessibilityLiveRegion="polite" style={[styles.summary, showErrors && errors.parameters ? styles.error : undefined]}>
          {showErrors && errors.parameters ? errors.parameters : parameterSummary}
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton iconName="check" isLoading={form.isSubmitting} label="Save" onPress={handleSubmit} />
      </View>

      <OptionPickerSheet
        isError={pickerLookup?.isError}
        isLoading={pickerLookup?.isLoading}
        isVisible={pickerLookup !== null}
        onClose={closePicker}
        onRetry={pickerLookup?.reload}
        onSelect={handleSelect}
        options={pickerLookup?.options ?? []}
        selectedIds={pickerSelected ? [pickerSelected.id] : []}
        title={activePicker && activePicker !== "completeBy" ? PICKER_TITLES[activePicker] : "Select"}
      />
      <DatePickerSheet
        isVisible={activePicker === "completeBy"}
        minimumDate={getMinimumCompletionDate()}
        onClose={closePicker}
        onConfirm={form.setCompleteBy}
        title="To Be Completed By"
        value={state.completeBy}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  legend: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption },
  content: { gap: SPACING.large, padding: SCREEN_HORIZONTAL_PADDING },
  field: { gap: SPACING.extraSmall },
  error: { color: COLORS.danger, ...TYPOGRAPHY.caption },
  summary: { color: COLORS.inkMuted, ...TYPOGRAPHY.body },
  footer: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: StyleSheet.hairlineWidth, padding: SCREEN_HORIZONTAL_PADDING },
});
