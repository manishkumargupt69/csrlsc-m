import type { ReactElement } from "react";
import { Image, StyleSheet, View } from "react-native";
import type { ImageSourcePropType, ViewStyle } from "react-native";

export const BRAND_NAME = "CSRLSC";

/*
 * The CSRLSC logo artwork (assets/branding). Each file is 1600 px wide, so it stays sharp at any width the app
 * uses on a 3x screen. "full" carries the tagline "Define Measure Elevate"; "wordmark" is the name alone, for
 * places too small for the tagline to be legible (the app header). "light" is the white version for maroon glass.
 */
const ARTWORK: Record<"full" | "wordmark", Record<"dark" | "light", { source: ImageSourcePropType; aspect: number }>> = {
  full: {
    dark: { source: require("@/assets/branding/csrlsc-logo.png") as number, aspect: 1600 / 764 },
    light: { source: require("@/assets/branding/csrlsc-logo-light.png") as number, aspect: 1600 / 764 },
  },
  wordmark: {
    dark: { source: require("@/assets/branding/csrlsc-wordmark.png") as number, aspect: 1600 / 545 },
    light: { source: require("@/assets/branding/csrlsc-wordmark-light.png") as number, aspect: 1600 / 545 },
  },
};

interface BrandLogoProps {
  /** Width in points; the height follows the artwork's proportions. */
  width?: number;
  variant?: "full" | "wordmark";
  /** "light" is the white-lettered version for the maroon header and side menu. */
  tone?: "dark" | "light";
  style?: ViewStyle;
}

/** The CSRLSC logo. */
export default function BrandLogo({ width = 160, variant = "full", tone = "dark", style }: BrandLogoProps): ReactElement {
  const { source, aspect } = ARTWORK[variant][tone];
  return (
    <View accessibilityLabel={BRAND_NAME} accessibilityRole="header" style={[styles.row, style]}>
      <Image accessibilityIgnoresInvertColors fadeDuration={0} resizeMode="contain" source={source} style={{ height: width / aspect, width }} />
    </View>
  );
}

const styles = StyleSheet.create({ row: { alignItems: "center", flexDirection: "row" } });
