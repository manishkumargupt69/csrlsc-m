import type { IncidentTypeOption } from "@/src/features/incidents/domain/incident.types";

/**
 * PLACEHOLDER DATA. The CSRLSC API has no incident or incident-type master yet,
 * so these lists only let the screens work end to end. Replace this module with
 * the backend lookup once the incident service exists.
 */
export const INCIDENT_TYPES: readonly IncidentTypeOption[] = [
  {
    id: "safety",
    label: "Safety",
    subTypes: [
      { id: "near-miss", label: "Near miss" },
      { id: "injury", label: "Injury" },
      { id: "unsafe-condition", label: "Unsafe condition" },
      { id: "equipment-failure", label: "Equipment failure" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    subTypes: [
      { id: "documentation-gap", label: "Documentation gap" },
      { id: "permit-issue", label: "Licence or permit issue" },
      { id: "policy-violation", label: "Policy violation" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    subTypes: [
      { id: "delay", label: "Delay" },
      { id: "damage", label: "Damage" },
      { id: "shortage", label: "Shortage" },
    ],
  },
  {
    id: "quality",
    label: "Quality",
    subTypes: [
      { id: "process-deviation", label: "Process deviation" },
      { id: "customer-complaint", label: "Customer complaint" },
    ],
  },
];
