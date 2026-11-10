export interface ProgressInput {
  total: number;
  audited: number;
}

export interface ProgressSummary {
  /** Parameters across every request in scope. */
  parameters: { total: number; assessed: number; pending: number; percent: number };
  /** Requests grouped by how far assessment has got. */
  requests: { total: number; completed: number; inProgress: number; notStarted: number };
}

/** Rolls per-request parameter counts up into the numbers the Assess overview shows. */
export const summarizeProgress = (items: readonly ProgressInput[]): ProgressSummary => {
  let total = 0;
  let assessed = 0;
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  for (const item of items) {
    total += item.total;
    assessed += item.audited;
    if (item.total > 0 && item.audited >= item.total) completed += 1;
    else if (item.audited > 0) inProgress += 1;
    else notStarted += 1;
  }
  return {
    parameters: {
      total,
      assessed,
      pending: Math.max(0, total - assessed),
      percent: total > 0 ? Math.round((assessed / total) * 100) : 0,
    },
    requests: { total: items.length, completed, inProgress, notStarted },
  };
};
