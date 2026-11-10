export const COLORS = {
  // Palette of the CSRLSC web app: maroon top bar and side menu, gold highlights, cool grey page.
  background: "#E8EDF2",
  surface: "#FFFFFF",
  drawerSurface: "#4A0C16",
  drawerHeader: "#64121D",
  surfaceMuted: "#F1F5F9",
  ink: "#0F172A",
  inkMuted: "#475569",
  accent: "#64121D",
  accentPressed: "#4A0C16",
  accentSoft: "#F7E9EB",
  maroonDark: "#4A0C16",
  gold: "#FFBD4A",
  onMaroonMuted: "rgba(255, 255, 255, 0.72)",
  onMaroonLine: "rgba(255, 255, 255, 0.14)",
  statusNavy: "#0C3155",
  statusTeal: "#0F8F8E",
  statusAmber: "#F59E0B",
  // Frosted-glass tints: translucent so the blurred content shows through.
  glassMaroon: "rgba(100, 18, 29, 0.58)",
  glassMaroonDeep: "rgba(74, 12, 22, 0.50)",
  glassEdge: "rgba(255, 255, 255, 0.22)",
  border: "#D8E1EC",
  overlay: "rgba(15, 23, 42, 0.38)",
  dangerSoft: "#FEF2F2",
  danger: "#DC2626",
  warningBackground: "#FEF3C7",
  warningInk: "#B45309",
  successBackground: "#DCFCE7",
  successInk: "#15803D",
  neutralBackground: "#F1F5F9",
  neutralInk: "#475569",
  white: "#FFFFFF",
} as const;

/*
 * Text styles deliberately set no lineHeight: React Native scales font sizes with the system text size but
 * not fixed line heights, so a fixed value clips text for anyone who enlarged theirs. The font's own line
 * height scales with it.
 */

export const SPACING = {
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 24,
  section: 32,
} as const;

export const RADII = {
  small: 8,
  medium: 12,
  large: 14,
  sheet: 20,
  pill: 999,
} as const;

export const TYPOGRAPHY = {
  caption: {
    fontSize: 12,
  },
  body: {
    fontSize: 15,
  },
  control: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 22,
  },
  screenTitle: {
    fontSize: 30,
  },
} as const;

export const CONTROL_HEIGHT = 52;
export const APP_HEADER_CONTENT_HEIGHT = 58;
export const FLOATING_TAB_BAR_HEIGHT = 64;
export const FLOATING_TAB_BAR_MINIMUM_BOTTOM_OFFSET = 20;
export const FLOATING_TAB_BAR_SAFE_AREA_GAP = 10;
export const FLOATING_TAB_BAR_CONTENT_CLEARANCE =
  FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MINIMUM_BOTTOM_OFFSET;
export const MINIMUM_TOUCH_SIZE = 48;
export const SCREEN_HORIZONTAL_PADDING = 20;
export const DETAIL_HEADER_HEIGHT = MINIMUM_TOUCH_SIZE + APP_HEADER_CONTENT_HEIGHT;
export const DETAIL_ACTION_FOOTER_HEIGHT = CONTROL_HEIGHT + 2 * SCREEN_HORIZONTAL_PADDING;
export const MAX_CONTENT_WIDTH = 600;

