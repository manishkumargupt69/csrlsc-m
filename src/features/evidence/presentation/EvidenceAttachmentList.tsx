import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import type { ListRenderItemInfo } from "react-native";
import { FlatList, StyleSheet, Text } from "react-native";

import EvidenceAttachmentRow from "@/src/features/evidence/presentation/EvidenceAttachmentRow";
import EvidencePreviewModal from "@/src/features/evidence/presentation/EvidencePreviewModal";
import type { EvidenceAttachment } from "@/src/types/evidence";
import { COLORS, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface EvidenceAttachmentListProps {
  attachments: readonly EvidenceAttachment[];
  onRemove?: (id: string) => void;
  showLocationUnavailable?: boolean;
}

const getAttachmentKey = (attachment: EvidenceAttachment): string => attachment.id;

export default function EvidenceAttachmentList({
  attachments,
  onRemove,
  showLocationUnavailable = false,
}: EvidenceAttachmentListProps): ReactElement {
  const [selectedAttachment, setSelectedAttachment] =
    useState<EvidenceAttachment | null>(null);
  const openAttachment = useCallback((attachment: EvidenceAttachment): void => {
    setSelectedAttachment(attachment);
  }, []);
  const closePreview = useCallback((): void => setSelectedAttachment(null), []);
  const renderAttachment = useCallback(
    ({ item }: ListRenderItemInfo<EvidenceAttachment>): ReactElement => (
      <EvidenceAttachmentRow
        attachment={item}
        onOpen={openAttachment}
        onRemove={onRemove}
        showLocationUnavailable={showLocationUnavailable}
      />
    ),
    [onRemove, openAttachment, showLocationUnavailable],
  );

  if (attachments.length === 0) {
    return <Text style={styles.empty}>No evidence attached.</Text>;
  }

  return (
    <>
      <FlatList
        data={attachments}
        horizontal
        keyExtractor={getAttachmentKey}
        renderItem={renderAttachment}
        showsHorizontalScrollIndicator={false}
      />
      {selectedAttachment ? (
        <EvidencePreviewModal
          attachment={selectedAttachment}
          onClose={closePreview}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  empty: { color: COLORS.inkMuted, ...TYPOGRAPHY.body, paddingVertical: SPACING.small },
});
