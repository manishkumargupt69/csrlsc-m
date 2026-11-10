import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Children, Fragment, isValidElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import type Feather from "@expo/vector-icons/Feather";

import IconTile from "@/src/components/ui/IconTile";
import { COLORS, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface InfoRowProps {
  label: string;
  value?: string;
  /** Leading icon; rows in one group should either all have one or none. */
  iconName?: ComponentProps<typeof Feather>["name"];
  /** Lets people long-press to copy the value (IDs, phone numbers). */
  isSelectable?: boolean;
  /** Custom content shown instead of the text value (e.g. a status badge). */
  children?: ReactNode;
}

/** One fact: icon tile, a small label above, the value below. */
export default function InfoRow({ label, value, iconName, isSelectable = false, children }: InfoRowProps): ReactElement {
  return (
    <View style={styles.row}>
      {iconName ? <IconTile name={iconName} /> : null}
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {children ?? <Text selectable={isSelectable} style={styles.valueText}>{value || "—"}</Text>}
      </View>
    </View>
  );
}

interface InfoGroupProps {
  children: ReactNode;
}

/** Inset grouped list: a rounded surface with hairline dividers between rows. */
export function InfoGroup({ children }: InfoGroupProps): ReactElement {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={styles.group}>
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index > 0 ? <View style={styles.divider} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "flex-start", flexDirection: "row", gap: SPACING.medium, paddingHorizontal: SPACING.large, paddingVertical: SPACING.medium },
  copy: { flex: 1, gap: 2 },
  label: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontWeight: "600", letterSpacing: 0.2 },
  valueText: { color: COLORS.ink, ...TYPOGRAPHY.body, fontWeight: "600" },
  group: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  divider: { backgroundColor: COLORS.border, height: StyleSheet.hairlineWidth, marginLeft: SPACING.large + 32 + SPACING.medium },
});
