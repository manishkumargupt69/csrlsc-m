import { StyleSheet, View } from "react-native";

import FormField from "@/src/components/ui/FormField";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import type { AuthMode } from "@/src/features/auth/domain/auth.types";
import { SPACING } from "@/src/theme/tokens";

interface SignInFields {
  userId: string;
  password: string;
  mpin: string;
}

interface SignInErrors {
  userId?: string;
  password?: string;
  mpin?: string;
}

interface SignInFormProps {
  mode: AuthMode;
  fields: SignInFields;
  errors: SignInErrors;
  isSubmitting: boolean;
  onChangeField: (field: keyof SignInFields, value: string) => void;
  onSubmit: () => void;
}

function SignInForm({
  mode,
  fields,
  errors,
  isSubmitting,
  onChangeField,
  onSubmit,
}: SignInFormProps) {
  if (mode === "mpin") {
    return (
      <View style={styles.form}>
        <FormField
          errorMessage={errors.userId}
          label="User ID"
          onChangeText={(value) => onChangeField("userId", value)}
          placeholder="Email or user ID"
          value={fields.userId}
        />
        <FormField
          errorMessage={errors.mpin}
          isSecure
          keyboardType="number-pad"
          label="MPIN"
          maxLength={4}
          onChangeText={(value) => onChangeField("mpin", value)}
          placeholder="Enter 4 digits"
          value={fields.mpin}
        />
        <PrimaryButton
          isLoading={isSubmitting}
          label="Sign in with MPIN"
          onPress={onSubmit}
        />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <FormField
        errorMessage={errors.userId}
        label="User ID"
        onChangeText={(value) => onChangeField("userId", value)}
        placeholder="Email or user ID"
        value={fields.userId}
      />
      <FormField
        allowsSecureTextReveal
        errorMessage={errors.password}
        isSecure
        label="Password"
        onChangeText={(value) => onChangeField("password", value)}
        placeholder="Enter password"
        value={fields.password}
      />
      <PrimaryButton
        isLoading={isSubmitting}
        label="Continue"
        onPress={onSubmit}
      />
    </View>
  );
}

export default SignInForm;

const styles = StyleSheet.create({
  form: {
    gap: SPACING.large,
  },
});
