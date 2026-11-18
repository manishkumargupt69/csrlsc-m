import type { ReactElement } from "react";
import { useCallback, useMemo } from "react";
import type { SectionListData, SectionListRenderItemInfo, StyleProp, ViewStyle } from "react-native";
import { SectionList, StyleSheet, Text, View } from "react-native";

import { groupParameters } from "@/src/features/assessments/data/assessment.mappers";
import type { AssessmentParameter, AuditDraft } from "@/src/features/assessments/domain/assessment.types";
import ParameterRow from "@/src/features/assessments/presentation/ParameterRow";
import { COLORS, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface ParameterSection {
  title: string;
  data: AssessmentParameter[];
}

interface ParameterListProps {
  parameters: readonly AssessmentParameter[];
  /** Everything above the parameters (summary, progress, filters); it scrolls with the list. */
  header: ReactElement;
  emptyMessage: string;
  contentContainerStyle: StyleProp<ViewStyle>;
  /** Unsaved edits by parameter id, so rows can show "Edited" and the draft rating. */
  drafts?: Readonly<Record<string, AuditDraft>>;
  onOpen?: (parameter: AssessmentParameter) => void;
}

const NO_DRAFTS: Readonly<Record<string, AuditDraft>> = {};
const getKey = (parameter: AssessmentParameter): string => parameter.id;

function CardGap(): ReactElement {
  return <View style={styles.cardGap} />;
}

/**
 * A request's parameters as separate cards, grouped under their Main Parameter. A SectionList renders only
 * the cards near the screen, so a request with hundreds of parameters scrolls smoothly.
 */
export default function ParameterList({ parameters, header, emptyMessage, contentContainerStyle, drafts = NO_DRAFTS, onOpen }: ParameterListProps): ReactElement {
  const sections = useMemo(
    (): ParameterSection[] => groupParameters(parameters).map((group) => ({ title: group.group, data: group.parameters })),
    [parameters],
  );

  const renderItem = useCallback(({ item }: SectionListRenderItemInfo<AssessmentParameter, ParameterSection>): ReactElement => {
    const draft = drafts[item.id];
    return <ParameterRow hasDraft={Boolean(draft)} onPress={onOpen} parameter={item} rating={draft ? draft.rating : item.rating} />;
  }, [drafts, onOpen]);

  const renderSectionHeader = useCallback(({ section }: { section: SectionListData<AssessmentParameter, ParameterSection> }): ReactElement | null => {
    if (!section.title) return <View style={styles.untitledGap} />;
    return (
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    );
  }, []);

  return (
    <SectionList
      contentContainerStyle={contentContainerStyle}
      extraData={drafts}
      initialNumToRender={8}
      ItemSeparatorComponent={CardGap}
      keyExtractor={getKey}
      ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
      ListHeaderComponent={<View style={styles.header}>{header}</View>}
      maxToRenderPerBatch={8}
      removeClippedSubviews
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      sections={sections}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      updateCellsBatchingPeriod={40}
      windowSize={9}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: SPACING.large },
  cardGap: { height: SPACING.small },
  untitledGap: { height: SPACING.large },
  // The Main Parameter heading: a maroon label with its count, sitting on the page above its cards.
  sectionHeader: { alignItems: "baseline", flexDirection: "row", gap: SPACING.small, paddingBottom: SPACING.small, paddingTop: SPACING.extraLarge },
  sectionTitle: { color: COLORS.accent, flexShrink: 1, ...TYPOGRAPHY.body, fontWeight: "800" },
  sectionCount: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontVariant: ["tabular-nums"], fontWeight: "700" },
  empty: { color: COLORS.inkMuted, ...TYPOGRAPHY.body, paddingTop: SPACING.large, textAlign: "center" },
});
