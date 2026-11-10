import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

import { COLORS } from "@/src/theme/tokens";

interface GlassBackgroundProps {
  /** Tint laid over the blur. Keep it translucent: content should show through, softened. */
  tint?: string;
  /** Blur strength, 1 to 100. */
  intensity?: number;
  /** Hairline highlight on the edge that faces the content, which is what makes the pane read as glass. */
  highlight?: "top" | "bottom" | "all" | "none";
  /** Corner radius, when the pane is a floating shape rather than an edge-to-edge bar. */
  radius?: number;
}

/**
 * Frosted-glass backing for bars and panels: the content behind is blurred, then a translucent maroon
 * tint and a light edge are added so text on top stays legible. Fill a parent with it (it is absolutely
 * positioned); the parent must clip with the same radius.
 */
export default function GlassBackground({
  tint = COLORS.glassMaroon,
  intensity = 30,
  highlight = "none",
  radius = 0,
}: GlassBackgroundProps): ReactElement {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: "hidden" }]}>
      <BlurView experimentalBlurMethod="dimezisBlurView" intensity={intensity} style={StyleSheet.absoluteFill} tint="dark" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
      {highlight === "top" ? <View style={styles.lineTop} /> : null}
      {highlight === "bottom" ? <View style={styles.lineBottom} /> : null}
      {highlight === "all" ? <View style={[StyleSheet.absoluteFill, styles.ring, { borderRadius: radius }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lineTop: { backgroundColor: COLORS.glassEdge, height: StyleSheet.hairlineWidth, left: 0, position: "absolute", right: 0, top: 0 },
  lineBottom: { backgroundColor: COLORS.glassEdge, bottom: 0, height: StyleSheet.hairlineWidth, left: 0, position: "absolute", right: 0 },
  ring: { borderColor: COLORS.glassEdge, borderWidth: StyleSheet.hairlineWidth },
});
