import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type TabRoute =
  | "/(app)/(tabs)/dashboard"
  | "/(app)/(tabs)/assessments"
  | "/(app)/(tabs)/assess"
  | "/(app)/(tabs)/incidents"
  | "/(app)/(tabs)/profile";

export interface TabItem {
  /** File name under app/(app)/(tabs). */
  name: "dashboard" | "assessments" | "assess" | "incidents" | "profile";
  title: string;
  accessibilityLabel: string;
  route: TabRoute;
  icon: IconName;
  activeIcon: IconName;
}

export const TAB_ITEMS: readonly TabItem[] = [
  { name: "dashboard", title: "Home", accessibilityLabel: "Home dashboard", route: "/(app)/(tabs)/dashboard", icon: "home-outline", activeIcon: "home" },
  { name: "assessments", title: "Requests", accessibilityLabel: "Assessment requests", route: "/(app)/(tabs)/assessments", icon: "clipboard-outline", activeIcon: "clipboard" },
  { name: "assess", title: "Assess", accessibilityLabel: "Assess requests", route: "/(app)/(tabs)/assess", icon: "checkbox-outline", activeIcon: "checkbox" },
  { name: "incidents", title: "Incidents", accessibilityLabel: "Incidents", route: "/(app)/(tabs)/incidents", icon: "warning-outline", activeIcon: "warning" },
  { name: "profile", title: "Profile", accessibilityLabel: "Profile", route: "/(app)/(tabs)/profile", icon: "person-outline", activeIcon: "person" },
];
