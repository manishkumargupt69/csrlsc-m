import type { ReactElement } from "react";
import { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import FormField from "@/src/components/ui/FormField";
import SecondaryButton from "@/src/components/ui/SecondaryButton";
import type { AssessmentParameter, AuditDraft } from "@/src/features/assessments/domain/assessment.types";
import { MAX_RATING, MIN_RATING } from "@/src/features/assessments/domain/assessment.types";
import { parseStringList } from "@/src/features/assessments/data/assessment.mappers";
import RatingSelector from "@/src/features/assessments/presentation/RatingSelector";
import { COLORS, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

/** Multiple-choice answers are stored as one comma-separated string, as the web client does. */
const MULTI_ANSWER_SEPARATOR = ", ";

interface ParameterFormProps {
  parameter: AssessmentParameter;
  draft: AuditDraft;
  ratingError?: string;
  onChange: (draft: AuditDraft) => void;
}

interface OptionButtonProps {
  label: string;
  isSelected: boolean;
  onToggle: (label: string) => void;
}

function OptionButton({ label, isSelected, onToggle }: OptionButtonProps): ReactElement {
  const handlePress = useCallback((): void => onToggle(label), [label, onToggle]);
  return <SecondaryButton isSelected={isSelected} label={label} onPress={handlePress} />;
}

export default function ParameterForm({ parameter, draft, ratingError, onChange }: ParameterFormProps): ReactElement {
  const selectedAnswers = parseStringList(draft.answer);
  const hasOptions = parameter.options.length > 0;

  const handleAnswerText = useCallback((value: string): void => onChange({ ...draft, answer: value }), [draft, onChange]);
  const handleRemarks = useCallback((value: string): void => onChange({ ...draft, remarks: value }), [draft, onChange]);
  const handleRating = useCallback((value: number | null): void => onChange({ ...draft, rating: value }), [draft, onChange]);
  const handleSingleChoice = useCallback((label: string): void => {
    onChange({ ...draft, answer: draft.answer === label ? "" : label });
  }, [draft, onChange]);
  const handleMultipleChoice = useCallback((label: string): void => {
    const next = selectedAnswers.includes(label)
      ? selectedAnswers.filter((answer) => answer !== label)
      : [...selectedAnswers, label];
    onChange({ ...draft, answer: next.join(MULTI_ANSWER_SEPARATOR) });
  }, [draft, onChange, selectedAnswers]);

  return (
    <View style={styles.container}>
      {parameter.question ? <Text style={styles.question}>{parameter.question}</Text> : null}
      {parameter.hint ? <Text style={styles.hint}>{parameter.hint}</Text> : null}

      {parameter.responseKind === "descriptive" || !hasOptions ? (
        <FormField isMultiline label="Answer" onChangeText={handleAnswerText} placeholder="Enter the answer" textCapitalization="sentences" value={draft.answer} />
      ) : (
        <View style={styles.options}>
          <Text style={styles.label}>{parameter.responseKind === "single" ? "Answer (choose one)" : "Answer (choose all that apply)"}</Text>
          {parameter.options.map((option) => (
            <OptionButton
              key={option}
              isSelected={selectedAnswers.includes(option)}
              label={option}
              onToggle={parameter.responseKind === "single" ? handleSingleChoice : handleMultipleChoice}
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

      <FormField isMultiline label="Remarks" onChangeText={handleRemarks} placeholder="Enter remarks" textCapitalization="sentences" value={draft.remarks} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.large },
  question: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "600" },
  hint: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption },
  label: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "600" },
  options: { gap: SPACING.small },
  rating: { gap: SPACING.small },
});
