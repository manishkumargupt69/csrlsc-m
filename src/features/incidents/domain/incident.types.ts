export interface IncidentOption {
  id: string;
  label: string;
}

export interface IncidentTypeOption extends IncidentOption {
  subTypes: readonly IncidentOption[];
}

export type IncidentSortKey = "newest" | "oldest" | "number";
