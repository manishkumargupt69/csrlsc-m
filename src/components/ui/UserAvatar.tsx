import type { ReactElement } from "react";
import { memo, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/src/theme/tokens";

const MAX_INITIALS = 2;

/** First letters of the first two words of a name, e.g. "CSRLSC Admin" gives "CA". */
export const getInitials = (name: string): string => {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((word) => word.charAt(0).toLocaleUpperCase());
  return letters.join("") || "?";
};

interface UserAvatarProps {
  name: string;
  /** Link to the profile picture; initials are shown when there is none or it cannot be loaded. */
  uri?: string | null;
  size: number;
  /** "light" is a white disc for use on the maroon header and menu. */
  tone?: "brand" | "light";
}

/** Round profile picture with initials as the fallback. */
function UserAvatar({ name, uri, size, tone = "brand" }: UserAvatarProps): ReactElement {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  useEffect(() => setFailedUri(null), [uri]);
  const showsImage = Boolean(uri) && uri !== failedUri;
  const isLight = tone === "light";

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.disc, { backgroundColor: isLight ? COLORS.white : COLORS.accent, borderRadius: size / 2, height: size, width: size }]}
    >
      {showsImage ? (
        <Image onError={() => setFailedUri(uri ?? null)} resizeMode="cover" source={{ uri: uri ?? undefined }} style={{ height: size, width: size }} />
      ) : (
        <Text allowFontScaling={false} style={[styles.initials, { color: isLight ? COLORS.accent : COLORS.gold, fontSize: size * 0.36, lineHeight: size * 0.44 }]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

export default memo(UserAvatar);

const styles = StyleSheet.create({
  disc: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  initials: { fontWeight: "800", letterSpacing: 1 },
});
