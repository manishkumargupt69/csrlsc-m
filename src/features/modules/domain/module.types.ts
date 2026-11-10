export type ModuleKey = "dashboard" | "assessments" | "assess" | "incidents";

export type ModuleIconName =
  | "alert-triangle"
  | "briefcase"
  | "check-square"
  | "clipboard"
  | "grid"
  | "home"
  | "list"
  | "tool";

export interface ModuleViewModel {
  id: string;
  key: ModuleKey | null;
  title: string;
  description: string;
  iconName: ModuleIconName;
  children?: ModuleViewModel[];
}
