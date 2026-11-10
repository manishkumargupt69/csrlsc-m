import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import Feather from "@expo/vector-icons/Feather";

import {
  COLORS,
  CONTROL_HEIGHT,
  MINIMUM_TOUCH_SIZE,
  RADII,
  SPACING,
  TYPOGRAPHY,
} from "@/src/theme/tokens";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  errorMessage?: string;
  isSecure?: boolean;
  allowsSecureTextReveal?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  maxLength?: number;
  isMultiline?: boolean;
  textCapitalization?: "none" | "sentences";
  /** Marks the field with an asterisk and announces it as required. */
  isRequired?: boolean;
}

function FormField({
  label,
  isRequired = false,
  value,
  onChangeText,
  placeholder,
  errorMessage,
  isSecure = false,
  allowsSecureTextReveal = false,
  keyboardType = "default",
  maxLength,
  isMultiline = false,
  textCapitalization = "none",
}: FormFieldProps) {
  const [isSecureTextVisible, setIsSecureTextVisible] = useState(false);
  const isRevealAvailable = isSecure && allowsSecureTextReveal;
  const handleToggleSecureText = useCallback(() => {
    setIsSecureTextVisible((currentValue) => !currentValue);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}{isRequired ? <Text style={styles.required}> *</Text> : null}</Text>
      <View style={[styles.inputContainer, errorMessage ? styles.inputError : undefined]}>
        <TextInput
          accessibilityLabel={isRequired ? label + ", required" : label}
          autoCapitalize={textCapitalization}
          autoCorrect={false}
          inputMode={keyboardType === "number-pad" ? "numeric" : undefined}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={isMultiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.inkMuted}
          secureTextEntry={isSecure && !isSecureTextVisible}
          showSoftInputOnFocus
          style={[styles.input, isMultiline ? styles.multiline : undefined]}
          value={value}
        />
        {isRevealAvailable ? (
          <Pressable
            accessibilityLabel={isSecureTextVisible ? "Hide password" : "Show password"}
            accessibilityRole="button"
            hitSlop={SPACING.small}
            onPress={handleToggleSecureText}
            style={styles.revealButton}
          >
            <Feather
              accessibilityElementsHidden
              color={COLORS.inkMuted}
              importantForAccessibility="no-hide-descendants"
              name={isSecureTextVisible ? "eye-off" : "eye"}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
      {errorMessage ? (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

export default FormField;

const styles = StyleSheet.create({
  container: {
    gap: SPACING.small,
  },
  required: { color: COLORS.danger },
  label: {
    color: COLORS.ink,
    ...TYPOGRAPHY.body,
    fontWeight: "600",
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.medium,
    borderWidth: 1,
    flexDirection: "row",
  },
  input: {
    color: COLORS.ink,
    flex: 1,
    ...TYPOGRAPHY.control,
    minHeight: CONTROL_HEIGHT,
    paddingHorizontal: SPACING.large,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  multiline: {
    height: "auto",
    minHeight: 96,
    paddingTop: SPACING.medium,
    textAlignVertical: "top",
  },
  revealButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: MINIMUM_TOUCH_SIZE,
    width: MINIMUM_TOUCH_SIZE,
  },
  errorText: {
    color: COLORS.danger,
    ...TYPOGRAPHY.caption,
  },
});
