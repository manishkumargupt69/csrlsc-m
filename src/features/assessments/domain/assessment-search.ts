import type { AssessmentListItem } from "@/src/features/assessments/domain/assessment.types";

/** True when every word typed appears somewhere in the request's number, parties, service or auditor. */
export const matchesAssessmentSearch = (item: AssessmentListItem, search: string): boolean => {
  const words = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [item.assessmentNo, item.requestedBy, item.requestFor, item.service, item.subService, item.domain, item.assignedTo]
    .join(" ")
    .toLocaleLowerCase();
  return words.every((word) => haystack.includes(word));
};
