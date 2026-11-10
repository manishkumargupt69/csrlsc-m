import type { AuthRoleComponent, AuthSession } from "@/src/features/auth/domain/auth.types";
import type { ModuleKey, ModuleViewModel } from "@/src/features/modules/domain/module.types";

/**
 * The role tree returned at login lists the whole ERP. The mobile app only
 * exposes the CSRLSC modules below, each gated by the role's permissions.
 * Admins control access by granting these components to a role in Menu Master.
 */
const ASSESSMENT_REQUEST_COMPONENT = "assessment request";
const ASSESS_REQUEST_COMPONENTS: readonly string[] = ["assess request", "assess requests"];
const INCIDENT_COMPONENT_PATTERN = /incident/i;

const MODULES: readonly ModuleViewModel[] = [
  { id: "dashboard", key: "dashboard", title: "Dashboard", description: "Summary of assessments", iconName: "home" },
  { id: "assessments", key: "assessments", title: "Assessment Requests", description: "Create, assign and view requests", iconName: "clipboard" },
  { id: "assess", key: "assess", title: "Assess Request", description: "Rate the parameters assigned to you", iconName: "check-square" },
  { id: "incidents", key: "incidents", title: "Incidents", description: "View and report incidents", iconName: "alert-triangle" },
];

const flattenComponents = (components: readonly AuthRoleComponent[]): AuthRoleComponent[] =>
  components.flatMap((component) => [component, ...flattenComponents(component.children)]);

const normalize = (value: string): string => value.trim().toLocaleLowerCase();

const hasAccess = (component: AuthRoleComponent): boolean =>
  component.hasAccess || component.permissions.length > 0;

const findComponent = (
  components: readonly AuthRoleComponent[],
  names: readonly string[],
): AuthRoleComponent | undefined =>
  components.find((component) => names.includes(normalize(component.componentName)));

export interface AssessmentPermissions {
  /** Can create requests and assign auditors. */
  canManage: boolean;
}

export const getAssessmentPermissions = (session: AuthSession): AssessmentPermissions => {
  const component = findComponent(
    flattenComponents(session.roleComponents),
    [ASSESSMENT_REQUEST_COMPONENT],
  );
  // The server sends a mobile-specific menu tree to phones that carries none of
  // the CSRLSC components, so fall back to the admin flag when it is absent.
  return { canManage: component ? component.permissions.includes("write") : session.user.isAdmin };
};

const isModuleAllowed = (key: ModuleKey | null, components: readonly AuthRoleComponent[]): boolean => {
  if (key === "dashboard") return true;
  const assessmentRequest = findComponent(components, [ASSESSMENT_REQUEST_COMPONENT]);
  // A component that is missing from the menu is treated as not yet configured and stays visible.
  if (key === "assessments") return assessmentRequest ? hasAccess(assessmentRequest) : true;
  if (key === "assess") {
    const assess = findComponent(components, ASSESS_REQUEST_COMPONENTS);
    const configured = assess ?? assessmentRequest;
    return configured ? hasAccess(configured) : true;
  }
  if (key === "incidents") {
    const incident = components.find((component) => INCIDENT_COMPONENT_PATTERN.test(component.componentName));
    // Until an admin configures an incident component, keep the module visible.
    return incident ? hasAccess(incident) : true;
  }
  return false;
};

export const getPermittedModules = (session: AuthSession): ModuleViewModel[] => {
  const components = flattenComponents(session.roleComponents);
  return MODULES.filter((module) => isModuleAllowed(module.key, components));
};
