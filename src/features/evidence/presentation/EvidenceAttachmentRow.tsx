import { memo, useMemo } from "react";
import type { ComponentProps, ReactElement } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { PressableStateCallbackType, StyleProp, ViewStyle } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import type {
  EvidenceAttachment,
  EvidenceKind,
} from "@/src/types/evidence";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

const EVIDENCE_ICONS: Record<
  EvidenceKind,
  ComponentProps<typeof Feather>["name"]
> = {
  document: "file-text",
  photo: "image",
  video: "video",
  audio: "mic",
};

interface EvidenceAttachmentRowProps {
  attachment: EvidenceAttachment;
  onOpen: (attachment: EvidenceAttachment) => void;
  onRemove?: (id: string) => void;
  showLocationUnavailable: boolean;
}

const getPreviewStyle = ({
  pressed,
}: PressableStateCallbackType): StyleProp<ViewStyle> => [
  styles.preview,
  pressed && styles.pressed,
];

function EvidenceAttachmentRow({
  attachment,
  onOpen,
  onRemove,
  showLocationUnavailable,
}: EvidenceAttachmentRowProps): ReactElement {
  const handleOpen = (): void => onOpen(attachment);
  const handleRemove = (): void => onRemove?.(attachment.id);
  const imageSource = useMemo(
    () => ({ uri: attachment.uri }),
    [attachment.uri],
  );

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint="Opens evidence preview"
        accessibilityLabel={attachment.name}
        accessibilityRole="button"
        onPress={handleOpen}
        style={getPreviewStyle}
      >
        {attachment.kind === "photo" ? (
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="cover"
            source={imageSource}
            style={styles.thumbnail}
          />
        ) : (
          <View style={styles.icon}>
            <Feather
              accessibilityElementsHidden
              color={COLORS.accent}
              importantForAccessibility="no-hide-descendants"
              name={EVIDENCE_ICONS[attachment.kind]}
              size={20}
            />
          </View>
        )}
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.name}>
            {attachment.name}
          </Text>
          <Text style={styles.kind}>{attachment.kind}</Text>
          {showLocationUnavailable && (attachment.kind === "photo" || attachment.kind === "video") ? <Text style={styles.location}>Location unavailable</Text> : null}
        </View>
      </Pressable>
      {onRemove ? (
        <Pressable
          accessibilityLabel={`Remove ${attachment.name}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleRemove}
          style={styles.remove}
        >
          <Feather
            accessibilityElementsHidden
            color={COLORS.danger}
            importantForAccessibility="no-hide-descendants"
            name="x"
            size={20}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export default memo(EvidenceAttachmentRow);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.medium,
    borderWidth: 1,
    flexDirection: "row",
    marginRight: SPACING.medium,
    minHeight: 72,
    padding: SPACING.medium,
    width: 252,
  },
  preview: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: SPACING.medium,
  },
  pressed: { opacity: 0.62 },
  icon: {
    alignItems: "center",
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADII.small,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  thumbnail: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.small,
    height: 48,
    width: 48,
  },
  copy: { flex: 1, gap: SPACING.extraSmall },
  name: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "600" },
  kind: {
    color: COLORS.inkMuted,
    ...TYPOGRAPHY.caption,
    textTransform: "capitalize",
  },
  location: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption },
  remove: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    minWidth: 40,
  },
});
