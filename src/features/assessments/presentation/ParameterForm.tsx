import type { ReactElement } from "react";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import FormField from "@/src/components/ui/FormField";
import type { AssessmentParameter, AuditDraft } from "@/src/features/assessments/domain/assessment.types";
import { MAX_RATING, MIN_RATING } from "@/src/features/assessments/domain/assessment.types";
import RatingSelector from "@/src/features/assessments/presentation/RatingSelector";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface ParameterFormProps {
  parameter: AssessmentParameter;
  draft: AuditDraft;
  ratingError?: string;
  onChange: (draft: AuditDraft) => void;
  /** Lets the screen scroll the remarks box clear of the keyboard. */
  onRemarksFocus?: () => void;
}

interface ChoiceRowProps {
  label: string;
  isSelected: boolean;
  onToggle: (label: string) => void;
}

/** One option of a choice question; every choice question takes exactly one answer, so each option is a radio button. */
function ChoiceRow({ label, isSelected, onToggle }: ChoiceRowProps): ReactElement {
  const handlePress = useCallback((): void => onToggle(label), [label, onToggle]);
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      onPress={handlePress}
      style={({ pressed }) => [styles.choice, isSelected && styles.choiceSelected, pressed && styles.choicePressed]}
    >
      <View style={[styles.mark, isSelected && styles.markSelected]}>
        {isSelected ? <View style={styles.dot} /> : null}
      </View>
      <Text style={[styles.choiceLabel, isSelected && styles.choiceLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function ParameterForm({ parameter, draft, ratingError, onChange, onRemarksFocus }: ParameterFormProps): ReactElement {
  const hasOptions = parameter.options.length > 0;

  const handleAnswerText = useCallback((value: string): void => onChange({ ...draft, answer: value }), [draft, onChange]);
  const handleRemarks = useCallback((value: string): void => onChange({ ...draft, remarks: value }), [draft, onChange]);
  const handleRating = useCallback((value: number | null): void => onChange({ ...draft, rating: value }), [draft, onChange]);
  // Single and Multiple Choice questions both take one answer: picking an option replaces the previous one.
  const handleChoice = useCallback((label: string): void => {
    onChange({ ...draft, answer: draft.answer === label ? "" : label });
  }, [draft, onChange]);

  return (
    <View style={styles.container}>
      {parameter.question ? (
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionTitle}>
              <Feather accessibilityElementsHidden color={COLORS.accent} name="help-circle" size={14} />
              <Text style={styles.questionCaption}>QUESTION</Text>
            </View>
          </View>
          <Text style={styles.question}>{parameter.question}</Text>
          {parameter.hint ? <Text style={styles.hint}>{parameter.hint}</Text> : null}
        </View>
      ) : null}

      {parameter.responseKind === "descriptive" || !hasOptions ? (
        <FormField isMultiline label="Answer" onChangeText={handleAnswerText} placeholder="Enter the answer" textCapitalization="sentences" value={draft.answer} />
      ) : (
        <View accessibilityRole="radiogroup" style={styles.options}>
          <View style={styles.answerHeader}>
            <Text style={styles.label}>Answer</Text>
            <Text style={styles.typeBadge}>{parameter.responseKind === "single" ? "Single Choice" : "Multiple Choice"}</Text>
          </View>
          {parameter.options.map((option) => (
            <ChoiceRow
              key={option}
              isSelected={draft.answer === option}
              label={option}
              onToggle={handleChoice}
            />
          ))}
        </View>
      )}

      <View style={styles.rating}>
        <Text style={styles.label}>
          {"Rating (" + MIN_RATING + "–" + MAX_RATING + ")"}
          {parameter.mandatory ? " *" : ""}
        </Text>
        <RatingSelector errorMessage={ratingError} isClearable={!parameter.mandatory} onChange={handleRating} value={draft.rating} />
      </View>

      <FormField isMultiline label="Rating Remarks" onChangeText={handleRemarks} onFocus={onRemarksFocus} placeholder="Enter rating remarks" textCapitalization="sentences" value={draft.remarks} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.large },
  questionCard: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.large, borderWidth: StyleSheet.hairlineWidth, gap: SPACING.small, padding: SPACING.medium },
  questionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  questionTitle: { alignItems: "center", flexDirection: "row", gap: 6 },
  questionCaption: { color: COLORS.accent, ...TYPOGRAPHY.caption, fontWeight: "800", letterSpacing: 0.8 },
  question: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "600" },
  hint: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption },
  answerHeader: { alignItems: "center", flexDirection: "row", gap: SPACING.small, justifyContent: "space-between" },
  typeBadge: { backgroundColor: COLORS.accentSoft, borderRadius: RADII.pill, color: COLORS.accent, ...TYPOGRAPHY.caption, fontWeight: "700", overflow: "hidden", paddingHorizontal: SPACING.small, paddingVertical: 2 },
  choice: { alignItems: "center", backgroundColor: COLORS.surface, borderColor: COLORS.border, borderRadius: RADII.medium, borderWidth: 1, flexDirection: "row", gap: SPACING.medium, minHeight: 52, paddingHorizontal: SPACING.medium, paddingVertical: SPACING.small },
  choiceSelected: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  choicePressed: { opacity: 0.85 },
  choiceLabel: { color: COLORS.ink, flex: 1, ...TYPOGRAPHY.body, fontWeight: "600" },
  choiceLabelSelected: { color: COLORS.accent, fontWeight: "700" },
  mark: { alignItems: "center", borderColor: COLORS.inkMuted, borderRadius: 11, borderWidth: 2, height: 22, justifyContent: "center", width: 22 },
  markSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dot: { backgroundColor: COLORS.white, borderRadius: 4, height: 8, width: 8 },
  label: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "600" },
  options: { gap: SPACING.small },
  rating: { gap: SPACING.small },
});
